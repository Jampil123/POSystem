import { useRef } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  /** Shows a spinner and keeps the dialog open while saving. */
  isPending?: boolean
}

// Confirmation for destructive actions (deactivate, remove, void, ...).
// On phones it slides up from the bottom as a sheet.
// The confirm button gets focus, so Enter confirms and Esc closes (UI guide 6.3).
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent
        className="rounded-xl max-md:top-auto max-md:bottom-0 max-md:max-w-full max-md:translate-y-0 max-md:rounded-b-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          confirmRef.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            ref={confirmRef}
            variant="destructive"
            className="h-12"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
