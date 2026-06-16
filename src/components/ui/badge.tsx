import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground ring-border',
        blue: 'bg-blue-50 text-blue-600 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-400/20',
        emerald:
          'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20',
        amber:
          'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/20',
        red: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-400/20',
        purple:
          'bg-purple-50 text-purple-600 ring-purple-500/20 dark:bg-purple-950/40 dark:text-purple-400 dark:ring-purple-400/20',
        orange:
          'bg-orange-50 text-orange-600 ring-orange-500/20 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-400/20',
        indigo:
          'bg-indigo-50 text-indigo-600 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-400/20',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
)

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }
