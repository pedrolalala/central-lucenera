import { type LucideIcon, ArrowUpRight } from 'lucide-react'

interface SystemCardProps {
  title: string
  description: string
  icon: LucideIcon
  url: string
  delay?: number
}

export function SystemCard({ title, description, icon: Icon, url, delay = 0 }: SystemCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block animate-stagger-up group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-full bg-card p-6 rounded-xl border border-border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-elevation group-hover:border-accent/60 relative overflow-hidden flex flex-col">
        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-6 transition-colors group-hover:bg-accent/10">
          <Icon className="w-6 h-6 text-primary transition-colors group-hover:text-accent" />
        </div>
        <h3 className="font-semibold text-lg text-primary mb-2 transition-colors pr-6 group-hover:text-accent">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>

        <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-muted-foreground opacity-0 -translate-y-2 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
      </div>
    </a>
  )
}
