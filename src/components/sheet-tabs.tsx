import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetTabsProps {
  sheetNames: string[]
  activeSheet: string | null
  onSheetChange: (name: string) => void
  onDeleteSheet?: (name: string) => void
}

export function SheetTabs({ sheetNames, activeSheet, onSheetChange, onDeleteSheet }: SheetTabsProps) {
  if (sheetNames.length === 0) return null

  const canDelete = sheetNames.length > 1

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {sheetNames.map((name) => (
        <button
          key={name}
          onClick={() => onSheetChange(name)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5',
            activeSheet === name
              ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)] border border-[rgba(0,212,255,0.3)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(100,150,255,0.08)] border border-transparent'
          )}
        >
          {name}
          {activeSheet === name && canDelete && onDeleteSheet && (
            <Trash2
              className="h-3.5 w-3.5 opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteSheet(name)
              }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
