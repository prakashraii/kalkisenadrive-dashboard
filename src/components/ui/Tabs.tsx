import { cn } from '../../lib/cn'

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'h-14 rounded-md px-8 text-base whitespace-nowrap',
              active
                ? 'border border-[#020B17] bg-[#020B17] text-white'
                : 'border border-black/12 bg-white text-black',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
