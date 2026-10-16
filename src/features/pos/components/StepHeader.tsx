import { Check } from 'lucide-react'
import type { StepStatus } from '@/features/pos/utils/posSteps'
import { cn } from '@/lib/utils'

const circleClasses: Record<StepStatus, string> = {
  active: 'bg-primary text-primary-foreground',
  done: 'bg-success text-white',
  todo: 'border bg-muted text-muted-foreground',
}

const statusWords: Record<StepStatus, string> = {
  active: 'current step',
  done: 'done',
  todo: 'not started',
}

type StepHeaderProps = {
  number: number
  title: string
  /** Shown under the title, e.g. "3 items · ₱105.00". */
  summary: string
  status: StepStatus
}

// Step number circle (yellow = current, green check = done, gray = not reached),
// title, and a one-line summary of the step.
export function StepHeader({ number, title, summary, status }: StepHeaderProps) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          circleClasses[status],
        )}
        aria-hidden="true"
      >
        {status === 'done' ? <Check className="size-5" /> : number}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold">
          {title}
          <span className="sr-only">
            {' '}
            (step {number}, {statusWords[status]})
          </span>
        </span>
        <span className="block truncate text-sm font-normal text-muted-foreground tabular-nums">
          {summary}
        </span>
      </span>
    </span>
  )
}
