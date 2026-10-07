import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Papel {
  id: string
  nome: string
  descricao: string | null
}

interface Sistema {
  id: string
  name: string
  slug: string
  visivel_no_hub: boolean
}

// SPEC-069: hierarquia de níveis (do maior para o menor) — TOTAL > EDITAR >
// EDITAR (SEM CADASTRAR) > CONSULTAR > SEM ACESSO. Cada nível vira um
// conjunto fixo de linhas em papel_permissoes (modulo_id sempre NULL —
// grant de sistema inteiro; permissão por módulo específico fica pra
// quando algum sistema além do Hub tiver módulos cadastrados).
type Nivel = 'sem_acesso' | 'consultar' | 'editar_sem_cadastrar' | 'editar' | 'total'

const NIVEIS: Nivel[] = ['sem_acesso', 'consultar', 'editar_sem_cadastrar', 'editar', 'total']

const NIVEL_LABELS: Record<Nivel, string> = {
  sem_acesso: 'Sem acesso',
  consultar: 'Consultar',
  editar_sem_cadastrar: 'Editar (sem cadastrar)',
  editar: 'Editar',
  total: 'Total',
}

// null = uma única linha com acao = NULL (o coringa "Acesso total" já usado
// antes desta mudança). Os demais níveis viram 1 linha por ação listada.
const NIVEL_ACOES: Record<Nivel, string[] | null> = {
  sem_acesso: [],
  consultar: ['visualizar'],
  editar_sem_cadastrar: ['editar', 'visualizar'],
  editar: ['criar', 'editar', 'visualizar'],
  total: null,
}

function detectNivel(acoes: (string | null)[]): Nivel {
  if (acoes.length === 0) return 'sem_acesso'
  if (acoes.includes(null)) return 'total'
  const set = new Set(acoes)
  if (set.has('criar')) return 'editar'
  if (set.has('editar')) return 'editar_sem_cadastrar'
  if (set.has('visualizar')) return 'consultar'
  return 'sem_acesso'
}

