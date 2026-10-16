import { getStepStatus, nextStep } from '@/features/pos/utils/posSteps'

describe('getStepStatus', () => {
  it('marks the open step as active', () => {
    expect(getStepStatus('review', { openStep: 'review', itemCount: 2, cashIsEnough: false })).toBe(
      'active',
    )
  })

  it('marks every other step as not reached when the cart is empty', () => {
    const state = { openStep: 'items' as const, itemCount: 0, cashIsEnough: false }
    expect(getStepStatus('review', state)).toBe('todo')
    expect(getStepStatus('payment', state)).toBe('todo')
  })

  it('marks Add items as done once there are items and another step is open', () => {
    expect(getStepStatus('items', { openStep: 'review', itemCount: 3, cashIsEnough: false })).toBe(
      'done',
    )
  })

  it('marks Review cart as done when Payment is open', () => {
    expect(
      getStepStatus('review', { openStep: 'payment', itemCount: 3, cashIsEnough: false }),
    ).toBe('done')
  })

  it('marks Payment as done only when the cash is enough', () => {
    expect(getStepStatus('payment', { openStep: 'items', itemCount: 3, cashIsEnough: true })).toBe(
      'done',
    )
    expect(getStepStatus('payment', { openStep: 'items', itemCount: 3, cashIsEnough: false })).toBe(
      'todo',
    )
  })
})

describe('nextStep', () => {
  it('goes items -> review -> payment', () => {
    expect(nextStep('items')).toBe('review')
    expect(nextStep('review')).toBe('payment')
    expect(nextStep('payment')).toBeNull()
  })
})
