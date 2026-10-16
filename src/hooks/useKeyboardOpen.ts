import { useSyncExternalStore } from 'react'

// True on touch screens while a text field is focused, which is when the
// on-screen keyboard is showing. The bottom navigation and the POS summary bar
// hide then, so they never cover the field being typed in.

function isTextField(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.isContentEditable || element instanceof HTMLTextAreaElement) return true
  if (!(element instanceof HTMLInputElement)) return false
  return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file'].includes(
    element.type,
  )
}

function subscribe(onChange: () => void) {
  document.addEventListener('focusin', onChange)
  document.addEventListener('focusout', onChange)
  return () => {
    document.removeEventListener('focusin', onChange)
    document.removeEventListener('focusout', onChange)
  }
}

function snapshot(): boolean {
  return window.matchMedia('(pointer: coarse)').matches && isTextField(document.activeElement)
}

export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
