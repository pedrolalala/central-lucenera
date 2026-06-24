import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AccessTab({ users }: { users: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [systems, setSystems] = useState<any[]>([])
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    supabase
      .from('systems')
      .select('*')
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
        const accessMap: Record<string, boolean> = {}
        data?.forEach((row) => {
          accessMap[row.system_id] = true
        })
        setUserAccess(accessMap)
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
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao conceder acesso' })
      } else {
        toast({ title: 'Sucesso', description: 'Acesso concedido com sucesso' })
      }
    } else {
      const { error } = await supabase
        .from('user_system_access')
        .delete()
        .match({ user_id: selectedUserId, system_id: systemId })
      if (error) {
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao remover acesso' })
      } else {
        toast({ title: 'Sucesso', description: 'Acesso removido com sucesso' })
      }
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-md space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Selecione o Usuário
          </label>
          <Select onValueChange={setSelectedUserId} value={selectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um usuário na lista..." />
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

        {selectedUser && (
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Papel atual:</span>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {selectedUser.role}
            </Badge>
          </div>
        )}
      </div>

      {selectedUserId ? (
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
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {sys.description}
                  </p>
                </div>
                <Switch
                  checked={!!userAccess[sys.id]}
                  onCheckedChange={() => toggleAccess(sys.id, !!userAccess[sys.id])}
                  className="data-[state=checked]:bg-primary"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          Selecione um usuário acima para configurar os sistemas que ele pode acessar.
        </div>
      )}
    </div>
  )
}
