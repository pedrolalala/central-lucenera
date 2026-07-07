import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

const ACOES = ['criar', 'editar', 'deletar', 'visualizar']

export function ExceptionsTab({ users }: { users: any[] }) {
  const { profile } = useAuth()
  const [sistemas, setSistemas] = useState<any[]>([])
  const [excecoes, setExcecoes] = useState<any[]>([])
  const [usuarioId, setUsuarioId] = useState('')
  const [systemId, setSystemId] = useState('')
  const [acao, setAcao] = useState('')
  const [tipo, setTipo] = useState<'conceder' | 'negar'>('conceder')
  const [justificativa, setJustificativa] = useState('')
  const { toast } = useToast()

  const userMap = users.reduce(
    (acc, u) => ({ ...acc, [u.id]: u.nome || u.email }),
    {} as Record<string, string>,
  )

  const fetchExcecoes = async () => {
    const { data } = await supabase
      .from('usuario_permissao_excecoes')
      .select('*, systems(name)')
      .order('criado_em', { ascending: false })
    setExcecoes(data || [])
  }

  useEffect(() => {
    supabase
      .from('systems')
      .select('id, name')
      .order('display_order')
      .then(({ data }) => setSistemas(data || []))
    fetchExcecoes()
  }, [])

  const criarExcecao = async () => {
    if (!usuarioId || !systemId || !acao || !justificativa.trim()) {
      toast({
        title: 'Preencha todos os campos',
        variant: 'destructive',
        description: 'Usuário, sistema, ação e justificativa são obrigatórios.',
      })
      return
    }

    const { error } = await supabase.from('usuario_permissao_excecoes').insert({
      usuario_id: usuarioId,
      system_id: systemId,
      acao,
      tipo,
      justificativa: justificativa.trim(),
      criado_por: profile?.id,
    })

    if (error) {
      toast({ title: 'Erro', variant: 'destructive', description: error.message })
      return
    }

    setUsuarioId('')
    setSystemId('')
    setAcao('')
    setJustificativa('')
    toast({ title: 'Sucesso', description: 'Exceção criada com sucesso' })
    fetchExcecoes()
  }

  const excluirExcecao = async (id: string) => {
    const { error } = await supabase.from('usuario_permissao_excecoes').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive', description: error.message })
      return
    }
    toast({ title: 'Sucesso', description: 'Exceção removida com sucesso' })
    fetchExcecoes()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
        <h3 className="font-medium text-foreground">Nova exceção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={usuarioId} onValueChange={setUsuarioId}>
            <SelectTrigger>
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={systemId} onValueChange={setSystemId}>
            <SelectTrigger>
              <SelectValue placeholder="Sistema" />
            </SelectTrigger>
            <SelectContent>
              {sistemas.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={acao} onValueChange={setAcao}>
            <SelectTrigger>
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              {ACOES.map((a) => (
                <SelectItem key={a} value={a} className="capitalize">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tipo} onValueChange={(v) => setTipo(v as 'conceder' | 'negar')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conceder">Conceder</SelectItem>
              <SelectItem value="negar">Negar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea
          placeholder="Justificativa (obrigatória)"
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        />

        <Button onClick={criarExcecao}>Criar exceção</Button>
      </div>

      <div className="space-y-2">
        {excecoes.map((exc) => (
          <Card key={exc.id} className="border-border">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{userMap[exc.usuario_id] || '—'}</span>
                  <Badge
                    variant="outline"
                    className={
                      exc.tipo === 'conceder'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }
                  >
                    {exc.tipo}
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">{exc.acao}</span>
                  <span className="text-sm text-muted-foreground">em {exc.systems?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{exc.justificativa}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => excluirExcecao(exc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {excecoes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma exceção registrada.</p>
        )}
      </div>
    </div>
  )
}
