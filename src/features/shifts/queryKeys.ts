export const shiftKeys = {
  all: ['shifts'] as const,
  current: (userId: string | undefined) => ['shifts', 'current', userId] as const,
  cash: (shiftId: number) => ['shifts', 'cash', shiftId] as const,
  list: ['shifts', 'list'] as const,
}
