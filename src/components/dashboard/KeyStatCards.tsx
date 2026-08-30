import { BadgeCheck, Building2, CarFront, HeartHandshake } from 'lucide-react'
import { StatCard } from '../ui/StatCard'

export type KeyStat = {
  value: number
  trend?: number
}

export function KeyStatCards({
  donatedUsers,
  members,
  clinics,
  drivers,
}: {
  donatedUsers: KeyStat
  members: KeyStat
  clinics: KeyStat
  drivers: KeyStat
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Donated Users"
        value={donatedUsers.value}
        trend={donatedUsers.trend}
        icon={<HeartHandshake className="size-4" />}
        tone="violet"
      />
      <StatCard
        title="Member Count"
        value={members.value}
        trend={members.trend}
        icon={<BadgeCheck className="size-4" />}
        tone="blue"
      />
      <StatCard
        title="Clinics"
        value={clinics.value}
        trend={clinics.trend}
        icon={<Building2 className="size-4" />}
        tone="orange"
      />
      <StatCard
        title="Drivers"
        value={drivers.value}
        trend={drivers.trend}
        icon={<CarFront className="size-4" />}
        tone="pink"
      />
    </div>
  )
}
