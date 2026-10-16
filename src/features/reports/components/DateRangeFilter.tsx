import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  datePresetLabels,
  type DatePreset,
  type DateRange,
} from '@/features/reports/utils/dateRanges'
import { cn } from '@/lib/utils'

const PRESETS: DatePreset[] = ['today', 'yesterday', 'this-week', 'this-month', 'custom']

type DateRangeFilterProps = {
  preset: DatePreset
  customRange: DateRange
  error: string | null
  onPresetChange: (preset: DatePreset) => void
  onCustomRangeChange: (range: DateRange) => void
}

// Date range presets (Philippine dates) and, for Custom, two date fields.
export function DateRangeFilter({
  preset,
  customRange,
  error,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={preset === value}
            onClick={() => onPresetChange(value)}
            className={cn(
              'min-h-12 rounded-full border px-4 text-sm font-medium',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              preset === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted',
            )}
          >
            {datePresetLabels[value]}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2 md:max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="report-from">From</Label>
            <Input
              id="report-from"
              type="date"
              className="h-12"
              value={customRange.from}
              onChange={(event) =>
                onCustomRangeChange({ ...customRange, from: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-to">To</Label>
            <Input
              id="report-to"
              type="date"
              className="h-12"
              value={customRange.to}
              onChange={(event) => onCustomRangeChange({ ...customRange, to: event.target.value })}
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
