import { ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import * as SelectPrimitive from '@radix-ui/react-select'
import type { RecordSource } from '@/lib/types'

interface SourceSelectorProps {
  sources: RecordSource[]
  activeSource: RecordSource | null
  onSourceChange: (sourceId: string) => void
}

export function SourceSelector({ sources, activeSource, onSourceChange }: SourceSelectorProps) {
  const displayName = activeSource?.name || 'Records'
  const hasMultiple = sources.length > 1

  if (!hasMultiple) {
    return (
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className="glow-cyan">{displayName}</span>
      </h1>
    )
  }

  return (
    <Select value={activeSource?.id || ''} onValueChange={onSourceChange}>
      <SelectPrimitive.Trigger className="flex items-center gap-1.5 cursor-pointer group focus:outline-none">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="glow-cyan group-hover:opacity-80 transition-opacity">{displayName}</span>
        </h1>
        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-[var(--accent-cyan)] transition-colors mt-1" />
      </SelectPrimitive.Trigger>
      <SelectContent>
        {sources.map((source) => (
          <SelectItem key={source.id} value={source.id}>
            {source.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
