import type { ReactNode } from 'react'
import { BottomNav, type TabId } from '../BottomNav'
import { SidebarNav } from '../SidebarNav'

interface NavigationWrapperProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  showBottomNav?: boolean
  children: ReactNode
}

export function NavigationWrapper({
  activeTab,
  onTabChange,
  showBottomNav = true,
  children
}: NavigationWrapperProps) {
  return (
    <div className="app-shell flex min-h-screen">
      {/* Desktop Sidebar */}
      <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content */}
      <div className="flex min-h-screen w-full flex-1 flex-col">
        <main className="flex min-h-screen w-full flex-1 flex-col">
          <div className="safe-top mx-auto flex w-full max-w-md flex-col px-6 pb-28 pt-6 md:max-w-3xl md:pb-12 md:pt-10 lg:max-w-4xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  )
}