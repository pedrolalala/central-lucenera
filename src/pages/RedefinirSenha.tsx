import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import logoUrl from '@/assets/logotipo-verticalv1branco-0271a.png'

// SPEC-205: destino do link do e-mail de recuperação. O supabase-js lê o token do
// endereço (#access_token...&type=recovery) e abre uma sessão; aqui a pessoa grava a
// nova senha com updateUser e volta para o login.
const TAMANHO_MINIMO = 8

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [estado, setEstado] = useState<'verificando' | 'pronto' | 'invalido'>('verificando')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Link vencido ou já usado: o Supabase devolve #error=...&error_code=otp_expired
    if (/[#&?]error(_code)?=/.test(window.location.hash + window.location.search)) {
      setEstado('invalido')
      return
    }
    let ativo = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (ativo && sessao && (evento === 'PASSWORD_RECOVERY' || evento === 'SIGNED_IN')) {
        setEstado('pronto')
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return
      setEstado(session ? 'pronto' : 'invalido')
    })
    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (nova.length < TAMANHO_MINIMO) {
      setErro(`A nova senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`)
      return
    }
    if (nova !== confirmacao) {
      setErro('A confirmação não é igual à nova senha.')
      return
    }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: nova })
    if (error) {
      setSalvando(false)
      setErro(
        error.message.includes('different from the old')
          ? 'A nova senha precisa ser diferente da atual.'
          : `Não foi possível salvar: ${error.message}`,
      )
      return
    }
    await supabase.auth.signOut()
    toast({ title: 'Senha alterada', description: 'Entre com a nova senha.' })
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 p-8 md:p-10 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex justify-center">
          <img src={logoUrl} alt="Luce Nera" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-display font-medium tracking-tight text-foreground/90 flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" />
          Criar nova senha
        </h1>

        {estado === 'verificando' && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {estado === 'invalido' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este link venceu ou já foi usado. Peça um novo link de recuperação.
            </p>
            <Button asChild className="w-full h-12">
              <Link to="/esqueci-senha">Pedir novo link</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground">
              <Link to="/">Voltar para o login</Link>
            </Button>
          </div>
        )}

        {estado === 'pronto' && (
          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <Input
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                required
                autoFocus
                className="h-12 px-4 bg-background/50"
                disabled={salvando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmacao">Repita a nova senha</Label>
              <Input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
                className="h-12 px-4 bg-background/50"
                disabled={salvando}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={salvando}>
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
