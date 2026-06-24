import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface UsersTabProps {
  users: any[]
  fetchUsers: () => void
}

export function UsersTab({ users, fetchUsers }: UsersTabProps) {
  const { toast } = useToast()

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', userId)
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar papel', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Papel atualizado com sucesso' })
      fetchUsers()
    }
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Nome</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Papel de Acesso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{u.nome || 'Não definido'}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge
                  variant={u.ativo !== false ? 'default' : 'secondary'}
                  className={
                    u.ativo !== false ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''
                  }
                >
                  {u.ativo !== false ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={u.role || 'viewer'}
                  onValueChange={(val) => handleRoleChange(u.id, val)}
                >
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
