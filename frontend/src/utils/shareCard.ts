import type { DilemmaResult } from '../types'

const WIDTH = 1080
const HEIGHT = 1920

interface ShareCardOptions {
  result: DilemmaResult
  dilemmaTitle: string
  date?: string
  // "Премиум-карточка" из магазина — золотая рамка + бейдж на PNG.
  premium?: boolean
}

export async function generateShareCard({
  result,
  dilemmaTitle,
  date,
  premium = false,
}: ShareCardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context не поддерживается')

  // ─── Фон ───
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bgGradient.addColorStop(0, '#0a0a14')
  bgGradient.addColorStop(0.5, '#13121f')
  bgGradient.addColorStop(1, '#1a0f28')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Акцентные цветовые пятна
  const spot1 = ctx.createRadialGradient(150, 200, 0, 150, 200, 500)
  spot1.addColorStop(0, 'rgba(74, 158, 255, 0.18)')
  spot1.addColorStop(1, 'rgba(74, 158, 255, 0)')
  ctx.fillStyle = spot1
  ctx.fillRect(0, 0, WIDTH, 600)

  const spot2 = ctx.createRadialGradient(930, 1700, 0, 930, 1700, 600)
  spot2.addColorStop(0, 'rgba(139, 92, 246, 0.15)')
  spot2.addColorStop(1, 'rgba(139, 92, 246, 0)')
  ctx.fillStyle = spot2
  ctx.fillRect(0, 1200, WIDTH, 720)

  // ─── Шапка ───
  ctx.fillStyle = '#4a9eff'
  ctx.font = '600 36px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('ДИЛЕММА ДНЯ', 80, 140)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '400 28px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(
    date ?? new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    80,
    190,
  )

  if (premium) {
    ctx.fillStyle = '#fbbf24'
    ctx.font = '700 28px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('👑 ПРЕМИУМ', WIDTH - 80, 140)
    ctx.textAlign = 'left'
  }

  // ─── Название дилеммы ───
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 72px -apple-system, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, dilemmaTitle, 80, 360, WIDTH - 160, 90)

  // ─── Разделительная линия ───
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 560)
  ctx.lineTo(WIDTH - 80, 560)
  ctx.stroke()

  // ─── Твой выбор ───
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '600 32px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('МОЙ ВЫБОР', 80, 660)

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 80px -apple-system, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, result.your_outcome, 80, 760, WIDTH - 160, 96)

  // ─── Процент совпадения ───
  const boxY = 1080
  const boxH = 260
  ctx.fillStyle = 'rgba(74, 158, 255, 0.1)'
  roundRect(ctx, 80, boxY, WIDTH - 160, boxH, 32)
  ctx.fill()

  ctx.strokeStyle = 'rgba(74, 158, 255, 0.3)'
  ctx.lineWidth = 2
  roundRect(ctx, 80, boxY, WIDTH - 160, boxH, 32)
  ctx.stroke()

  // Большой процент
  ctx.fillStyle = '#4a9eff'
  ctx.font = '800 160px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${result.match_percent}%`, WIDTH / 2, boxY + 175)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '400 32px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(
    `из ${result.total_players} игроков поступили так же`,
    WIDTH / 2,
    boxY + 225,
  )

  ctx.textAlign = 'left'

  // ─── Как поступили другие ───
  const othersY = 1420
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '600 28px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('КАК ПОСТУПИЛИ ДРУГИЕ', 80, othersY)

  const sorted = Object.entries(result.stats).sort((a, b) => b[1] - a[1])
  const maxRows = 4
  const rows = sorted.slice(0, maxRows)

  let rowY = othersY + 70
  for (const [optionId, count] of rows) {
    const label = result.stat_labels?.[optionId] ?? optionId
    const percent = Math.round((count / result.total_players) * 100)
    const isYours = optionId === result.your_choice

    ctx.fillStyle = isYours ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
    ctx.font = `${isYours ? '600' : '400'} 36px -apple-system, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(truncate(label, 28), 80, rowY)

    ctx.textAlign = 'right'
    ctx.fillStyle = isYours ? '#4a9eff' : 'rgba(255, 255, 255, 0.9)'
    ctx.font = '700 36px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(`${percent}%`, WIDTH - 80, rowY)
    ctx.textAlign = 'left'

    // Прогресс-бар
    const barY = rowY + 20
    const barW = WIDTH - 160
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    roundRect(ctx, 80, barY, barW, 10, 5)
    ctx.fill()

    ctx.fillStyle = isYours ? '#4a9eff' : 'rgba(255, 255, 255, 0.4)'
    roundRect(ctx, 80, barY, (barW * percent) / 100, 10, 5)
    ctx.fill()

    rowY += 90
  }

  // ─── Подвал ───
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '400 28px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('t.me/daily_dilemma_ru_bot · Дилемма дня', WIDTH / 2, HEIGHT - 80)

  // ─── Премиум-рамка ───
  // Рисуем последней, поверх всего остального содержимого карточки.
  if (premium) {
    const inset = 16
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 6
    roundRect(ctx, inset, inset, WIDTH - inset * 2, HEIGHT - inset * 2, 28)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
    ctx.lineWidth = 2
    roundRect(
      ctx,
      inset + 10,
      inset + 10,
      WIDTH - (inset + 10) * 2,
      HEIGHT - (inset + 10) * 2,
      22,
    )
    ctx.stroke()
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Не удалось создать PNG'))
        else resolve(blob)
      },
      'image/png',
      1,
    )
  })
}

// ─── Хелперы ───

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
  return currentY
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}