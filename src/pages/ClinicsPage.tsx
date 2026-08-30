import { Building2, HeartHandshake, Link as LinkIcon, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClinicDetailsForm, type Clinic } from '../components/clinics/ClinicDetailsForm'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { api } from '../lib/api'
import { countryName, flagEmoji } from '../lib/cn'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

const COLUMNS = [
  'Clinic Registration ID',
  'Clinic Name',
  'Contact Details',
  'Country',
  'City',
  'Address',
  'Status',
  'Action',
]

function mapHref(clinic: Clinic) {
  if (clinic.mapUrl) return clinic.mapUrl
  const query = [clinic.address, clinic.city, countryName(clinic.countryCode)].filter(Boolean).join(', ')
  return query ? `https://maps.google.com/?q=${encodeURIComponent(query)}` : undefined
}

export function ClinicsPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const form = params.get('form')
  const list = useAdminList<Clinic>('clinics', '/admin/clinics')
  const mut = useAdminMutation(['clinics', 'clinic-stats', 'dashboard-summary'])
  const [del, setDel] = useState<Clinic | null>(null)
  const { data: stats } = useQuery({
    queryKey: ['clinic-stats'],
    queryFn: async () =>
      (await api.get<{ totalClinics: number; totalMembers: number; totalDonationCents: number }>('/admin/clinics/stats'))
        .data,
  })

  if (form === 'new') {
    return <ClinicDetailsForm clinicId="new" onClose={() => setParams({})} />
  }

  if (form) {
    return <ClinicDetailsForm clinicId={form} onClose={() => setParams({})} />
  }

  if (viewId) {
    return (
      <ClinicDetailsForm
        clinicId={viewId}
        readOnly
        onClose={() => setParams({})}
        onEdit={() => setParams({ form: viewId })}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Total Clinic"
          value={stats?.totalClinics ?? 0}
          icon={<Building2 className="size-6 text-[#009EE8]" />}
        />
        <MetricCard
          title="Total Clinic Members"
          value={stats?.totalMembers ?? 0}
          icon={<Users className="size-6 text-[#009EE8]" />}
        />
        <MetricCard
          title="Total Clinic Donation"
          value={stats?.totalDonationCents ?? 0}
          money
          icon={<HeartHandshake className="size-6 text-[#00A419]" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-normal text-black">Clinic List</h2>
          <button
            type="button"
            onClick={() => setParams({ form: 'new' })}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            Add Clinic
          </button>
        </div>
        <TableToolbar
          search={list.search}
          onSearch={list.setSearch}
          country={list.country}
          onCountry={list.setCountry}
        />
        <TableFrame>
          <DataTable columns={COLUMNS}>
            {(list.data?.data ?? []).map((c) => {
              const href = mapHref(c)
              return (
                <tr key={c.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{c.publicId ?? c.id.slice(-6)}</td>
                  <td className="px-2.5 py-4">{c.name}</td>
                  <td className="px-2.5 py-4 leading-[15px]">
                    <div>{c.email}</div>
                    <div>{c.phone}</div>
                  </td>
                  <td className="px-2.5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-[18px] items-center justify-center overflow-hidden rounded-full text-[11px] leading-none">
                        {flagEmoji(c.countryCode)}
                      </span>
                      {countryName(c.countryCode)}
                    </span>
                  </td>
                  <td className="px-2.5 py-4">{c.city}</td>
                  <td className="px-2.5 py-4">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#009EE8]"
                      >
                        <LinkIcon className="size-3.5" />
                        Map Link
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2.5 py-4">
                    <StatusBadge status={c.status === 'ACTIVE' ? 'APPROVED' : c.status} />
                  </td>
                  <td className="px-2.5 py-4">
                    <ActionButtons
                      onView={() => setParams({ view: c.id })}
                      onEdit={() => setParams({ form: c.id })}
                      onDelete={() => setDel(c)}
                    />
                  </td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination
            page={list.data?.meta.page ?? 1}
            pageCount={list.data?.meta.pageCount ?? 1}
            total={list.data?.meta.total ?? 0}
            limit={10}
            onPage={list.setPage}
          />
        </TableFrame>
      </section>
      <ConfirmDialog
        open={!!del}
        title="Delete clinic"
        message="This cannot be undone."
        onClose={() => setDel(null)}
        pending={mut.isPending}
        onConfirm={async () => {
          if (!del) return
          try {
            await mut.run(() => api.delete(`/admin/clinics/${del.id}`), {
              success: 'Clinic deleted',
              error: 'Could not delete clinic',
            })
            setDel(null)
          } catch {
            // Keep dialog open after a failed delete
          }
        }}
      />
    </div>
  )
}
