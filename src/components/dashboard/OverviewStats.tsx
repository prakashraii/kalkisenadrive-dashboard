import { BadgeCheck, Building2, CarFront, HeartHandshake } from 'lucide-react'
import { StatCard, type StatTone } from '../ui/StatCard'

type OverviewKpis = {
  donatedUsers: number
  donatedUsersTrend: number
  memberCount: number
  memberCountTrend: number
  totalClinics: number
  clinicsTrend: number
  totalDriverRegistrations: number
  driversTrend: number
}

const CARDS: {
  title: string
  href: string
  tone: StatTone
  icon: typeof HeartHandshake
  valueKey: keyof OverviewKpis
  trendKey: keyof OverviewKpis
}[] = [
  {
    title: 'Donated Users',
    href: '/donations',
    tone: 'violet',
    icon: HeartHandshake,
    valueKey: 'donatedUsers',
    trendKey: 'donatedUsersTrend',
  },
  {
    title: 'Member Count',
    href: '/memberships',
    tone: 'blue',
    icon: BadgeCheck,
    valueKey: 'memberCount',
    trendKey: 'memberCountTrend',
  },
  {
    title: 'Clinics',
    href: '/clinics',
    tone: 'orange',
    icon: Building2,
    valueKey: 'totalClinics',
    trendKey: 'clinicsTrend',
  },
  {
    title: 'Drivers',
    href: '/drivers',
    tone: 'pink',
    icon: CarFront,
    valueKey: 'totalDriverRegistrations',
    trendKey: 'driversTrend',
  },
]

export function OverviewStats({ kpis, loading }: { kpis?: OverviewKpis; loading?: boolean }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <StatCard
            key={card.title}
            title={card.title}
            value={kpis?.[card.valueKey] ?? 0}
            trend={kpis?.[card.trendKey]}
            href={card.href}
            tone={card.tone}
            loading={loading}
            icon={<Icon className="size-4" strokeWidth={2.25} />}
          />
        )
      })}
    </section>
  )
}
