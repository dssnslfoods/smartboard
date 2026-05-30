import { useRef, useState } from 'react'
import { Activity, Database, FileText, Pencil, Plus, Sparkles, Trash2, Upload, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useUserStore } from '@/stores/userStore'
import { useSourceActiveStore } from '@/stores/sourceActiveStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import { handoffTemplate, summarizeHandoff } from '@/lib/handoff'
import { getCatalog } from '@/lib/sourceCatalog'
import { validateUrl, validateAnonKey, quickTest, normalizeSupabaseUrl } from '@/lib/supabaseValidation'
import type { ConnectionState, DataSource } from '@/types'
import { cn } from '@/lib/utils'

const COLORS = ['#58A6FF', '#3FB950', '#BC8CFF', '#D29922', '#F85149', '#39C5CF']
const empty = { name: '', url: '', anonKey: '', color: COLORS[0], description: '', handoff: '' }

const BUILTIN_IDS = new Set([DEMO_SOURCE_ID])

interface LiveRow {
  id: string
  name: string
  description: string
  color: string
  url: string
  state: ConnectionState | 'demo'
  latencyMs?: number
  tableCount?: number
  error?: string
  badge?: string
  kind: 'snapshot' | 'user'
  ref?: DataSource // for user-added editing/deleting
  catalogTables?: number
  catalogCols?: number
}

/** Active toggle switch (small, accessible). */
function ActiveToggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-accent-green' : 'bg-bg-secondary border border-border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={on ? 'Active — click to deactivate' : 'Inactive — click to activate'}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

