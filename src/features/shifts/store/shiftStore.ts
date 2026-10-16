// The open shift is data saved in the database, so it is loaded with TanStack
// Query (useCurrentShift in hooks/useShifts.ts) instead of a Zustand store.
// This keeps one source of truth: closing a shift on any page locks the POS.
// The file is kept for the folder structure in the development plan.
export {}
