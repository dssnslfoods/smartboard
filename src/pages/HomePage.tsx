import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Copy,
  Database,
  LayoutGrid,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useUserStore } from '@/stores/userStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TEMPLATES } from '@/lib/templates'

function StatTile({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; value: string | number; tone: string }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `${tone}1f` }}>
        <Icon className="h-5 w-5" style={{ color: tone }} />
      </div>
      <div>
        <div className="font-data text-2xl font-semibold text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary">{label}</div>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { dashboards, createDashboard, duplicateDashboard, deleteDashboard } = useDashboardStore()
  const sources = useDataSourceStore((s) => s.sources)
  const isAdmin = useUserStore((s) => s.user.role === 'admin')

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [template, setTemplate] = useState('')
  const [menu, setMenu] = useState<string | null>(null)

  const lastUpdated = dashboards.reduce((max, d) => Math.max(max, d.updatedAt), 0)

  const submit = () => {
    if (!name.trim()) return
    const d = createDashboard({ name: name.trim(), template: template || undefined })
    setOpen(false)
    setName('')
    setTemplate('')
    navigate(`/dashboard/${d.id}`)
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Dashboard Hub"
        subtitle="Executive analytics across all your connected data sources."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Dashboard
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3">
        <StatTile icon={Database} label="Data sources" value={sources.length + 1} tone="#58A6FF" />
        <StatTile icon={LayoutGrid} label="Dashboards" value={dashboards.length} tone="#3FB950" />
        <StatTile
          icon={Clock}
          label="Last updated"
          value={lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : '—'}
          tone="#BC8CFF"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-2 sm:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((d) => (
          <div
            key={d.id}
            onClick={() => navigate(`/dashboard/${d.id}`)}
            className="card card-hover group relative cursor-pointer p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/12">
                <LayoutGrid className="h-5 w-5 text-accent-blue" />
              </div>
              {isAdmin && (
                <div className="relative">
                  <button
                    className="rounded-md p-1 text-text-secondary opacity-0 transition-opacity hover:bg-bg-secondary hover:text-text-primary group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenu(menu === d.id ? null : d.id)
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menu === d.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenu(null) }} />
                      <div className="absolute right-0 top-7 z-20 w-36 overflow-hidden rounded-lg border border-border bg-bg-secondary py-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-primary hover:bg-bg-card"
                          onClick={() => { duplicateDashboard(d.id); setMenu(null) }}
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        <button
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-accent-red hover:bg-bg-card"
                          onClick={() => { deleteDashboard(d.id); setMenu(null) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-text-primary">{d.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
              {d.description ?? 'Custom dashboard'}
            </p>
            <div className="mt-4 flex items-center justify-between text-[11px] text-text-secondary">
              <span>{d.widgets.length} widgets</span>
              <span>Updated {formatDistanceToNow(d.updatedAt, { addSuffix: true })}</span>
            </div>
          </div>
        ))}

        {isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="card flex min-h-[180px] flex-col items-center justify-center gap-2 border-dashed text-text-secondary transition-colors hover:border-accent-blue/40 hover:text-accent-blue"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Create dashboard</span>
          </button>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create dashboard"
        description="Start blank or from a curated executive template."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit} disabled={!name.trim()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Dashboard name">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q3 Executive Review"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <Field label="Template" hint="Templates pre-load widgets wired to demo data.">
            <Select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Blank dashboard"
              options={[
                { value: '', label: 'Blank dashboard' },
                ...TEMPLATES.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
