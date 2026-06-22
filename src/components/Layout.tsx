import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { LogOut, LampDesk } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'

export default function Layout() {
  const { isAuthenticated, logout } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  if (isAuthenticated && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isAuthenticated && (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-accent/40 shadow-sm transition-all">
          <div className="container mx-auto px-4 max-w-[1200px] h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <LampDesk size={18} />
              </div>
              <span className="font-display font-semibold text-primary tracking-wide text-lg">
                Central Lucenera
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
    </div>
  )
}
