import { useEffect, useEffectEvent } from 'react'

/** Key name (KeyboardEvent.key, e.g. "F1") -> what to do. */
export type ShortcutMap = Partial<Record<string, () => void>>

// Desktop keyboard shortcuts (UI guide section 6.3). Enter and Esc in dialogs
// are handled by the dialogs themselves.
// Shortcuts are ignored while a dialog is open, so they never act behind it.
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    const action = shortcuts[event.key]
    if (!action) return
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
    // F1 would otherwise open the browser's help page.
    event.preventDefault()
    action()
  })

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [enabled])
}
