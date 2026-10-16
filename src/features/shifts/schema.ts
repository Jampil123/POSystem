import { z } from 'zod'
import { moneyField } from '@/lib/formFields'

export const openShiftSchema = z.object({
  starting_cash: moneyField('Enter the starting cash in the drawer.'),
})

export type OpenShiftInput = z.input<typeof openShiftSchema>
export type OpenShiftValues = z.output<typeof openShiftSchema>

export const closeShiftSchema = z.object({
  actual_cash: moneyField('Enter the cash counted in the drawer.'),
})

export type CloseShiftInput = z.input<typeof closeShiftSchema>
export type CloseShiftValues = z.output<typeof closeShiftSchema>
