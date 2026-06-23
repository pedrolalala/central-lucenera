import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemCard } from '@/components/SystemCard'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import * as Icons from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type System = {
  id: string
  name: string
  description: string
  link: string
  icon_name: string
}

const getIcon = (iconName: string) => {
  const Icon = (Icons as any)[iconName]
  return Icon || Icons.Box
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [systems, setSystems] = useState<System[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      supabase
        .from('systems')
        .select('*')
        .order('display_order', { ascending: true })
        .then(({ data }) => {
          if (data) setSystems(data)
          setFetching(false)
        })
    }
  }, [user])

  if (loading || (!user && !loading)) {
    return null
  }

  return (
    <div className="container mx-auto max-w-[1200px] py-12 px-4 sm:px-6 flex-1">
      <div className="mb-12 animate-fade-in-up flex flex-col gap-3">
        <h1 className="text-4xl font-display font-semibold text-primary tracking-tight">
          Central de Sistemas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Selecione o sistema que deseja acessar. Os módulos abrirão em uma nova guia para facilitar
          seu fluxo de trabalho.
        </p>
      </div>

      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
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
              delay={index * 80}
            />
          ))}
        </div>
      )}
    </div>
  )
}
