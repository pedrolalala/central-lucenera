import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// SPEC-206: movimentação de todos os sistemas. Os dados vêm de auditoria.eventos pelas RPCs
// auditoria_listar / auditoria_resumo_usuarios (só admin). O sistema de cada evento é o slug
// de `systems` (descoberto pelo endereço de onde veio a requisição).

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: any; error: any }>

const POR_PAGINA = 100
const TODOS = '__todos__'

type Evento = {
  id: number
  criado_em: string
  usuario_id: string | null
  usuario_nome: string | null
  sistema: string | null
  tipo: string
  entidade: string | null
  registro_id: string | null
  referencia: string | null
  mudancas: Record<string, unknown> | null
  ip: string | null
  navegador: string | null
  total: number
}

type ResumoUsuario = {
  usuario_id: string
  nome: string | null
  email: string | null
  ativo: boolean | null
  papel: string | null
  ultimo_login: string | null
  logins_hoje: number
  logins_periodo: number
  dias_com_login: number
  acoes_periodo: number
  sistemas: string[] | null
  senha_padrao: boolean
  ultima_troca_senha: string | null
}

const PERIODOS: Record<string, { label: string; dias: number }> = {
  hoje: { label: 'Hoje', dias: 0 },
  '7d': { label: 'Últimos 7 dias', dias: 7 },
  '30d': { label: 'Últimos 30 dias', dias: 30 },
  '90d': { label: 'Últimos 90 dias', dias: 90 },
  '12m': { label: 'Últimos 12 meses', dias: 365 },
}

