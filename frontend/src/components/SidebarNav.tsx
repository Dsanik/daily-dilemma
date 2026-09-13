import { NAV_TABS, type TabId } from './BottomNav'

interface SidebarNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r p-6 safe-top md:flex"
      style={{
        borderColor: 'rgba(128,128,128,0.15)',
      }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Дилемма дня</h1>
        <p className="text-xs opacity-60">
          Один выбор в день. Живая статистика.
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? 'rgba(74, 158, 255, 0.12)'
                  : 'transparent',
                color: isActive ? 'var(--app-accent)' : 'var(--app-text)',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto">
        <p className="text-[10px] opacity-40">
          v1.0 · Прогресс хранится локально; в Telegram стрик также
          синхронизируется с сервером
        </p>
      </div>
    </aside>
  )
}