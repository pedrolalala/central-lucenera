import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UsersTabProps {
  users: any[]
  fetchUsers: () => void
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'operador', label: 'Operador' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'viewer', label: 'Visualizador' },
]

const EMPTY_FORM = { nome: '', email: '', password: '', role: 'viewer' }

export function UsersTab({ users, fetchUsers }: UsersTabProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', userId)
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar papel', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Papel atualizado com sucesso' })
      fetchUsers()
    }
  }

  const handleActiveToggle = async (userId: string, currentVal: boolean) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !currentVal })
      .eq('id', userId)
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar status', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso' })
      fetchUsers()
    }
  }

  const handleCreateUser = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password) {
      toast({
        title: 'Preencha os campos',
        description: 'Nome, email e senha são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.rpc('criar_usuario', {
      p_email: form.email.trim(),
      p_password: form.password,
      p_nome: form.nome.trim(),
      p_role: form.role,
    })
    setSubmitting(false)

    if (error) {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Sucesso', description: 'Usuário criado com sucesso' })
    setForm(EMPTY_FORM)
    setOpen(false)
    fetchUsers()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) setForm(EMPTY_FORM)
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Cadastre um usuário informando nome, email e senha de acesso.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@lucenera.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Senha de acesso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Papel de Acesso</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) => setForm((f) => ({ ...f, role: val }))}
                >
                  <SelectTrigger id="role" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={u.ativo !== false}
                      onCheckedChange={() => handleActiveToggle(u.id, u.ativo !== false)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Badge
                      variant={u.ativo !== false ? 'default' : 'secondary'}
                      className={
                        u.ativo !== false ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''
                      }
                    >
                      {u.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
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
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
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
    </div>
  )
}
