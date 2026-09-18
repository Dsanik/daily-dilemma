import { popup } from '@telegram-apps/sdk-react'

/**
 * Показывает диалог подтверждения. Внутри Telegram использует нативный
 * попап платформы (в теме приложения), вне Telegram — браузерный confirm().
 * Раньше везде использовался голый window.confirm(), который в Telegram
 * WebView выглядит чужеродно и не всегда ведёт себя предсказуемо.
 */
export async function confirmDialog(message: string): Promise<boolean> {
  try {
    if (popup.open.isAvailable()) {
      const buttonId = await popup.open({
        message,
        buttons: [
          { id: 'confirm', type: 'destructive', text: 'Да, сбросить' },
          { id: 'cancel', type: 'cancel' },
        ],
      })
      return buttonId === 'confirm'
    }
  } catch (err) {
    // Telegram popup недоступен, используем стандартный confirm
  }

  return window.confirm(message)
}