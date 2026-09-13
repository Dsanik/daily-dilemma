import type { Story, StoryFinale, StoryProgress } from '../types'

const WIDTH = 1080

/**
 * Высота зависит от количества выборов:
 * - ≤ 5 выборов → 1440 (пост 4:5, плотный)
 * - 6–8 выборов → 1920 (стандартный сторис)
 */
function getCanvasHeight(choicesCount: number): number {
  return choicesCount <= 5 ? 1440 : 1920
}

interface ShareStoryCardOptions {
  story: Story
  progress: StoryProgress
  finale: StoryFinale | null
  // "Премиум-карточка" из магазина — золотая рамка + бейдж на PNG.
  premium?: boolean
}

export async function generateStoryShareCard({
  story,
  progress,
  finale,
  premium = false,
}: ShareStoryCardOptions): Promise<Blob> {
  const choicesCount = progress.choices.length
  const HEIGHT = getCanvasHeight(choicesCount)
  const isCompact = HEIGHT === 1440

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context не поддерживается')

  // ─── Фон ───
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bgGradient.addColorStop(0, '#0a0a14')
  bgGradient.addColorStop(0.5, '#13121f')
  bgGradient.addColorStop(1, '#0f0f14')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Акцентное пятно в цвете обложки
  const hex = story.coverColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const spot = ctx.createRadialGradient(150, 200, 0, 150, 200, 700)
  spot.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.22)`)
  spot.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = spot
  ctx.fillRect(0, 0, WIDTH, 800)

  const spot2 = ctx.createRadialGradient(930, HEIGHT - 200, 0, 930, HEIGHT - 200, 700)
  spot2.addColorStop(0, 'rgba(139, 92, 246, 0.18)')
  spot2.addColorStop(1, 'rgba(139, 92, 246, 0)')
  ctx.fillStyle = spot2
  ctx.fillRect(0, HEIGHT - 720, WIDTH, 720)

  // ─── Шапка ───
  const headerY = isCompact ? 100 : 130

  ctx.fillStyle = story.coverColor
  ctx.font = '600 32px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('МОЯ ИСТОРИЯ', 80, headerY)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '400 26px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(
    new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    80,
    headerY + 45,
  )

  if (premium) {
    ctx.fillStyle = '#fbbf24'
    ctx.font = '700 26px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('👑 ПРЕМИУМ', WIDTH - 80, headerY)
    ctx.textAlign = 'left'
  }

  // ─── Название истории ───
  const titleY = isCompact ? 260 : 320
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 64px -apple-system, "Segoe UI", Roboto, sans-serif'
  const titleEndY = wrapText(ctx, story.title, 80, titleY, WIDTH - 160, 80)

  // ─── Финальная концовка ───
  // boxY отталкивается от того, где реально закончился заголовок (он может
  // перенестись на 2-3 строки для длинных названий), а не от фиксированного
  // значения — иначе длинный заголовок наезжал бы на блок концовки.
  const minBoxY = isCompact ? 380 : 460
  const boxY = Math.max(minBoxY, titleEndY + 70)
  const boxHeight = isCompact ? 180 : 200

  if (finale) {
    ctx.fillStyle = `${finale.color}22`
    roundRect(ctx, 80, boxY, WIDTH - 160, boxHeight, 24)
    ctx.fill()

    ctx.strokeStyle = `${finale.color}66`
    ctx.lineWidth = 2
    roundRect(ctx, 80, boxY, WIDTH - 160, boxHeight, 24)
    ctx.stroke()

    ctx.fillStyle = finale.color
    ctx.font = '700 24px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('ТВОЯ КОНЦОВКА', 120, boxY + 55)

    ctx.fillStyle = '#ffffff'
    ctx.font = '800 52px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(finale.title, 120, boxY + 120)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '400 22px -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(`${progress.choices.length} ключевых выборов`, 120, boxY + 158)
  }

  // ─── Путь с динамическими размерами ───
  const startY = isCompact ? 630 : 700

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '600 24px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('ТВОЙ ПУТЬ', 80, startY)

  const recentChoices = progress.choices.slice(-8)

  // Динамический размер строк в зависимости от количества выборов
  const rowHeight =
    recentChoices.length <= 3 ? 140 : recentChoices.length <= 5 ? 120 : 100
  const circleRadius =
    recentChoices.length <= 3 ? 28 : recentChoices.length <= 5 ? 24 : 20
  const choiceFontSize =
    recentChoices.length <= 3 ? 32 : recentChoices.length <= 5 ? 28 : 24
  const chapterFontSize =
    recentChoices.length <= 3 ? 20 : recentChoices.length <= 5 ? 18 : 16

  let rowY = startY + (isCompact ? 70 : 100)

  // Вертикальная линия пути
  if (recentChoices.length > 1) {
    ctx.strokeStyle = `${story.coverColor}40`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(110, rowY - 10)
    ctx.lineTo(110, rowY - 10 + (recentChoices.length - 1) * rowHeight)
    ctx.stroke()
  }

  for (const choice of recentChoices) {
    const chapterIndex = story.chapters.findIndex(
      (c) => c.id === choice.chapterId,
    )
    const chapterNum = chapterIndex >= 0 ? chapterIndex + 1 : '?'

    // Кружок с номером
    ctx.fillStyle = story.coverColor
    ctx.beginPath()
    ctx.arc(110, rowY - 10, circleRadius, 0, Math.PI * 2)
    ctx.fill()

    // Белая обводка вокруг кружка — отделяет от линии
    ctx.strokeStyle = '#0f0f14'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(110, rowY - 10, circleRadius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${Math.round(choiceFontSize * 0.85)}px -apple-system, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(String(chapterNum), 110, rowY - 3)
    ctx.textAlign = 'left'

    // Название главы над выбором
    const chapter = story.chapters.find((c) => c.id === choice.chapterId)
    if (chapter) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = `500 ${chapterFontSize}px -apple-system, "Segoe UI", Roboto, sans-serif`
      const shortTitle =
        chapter.title.length > 42
          ? chapter.title.slice(0, 39) + '…'
          : chapter.title
      ctx.fillText(shortTitle, 160, rowY - circleRadius - 5)
    }

    // Сам выбор
    ctx.fillStyle = '#ffffff'
    ctx.font = `500 ${choiceFontSize}px -apple-system, "Segoe UI", Roboto, sans-serif`
    const maxLabelLen =
      recentChoices.length <= 3 ? 42 : recentChoices.length <= 5 ? 48 : 52
    const shortLabel =
      choice.label.length > maxLabelLen
        ? choice.label.slice(0, maxLabelLen - 3) + '…'
        : choice.label
    ctx.fillText(shortLabel, 160, rowY + circleRadius * 0.4)

    rowY += rowHeight
  }

  // ─── Подвал ───
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '400 26px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Дилемма дня', WIDTH / 2, HEIGHT - 60)

  // ─── Премиум-рамка ───
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
      0.92,
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