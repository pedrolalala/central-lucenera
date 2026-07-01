import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'
import logoUrl from '@/assets/logotipo-verticalv1branco-0271a.png'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const showHeader =
    user && (location.pathname === '/dashboard' || location.pathname.startsWith('/admin'))

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {showHeader && (
        <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-[1200px]">
            <div className="flex items-center gap-3">
              <div
                className="cursor-pointer transition-opacity hover:opacity-80 flex items-center justify-center"
                onClick={() => navigate('/dashboard')}
              >
                <img
                  src={logoUrl}
                  alt="Luce Nera"
                  className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {profile?.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className={`text-muted-foreground hover:text-primary transition-colors ${location.pathname.startsWith('/admin') ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Administração</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-muted border-border"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
    </div>
  )
}
