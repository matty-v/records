import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  value: string
  onChange: (value: string) => void
  step?: number
  id?: string
  placeholder?: string
}

export function NumberStepper({ value, onChange, step = 1, id, placeholder }: NumberStepperProps) {
  const numValue = parseFloat(value) || 0

  const decrement = () => {
    onChange(String(numValue - step))
  }

  const increment = () => {
    onChange(String(numValue + step))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] text-foreground transition-all duration-200 active:scale-95 active:bg-[rgba(0,212,255,0.15)] hover:border-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,212,255,0.1)]"
        aria-label="Decrease value"
      >
        <Minus className="h-5 w-5" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-12 w-full rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] px-3 py-2 text-center text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
      />
      <button
        type="button"
        onClick={increment}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] text-foreground transition-all duration-200 active:scale-95 active:bg-[rgba(0,212,255,0.15)] hover:border-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,212,255,0.1)]"
        aria-label="Increase value"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}
