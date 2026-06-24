import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LampDesk, Loader2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const { signIn, user, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (!error) {
      setIsExiting(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 300)
    } else {
      toast({
        variant: 'destructive',
        title: 'Acesso negado',
        description: 'Credenciais inválidas. Verifique seu e-mail e senha.',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/50" />
      </div>

      <div
        className={cn(
          'w-full max-w-md space-y-8 p-8 md:p-10 bg-card/50 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-10 transition-all duration-300',
          isExiting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0',
          'animate-fade-in',
        )}
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <LampDesk size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            Central Lucenera
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Plataforma unificada para gestão de sistemas
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input
              id="email"
              type="email"
              placeholder="pedro@lucenera.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 px-4 bg-background/50 focus-visible:ring-primary"
              disabled={isLoading || isExiting}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 px-4 bg-background/50 focus-visible:ring-primary"
              disabled={isLoading || isExiting}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium transition-all active:scale-[0.98] mt-4 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            disabled={isLoading || isExiting}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar na Central <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Ambiente seguro. Acesso restrito a colaboradores autorizados Lucenera®.
          </p>
        </div>
      </div>
    </div>
  )
}