export function RolesTab() {
  const [papeis, setPapeis] = useState<Papel[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [selectedPapelId, setSelectedPapelId] = useState<string>('')
  const [niveis, setNiveis] = useState<Record<string, Nivel>>({})
  const [novoPapelNome, setNovoPapelNome] = useState('')
  const { toast } = useToast()

  const fetchPapeis = async () => {
    const { data } = await supabase.from('papeis').select('id, nome, descricao').order('nome')
    setPapeis(data || [])
  }

  useEffect(() => {
    fetchPapeis()
    supabase
      .from('systems')
      .select('id, name, slug, visivel_no_hub')
      .order('display_order')
      .then(({ data }) => setSistemas(data || []))
  }, [])

  useEffect(() => {
    if (!selectedPapelId) {
      setNiveis({})
      return
    }
    supabase
      .from('papel_permissoes')
      .select('system_id, acao')
      .eq('papel_id', selectedPapelId)
      .is('modulo_id', null)
      .then(({ data }) => {
        const bySystem: Record<string, (string | null)[]> = {}
        data?.forEach((row) => {
          if (!bySystem[row.system_id]) bySystem[row.system_id] = []
          bySystem[row.system_id].push(row.acao)
        })
        const map: Record<string, Nivel> = {}
        Object.entries(bySystem).forEach(([systemId, acoes]) => {
          map[systemId] = detectNivel(acoes)
        })
        setNiveis(map)
      })
  }, [selectedPapelId])

  const criarPapel = async () => {
    if (!novoPapelNome.trim()) return
    const { error } = await supabase.from('papeis').insert({ nome: novoPapelNome.trim() })
    if (error) {
      toast({ title: 'Erro', variant: 'destructive', description: error.message })
      return
    }
    setNovoPapelNome('')
    toast({ title: 'Sucesso', description: 'Papel criado com sucesso' })
    fetchPapeis()
  }

  const excluirPapel = async (papelId: string) => {
    const { error } = await supabase.from('papeis').delete().eq('id', papelId)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive', description: error.message })
      return
    }
    if (selectedPapelId === papelId) setSelectedPapelId('')
    toast({ title: 'Sucesso', description: 'Papel excluído com sucesso' })
    fetchPapeis()
  }

  const setNivelSistema = async (systemId: string, novoNivel: Nivel) => {
    const nivelAnterior = niveis[systemId] ?? 'sem_acesso'
    if (novoNivel === nivelAnterior) return
    setNiveis((prev) => ({ ...prev, [systemId]: novoNivel }))

    // Sem transação de verdade disponível via supabase-js — apaga tudo que
    // esse papel tinha pra esse sistema (nível de sistema inteiro, sem
    // módulo) e recria do zero com o conjunto de ações do nível escolhido.
    const { error: deleteError } = await supabase
      .from('papel_permissoes')
      .delete()
      .eq('papel_id', selectedPapelId)
      .eq('system_id', systemId)
      .is('modulo_id', null)

    if (deleteError) {
      setNiveis((prev) => ({ ...prev, [systemId]: nivelAnterior }))
      toast({ title: 'Erro', variant: 'destructive', description: deleteError.message })
      return
    }

    const acoes = NIVEL_ACOES[novoNivel]
    if (acoes === null) {
      const { error } = await supabase
        .from('papel_permissoes')
        .insert({ papel_id: selectedPapelId, system_id: systemId, modulo_id: null, acao: null })
      if (error) {
        setNiveis((prev) => ({ ...prev, [systemId]: nivelAnterior }))
        toast({ title: 'Erro', variant: 'destructive', description: error.message })
      }
      return
    }

    if (acoes.length === 0) return // sem_acesso: já apagou tudo acima, nada a inserir

    const { error } = await supabase.from('papel_permissoes').insert(
      acoes.map((acao) => ({
        papel_id: selectedPapelId,
        system_id: systemId,
        modulo_id: null,
        acao,
      })),
    )
    if (error) {
      setNiveis((prev) => ({ ...prev, [systemId]: nivelAnterior }))
      toast({ title: 'Erro', variant: 'destructive', description: error.message })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo papel"
            value={novoPapelNome}
            onChange={(e) => setNovoPapelNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criarPapel()}
          />
          <Button size="icon" onClick={criarPapel}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {papeis.map((papel) => (
            <Card
              key={papel.id}
              className={`cursor-pointer transition-all ${selectedPapelId === papel.id ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
              onClick={() => setSelectedPapelId(papel.id)}
            >
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <span className="font-medium capitalize text-sm truncate">{papel.nome}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    excluirPapel(papel.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedPapelId ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O papel não faz o sistema aparecer no Hub — quem vê cada sistema é definido na aba
              "Acesso a Sistemas". Aqui se define o que quem tem este papel pode fazer dentro dos
              sistemas liberados para ele.
            </p>
            <p className="text-sm text-muted-foreground">
              Total libera visualizar/criar/editar/deletar/aprovar em todo o sistema. Editar inclui
              criar; Editar (sem cadastrar) edita mas não cria; Consultar só permite ver. Permissão
              por módulo específico fica disponível quando o sistema tiver módulos cadastrados (hoje
              só o próprio Hub tem).
            </p>
            <div className="space-y-2">
              {sistemas.map((sys) => (
                <Card key={sys.id} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{sys.name}</span>
                      {!sys.visivel_no_hub && (
                        <Badge variant="outline" className="text-[10px]">
                          interno
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={niveis[sys.id] ?? 'sem_acesso'}
                      onValueChange={(v) => setNivelSistema(sys.id, v as Nivel)}
                    >
                      <SelectTrigger className="w-[200px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS.map((n) => (
                          <SelectItem key={n} value={n}>
                            {NIVEL_LABELS[n]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
            Selecione um papel à esquerda para configurar suas permissões por sistema.
          </div>
        )}
      </div>
    </div>
  )
}
