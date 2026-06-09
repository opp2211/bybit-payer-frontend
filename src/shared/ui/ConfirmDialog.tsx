import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Button } from '@/shared/ui/Button'

type Props = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  loading?: boolean
  tone?: 'primary' | 'danger'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  tone = 'primary',
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [loading, onClose, open])

  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop" role="presentation" onMouseDown={() => !loading && onClose()}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dialog__close"
          aria-label="Закрыть"
          disabled={loading}
          onClick={onClose}
        >
          <X size={19} />
        </button>
        <h2 id="confirm-dialog-title">{title}</h2>
        <div className="dialog__description">{description}</div>
        <div className="dialog__actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Не отменять
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
