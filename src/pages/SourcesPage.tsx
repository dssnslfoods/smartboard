import { useState } from 'react'
import { Activity, Database, Pencil, Plus, Trash2, Zap } from 'lucide-react'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useUserStore } from '@/stores/userStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_META } from '@/lib/snapshotData'
import type { ConnectionState, DataSource } from '@/types'

const COLORS = ['#58A6FF', '#3FB950', '#BC8CFF', '#D29922', '#F85149', '#39C5CF']
const empty = { name: '', url: '', anonKey: '', color: COLORS[0], description: '' }

// Built-in read-only sources always present (not stored in supabaseManager)
const BUILTIN_ROWS = [
  {
    id: SNAPSHOT_META.id,
    name: SNAPSHOT_META.name,
    url: 'https://jcueieskfvhmrwcmgnyh.supabase.co',
    color: SNAPSHOT_META.color,
    description: SNAPSHOT_META.description,
    state: 'connected' as ConnectionState,
    latencyMs: undefined as number | undefined,
    tableCount: undefined as number | undefined,
    builtin: true,
    badge: 'Snapshot',
  },
  {
    id: DEMO_SOURCE_ID,
    name: 'Demo data',
    url: 'Built-in synthetic data',
    color: '#BC8CFF',
    description: 'Seeded demo data — no network connection required.',
    state: 'demo' as ConnectionState | 'demo',
    latencyMs: undefined,
    tableCount: 5,
    builtin: true,
    badge: 'Built-in',
  },
]

export function SourcesPage() {
  const { sources, status, addSource, updateSource, removeSource, testConnection } =
    useDataSourceStore()
  const isAdmin = useUserStore((s) => s.user.role === 'admin')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DataSource | null>(null)
  const [form, setForm] = useState(empty)

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (s: DataSource) => {
    setEditing(s)
    setForm({ name: s.name, url: s.url, anonKey: s.anonKey, color: s.color, description: s.description })
    setOpen(true)
  }

  const save = () => {
    if (!form.name.trim() || !form.url.trim() || !form.anonKey.trim()) return
    if (editing) updateSource(editing.id, form)
    else {
      const s = addSource(form)
      testConnection(s.id)
    }
    setOpen(false)
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-secondary">
        <Database className="h-8 w-8" />
        <p className="text-sm">Source management requires the Admin role.</p>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Data Sources"
        subtitle="Register Supabase projects. Anon keys are stored locally in your browser — never in a database."
        actions={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add source
          </Button>
        }
      />

      <div className="px-6 py-4">
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-secondary/50 text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 font-medium">Tables</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Built-in sources ── */}
              {BUILTIN_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />
                      <div>
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          {row.name}
                          <Badge tone={row.badge === 'Snapshot' ? 'green' : 'purple'}>
                            {row.badge}
                          </Badge>
                        </div>
                        {row.description && (
                          <div className="text-xs text-text-secondary">{row.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-text-secondary">
                    {row.url.startsWith('https') ? row.url.replace(/^https?:\/\//, '') : row.url}
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot state={row.state as never} showLabel />
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-text-primary">
                    {row.latencyMs != null ? `${row.latencyMs} ms` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.tableCount != null ? <Badge tone="blue">{row.tableCount}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-text-secondary italic">Read-only</span>
                  </td>
                </tr>
              ))}

              {/* ── User-added live sources ── */}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No live sources added yet.{' '}
                    <button className="text-accent-blue hover:underline" onClick={openAdd}>
                      Add your first source →
                    </button>
                  </td>
                </tr>
              )}
              {sources.map((s) => {
                const st = status[s.id]
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        <div>
                          <div className="font-medium text-text-primary">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-text-secondary">{s.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-data text-xs text-text-secondary">
                      {s.url.replace(/^https?:\/\//, '')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot state={st?.state ?? 'idle'} showLabel />
                      {st?.error && <div className="mt-0.5 text-[11px] text-accent-red">{st.error}</div>}
                    </td>
                    <td className="px-4 py-3 font-data text-xs text-text-primary">
                      {st?.latencyMs != null ? `${st.latencyMs} ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {st?.tableCount != null ? <Badge tone="blue">{st.tableCount}</Badge> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" size="sm" onClick={() => testConnection(s.id)}>
                          <Zap className="h-3.5 w-3.5" /> Test
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent-red"
                          onClick={() => removeSource(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit source' : 'Add data source'}
        description="Connect a Supabase project by URL and anon (public) key."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {editing ? 'Save changes' : 'Add source'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Production DB" />
          </Field>
          <Field label="Supabase URL">
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://xxxx.supabase.co"
              className="font-data text-xs"
            />
          </Field>
          <Field label="Anon key" hint="The public anon key. Stored only in your browser's localStorage.">
            <Textarea
              value={form.anonKey}
              onChange={(e) => setForm({ ...form, anonKey: e.target.value })}
              placeholder="eyJhbGciOi…"
              rows={3}
              className="font-data text-xs"
            />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Customer-facing prod cluster" />
          </Field>
          <Field label="Accent color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className="h-7 w-7 rounded-full ring-offset-2 ring-offset-bg-card transition-all"
                  style={{
                    background: c,
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                  aria-label={c}
                >
                  {form.color === c && <Activity className="mx-auto h-3.5 w-3.5 text-black/60" />}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
