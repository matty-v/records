import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[rgba(100,150,255,0.08)]',
        className
      )}
      {...props}
    />
  )
}
