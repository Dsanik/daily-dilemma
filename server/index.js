import 'dotenv/config'
import express from 'express'
import TelegramBot from 'node-telegram-bot-api'
import cron from 'node-cron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000
const BOT_TOKEN = process.env.BOT_TOKEN
const WEBAPP_URL =
  process.env.WEBAPP_URL || 'https://dsanik.github.io/daily-dilemma/'
// Часовой пояс, по которому считаются "сутки" для стрика — должен совпадать
// с таймзоной крона напоминаний, иначе граница дня на сервере и на клиенте
// (который считает по локальному времени телефона) будет расходиться.
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Minsk'
// DATA_FILE можно переопределить переменной окружения, чтобы указать на
// смонтированный персистентный диск (см. предупреждение при старте ниже).
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json')

// Если заданы UPSTASH_REDIS_REST_URL/TOKEN — данные хранятся во внешнем
// бесплатном Redis (Upstash), который переживает и сон, и редеплой сервиса.
// Это способ обойтись без Persistent Disk на бесплатном плане Render.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const REDIS_DATA_KEY = 'daily-dilemma:data'
const usingRedis = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // requests per window
const rateLimitMap = new Map()

// Input validation patterns
const VALID_USER_ID_PATTERN = /^(tg_\d+|local_[a-f0-9-]+)$/
const VALID_DILEMMA_SLUG_PATTERN = /^[a-z0-9-_]+$/
const MAX_STRING_LENGTH = 1000

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не задан.')
  process.exit(1)
}

if (usingRedis) {
  console.log('✅ Хранилище: Upstash Redis — переживает сон и редеплой сервиса')
} else if (!process.env.DATA_FILE) {
  console.warn(
    '⚠️  Данные хранятся в локальном файле рядом с кодом (data.json).\n' +
      '   На большинстве PaaS (Render, Railway и т.п.) диск контейнера ' +
      'эфемерный: при каждом передеплое/рестарте data.json будет стёрт, ' +
      'и все стрики/статистика пользователей обнулятся.\n' +
      '   Чтобы это исправить бесплатно: заведите базу на Upstash Redis ' +
      '(upstash.com, постоянный free tier) и укажите ' +
      'UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN в переменных ' +
      'окружения — либо, если готовы платить, подключите persistent disk ' +
      'и укажите DATA_FILE=/путь/к/диску/data.json.',
  )
}

// Input validation functions
function validateUserId(userId) {
  return typeof userId === 'string' && 
         userId.length <= MAX_STRING_LENGTH && 
         VALID_USER_ID_PATTERN.test(userId)
}

function validateDilemmaSlug(slug) {
  return typeof slug === 'string' && 
         slug.length <= MAX_STRING_LENGTH && 
         VALID_DILEMMA_SLUG_PATTERN.test(slug)
}

function validateString(str, maxLength = MAX_STRING_LENGTH) {
  return typeof str === 'string' && str.length <= maxLength
}

function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, MAX_STRING_LENGTH)
}

// Rate limiting middleware
function rateLimit(req, res, next) {
  const clientId = req.ip || 'unknown'
  const now = Date.now()
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return next()
  }
  
  const clientData = rateLimitMap.get(clientId)
  
  if (now > clientData.resetTime) {
    // Reset the window
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return next()
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    })
  }
  
  clientData.count++
  next()
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now()
  for (const [clientId, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(clientId)
    }
  }
}, RATE_LIMIT_WINDOW)

// Возвращает "сегодня" в формате YYYY-MM-DD в часовом поясе APP_TIMEZONE.
function todayInAppTimezone() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// Проверяет подлинность initData, которую Telegram выдаёт Mini App'у.
// Алгоритм — официальный, из документации Telegram Web Apps.
// Возвращает объект user при успехе, иначе null.
function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== 'string') return null

  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null
    params.delete('hash')

    const dataCheckString = [...params.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Сравнение постоянной длины, чтобы не утекало время сравнения строк.
    const a = Buffer.from(computedHash, 'hex')
    const b = Buffer.from(hash, 'hex')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

    const authDate = Number(params.get('auth_date') || 0)
    if (!authDate) return null
    const ageSeconds = Date.now() / 1000 - authDate
    if (ageSeconds > maxAgeSeconds || ageSeconds < -60) return null

    const userRaw = params.get('user')
    if (!userRaw) return null
    const user = JSON.parse(userRaw)
    if (!user?.id) return null

    return user
  } catch (error) {
    console.warn('Telegram init data verification error:', error.message)
    return null
  }
}

