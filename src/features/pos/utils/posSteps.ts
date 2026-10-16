import type { PosStep } from '@/features/pos/store/cartStore'

export type StepStatus = 'active' | 'done' | 'todo'

export const STEP_ORDER: PosStep[] = ['items', 'review', 'payment']

type StepState = {
  openStep: PosStep | null
  itemCount: number
  cashIsEnough: boolean
}

// Status circle of a step header (UI guide 6.3):
// active = the open step (yellow), done = finished (green check), todo = not reached (gray).
export function getStepStatus(
  step: PosStep,
  { openStep, itemCount, cashIsEnough }: StepState,
): StepStatus {
  if (step === openStep) return 'active'
  if (itemCount === 0) return 'todo'
  if (step === 'items') return 'done'
  if (step === 'review') return openStep === 'payment' || cashIsEnough ? 'done' : 'todo'
  return cashIsEnough ? 'done' : 'todo'
}

/** The step after this one, or null for the last step. */
export function nextStep(step: PosStep): PosStep | null {
  const index = STEP_ORDER.indexOf(step)
  return STEP_ORDER[index + 1] ?? null
}
