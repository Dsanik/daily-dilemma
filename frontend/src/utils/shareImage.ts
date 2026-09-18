import { api } from '../api/client';

export interface ShareOutcome {
  method: "telegram" | "download" | "preview" | "failed";
  error?: string;
}

export async function shareImage(
  blob: Blob,
  filename: string,
): Promise<ShareOutcome> {
  const isTelegramWebView = Boolean(window.Telegram?.WebApp?.initData);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ИСПРАВЛЕНИЕ 1: Для Telegram Mini App на мобильных устройствах используем публичный URL
  if (isTelegramWebView && isMobile) {
    try {
      
      // Загружаем изображение на сервер и получаем публичный HTTPS URL
      const uploadResult = await api.uploadShareImage(blob, filename);
      
      if (!uploadResult?.ok || !uploadResult.url) {
        throw new Error(uploadResult?.error || 'Failed to upload image');
      }

      const publicUrl = uploadResult.url;

      // Пробуем Telegram Web App API с публичным URL
      const webApp = window.Telegram?.WebApp;
      
      if (webApp) {
        // ИСПРАВЛЕНИЕ 2: Используем правильные методы Telegram Web App API
        
        // 1a. shareToStory для Stories (работает в новых версиях)
        if (typeof webApp.shareToStory === 'function' && 
            typeof webApp.isVersionAtLeast === 'function' && 
            webApp.isVersionAtLeast('7.8')) {
          webApp.shareToStory(publicUrl);
          return { method: "telegram" };
        }

        // 1b. openTelegramLink для обычного шеринга
        if (typeof webApp.openTelegramLink === 'function') {
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent('Мой результат в Дилемме дня!')}`;
          webApp.openTelegramLink(shareUrl);
          return { method: "telegram" };
        }

        // 1c. openLink как fallback
        if (typeof webApp.openLink === 'function') {
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent('Мой результат в Дилемме дня!')}`;
          webApp.openLink(shareUrl);
          return { method: "telegram" };
        }
      }

      // Fallback: открываем изображение в новом окне для ручного сохранения
      window.open(publicUrl, '_blank');
      return { method: "preview" };

    } catch (error) {
      console.error('Mobile Telegram share error:', error);
      // Fallback на локальный blob URL
      return shareWithLocalUrl(blob, filename, isTelegramWebView);
    }
  }

  // ИСПРАВЛЕНИЕ 3: Для всех остальных случаев используем локальную логику
  return shareWithLocalUrl(blob, filename, isTelegramWebView);
}

// Функция для шеринга с локальным blob URL (для десктопа и fallback)
function shareWithLocalUrl(blob: Blob, filename: string, isTelegramWebView: boolean): Promise<ShareOutcome> {
  return new Promise((resolve) => {
    const file = new File([blob], filename, { type: "image/png" });
    const url = URL.createObjectURL(blob);

    // Cleanup function
    const cleanup = () => URL.revokeObjectURL(url);

    // 1. Web Share API (работает на некоторых платформах)
    if (typeof navigator !== "undefined" && 
        "canShare" in navigator && 
        typeof navigator.canShare === "function") {
      try {
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "Дилемма дня",
            text: "Мой выбор в дилемме дня",
          }).then(() => {
            cleanup();
            resolve({ method: "telegram" });
          }).catch((err) => {
            console.warn("Web Share failed:", err);
            fallbackShare();
          });
          return;
        }
      } catch (err) {
        console.warn("Web Share API error:", err);
      }
    }

    function fallbackShare() {
      // 2a. Telegram WebView: открываем изображение для ручного сохранения
      if (isTelegramWebView) {
        try {
          window.open(url, "_blank");
          setTimeout(cleanup, 5000);
          resolve({ method: "preview" });
        } catch (err) {
          console.warn("Preview open failed:", err);
          downloadFallback();
        }
      } else {
        downloadFallback();
      }
    }

    function downloadFallback() {
      // 2b. Обычный браузер: программное скачивание
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(cleanup, 1000);
        resolve({ method: "download" });
      } catch (err) {
        cleanup();
        resolve({
          method: "failed",
          error: err instanceof Error ? err.message : "Download failed",
        });
      }
    }

    fallbackShare();
  });
}
