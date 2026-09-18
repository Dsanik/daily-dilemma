import { NAV_TABS, type TabId } from './BottomNav'

interface SidebarNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-8 border-r p-8 safe-top md:flex"
      style={{
        borderColor: 'var(--calm-border)',
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 
          className="font-bold"
          style={{ 
            fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', 
            lineHeight: '1.3',
            color: 'var(--app-text)'
          }}
        >
          Дилемма дня
        </h1>
        <p 
          className="opacity-70"
          style={{ 
            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', 
            lineHeight: '1.5',
            color: 'var(--app-hint)'
          }}
        >
          Один выбор в день. Живая статистика.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-4 rounded-2xl px-4 py-3 text-left font-medium calm-transition calm-scale"
              style={{
                backgroundColor: isActive
                  ? 'var(--calm-surface)'
                  : 'transparent',
                color: isActive ? 'var(--app-accent)' : 'var(--app-text)',
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto">
        <p 
          className="opacity-50"
          style={{ 
            fontSize: 'clamp(0.625rem, 1.25vw, 0.75rem)', 
            lineHeight: '1.4',
            color: 'var(--app-hint)'
          }}
        >
          v1.0 · Прогресс хранится локально; в Telegram стрик также
          синхронизируется с сервером
        </p>
      </div>
    </aside>
  )
}