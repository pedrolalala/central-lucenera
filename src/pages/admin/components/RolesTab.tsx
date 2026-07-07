import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export function RolesTab() {
  const [papeis, setPapeis] = useState<Papel[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [selectedPapelId, setSelectedPapelId] = useState<string>('')
  const [acessoTotal, setAcessoTotal] = useState<Record<string, boolean>>({})
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
      setAcessoTotal({})
      return
    }
    supabase
      .from('papel_permissoes')
      .select('system_id')
      .eq('papel_id', selectedPapelId)
      .is('modulo_id', null)
      .is('acao', null)
      .then(({ data }) => {
        const map: Record<string, boolean> = {}
        data?.forEach((row) => {
          map[row.system_id] = true
        })
        setAcessoTotal(map)
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

  const toggleAcessoTotal = async (systemId: string, currentVal: boolean) => {
    const newVal = !currentVal
    setAcessoTotal((prev) => ({ ...prev, [systemId]: newVal }))

    if (newVal) {
      const { error } = await supabase
        .from('papel_permissoes')
        .insert({ papel_id: selectedPapelId, system_id: systemId })
      if (error) {
        setAcessoTotal((prev) => ({ ...prev, [systemId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: error.message })
      }
    } else {
      const { error } = await supabase
        .from('papel_permissoes')
        .delete()
        .eq('papel_id', selectedPapelId)
        .eq('system_id', systemId)
        .is('modulo_id', null)
        .is('acao', null)
      if (error) {
        setAcessoTotal((prev) => ({ ...prev, [systemId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: error.message })
      }
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
              Acesso total libera visualizar/criar/editar/deletar em todo o sistema. Permissão por
              módulo/ação fica disponível quando o sistema tiver módulos cadastrados (hoje só o
              próprio Hub tem).
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
                    <label className="flex items-center gap-2 text-sm shrink-0">
                      <Checkbox
                        checked={!!acessoTotal[sys.id]}
                        onCheckedChange={() => toggleAcessoTotal(sys.id, !!acessoTotal[sys.id])}
                      />
                      Acesso total
                    </label>
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
