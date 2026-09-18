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
      className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-40 border-t md:hidden backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--app-bg)',
        borderColor: 'var(--calm-border)',
      }}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-around py-3">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-2 py-2 calm-transition calm-scale rounded-xl"
              style={{
                color: isActive ? 'var(--app-accent)' : 'var(--app-hint)',
              }}
              aria-label={tab.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span 
                className="whitespace-nowrap font-medium"
                style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}