export interface ShareOutcome {
  method: 'telegram' | 'download' | 'failed'
  error?: string
}

export async function shareImage(blob: Blob, filename: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: 'image/png' })
  const url = URL.createObjectURL(blob)

  // 1. Telegram: если есть нативный share API
  try {
    const wa = window.Telegram?.WebApp as
      | (Window['Telegram'] extends { WebApp?: infer W } ? W : never)
      | undefined

    const anyWa = wa as unknown as {
      shareToStory?: (mediaUrl: string) => void
      isVersionAtLeast?: (v: string) => boolean
    } | undefined

    // shareToStory доступен в свежих версиях
    if (anyWa?.shareToStory && anyWa?.isVersionAtLeast?.('7.8')) {
      anyWa.shareToStory(url)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return { method: 'telegram' }
    }
  } catch (err) {
    console.warn('Telegram share failed:', err)
  }

  // 2. Web Share API (iOS Safari, Android Chrome)
  try {
    if (
      typeof navigator !== 'undefined' &&
      'canShare' in navigator &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: 'Дилемма дня',
        text: 'Мой выбор в дилемме дня',
      })
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return { method: 'telegram' }
    }
  } catch (err) {
    console.warn('Web Share failed:', err)
  }

  // 3. Fallback: скачивание файла
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return { method: 'download' }
  } catch (err) {
    return {
      method: 'failed',
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}