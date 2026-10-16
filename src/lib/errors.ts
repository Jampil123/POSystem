// Message to show in a toast for an error thrown by an api.ts function.
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error && error.message ? error.message : fallback
}
