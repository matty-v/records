import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin text-[var(--accent-cyan)]', {
  variants: {
    size: {
      sm: 'h-3.5 w-3.5',
      default: 'h-5 w-5',
      lg: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

export function Spinner({ size, className }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size, className }))} />
}
