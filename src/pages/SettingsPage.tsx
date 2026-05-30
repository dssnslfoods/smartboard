import { useRef } from 'react'
import { Download, Moon, Upload } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type { Dashboard } from '@/types'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {description && <p className="mt-1 text-xs text-text-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const settings = useSettingsStore()
  const { dashboards, importDashboards } = useDashboardStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportConfigs = () => {
    const blob = new Blob([JSON.stringify({ dashboards, exportedAt: Date.now() }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'boardroom-dashboards.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importConfigs = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const incoming: Dashboard[] = parsed.dashboards ?? parsed
        if (Array.isArray(incoming)) importDashboards(incoming)
      } catch {
        alert('Invalid configuration file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="pb-10">
      <PageHeader title="Settings" subtitle="App-wide preferences and configuration management." />

      <div className="grid grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-2">
        <Section title="Theme" description="Choose how dark the executive terminal looks.">
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'darker'] as const).map((t) => (
              <button
                key={t}
                onClick={() => settings.update({ theme: t })}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  settings.theme === t
                    ? 'border-accent-blue/50 bg-accent-blue/8'
                    : 'border-border hover:border-[#30363d]'
                )}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md"
                  style={{ background: t === 'dark' ? '#0a0b0d' : '#050608', border: '1px solid #21262d' }}
                >
                  <Moon className="h-4 w-4 text-accent-blue" />
                </div>
                <div>
                  <div className="text-sm font-medium capitalize text-text-primary">{t}</div>
                  <div className="text-[11px] text-text-secondary">
                    {t === 'dark' ? 'Default executive' : 'Maximum contrast'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Defaults" description="Applied to new widgets and dashboards.">
          <div className="space-y-4">
            <Field label="Default date range">
              <Select
                value={settings.defaultDateRange ?? '30d'}
                onChange={(e) => settings.update({ defaultDateRange: e.target.value as never })}
                options={[
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                  { value: 'ytd', label: 'Year to date' },
                  { value: 'all', label: 'All time' },
                ]}
              />
            </Field>
            <Field label="Default refresh interval">
              <Select
                value={String(settings.defaultRefreshInterval)}
                onChange={(e) => settings.update({ defaultRefreshInterval: Number(e.target.value) })}
                options={[
                  { value: '0', label: 'Manual only' },
                  { value: '30', label: 'Every 30s' },
                  { value: '60', label: 'Every 60s' },
                  { value: '300', label: 'Every 5 min' },
                ]}
              />
            </Field>
          </div>
        </Section>

        <Section title="Export / Import" description="Back up or migrate your dashboard configurations as JSON.">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportConfigs}>
              <Download className="h-4 w-4" /> Export dashboards
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import dashboards
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importConfigs(f)
                e.target.value = ''
              }}
            />
          </div>
          <p className="mt-3 text-[11px] text-text-secondary">
            {dashboards.length} dashboards currently stored.
          </p>
        </Section>
      </div>
    </div>
  )
}