export function SourcesPage() {
  const navigate = useNavigate()
  const { sources, status, addSource, updateSource, removeSource, testConnection } = useDataSourceStore()
  const isAdmin = useUserStore((s) => s.user.role === 'admin')
  const { isActive, setActive } = useSourceActiveStore()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DataSource | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmDelete, setConfirmDelete] = useState<DataSource | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const userSources = sources.filter((s) => !BUILTIN_IDS.has(s.id))

  // Live sources = baked snapshots (real Supabase projects) + user-added.
  const liveRows: LiveRow[] = [
    ...SNAPSHOT_SOURCES.map((s) => {
      const cat = getCatalog(s.id)
      return {
        id: s.id, name: s.name, description: s.description, color: s.color,
        url: s.projectUrl, state: 'connected' as ConnectionState,
        badge: 'Snapshot', kind: 'snapshot' as const,
        catalogTables: cat.tables.length,
        catalogCols: cat.tables.reduce((a, t) => a + t.columns.length, 0),
      }
    }),
    ...userSources.map((s) => {
      const st = status[s.id]
      const cat = getCatalog(s.id)
      return {
        id: s.id, name: s.name, description: s.description, color: s.color, url: s.url,
        state: st?.state ?? 'idle', latencyMs: st?.latencyMs, tableCount: st?.tableCount,
        error: st?.error, kind: 'user' as const, ref: s,
        catalogTables: cat.tables.length,
        catalogCols: cat.tables.reduce((a, t) => a + t.columns.length, 0),
      }
    }),
  ]

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (s: DataSource) => {
    setEditing(s)
    setForm({ name: s.name, url: s.url, anonKey: s.anonKey, color: s.color, description: s.description, handoff: s.handoff ?? '' })
    setOpen(true)
  }
  const [preflight, setPreflight] = useState<{ testing: boolean; result?: { ok: boolean; latencyMs: number; tableCount?: number; error?: string } }>({ testing: false })

  const onUpload = (file: File) => {
    const r = new FileReader()
    r.onload = () => setForm((f) => ({ ...f, handoff: String(r.result) }))
    r.readAsText(file)
  }

  // Real-time validation
  const urlVal = validateUrl(form.url)
  const keyVal = validateAnonKey(form.anonKey, urlVal.ref)
  const canSave = form.name.trim() && urlVal.valid && keyVal.valid
  const handoffSummary = form.handoff.trim() ? summarizeHandoff(form.handoff) : null

  const runPreflight = async () => {
    setPreflight({ testing: true })
    const result = await quickTest(form.url, form.anonKey)
    setPreflight({ testing: false, result })
  }

  const save = () => {
    if (!canSave) return
    const payload = { ...form, url: normalizeSupabaseUrl(form.url), handoff: form.handoff.trim() || undefined }
    if (editing) updateSource(editing.id, payload)
    else { const s = addSource(payload); testConnection(s.id) }
    setOpen(false)
    setPreflight({ testing: false })
  }
  const confirmAndDelete = () => {
    if (!confirmDelete) return
    removeSource(confirmDelete.id)
    setConfirmDelete(null)
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-secondary">
        <Database className="h-8 w-8" />
        <p className="text-sm">Source management requires the Admin role.</p>
      </div>
    )
  }

  const activeCount = liveRows.filter((r) => isActive(r.id)).length

  return (
    <div className="pb-10">
      <PageHeader
        title="Data Sources"
        subtitle="Read-only. Boardroom only views & analyzes — never modifies any source database."
        actions={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add source
          </Button>
        }
      />

      <div className="space-y-4 px-6 py-4">

        {/* ── Live Sources ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-bg-secondary/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Live Sources
              </span>
              <Badge tone="neutral">{liveRows.length} total · {activeCount} active</Badge>
            </div>
            <span className="text-[11px] text-text-secondary">
              Toggle the switch to include/exclude a source from dashboards
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-secondary/30 text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-2.5 font-medium w-14">Active</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">URL</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Schema</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveRows.map((row) => {
                const on = isActive(row.id)
                return (
                  <tr key={row.id} className={cn('border-b border-border last:border-0 hover:bg-bg-secondary/20', !on && 'opacity-55')}>
                    <td className="px-4 py-3">
                      <ActiveToggle on={on} onChange={(v) => setActive(row.id, v)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium text-text-primary">
                            {row.name}
                            {row.badge && <Badge tone="green">{row.badge}</Badge>}
                          </div>
                          {row.description && (
                            <div className="text-xs text-text-secondary">{row.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-data text-xs text-text-secondary">
                      {row.url.replace(/^https?:\/\//, '')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot state={row.state as never} showLabel />
                      {row.error && <div className="mt-0.5 text-[11px] text-accent-red">{row.error}</div>}
                      {row.latencyMs != null && <div className="text-[10px] text-text-secondary">{row.latencyMs} ms</div>}
                    </td>
                    <td className="px-4 py-3">
                      {row.catalogTables ? (
                        <Badge tone="blue">{row.catalogTables} tables · {row.catalogCols} cols</Badge>
                      ) : (
                        <span className="text-[11px] text-text-secondary">No handoff</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {row.catalogTables ? (
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/reports-gallery/${row.id}`)} title="Suggested reports">
                            <Sparkles className="h-3.5 w-3.5" /> Reports
                          </Button>
                        ) : null}
                        {row.kind === 'user' && row.ref ? (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => testConnection(row.id)}>
                              <Zap className="h-3.5 w-3.5" /> Test
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.ref!)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-accent-red"
                              onClick={() => setConfirmDelete(row.ref!)} title="Delete source">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] italic text-text-secondary">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {liveRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-secondary">
                    No sources yet.{' '}
                    <button className="text-accent-blue hover:underline" onClick={openAdd}>Add your first source →</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Built-in (Demo only) ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-bg-secondary/50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Built-in
            </span>
            <span className="text-[11px] text-text-secondary">Synthetic data for testing / templates</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-secondary/30 text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-2.5 font-medium w-14">Active</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">URL</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Tables</th>
              </tr>
            </thead>
            <tbody>
              <tr className={cn('hover:bg-bg-secondary/20', !isActive(DEMO_SOURCE_ID) && 'opacity-55')}>
                <td className="px-4 py-3">
                  <ActiveToggle on={isActive(DEMO_SOURCE_ID)} onChange={(v) => setActive(DEMO_SOURCE_ID, v)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent-purple" />
                    <div>
                      <div className="flex items-center gap-2 font-medium text-text-primary">
                        Demo data <Badge tone="purple">Built-in</Badge>
                      </div>
                      <div className="text-xs text-text-secondary">Seeded synthetic data — no network connection required.</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-data text-xs text-text-secondary">Built-in synthetic</td>
                <td className="px-4 py-3"><StatusDot state="demo" showLabel /></td>
                <td className="px-4 py-3"><Badge tone="blue">5</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setPreflight({ testing: false }) }}
        title={editing ? 'Edit source' : 'Add data source'}
        description="Connect a Supabase project by URL and anon (public) key. Read-only — Boardroom will never write to your database."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); setPreflight({ testing: false }) }}>Cancel</Button>
            <Button variant="secondary" onClick={runPreflight} disabled={!urlVal.valid || !keyVal.valid || preflight.testing}>
              <Zap className="h-3.5 w-3.5" /> {preflight.testing ? 'Testing…' : 'Test connection'}
            </Button>
            <Button variant="primary" onClick={save} disabled={!canSave}>{editing ? 'Save changes' : 'Add source'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Production DB" />
          </Field>

          {/* URL with validation */}
          <Field label="Supabase URL">
            <Input
              value={form.url}
              onChange={(e) => { setForm({ ...form, url: e.target.value }); setPreflight({ testing: false }) }}
              placeholder="https://xxxx.supabase.co"
              className={cn('font-data text-xs', urlVal.error && form.url.trim() && 'border-accent-red/60')}
            />
            {form.url.trim() && (
              <div className="mt-1 text-[11px]">
                {urlVal.valid ? (
                  <span className="text-accent-green">
                    ✓ {urlVal.ref ? `Project: ${urlVal.ref}` : 'Valid URL (custom/self-hosted)'}
                  </span>
                ) : (
                  <span className="text-accent-red">{urlVal.error}</span>
                )}
              </div>
            )}
          </Field>

          {/* Anon key with validation */}
          <Field label="Anon key" hint="Stored only in your browser's localStorage.">
            <Textarea
              value={form.anonKey}
              onChange={(e) => { setForm({ ...form, anonKey: e.target.value }); setPreflight({ testing: false }) }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={3}
              className={cn('font-data text-xs', keyVal.error && form.anonKey.trim() && 'border-accent-red/60')}
            />
            {form.anonKey.trim() && (
              <div className="mt-1 text-[11px]">
                {keyVal.valid ? (
                  <span className="text-accent-green">
                    ✓ {keyVal.isJwt ? 'JWT format' : 'Publishable key'}{keyVal.matchesProject ? ` · matches ${urlVal.ref}` : ''}
                  </span>
                ) : (
                  <span className="text-accent-red">{keyVal.error}</span>
                )}
              </div>
            )}
            {urlVal.ref && (
              <div className="mt-2 rounded-lg border border-border bg-bg-secondary/40 p-2 text-[11px] text-text-secondary">
                📋 ไปที่ <span className="font-medium text-accent-blue">supabase.com/dashboard/project/{urlVal.ref}/settings/api</span> → copy <span className="font-medium">anon public</span> key
              </div>
            )}
          </Field>

          {/* Preflight test result */}
          {preflight.result && (
            <div className={cn(
              'rounded-lg border p-3 text-sm',
              preflight.result.ok
                ? 'border-accent-green/30 bg-accent-green/8 text-accent-green'
                : 'border-accent-red/30 bg-accent-red/8 text-accent-red'
            )}>
              {preflight.result.ok ? (
                <>✅ Connected! {preflight.result.latencyMs}ms · {preflight.result.tableCount ?? '?'} tables visible</>
              ) : (
                <>❌ {preflight.result.error}</>
              )}
            </div>
          )}
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Customer-facing prod cluster" />
          </Field>
          <Field label="Accent color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className="h-7 w-7 rounded-full ring-offset-2 ring-offset-bg-card transition-all"
                  style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none' }}
                  aria-label={c}>
                  {form.color === c && <Activity className="mx-auto h-3.5 w-3.5 text-black/60" />}
                </button>
              ))}
            </div>
          </Field>

          {/* Handoff upload */}
          <div className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <FileText className="h-3.5 w-3.5 text-accent-blue" />
                Schema handoff (handoff.md)
              </div>
              <div className="flex items-center gap-1">
                <input ref={fileRef} type="file" accept=".md,.txt,text/markdown" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
                <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, handoff: handoffTemplate() }))}>Use template</Button>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
              </div>
            </div>
            <p className="mb-2 text-[11px] text-text-secondary">
              อธิบาย table/column ของ source เพื่อให้ระบบเข้าใจ schema, แนะนำรายงาน และสร้าง widget ได้ถูกต้อง
              (จำเป็นเมื่อ source มี RLS ที่ anon key อ่านไม่ได้)
            </p>
            <Textarea value={form.handoff} onChange={(e) => setForm({ ...form, handoff: e.target.value })}
              placeholder={'## table: orders — Customer orders\n- id (id)\n- created_at (date)\n- amount (metric)\n- region (dimension)'}
              rows={6} className="font-data text-[11px]" />
            {handoffSummary && (
              <div className="mt-2 text-[11px]">
                {handoffSummary.ok ? (
                  <span className="text-accent-green">✓ พบ {handoffSummary.tables} tables · {handoffSummary.columns} columns — ระบบจะแนะนำรายงานให้อัตโนมัติ</span>
                ) : (
                  <span className="text-accent-amber">⚠ ยังอ่าน schema ไม่ได้ — ตรวจรูปแบบ (ดู "Use template")</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete source"
        description={`Remove "${confirmDelete?.name}"? Dashboards using this source will show empty data.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmAndDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </>
        }>
        <div className="rounded-lg border border-accent-red/20 bg-accent-red/8 p-3 text-sm text-accent-red">
          ⚠️ This action cannot be undone. (Source database is untouched — only the Boardroom connection is removed.)
        </div>
      </Dialog>
    </div>
  )
}
