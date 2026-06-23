import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut, LampDesk } from 'lucide-react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isDashboard = location.pathname === '/dashboard'

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {user && isDashboard && (
        <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-[1200px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center border border-accent/20 shadow-sm">
                <LampDesk className="w-5 h-5 text-accent" />
              </div>
              <span className="font-display font-semibold tracking-tight text-xl text-primary">
                Central Lucenera
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted border-border"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
    </div>
  )
}
