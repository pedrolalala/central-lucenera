import { SystemCard } from '@/components/SystemCard'
import { Landmark, Users, Briefcase, Calculator, Truck, BookOpen, UserCircle } from 'lucide-react'

const SYSTEMS = [
  {
    title: 'Administração Bancária',
    description: 'Gerencia boletos, duplicatas, retorno CNAB 400 e remessa Bradesco.',
    icon: Landmark,
    url: 'https://retorno-bancario-bradesco-5392a.goskip.app/',
  },
  {
    title: 'Cadastro Lucenera',
    description: 'Registro de clientes, peças técnicas e novos projetos.',
    icon: Users,
    url: 'https://cadastro-lucenera-b86fe.goskip.app/',
  },
  {
    title: 'CRM Lucenera',
    description: 'Histórico e acompanhamento de cada cliente.',
    icon: Briefcase,
    url: 'https://lucenera-crm-3bd29.goskip.app/?v=1460a3e',
  },
  {
    title: 'Orçamentos Lucenera',
    description: 'Fluxo de aprovação de itens de orçamento.',
    icon: Calculator,
    url: 'https://gestaofinanceiralucenera.goskip.app/budgets',
  },
  {
    title: 'Sistema de Entregas',
    description: 'Controle logístico de entregas e expedição.',
    icon: Truck,
    url: '#',
  },
  {
    title: 'Fichas Técnicas Ubiqua',
    description: 'Catálogo de peças técnicas da marca representada.',
    icon: BookOpen,
    url: 'https://lucenera.lovable.app/separacao',
  },
  {
    title: 'Dashboard RH Lucenera',
    description: 'Gestão de pessoas, remunerações e dados de colaboradores.',
    icon: UserCircle,
    url: 'https://dashboard-rh-lucenera-5fe9c.goskip.app/?v=930e4f5',
  },
]

export default function Dashboard() {
  return (
    <div className="container mx-auto max-w-[1200px] py-12 px-4 sm:px-6">
      <div className="mb-12 animate-fade-in-up flex flex-col gap-3">
        <h1 className="text-4xl font-display font-semibold text-primary tracking-tight">
          Central de Sistemas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Selecione o sistema que deseja acessar. Os módulos abrirão em uma nova guia para facilitar
          seu fluxo de trabalho.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {SYSTEMS.map((system, index) => (
          <SystemCard
            key={system.title}
            title={system.title}
            description={system.description}
            icon={system.icon}
            url={system.url}
            delay={index * 80}
          />
        ))}
      </div>
    </div>
  )
}
