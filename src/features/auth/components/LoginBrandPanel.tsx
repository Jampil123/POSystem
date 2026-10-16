import { cn } from '@/lib/utils'

const steps = ['Log in', 'Open your shift', 'Start selling']

// The yellow side of the login page: the store logo, a welcome message, and the
// three steps of a cashier's day. Flat yellow with dark text (UI guide 2 and 6.1).
export function LoginBrandPanel() {
  return (
    <section
      aria-label="Kuya Tata Sari-Sari Store"
      className="flex flex-col items-center gap-4 bg-primary px-6 py-8 text-center text-primary-foreground md:items-start md:justify-between md:gap-8 md:p-10 md:text-left short:justify-center! short:gap-3! short:py-5!"
    >
      <p className="hidden text-sm font-semibold md:block short:hidden!">Kuya Tata POS</p>

      <div className="flex flex-col items-center gap-4 md:items-start">
        <img
          src="/brand/kuya-tata-logo.png"
          alt="Kuya Tata Sari-Sari Store logo"
          width={480}
          height={480}
          className="size-32 md:size-48 lg:size-56 short:size-24!"
        />
        <div className="grid gap-2">
          <p className="text-3xl font-bold md:text-4xl short:text-2xl!">Welcome back!</p>
          <p className="max-w-sm text-base text-primary-foreground/80">
            Log in to start your shift at the Kuya Tata Sari-Sari Store.
          </p>
        </div>
      </div>

      <ol className="hidden w-full grid-cols-3 gap-3 md:grid short:hidden!">
        {steps.map((step, index) => (
          <li
            key={step}
            className={cn(
              'flex min-h-24 flex-col justify-between gap-3 rounded-lg p-3 text-sm',
              index === 0 ? 'bg-card font-semibold' : 'bg-card/50',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 items-center justify-center rounded-full border border-primary-foreground/30 text-xs font-semibold',
                index === 0 && 'border-primary-foreground bg-primary-foreground text-card',
              )}
            >
              {index + 1}
            </span>
            <span>
              <span className="sr-only">Step {index + 1}: </span>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