const TIPOS: Record<string, { label: string; cor: string }> = {
  login: { label: 'Entrou', cor: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  senha_alterada: { label: 'Senha alterada', cor: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  criou: { label: 'Criou', cor: 'bg-green-500/10 text-green-500 border-green-500/20' },
  alterou: { label: 'Alterou', cor: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  mudou_status: { label: 'Mudou status', cor: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  aprovou: { label: 'Aprovou', cor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  apagou: { label: 'Apagou', cor: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

function inicioPeriodo(chave: string): Date {
  const d = new Date()
  if (chave === 'hoje') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  d.setDate(d.getDate() - PERIODOS[chave].dias)
  return d
}

function dataHora(v: string | null) {
  return v ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '—'
}

function valorTexto(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export function MovimentacaoTab({ users }: { users: any[] }) {
  const [sistemas, setSistemas] = useState<{ slug: string; name: string }[]>([])
  const [periodo, setPeriodo] = useState('7d')
  const [sistema, setSistema] = useState(TODOS)
  const [usuario, setUsuario] = useState(TODOS)
  const [tipo, setTipo] = useState(TODOS)
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(0)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [resumo, setResumo] = useState<ResumoUsuario[]>([])
  const [carregandoResumo, setCarregandoResumo] = useState(true)
  const [detalhe, setDetalhe] = useState<Evento | null>(null)
  const [aba, setAba] = useState('linha')
  const [recarregar, setRecarregar] = useState(0)

  const nomeSistema = useMemo(() => {
    const m: Record<string, string> = { automacao: 'Automação', local: 'Local (teste)' }
    sistemas.forEach((s) => (m[s.slug] = s.name))
    return (slug: string | null) => (slug ? (m[slug] ?? slug) : '—')
  }, [sistemas])

  useEffect(() => {
    supabase
      .from('systems')
      .select('slug, name')
      .order('display_order')
      .then(({ data }) => setSistemas((data as any[]) ?? []))
  }, [])

  // Volta para a primeira página quando muda um filtro.
  useEffect(() => setPagina(0), [periodo, sistema, usuario, tipo, busca])

  useEffect(() => {
    let ativo = true
    const t = setTimeout(async () => {
      setCarregando(true)
      setErro(null)
      const { data, error } = await rpc('auditoria_listar', {
        p_de: inicioPeriodo(periodo).toISOString(),
        p_ate: new Date().toISOString(),
        p_sistema: sistema === TODOS ? null : sistema,
        p_usuario: usuario === TODOS ? null : usuario,
        p_tipo: tipo === TODOS ? null : tipo,
        p_busca: busca.trim() || null,
        p_limite: POR_PAGINA,
        p_offset: pagina * POR_PAGINA,
      })
      if (!ativo) return
      if (error) setErro(error.message)
      setEventos((data as Evento[]) ?? [])
      setCarregando(false)
    }, 300)
    return () => {
      ativo = false
      clearTimeout(t)
    }
  }, [periodo, sistema, usuario, tipo, busca, pagina, recarregar])

  useEffect(() => {
    let ativo = true
    setCarregandoResumo(true)
    rpc('auditoria_resumo_usuarios', {
      p_de: inicioPeriodo(periodo).toISOString(),
      p_ate: new Date().toISOString(),
    }).then(({ data }) => {
      if (!ativo) return
      setResumo((data as ResumoUsuario[]) ?? [])
      setCarregandoResumo(false)
    })
    return () => {
      ativo = false
    }
  }, [periodo, recarregar])

  const total = eventos[0]?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const comSenhaPadrao = resumo.filter((r) => r.ativo !== false && r.senha_padrao).length

  function verPessoa(id: string) {
    setUsuario(id)
    setAba('linha')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIODOS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sistema} onValueChange={setSistema}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Sistema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os sistemas</SelectItem>
            {sistemas.map((s) => (
              <SelectItem key={s.slug} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
            <SelectItem value="automacao">Automação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={usuario} onValueChange={setUsuario}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Pessoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as pessoas</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome || u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as ações</SelectItem>
            {Object.entries(TIPOS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar (ex.: ORC-0012, 26.319)"
            className="pl-9 bg-background"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={aba} onValueChange={setAba} className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="linha">Linha do tempo</TabsTrigger>
            <TabsTrigger value="pessoas">
              Pessoas
              {comSenhaPadrao > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                  {comSenhaPadrao}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => setRecarregar((n) => n + 1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <TabsContent value="linha" className="space-y-3">
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[140px]">Quando</TableHead>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="w-[130px]">Ação</TableHead>
                    <TableHead className="min-w-[280px]">O quê</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carregando && eventos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : eventos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Nenhuma movimentação com esses filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventos.map((ev) => (
                      <TableRow
                        key={ev.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setDetalhe(ev)}
                      >
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {dataHora(ev.criado_em)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {ev.usuario_nome || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{nomeSistema(ev.sistema)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${TIPOS[ev.tipo]?.cor ?? 'bg-secondary'}`}
                          >
                            {TIPOS[ev.tipo]?.label ?? ev.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[420px] truncate" title={ev.referencia ?? ''}>
                          {ev.referencia || ev.entidade || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total.toLocaleString('pt-BR')} movimentações</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === 0 || carregando}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>
                {pagina + 1} / {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina + 1 >= totalPaginas || carregando}
                onClick={() => setPagina((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pessoas">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="text-center">Entradas hoje</TableHead>
                    <TableHead className="text-center">Entradas no período</TableHead>
                    <TableHead className="text-center">Dias que entrou</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                    <TableHead>Sistemas mais usados</TableHead>
                    <TableHead>Senha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carregandoResumo && resumo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    resumo.map((r) => (
                      <TableRow
                        key={r.usuario_id}
                        className={`hover:bg-muted/30 cursor-pointer ${r.ativo === false ? 'opacity-50' : ''}`}
                        onClick={() => verPessoa(r.usuario_id)}
                        title="Ver a movimentação desta pessoa"
                      >
                        <TableCell>
                          <div className="font-medium text-sm">{r.nome || r.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.email}
                            {r.ativo === false && ' · inativo'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.ultimo_login ? dataHora(r.ultimo_login) : 'Nunca entrou'}
                        </TableCell>
                        <TableCell className="text-center text-sm">{r.logins_hoje}</TableCell>
                        <TableCell className="text-center text-sm">{r.logins_periodo}</TableCell>
                        <TableCell className="text-center text-sm">{r.dias_com_login}</TableCell>
                        <TableCell className="text-center text-sm">{r.acoes_periodo}</TableCell>
                        <TableCell className="text-sm">
                          {(r.sistemas ?? []).map(nomeSistema).join(', ') || '—'}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.senha_padrao ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Senha padrão
                            </Badge>
                          ) : r.ultima_troca_senha ? (
                            <span className="text-muted-foreground">
                              Trocada em {dataHora(r.ultima_troca_senha)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Própria</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Entradas e ações contam a partir de 19/10/2026, quando o registro foi ligado. "Último
            acesso" vem do login do Supabase e vale também para antes dessa data.
          </p>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle>{detalhe.referencia || detalhe.entidade}</DialogTitle>
                <DialogDescription>
                  {TIPOS[detalhe.tipo]?.label ?? detalhe.tipo} por {detalhe.usuario_nome || '—'} em{' '}
                  {dataHora(detalhe.criado_em)} · {nomeSistema(detalhe.sistema)}
                </DialogDescription>
              </DialogHeader>
              <DetalheMudancas ev={detalhe} />
              <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                {detalhe.ip && <div>IP: {detalhe.ip}</div>}
                {detalhe.navegador && <div className="break-all">Navegador: {detalhe.navegador}</div>}
                {detalhe.entidade && (
                  <div>
                    Tabela: <span className="font-mono">{detalhe.entidade}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetalheMudancas({ ev }: { ev: Evento }) {
  const m = ev.mudancas ?? {}
  const chaves = Object.keys(m)
  if (chaves.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem detalhes.</p>
  }
  const ehAlteracao = ev.tipo !== 'criou' && ev.tipo !== 'apagou' && chaves.every((k) => Array.isArray(m[k]))
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Campo</TableHead>
            {ehAlteracao ? (
              <>
                <TableHead>Antes</TableHead>
                <TableHead>Depois</TableHead>
              </>
            ) : (
              <TableHead>{ev.tipo === 'apagou' ? 'Valor apagado' : 'Valor'}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {chaves.map((k) => {
            const v = m[k] as any
            return (
              <TableRow key={k}>
                <TableCell className="font-mono text-xs align-top">{k}</TableCell>
                {ehAlteracao ? (
                  <>
                    <TableCell className="text-xs text-red-500/90 break-all align-top">
                      {valorTexto(v[0])}
                    </TableCell>
                    <TableCell className="text-xs text-green-500/90 break-all align-top">
                      {valorTexto(v[1])}
                    </TableCell>
                  </>
                ) : (
                  <TableCell className="text-xs break-all align-top">{valorTexto(v)}</TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
