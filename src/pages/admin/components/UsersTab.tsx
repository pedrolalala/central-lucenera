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
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Users } from 'lucide-react'
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
const EMPTY_BULK_FORM = { lista: '', password: '', role: 'viewer' }

// Cadastro em lote: cada linha "Nome, email@dominio.com" — o acesso por
// sistema (user_system_access) continua sendo feito depois, um a um, na
// aba "Acesso a Sistemas"; este formulário só cria as contas de login.
interface BulkParsedRow {
  raw: string
  nome: string
  email: string
  parseError?: string
}

function parseBulkLista(raw: string): BulkParsedRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const commaIdx = line.indexOf(',')
      if (commaIdx === -1) {
        return {
          raw: line,
          nome: '',
          email: '',
          parseError: 'Formato inválido — use "Nome, email"',
        }
      }
      const nome = line.slice(0, commaIdx).trim()
      const email = line.slice(commaIdx + 1).trim()
      if (!nome || !email || !email.includes('@')) {
        return { raw: line, nome, email, parseError: 'Nome ou email inválido' }
      }
      return { raw: line, nome, email }
    })
}

export function UsersTab({ users, fetchUsers }: UsersTabProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK_FORM)

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

  const handleCreateBulkUsers = async () => {
    const rows = parseBulkLista(bulkForm.lista)

    if (rows.length === 0) {
      toast({
        title: 'Lista vazia',
        description: 'Cole ao menos uma linha "Nome, email".',
        variant: 'destructive',
      })
      return
    }
    if (!bulkForm.password) {
      toast({
        title: 'Preencha a senha',
        description: 'A senha é obrigatória e será usada para todos os usuários da lista.',
        variant: 'destructive',
      })
      return
    }

    setBulkSubmitting(true)
    const sucessos: string[] = []
    const falhas: { email: string; motivo: string }[] = []

    // Sequencial (não Promise.all) — cada chamada é uma criação de conta
    // real em auth.users; sequencial evita rajada simultânea na RPC e
    // deixa o resultado por linha fácil de rastrear.
    for (const row of rows) {
      if (row.parseError) {
        falhas.push({ email: row.raw, motivo: row.parseError })
        continue
      }
      const { error } = await supabase.rpc('criar_usuario', {
        p_email: row.email,
        p_password: bulkForm.password,
        p_nome: row.nome,
        p_role: bulkForm.role,
      })
      if (error) {
        falhas.push({ email: row.email, motivo: error.message })
      } else {
        sucessos.push(row.email)
      }
    }

    setBulkSubmitting(false)
    fetchUsers()

    if (falhas.length === 0) {
      toast({
        title: 'Sucesso',
        description: `${sucessos.length} usuário(s) criado(s) com sucesso.`,
      })
      setBulkForm(EMPTY_BULK_FORM)
      setBulkOpen(false)
      return
    }

    toast({
      title:
        sucessos.length > 0
          ? `${sucessos.length} criado(s), ${falhas.length} falharam`
          : 'Falha ao criar usuários',
      description:
        falhas
          .slice(0, 5)
          .map((f) => `${f.email}: ${f.motivo}`)
          .join(' | ') + (falhas.length > 5 ? ` | +${falhas.length - 5} outro(s)` : ''),
      variant: 'destructive',
      duration: 12000,
    })
    // Mantém o dialog aberto com só as linhas que falharam, pra corrigir e reenviar.
    setBulkForm((f) => ({ ...f, lista: falhas.map((fl) => fl.email).join('\n') }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog
          open={bulkOpen}
          onOpenChange={(next) => {
            setBulkOpen(next)
            if (!next) setBulkForm(EMPTY_BULK_FORM)
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Novo Usuário em Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário em Lote</DialogTitle>
              <DialogDescription>
                Uma linha por pessoa: "Nome, email@dominio.com". Todos recebem a mesma senha e papel
                — ajuste individualmente depois se precisar. O acesso a cada sistema continua sendo
                dado um por um na aba "Acesso a Sistemas".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="bulk-lista">Nome, email (um por linha)</Label>
                <Textarea
                  id="bulk-lista"
                  value={bulkForm.lista}
                  onChange={(e) => setBulkForm((f) => ({ ...f, lista: e.target.value }))}
                  placeholder={
                    'João Silva, joao@lucenera.com.br\nMaria Souza, maria@lucenera.com.br'
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-password">Senha (igual para todos)</Label>
                <Input
                  id="bulk-password"
                  type="password"
                  value={bulkForm.password}
                  onChange={(e) => setBulkForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Senha de acesso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-role">Papel de Acesso (igual para todos)</Label>
                <Select
                  value={bulkForm.role}
                  onValueChange={(val) => setBulkForm((f) => ({ ...f, role: val }))}
                >
                  <SelectTrigger id="bulk-role" className="bg-background">
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
              <Button
                variant="outline"
                onClick={() => setBulkOpen(false)}
                disabled={bulkSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateBulkUsers} disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Criando...' : 'Criar Usuários'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
