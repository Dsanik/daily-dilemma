import { useEffect, useState, useCallback, useRef } from 'react'
import {
  init,
  miniApp,
  viewport,
  themeParams,
  hapticFeedback,
} from '@telegram-apps/sdk-react'
import type { TelegramUser } from '../types'

interface TelegramWebAppShape {
  initData?: string
  initDataUnsafe?: {
    user?: TelegramUser
  }
  ready?: () => void
  expand?: () => void
  // Share API methods
  shareToStory?: (mediaUrl: string) => void
  isVersionAtLeast?: (version: string) => boolean
  openTelegramLink?: (url: string) => void
  openLink?: (url: string) => void
  MainButton?: {
    setText: (text: string) => void
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppShape
    }
  }
}

export function useTelegram() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<TelegramUser | undefined>(undefined)
  const [initData, setInitData] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Haptic feedback wrapper
  const triggerHaptic = useCallback((type: 'impact' | 'notification' | 'selection', style?: string) => {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.HapticFeedback) {
        switch (type) {
          case 'impact':
            webApp.HapticFeedback.impactOccurred((style as 'light' | 'medium' | 'heavy') || 'medium')
            break
          case 'notification':
            webApp.HapticFeedback.notificationOccurred((style as 'error' | 'success' | 'warning') || 'success')
            break
          case 'selection':
            webApp.HapticFeedback.selectionChanged()
            break
        }
      } else if (hapticFeedback.impactOccurred.isAvailable()) {
        // Fallback to SDK
        switch (type) {
          case 'impact':
            hapticFeedback.impactOccurred((style as 'light' | 'medium' | 'heavy') || 'medium')
            break
          case 'notification':
            hapticFeedback.notificationOccurred((style as 'error' | 'success' | 'warning') || 'success')
            break
          case 'selection':
            hapticFeedback.selectionChanged()
            break
        }
      }
    } catch (err) {
      console.warn('Haptic feedback error:', err)
    }
  }, [])

  // Храним последний зарегистрированный колбэк, чтобы отписать его перед
  // регистрацией нового — иначе Telegram копит обработчики onClick, и один
  // тап по кнопке вызывает все когда-либо переданные колбэки разом.
  const mainButtonCallbackRef = useRef<(() => void) | null>(null)
  const backButtonCallbackRef = useRef<(() => void) | null>(null)

  // Main button controls
  const showMainButton = useCallback((text: string, onClick: () => void) => {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.MainButton) {
        if (mainButtonCallbackRef.current) {
          webApp.MainButton.offClick(mainButtonCallbackRef.current)
        }
        mainButtonCallbackRef.current = onClick
        webApp.MainButton.setText(text)
        webApp.MainButton.onClick(onClick)
        webApp.MainButton.show()
      }
    } catch (err) {
      console.warn('Main button error:', err)
    }
  }, [])

  const hideMainButton = useCallback(() => {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.MainButton) {
        if (mainButtonCallbackRef.current) {
          webApp.MainButton.offClick(mainButtonCallbackRef.current)
          mainButtonCallbackRef.current = null
        }
        webApp.MainButton.hide()
      }
    } catch (err) {
      console.warn('Main button hide error:', err)
    }
  }, [])

  // Back button controls
  const showBackButton = useCallback((onClick: () => void) => {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.BackButton) {
        if (backButtonCallbackRef.current) {
          webApp.BackButton.offClick(backButtonCallbackRef.current)
        }
        backButtonCallbackRef.current = onClick
        webApp.BackButton.onClick(onClick)
        webApp.BackButton.show()
      }
    } catch (err) {
      console.warn('Back button error:', err)
    }
  }, [])

  const hideBackButton = useCallback(() => {
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.BackButton) {
        if (backButtonCallbackRef.current) {
          webApp.BackButton.offClick(backButtonCallbackRef.current)
          backButtonCallbackRef.current = null
        }
        webApp.BackButton.hide()
      }
    } catch (err) {
      console.warn('Back button hide error:', err)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const initializeTelegram = async () => {
      try {
        const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
        const hasTelegram = Boolean(webApp?.initData)

        if (!mounted) return

        setUser(webApp?.initDataUnsafe?.user)
        setInitData(webApp?.initData ?? '')

        if (hasTelegram) {
          try {
            // Initialize SDK
            await init()
            
            // Mount components with error handling
            if (miniApp.mount.isAvailable()) {
              miniApp.mount()
              miniApp.ready()
            }
            
            if (viewport.mount.isAvailable()) {
              viewport.mount()
              viewport.expand()
              
              // Note: Viewport event handling would need proper SDK integration
            }
            
            if (themeParams.mount.isAvailable()) {
              themeParams.mount()
            }

            // Initialize haptic feedback
            if (hapticFeedback.impactOccurred.isAvailable()) {
              // Haptic feedback is available
            }

          } catch (err) {
            console.warn('Telegram SDK init error:', err)
            setError('Failed to initialize Telegram SDK')
          }
        } else {
          // Browser fallback
          try {
            webApp?.ready?.()
            webApp?.expand?.()
          } catch (err) {
            console.warn('Browser fallback error:', err)
          }
        }

        if (mounted) {
          setReady(true)
        }
      } catch (err) {
        console.error('Telegram initialization error:', err)
        if (mounted) {
          setError('Failed to initialize')
          setReady(true) // Still set ready to not block the app
        }
      }
    }

    initializeTelegram()

    return () => {
      mounted = false
    }
  }, [])

  return {
    user,
    ready,
    isTelegram: Boolean(initData),
    initData,
    error,
    triggerHaptic,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
  }
}