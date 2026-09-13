import { Home, Archive, BookOpen, User, Info } from 'lucide-react'

export type TabId = 'today' | 'archive' | 'stories' | 'profile' | 'about'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

export const NAV_TABS: Tab[] = [
  { id: 'today', label: 'Сегодня', icon: Home },
  { id: 'archive', label: 'Архив', icon: Archive },
  { id: 'stories', label: 'Истории', icon: BookOpen },
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'about', label: 'О проекте', icon: Info },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
      style={{
        backgroundColor: 'var(--app-bg)',
        borderColor: 'rgba(128,128,128,0.15)',
      }}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-around py-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-1 py-1 transition-colors"
              style={{
                color: isActive ? 'var(--app-accent)' : 'var(--app-hint)',
              }}
              aria-label={tab.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="whitespace-nowrap text-[9px] font-medium">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}