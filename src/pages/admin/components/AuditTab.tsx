import { useState, useEffect } from 'react'
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

const ENTIDADES = ['papeis', 'papel_permissoes', 'usuario_papeis', 'usuario_permissao_excecoes']

export function AuditTab({ users }: { users: any[] }) {
  const [logs, setLogs] = useState<any[]>([])
  const [entidade, setEntidade] = useState<string>('todas')
  const [loading, setLoading] = useState(true)

  const userMap = users.reduce(
    (acc, u) => ({ ...acc, [u.id]: u.nome || u.email }),
    {} as Record<string, string>,
  )

  useEffect(() => {
    let mounted = true
    const fetchLogs = async () => {
      setLoading(true)
      let q = supabase
        .from('auditoria_permissoes')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(100)

      if (entidade !== 'todas') {
        q = q.eq('entidade', entidade)
      }

      const { data } = await q
      if (mounted) {
        setLogs(data || [])
        setLoading(false)
      }
    }
    fetchLogs()
    return () => {
      mounted = false
    }
  }, [entidade])

  return (
    <div className="space-y-4 animate-fade-in">
      <Select value={entidade} onValueChange={setEntidade}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as entidades</SelectItem>
          {ENTIDADES.map((e) => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Alteração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma alteração registrada.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(log.criado_em).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-sm">{userMap[log.autor_id] || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entidade}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.antes && log.depois ? 'Atualizado' : log.depois ? 'Criado' : 'Removido'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
