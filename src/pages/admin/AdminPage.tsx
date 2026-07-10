import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, UserCog, Activity, KeySquare, UserX2, LayoutGrid } from 'lucide-react'
import { UsersTab } from './components/UsersTab'
import { AccessTab } from './components/AccessTab'
import { LogsTab } from './components/LogsTab'
import { RolesTab } from './components/RolesTab'
import { ExceptionsTab } from './components/ExceptionsTab'
import { AuditTab } from './components/AuditTab'
import { SystemAccessTab } from './components/SystemAccessTab'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [profile, loading, navigate])

  const fetchUsers = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('nome')
    if (data) setUsers(data)
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile])

  if (loading || profile?.role !== 'admin') return null

  return (
    <div className="container mx-auto max-w-[1200px] py-10 px-4 sm:px-6 flex-1 animate-fade-in">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-4xl font-display font-semibold text-primary tracking-tight">
          Administração
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
          Gerencie permissões de usuários, controle o acesso aos sistemas internos e monitore as
          atividades da plataforma através dos logs de auditoria.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-8">
        <TabsList className="bg-card border border-border p-1.5 h-auto rounded-lg shadow-sm">
          <TabsTrigger
            value="users"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <UserCog className="w-4 h-4 mr-2.5" />
            Gestão de Usuários
          </TabsTrigger>
          <TabsTrigger
            value="access"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <ShieldAlert className="w-4 h-4 mr-2.5" />
            Matriz de Acesso
          </TabsTrigger>
          <TabsTrigger
            value="systems-access"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <LayoutGrid className="w-4 h-4 mr-2.5" />
            Acesso a Sistemas
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <KeySquare className="w-4 h-4 mr-2.5" />
            Papéis
          </TabsTrigger>
          <TabsTrigger
            value="exceptions"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <UserX2 className="w-4 h-4 mr-2.5" />
            Exceções
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <Activity className="w-4 h-4 mr-2.5" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger
            value="permission-audit"
            className="py-2.5 px-6 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all rounded-md"
          >
            <Activity className="w-4 h-4 mr-2.5" />
            Auditoria de Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="users"
          className="bg-card border border-border rounded-xl p-6 shadow-sm focus-visible:outline-none focus-visible:ring-0"
        >
          <UsersTab users={users} fetchUsers={fetchUsers} />
        </TabsContent>

        <TabsContent value="access" className="focus-visible:outline-none focus-visible:ring-0">
          <AccessTab users={users} />
        </TabsContent>

        <TabsContent
          value="systems-access"
          className="bg-card border border-border rounded-xl p-6 shadow-sm focus-visible:outline-none focus-visible:ring-0"
        >
          <SystemAccessTab users={users} />
        </TabsContent>

        <TabsContent value="roles" className="focus-visible:outline-none focus-visible:ring-0">
          <RolesTab />
        </TabsContent>

        <TabsContent value="exceptions" className="focus-visible:outline-none focus-visible:ring-0">
          <ExceptionsTab users={users} />
        </TabsContent>

        <TabsContent value="logs" className="focus-visible:outline-none focus-visible:ring-0">
          <LogsTab users={users} />
        </TabsContent>

        <TabsContent
          value="permission-audit"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <AuditTab users={users} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
