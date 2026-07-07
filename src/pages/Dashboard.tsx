import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemCard } from '@/components/SystemCard'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { redirectWithCode } from '@/lib/cross-system-auth'
import * as Icons from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type System = {
  id: string
  name: string
  description: string
  link: string
  icon_name: string
  display_order: number
  slug?: string
}

const getIcon = (iconName: string) => {
  const Icon = (Icons as any)[iconName]
  return Icon || Icons.Box
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [systems, setSystems] = useState<System[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const fetchSystems = async () => {
      if (!user || !profile) return

      setFetching(true)
      const { data, error } = await (supabase as any).rpc('hub_sistemas_permitidos', {
        p_usuario_id: user.id,
      })

      if (!error && data) {
        const allowedSystems = [...data]
        allowedSystems.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        setSystems(allowedSystems)
      } else {
        const { data: legacyData } = await supabase
          .from('user_system_access')
          .select('system_id, systems(*)')
          .eq('user_id', user.id)

        const allowedSystems = legacyData?.map((d: any) => d.systems).filter(Boolean) || []
        allowedSystems.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        setSystems(allowedSystems)
      }
      setFetching(false)
    }

    if (user && profile) {
      fetchSystems()
    }
  }, [user, profile])

  if (loading || (!user && !loading)) {
    return null
  }

  const openSystem = async (system: System) => {
    try {
      await redirectWithCode(system.link, '/', system.slug, { newTab: true })
    } catch {
      window.open(system.link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="container mx-auto max-w-[1200px] py-12 px-4 sm:px-6 flex-1">
      <div className="mb-12 animate-fade-in-up flex flex-col gap-3">
        <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">
          Sistemas Internos
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Selecione o sistema que deseja acessar. Os módulos abrirão em uma nova guia para facilitar
          seu fluxo de trabalho.
        </p>
      </div>

      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : systems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in border border-dashed border-border rounded-xl bg-card/30">
          <Icons.ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">Sem acesso configurado</h3>
          <p className="text-muted-foreground max-w-md">
            Sua conta ainda não possui acesso liberado a nenhum sistema. Entre em contato com o
            administrador da plataforma.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {systems.map((system, index) => (
            <SystemCard
              key={system.id}
              title={system.name}
              description={system.description}
              icon={getIcon(system.icon_name)}
              url={system.link}
              onOpen={() => void openSystem(system)}
              delay={index * 50}
            />
          ))}
        </div>
      )}
    </div>
  )
}
