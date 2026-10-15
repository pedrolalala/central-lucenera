import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import logoUrl from '@/assets/logotipo-verticalv1branco-0271a.png'

// SPEC-205: "Esqueceu a senha?" do login manda o link de recuperação do Supabase
// para o e-mail informado. O link volta em /redefinir-senha.
export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setEnviando(false)
    if (error) {
      setErro(
        error.status === 429
          ? 'Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente de novo.'
          : `Não foi possível enviar o e-mail: ${error.message}`,
      )
      return
    }
    setEnviado(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 p-8 md:p-10 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex justify-center">
          <img src={logoUrl} alt="Luce Nera" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-display font-medium tracking-tight text-foreground/90">
          Recuperar senha
        </h1>

        {enviado ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-4">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com <strong className="text-foreground">{email}</strong>,
                enviamos um link para criar uma nova senha. Confira a caixa de entrada e o spam. O
                link vale por 1 hora.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full h-12">
              <Link to="/">Voltar para o login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Digite o seu e-mail. Vamos mandar um link para você criar uma nova senha.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="pedro@lucenera.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-12 px-4 bg-background/50"
                disabled={enviando}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={enviando}>
              {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link'}
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Link>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
