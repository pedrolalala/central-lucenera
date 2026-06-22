import { useState, type FormEvent } from 'react'
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
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

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
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-primary">
        <img
          src="https://img.usecurling.com/p/1200/1200?q=luxury%20lighting&dpr=2"
          className="absolute inset-0 object-cover w-full h-full opacity-60 mix-blend-overlay"
          alt="Luxury architectural lighting"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-primary-foreground z-10 animate-fade-in-up">
          <div className="w-16 h-16 bg-accent/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-accent/30 shadow-elevation">
            <LampDesk size={32} className="text-accent" />
          </div>
          <h1 className="text-5xl font-display font-semibold tracking-tight mb-4">
            Central Lucenera
          </h1>
          <p className="text-xl text-primary-foreground/80 font-light max-w-lg leading-relaxed">
            Plataforma unificada para gestão de sistemas e processos de design e iluminação.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <div
          className={cn(
            'w-full max-w-md space-y-8 transition-all duration-300',
            isExiting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0',
            'animate-fade-in',
          )}
        >
          <div className="text-center lg:text-left mb-10">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 lg:hidden">
              <LampDesk size={24} className="text-primary" />
            </div>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-primary">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Insira suas credenciais para acessar a central.
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
                className="h-12 px-4 bg-white focus-visible:ring-accent"
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
                className="h-12 px-4 bg-white focus-visible:ring-accent"
                disabled={isLoading || isExiting}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium transition-all active:scale-[0.98] mt-4"
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

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Ambiente seguro. Acesso restrito a colaboradores autorizados Lucenera®.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
