import clsx from 'clsx'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  tone?: 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger'
  className?: string
}>

export function Badge({ tone = 'neutral', className, children }: Props) {
  return <span className={clsx('badge', `badge--${tone}`, className)}>{children}</span>
}