// ─── Хранилище ───

// Отправляет одну Redis-команду через REST API Upstash (тело-формат:
// массив ["КОМАНДА", "арг1", "арг2", ...] — безопасен для больших JSON-значений,
// в отличие от передачи значения прямо в пути URL).
async function redisCommand(command) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      throw new Error(`Redis HTTP ${res.status}: ${res.statusText}`)
    }
    
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    return json.result
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Redis request timeout')
    }
    throw error
  }
}

async function loadData() {
  if (usingRedis) {
    try {
      const raw = await redisCommand(['GET', REDIS_DATA_KEY])
      const data = raw ? JSON.parse(raw) : { users: {}, completedToday: {} }
      
      // Validate data structure
      if (!data.users || typeof data.users !== 'object') {
        data.users = {}
      }
      if (!data.completedToday || typeof data.completedToday !== 'object') {
        data.completedToday = {}
      }
      
      return data
    } catch (err) {
      console.error('Не удалось загрузить данные из Upstash:', err.message)
      return { users: {}, completedToday: {} }
    }
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { users: {}, completedToday: {} }
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const data = JSON.parse(raw)
    
    // Validate data structure
    if (!data.users || typeof data.users !== 'object') {
      data.users = {}
    }
    if (!data.completedToday || typeof data.completedToday !== 'object') {
      data.completedToday = {}
    }
    
    return data
  } catch (error) {
    console.error('Error loading local data:', error.message)
    return { users: {}, completedToday: {} }
  }
}

