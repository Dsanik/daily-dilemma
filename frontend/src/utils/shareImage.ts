export interface ShareOutcome {
  method: "telegram" | "download" | "preview" | "failed";
  error?: string;
}

export async function shareImage(
  blob: Blob,
  filename: string,
): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const isTelegramWebView = Boolean(window.Telegram?.WebApp?.initData);

  // 1. Telegram: если есть нативный share API
  try {
    const wa = window.Telegram?.WebApp as
      | (Window["Telegram"] extends { WebApp?: infer W } ? W : never)
      | undefined;

    const anyWa = wa as unknown as
      | {
          shareToStory?: (mediaUrl: string) => void;
          isVersionAtLeast?: (v: string) => boolean;
        }
      | undefined;

    // shareToStory доступен в свежих версиях
    if (anyWa?.shareToStory && anyWa?.isVersionAtLeast?.("7.8")) {
      anyWa.shareToStory(url);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { method: "telegram" };
    }
  } catch (err) {
    console.warn("Telegram share failed:", err);
  }

  // 2. Web Share API (iOS Safari, Android Chrome) — часто недоступен именно
  // внутри встроенного WebView Telegram, но пробуем в любом контексте.
  try {
    if (
      typeof navigator !== "undefined" &&
      "canShare" in navigator &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "Дилемма дня",
        text: "Мой выбор в дилемме дня",
      });
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { method: "telegram" };
    }
  } catch (err) {
    console.warn("Web Share failed:", err);
  }

  // 3a. Внутри Telegram Mini App скачивание через невидимую <a download>
  // ЧАСТО НЕ РАБОТАЕТ: встроенный WebView может "проглотить" клик без
  // ошибки, но так и не положить файл никуда, куда пользователь может
  // добраться (не в Галерею, не в Файлы) — визуально выглядит как успех,
  // а по факту файл нигде не найти. Поэтому здесь вместо тихого скачивания
  // открываем картинку на весь экран — там гарантированно работает
  // системный жест "нажать и удержать → сохранить", т.к. это уже обычное
  // изображение на странице, а не программное скачивание.
  if (isTelegramWebView) {
    try {
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { method: "preview" };
    } catch (err) {
      console.warn("Preview open failed:", err);
    }
  }

  // 3b. Обычный браузер (не Telegram) — тут скачивание работает нормально
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { method: "download" };
  } catch (err) {
    return {
      method: "failed",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
