import clsx from 'clsx'
import { Copy } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { toast } from 'sonner'

import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'> & {
  value: string
  children: ReactNode
  successMessage?: string
}

export function CopyValue({
  value,
  children,
  successMessage = 'Значение скопировано',
  className,
  ...props
}: Props) {
  const copy = async () => {
    try {
      await copyToClipboard(value)
      toast.success(successMessage)
    } catch {
      toast.error('Не удалось скопировать значение')
    }
  }

  return (
    <button
      type="button"
      className={clsx('copy-value', className)}
      title="Скопировать"
      onClick={() => void copy()}
      {...props}
    >
      <span>{children}</span>
      <Copy size={14} />
    </button>
  )
}