async function saveData(data) {
  // Validate data before saving
  if (!data || typeof data !== 'object') {
    console.error('Invalid data structure for saving')
    return
  }
  
  if (usingRedis) {
    try {
      await redisCommand(['SET', REDIS_DATA_KEY, JSON.stringify(data)])
    } catch (err) {
      console.error('Не удалось сохранить данные в Upstash:', err.message)
    }
    return
  }

  try {
    // Atomic write using temporary file
    const tempFile = `${DATA_FILE}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tempFile, DATA_FILE)
  } catch (err) {
    console.error('Не удалось сохранить данные:', err.message)
  }
}

let data = await loadData()

// ─── Бот ───
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
})

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message)
})

bot.on('error', (err) => {
  console.error('Bot error:', err.message)
})

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from?.id
  if (!userId) return

  const telegramKey = `tg_${userId}`

  try {
    data.users[telegramKey] = {
      ...data.users[telegramKey],
      chatId,
      firstName: sanitizeString(msg.from?.first_name || ''),
      username: sanitizeString(msg.from?.username || ''),
      registeredAt: data.users[telegramKey]?.registeredAt || Date.now(),
    }
    await saveData(data)

    const text =
      '👋 Привет! Это бот «Дилемма дня».\n\n' +
      'Каждый день — одна этическая или жизненная ситуация. Ты делаешь выбор. В конце видишь, как поступили другие.\n\n' +
      '🔥 Заходи каждый день, чтобы не потерять серию.\n\n' +
      'Нажми кнопку ниже, чтобы открыть приложение.'

    await bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎭 Открыть Дилемму дня',
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    })
  } catch (err) {
    console.error('Ошибка /start:', err.message)
    try {
      await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.')
    } catch (sendError) {
      console.error('Failed to send error message:', sendError.message)
    }
  }
})

bot.onText(/\/help/, async (msg) => {
  try {
    const text =
      '📖 Что умеет бот:\n\n' +
      '/start — открыть приложение\n' +
      '/help — эта справка\n' +
      '/mystats — твоя статистика\n' +
      '/stop — отключить напоминания\n\n' +
      'Каждый день в 20:00 я напоминаю, если ты ещё не прошёл дилемму.'
    await bot.sendMessage(msg.chat.id, text)
  } catch (err) {
    console.error('Ошибка /help:', err.message)
  }
})

bot.onText(/\/stop/, async (msg) => {
  try {
    const userId = msg.from?.id
    if (!userId) return
    const telegramKey = `tg_${userId}`
    if (data.users[telegramKey]) {
      data.users[telegramKey].notificationsDisabled = true
      await saveData(data)
    }
    await bot.sendMessage(
      msg.chat.id,
      '🔕 Напоминания отключены. Чтобы вернуть — напиши /start.',
    )
  } catch (err) {
    console.error('Ошибка /stop:', err.message)
  }
})

bot.onText(/\/mystats/, async (msg) => {
  try {
    const userId = msg.from?.id
    if (!userId) return
    const telegramKey = `tg_${userId}`
    const user = data.users[telegramKey]
    if (!user) {
      await bot.sendMessage(msg.chat.id, 'Сначала запусти /start')
      return
    }
    const streak = user.streak || 0
    const totalPlayed = user.totalPlayed || 0
    const text =
      `📊 Твоя статистика:\n\n` +
      `🔥 Стрик: ${streak} ${pluralDays(streak)}\n` +
      `🎭 Пройдено дилемм: ${totalPlayed}\n\n` +
      `Продолжай в том же духе!`
    await bot.sendMessage(msg.chat.id, text)
  } catch (err) {
    console.error('Ошибка /mystats:', err.message)
  }
})

function pluralDays(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'дня'
  return 'дней'
}

// ─── Express API ───
const app = express()

// Security middleware
app.use(express.json({ limit: '10mb' }))
app.use(rateLimit)

// Trust proxy for rate limiting
app.set('trust proxy', 1)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Telegram-Init-Data',
  )
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  next()
})

// Enhanced authentication middleware
app.use((req, res, next) => {
  const userId =
    req.method === 'GET' ? String(req.query.userId || '') : req.body?.userId

  // Validate userId format
  if (userId && !validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' })
  }

  if (!userId || !userId.startsWith('tg_')) {
    next()
    return
  }

  const initData = req.headers['x-telegram-init-data']
  const tgUser = verifyTelegramInitData(initData, BOT_TOKEN)

  if (!tgUser || `tg_${tgUser.id}` !== userId) {
    return res.status(401).json({ error: 'invalid or missing Telegram init data' })
  }

  next()
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    users: Object.keys(data.users).length,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  })
})

app.post('/api/register', async (req, res) => {
  try {
    const { userId, firstName, username } = req.body || {}
    
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' })
    }
    
    const existing = data.users[userId] || {}
    data.users[userId] = {
      ...existing,
      firstName: sanitizeString(firstName || existing.firstName || ''),
      username: sanitizeString(username || existing.username || ''),
      registeredAt: existing.registeredAt || Date.now(),
      lastSeenAt: Date.now(),
    }
    
    await saveData(data)
    res.json({ ok: true })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/completed', async (req, res) => {
  try {
    const { userId, dilemmaSlug } = req.body || {}
    
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' })
    }
    
    if (!validateDilemmaSlug(dilemmaSlug)) {
      return res.status(400).json({ error: 'Invalid dilemmaSlug' })
    }

    const user = data.users[userId] || { registeredAt: Date.now() }
    const today = todayInAppTimezone()
    const lastCompleted = user.lastCompletedDate
    let streak = user.streak || 0

    if (lastCompleted !== today) {
      if (lastCompleted) {
        const gap = Math.round(
          (new Date(today) - new Date(lastCompleted)) / 86400000,
        )
        streak = gap === 1 ? streak + 1 : 1
      } else {
        streak = 1
      }
      user.lastCompletedDate = today
      user.streak = streak
      user.totalPlayed = (user.totalPlayed || 0) + 1
    }

    data.users[userId] = user
    await saveData(data)

    res.json({ ok: true, streak })
  } catch (error) {
    console.error('Completed error:', error)
    res.status(500).json({ error: 'Failed to mark completed' })
  }
})

app.get('/api/streak', (req, res) => {
  try {
    const userId = String(req.query.userId || '')
    
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' })
    }

    const user = data.users[userId]
    if (!user) {
      return res.json({
        ok: true,
        streak: 0,
        totalPlayed: 0,
        lastCompletedDate: null,
      })
    }

    // Проверяем, не сгорел ли стрик
    const today = todayInAppTimezone()
    let streak = user.streak || 0
    if (user.lastCompletedDate) {
      const gap = Math.round(
        (new Date(today) - new Date(user.lastCompletedDate)) / 86400000,
      )
      if (gap > 1) streak = 0
    }

    res.json({
      ok: true,
      streak,
      totalPlayed: user.totalPlayed || 0,
      lastCompletedDate: user.lastCompletedDate || null,
    })
  } catch (error) {
    console.error('Streak error:', error)
    res.status(500).json({ error: 'Failed to get streak' })
  }
})

// ─── Загрузка изображений для шеринга ───
app.post('/api/upload-share-image', async (req, res) => {
  try {
    // Получаем base64 изображение из тела запроса
    const { image, filename } = req.body || {}
    
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' })
    }
    
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' })
    }

    // Валидация base64 (должно начинаться с data:image/png;base64,)
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
    if (!base64Match) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 encoded image.' })
    }

    const imageType = base64Match[1]
    const base64Data = base64Match[2]
    
    // Проверяем размер (ограничиваем 5MB)
    const imageSizeBytes = (base64Data.length * 3) / 4
    if (imageSizeBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum size is 5MB.' })
    }

    // Создаем уникальный ID для изображения
    const imageId = crypto.randomUUID()
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    // Сохраняем изображение в памяти (в production можно использовать S3, Cloudinary и т.д.)
    // Для упрощения используем временное хранилище в памяти
    if (!global.tempImages) {
      global.tempImages = new Map()
    }
    
    // Сохраняем изображение с TTL (время жизни 1 час)
    global.tempImages.set(imageId, {
      data: base64Data,
      type: imageType,
      filename: cleanFilename,
      createdAt: Date.now(),
      ttl: 60 * 60 * 1000 // 1 час в миллисекундах
    })
    
    // Очищаем старые изображения
    cleanupExpiredImages()
    
    // Возвращаем публичный URL
    const publicUrl = `https://daily-dilemma.onrender.com/api/share-image/${imageId}`
    
    res.json({ 
      ok: true, 
      url: publicUrl,
      imageId: imageId,
      expiresIn: 3600 // секунд
    })
    
  } catch (error) {
    console.error('Upload share image error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Endpoint для получения загруженных изображений
app.get('/api/share-image/:imageId', (req, res) => {
  try {
    const { imageId } = req.params
    
    if (!global.tempImages || !global.tempImages.has(imageId)) {
      return res.status(404).json({ error: 'Image not found or expired' })
    }
    
    const imageData = global.tempImages.get(imageId)
    
    // Проверяем TTL
    if (Date.now() - imageData.createdAt > imageData.ttl) {
      global.tempImages.delete(imageId)
      return res.status(404).json({ error: 'Image expired' })
    }
    
    // Конвертируем base64 в buffer
    const buffer = Buffer.from(imageData.data, 'base64')
    
    // Устанавливаем правильные заголовки
    res.setHeader('Content-Type', `image/${imageData.type}`)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=3600') // Кешируем на 1 час
    res.setHeader('Content-Disposition', `inline; filename="${imageData.filename}"`)
    
    res.send(buffer)
    
  } catch (error) {
    console.error('Get share image error:', error)
    res.status(500).json({ error: 'Failed to get image' })
  }
})

// Функция для очистки устаревших изображений
function cleanupExpiredImages() {
  if (!global.tempImages) return
  
  const now = Date.now()
  for (const [imageId, imageData] of global.tempImages.entries()) {
    if (now - imageData.createdAt > imageData.ttl) {
      global.tempImages.delete(imageId)
    }
  }
}

// Периодическая очистка каждые 10 минут
setInterval(cleanupExpiredImages, 10 * 60 * 1000)

// ─── Крон: напоминания в 20:00 ───
cron.schedule(
  '0 20 * * *',
  async () => {
    const today = todayInAppTimezone()
    console.log(`[${new Date().toISOString()}] Отправка напоминаний...`)

    let sentCount = 0
    let errorCount = 0

    for (const [userId, user] of Object.entries(data.users)) {
      if (user.notificationsDisabled) continue
      if (!user.chatId) continue
      if (user.lastCompletedDate === today) continue

      const streak = user.streak || 0
      const text =
        streak > 0
          ? `🔥 Твоя серия ${streak} ${pluralDays(streak)} под угрозой!\n\nЗайди и пройди сегодняшнюю дилемму, пока не сгорела.`
          : `🎭 Сегодняшняя дилемма ждёт тебя!\n\nЗайди и сделай свой выбор.`

      try {
        await bot.sendMessage(user.chatId, text, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🎭 Открыть Дилемму дня',
                  web_app: { url: WEBAPP_URL },
                },
              ],
            ],
          },
        })
        sentCount++
      } catch (err) {
        console.error(`Не удалось отправить ${userId}:`, err.message)
        errorCount++
      }
    }

    console.log(`Напоминания отправлены: ${sentCount} успешно, ${errorCount} ошибок.`)
  },
  { timezone: APP_TIMEZONE },
)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// ─── Запуск ───
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`)
  console.log(`✅ Бот активен`)
  console.log(`✅ Крон напоминаний: 20:00 ${APP_TIMEZONE}`)
  console.log(`✅ Rate limiting: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW/1000}s`)
})