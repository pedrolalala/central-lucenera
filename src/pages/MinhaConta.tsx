import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// SPEC-187: cada usuário troca a própria senha (as contas novas nascem com a senha padrão).
// Confere a senha atual antes (signInWithPassword) para ninguém trocar a senha de uma
// sessão esquecida aberta.
const TAMANHO_MINIMO = 8

export default function MinhaConta() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading, navigate])

  if (loading || !user) return null

  async function salvar(e: React.FormEvent) {
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
    if (nova === atual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }
    setSalvando(true)
    try {
      const { error: errAtual } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: atual,
      })
      if (errAtual) {
        setErro('Senha atual incorreta.')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: nova })
      if (error) {
        setErro(error.message)
        return
      }
      setAtual('')
      setNova('')
      setConfirmacao('')
      toast({ title: 'Senha alterada', description: 'Use a nova senha no próximo login.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto max-w-md py-10 px-4 flex-1 animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-semibold text-primary tracking-tight">
            Minha senha
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form
        onSubmit={salvar}
        className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="senha-atual">Senha atual</Label>
          <Input
            id="senha-atual"
            type="password"
            autoComplete="current-password"
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="senha-nova">Nova senha</Label>
          <Input
            id="senha-nova"
            type="password"
            autoComplete="new-password"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Pelo menos {TAMANHO_MINIMO} caracteres.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="senha-confirmacao">Confirmar nova senha</Label>
          <Input
            id="senha-confirmacao"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
          />
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" className="w-full" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Alterar senha'}
        </Button>
      </form>
    </div>
  )
}
