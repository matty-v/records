import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-cyan)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-cyan)] text-[#0a0e14] hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
        destructive: 'bg-destructive/80 text-destructive-foreground hover:bg-destructive hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        outline: 'border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] bg-transparent hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-muted-foreground hover:text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)]',
        link: 'text-[var(--accent-cyan)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
