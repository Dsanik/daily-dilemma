export function AboutPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">О проекте</h1>
        <p className="mt-1 text-xs opacity-60">Дилемма дня — что это и зачем</p>
      </div>

      <div
        className="flex flex-col gap-3 rounded-2xl p-5"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <p className="text-sm leading-relaxed">
          Каждый день — одна этическая или жизненная ситуация. Ты делаешь
          выбор. В конце видишь, как поступили другие.
        </p>
        <p className="text-sm leading-relaxed">
          Здесь нет правильных ответов. Есть только выборы — и то, что за ними
          стоит.
        </p>
      </div>

      <div
        className="flex flex-col gap-3 rounded-2xl p-5"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
          Приватность
        </p>
        <ul className="flex flex-col gap-2 text-xs leading-relaxed opacity-80">
          <li>· Мы не строим психологический профиль</li>
          <li>· Мы не ставим диагнозы</li>
          <li>
            · Основной прогресс хранится локально на твоём устройстве
          </li>
          <li>
            · Если открываешь бота в Telegram — стрик и число пройденных
            дилемм дополнительно сохраняются на сервере, чтобы не терять их
            при смене устройства
          </li>
          <li>
            · «Аргументы» в «Трибунале» — примеры типичных позиций, а не
            сообщения других игроков в реальном времени
          </li>
        </ul>
      </div>

      <div
        className="flex flex-col gap-3 rounded-2xl p-5"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
          Уникальные механики
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold">Зеркало меньшинства</p>
            <p className="mt-0.5 text-[11px] leading-relaxed opacity-70">
              Если ты выбрал редкий вариант — увидишь, как ещё мыслят люди с
              таким же выбором.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold">Анонимный трибунал</p>
            <p className="mt-0.5 text-[11px] leading-relaxed opacity-70">
              Оставь свой аргумент и почитай примеры того, как рассуждают
              люди, выбравшие иначе.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}