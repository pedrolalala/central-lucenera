import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SystemCard } from '@/components/SystemCard'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import * as Icons from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { LogOut, LampDesk } from 'lucide-react'

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
  const { user, loading, signOut } = useAuth()
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading || (!user && !loading)) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <LampDesk size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg text-foreground">
              Central Lucenera
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-[1200px] py-12 px-4 sm:px-6 flex-1">
        <div className="mb-12 animate-fade-in-up flex flex-col gap-3">
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">
            Sistemas Internos
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Selecione o sistema que deseja acessar. Os módulos abrirão em uma nova guia para
            facilitar seu fluxo de trabalho.
          </p>
        </div>

        {fetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl bg-card border border-border" />
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
                delay={index * 50}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
