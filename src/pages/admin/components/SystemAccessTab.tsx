import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface SystemItem {
  id: string
  name: string
  slug: string
  visivel_no_hub: boolean
}

export function SystemAccessTab({ users }: { users: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [systems, setSystems] = useState<SystemItem[]>([])
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    supabase
      .from('systems')
      .select('id, name, slug, visivel_no_hub')
      .order('display_order')
      .then(({ data }) => setSystems(data || []))
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setUserAccess({})
      return
    }
    supabase
      .from('user_system_access')
      .select('system_id')
      .eq('user_id', selectedUserId)
      .then(({ data }) => {
        const map: Record<string, boolean> = {}
        data?.forEach((row) => {
          map[row.system_id] = true
        })
        setUserAccess(map)
      })
  }, [selectedUserId])

  const toggleAccess = async (systemId: string, currentVal: boolean) => {
    const newVal = !currentVal
    setUserAccess((prev) => ({ ...prev, [systemId]: newVal }))

    if (newVal) {
      const { error } = await supabase
        .from('user_system_access')
        .insert({ user_id: selectedUserId, system_id: systemId })
      if (error) {
        setUserAccess((prev) => ({ ...prev, [systemId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao conceder acesso' })
      } else {
        toast({ title: 'Sucesso', description: 'Acesso concedido ao sistema' })
      }
    } else {
      const { error } = await supabase
        .from('user_system_access')
        .delete()
        .match({ user_id: selectedUserId, system_id: systemId })
      if (error) {
        setUserAccess((prev) => ({ ...prev, [systemId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao remover acesso' })
      } else {
        toast({ title: 'Sucesso', description: 'Acesso removido do sistema' })
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-md space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Selecione o Usuário
        </label>
        <Select onValueChange={setSelectedUserId} value={selectedUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Escolha um usuário..." />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome || u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUserId ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Marque os sistemas que o usuário selecionado poderá acessar no dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((sys) => (
              <Card
                key={sys.id}
                className={`transition-all duration-200 border ${userAccess[sys.id] ? 'border-primary/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-border opacity-70 hover:opacity-100'}`}
              >
                <CardContent className="p-5 flex items-center justify-between gap-4 h-full">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-base truncate ${userAccess[sys.id] ? 'text-primary' : 'text-foreground'}`}
                    >
                      {sys.name}
                    </h4>
                    {!sys.visivel_no_hub && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        interno
                      </Badge>
                    )}
                  </div>
                  <Checkbox
                    checked={!!userAccess[sys.id]}
                    onCheckedChange={() => toggleAccess(sys.id, !!userAccess[sys.id])}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          Selecione um usuário acima para gerenciar o acesso aos sistemas.
        </div>
      )}
    </div>
  )
}
