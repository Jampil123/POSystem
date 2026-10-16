export const shiftKeys = {
  all: ['shifts'] as const,
  current: (userId: string | undefined) => ['shifts', 'current', userId] as const,
  sales: (shiftId: number) => ['shifts', 'sales', shiftId] as const,
  list: ['shifts', 'list'] as const,
}
