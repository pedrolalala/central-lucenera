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
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function LogsTab({ users }: { users: any[] }) {
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const userMap = users.reduce(
    (acc, u) => ({ ...acc, [u.id]: u.email }),
    {} as Record<string, string>,
  )

  useEffect(() => {
    let mounted = true
    const fetchLogs = async () => {
      setLoading(true)
      let q = supabase
        .from('logs_auditoria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (search) {
        q = q.ilike('tabela', `%${search}%`)
      }

      const { data } = await q
      if (mounted) {
        setLogs(data || [])
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchLogs, 400)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [search])

  const getOperationColor = (op: string) => {
    if (!op) return 'bg-secondary text-secondary-foreground'
    const lower = op.toLowerCase()
    if (lower.includes('insert')) return 'bg-green-500/10 text-green-500 border-green-500/20'
    if (lower.includes('update')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (lower.includes('delete')) return 'bg-red-500/10 text-red-500 border-red-500/20'
    return 'bg-secondary text-secondary-foreground'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome da tabela..."
            className="pl-9 bg-background border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Exibindo os {logs.length} registros mais recentes
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[160px] font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Usuário</TableHead>
                <TableHead className="w-[120px] font-semibold">Operação</TableHead>
                <TableHead className="font-semibold">Tabela</TableHead>
                <TableHead className="min-w-[300px] font-semibold">Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum log encontrado para esta busca.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {userMap[log.usuario_id] || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 ${getOperationColor(log.operacao)}`}
                      >
                        {log.operacao || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.tabela}
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate" title={log.observacao}>
                      {log.observacao || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
