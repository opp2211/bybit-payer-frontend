import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/Button'

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-label="Загрузка">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}

type ErrorProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Не удалось загрузить данные',
  message,
  onRetry,
}: ErrorProps) {
  return (
    <div className="state-box state-box--error">
      <span className="state-box__icon">
        <AlertCircle size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    </div>
  )
}

type EmptyProps = {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyProps) {
  return (
    <div className="state-box state-box--empty">
      <span className="state-box__icon">{icon ?? <Inbox size={21} />}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {action}
      </div>
    </div>
  )
}
