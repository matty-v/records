import { cn } from '@/lib/utils'

export type ViewMode = 'table' | 'chart'

interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg p-0.5"
      style={{
        border: '1px solid rgba(100,150,255,0.2)',
        background: 'rgba(18,24,33,0.5)',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          mode === 'table'
            ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)]'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange('chart')}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          mode === 'chart'
            ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)]'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Chart
      </button>
    </div>
  )
}
