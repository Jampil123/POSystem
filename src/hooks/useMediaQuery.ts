import { useSyncExternalStore } from 'react'

// True when a CSS media query matches, e.g. useMediaQuery('(min-width: 1024px)').
// Updates when the window is resized or the device is rotated.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
