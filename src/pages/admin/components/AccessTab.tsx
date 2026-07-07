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
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Papel {
  id: string
  nome: string
  descricao: string | null
}

export function AccessTab({ users }: { users: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [papeis, setPapeis] = useState<Papel[]>([])
  const [userPapeis, setUserPapeis] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    supabase
      .from('papeis')
      .select('id, nome, descricao')
      .order('nome')
      .then(({ data }) => setPapeis(data || []))
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setUserPapeis({})
      return
    }

    supabase
      .from('usuario_papeis')
      .select('papel_id')
      .eq('usuario_id', selectedUserId)
      .then(({ data }) => {
        const map: Record<string, boolean> = {}
        data?.forEach((row) => {
          map[row.papel_id] = true
        })
        setUserPapeis(map)
      })
  }, [selectedUserId])

  const togglePapel = async (papelId: string, currentVal: boolean) => {
    const newVal = !currentVal
    setUserPapeis((prev) => ({ ...prev, [papelId]: newVal }))

    if (newVal) {
      const { error } = await supabase
        .from('usuario_papeis')
        .insert({ usuario_id: selectedUserId, papel_id: papelId })
      if (error) {
        setUserPapeis((prev) => ({ ...prev, [papelId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao atribuir papel' })
      } else {
        toast({ title: 'Sucesso', description: 'Papel atribuído com sucesso' })
      }
    } else {
      const { error } = await supabase
        .from('usuario_papeis')
        .delete()
        .match({ usuario_id: selectedUserId, papel_id: papelId })
      if (error) {
        setUserPapeis((prev) => ({ ...prev, [papelId]: currentVal }))
        toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao remover papel' })
      } else {
        toast({ title: 'Sucesso', description: 'Papel removido com sucesso' })
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
            <span className="text-muted-foreground">Papel legado (usuarios.role):</span>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {selectedUser.role}
            </Badge>
          </div>
        )}
      </div>

      {selectedUserId ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Papéis atribuídos definem visibilidade e ações por sistema. Configure o que cada papel
            pode fazer na aba "Papéis".
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papeis.map((papel) => (
              <Card
                key={papel.id}
                className={`transition-all duration-200 border ${userPapeis[papel.id] ? 'border-primary/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-border opacity-70 hover:opacity-100'}`}
              >
                <CardContent className="p-5 flex items-center justify-between gap-4 h-full">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-base capitalize truncate ${userPapeis[papel.id] ? 'text-primary' : 'text-foreground'}`}
                    >
                      {papel.nome}
                    </h4>
                    {papel.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {papel.descricao}
                      </p>
                    )}
                  </div>
                  <Checkbox
                    checked={!!userPapeis[papel.id]}
                    onCheckedChange={() => togglePapel(papel.id, !!userPapeis[papel.id])}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl text-muted-foreground bg-card/30">
          Selecione um usuário acima para configurar os papéis que ele possui.
        </div>
      )}
    </div>
  )
}
