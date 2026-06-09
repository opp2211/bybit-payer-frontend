import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLElement> & {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function Card({ title, description, action, icon, className, children, ...props }: Props) {
  return (
    <section className={clsx('card', className)} {...props}>
      {(title || description || action) && (
        <header className="card__header">
          <div className="card__heading">
            {icon && <span className="card__icon">{icon}</span>}
            <div>
              {title && <h2>{title}</h2>}
              {description && <p>{description}</p>}
            </div>
          </div>
          {action && <div className="card__action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
