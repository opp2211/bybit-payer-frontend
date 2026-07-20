import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, Building2, Info, Phone, Send, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useActiveBanksQuery } from '@/entities/bank/model/queries'
import { useSystemStatusQuery } from '@/entities/system/model/queries'
import { useCreateWithdrawal } from '@/features/create-withdrawal/model/useCreateWithdrawal'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatNumber, formatRub } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const phoneIsValid = (value: string) => {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  return /^7\d{10}$/.test(normalized)
}

const schema = z.object({
  amountRub: z
    .number({ error: 'Введите сумму' })
    .int('Сумма должна быть целым числом')
    .positive('Сумма должна быть больше нуля'),
  recipientPhone: z
    .string()
    .trim()
    .min(1, 'Введите номер телефона')
    .refine(phoneIsValid, 'Введите российский номер из 11 цифр'),
  recipientBank: z.string().trim().min(1, 'Выберите банк'),
  recipientName: z.string().trim().min(2, 'Введите имя получателя').max(120, 'Имя слишком длинное'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  workspacePublicId: string
}

export function CreateWithdrawalForm({ workspacePublicId }: Props) {
  const mutation = useCreateWithdrawal(workspacePublicId)
  const banksQuery = useActiveBanksQuery()
  const systemQuery = useSystemStatusQuery(workspacePublicId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipientPhone: '',
      recipientBank: '',
      recipientName: '',
    },
  })

  const banks = banksQuery.data ?? []
  const banksUnavailable = banksQuery.isPending || banksQuery.isError || banks.length === 0

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await mutation.mutateAsync({
        ...values,
        recipientName: values.recipientName.trim(),
        recipientPhone: values.recipientPhone.trim(),
      })
      reset()
      toast.success(`Заявка ${created.publicId} создана`, {
        description:
          created.status === 'QUEUED'
            ? 'Заявка добавлена в очередь.'
            : 'Сумма передана в обработку.',
      })
    } catch (error) {
      toast.error('Не удалось создать заявку', {
        description: getErrorMessage(error),
      })
    }
  })

  const status = systemQuery.data
  const rangeText =
    status?.currentMinRub != null && status.currentMaxRub != null
      ? `${formatRub(status.currentMinRub)} - ${formatRub(status.currentMaxRub)}`
      : 'рассчитывается после синхронизации'

  return (
    <Card
      className="create-form-card"
      title="Новая выплата"
      description="Создайте заявку в текущем workspace"
      icon={<Send size={17} />}
    >
      <form className="create-form" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="amountRub">Сумма выплаты</label>
          <div className="input-shell">
            <Banknote size={17} />
            <input
              id="amountRub"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="10000"
              aria-invalid={Boolean(errors.amountRub)}
              {...register('amountRub', { valueAsNumber: true })}
            />
            <span className="input-shell__suffix">RUB</span>
          </div>
          {errors.amountRub ? (
            <span className="form-field__error">{errors.amountRub.message}</span>
          ) : (
            <span className="form-field__hint">Текущий диапазон: {rangeText}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="recipientPhone">Телефон получателя</label>
          <div className="input-shell">
            <Phone size={17} />
            <input
              id="recipientPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (919) 121-21-23"
              aria-invalid={Boolean(errors.recipientPhone)}
              {...register('recipientPhone')}
            />
          </div>
          {errors.recipientPhone && (
            <span className="form-field__error">{errors.recipientPhone.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="recipientName">Имя получателя</label>
          <div className="input-shell">
            <UserRound size={17} />
            <input
              id="recipientName"
              type="text"
              autoComplete="name"
              placeholder="Кирилл М."
              aria-invalid={Boolean(errors.recipientName)}
              {...register('recipientName')}
            />
          </div>
          {errors.recipientName ? (
            <span className="form-field__error">{errors.recipientName.message}</span>
          ) : (
            <span className="form-field__hint">Имя будет сверено с PDF-чеком</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="recipientBank">Банк получателя</label>
          <div className="input-shell input-shell--select">
            <Building2 size={17} />
            <select
              id="recipientBank"
              aria-invalid={Boolean(errors.recipientBank)}
              disabled={banksUnavailable}
              {...register('recipientBank')}
            >
              <option value="">
                {banksQuery.isPending
                  ? 'Загрузка банков...'
                  : banksQuery.isError
                    ? 'Не удалось загрузить банки'
                    : banks.length === 0
                      ? 'Нет доступных банков'
                      : 'Выберите банк'}
              </option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.title}
                </option>
              ))}
            </select>
          </div>
          {banksQuery.isError ? (
            <span className="form-field__error">
              {getErrorMessage(banksQuery.error)}{' '}
              <button
                type="button"
                className="form-field__retry"
                onClick={() => void banksQuery.refetch()}
              >
                Повторить
              </button>
            </span>
          ) : errors.recipientBank ? (
            <span className="form-field__error">{errors.recipientBank.message}</span>
          ) : banks.length === 0 && !banksQuery.isPending ? (
            <span className="form-field__hint">На backend нет активных банков</span>
          ) : (
            <span className="form-field__hint">Список загружается с backend</span>
          )}
        </div>

        <div className="form-note">
          <Info size={16} />
          <div>
            <span>
              Доступный баланс:{' '}
              <strong>
                {status?.availableUsdtBalance == null
                  ? '-'
                  : `${formatNumber(status.availableUsdtBalance)} USDT`}
              </strong>
            </span>
            <span>
              В рублях: <strong>{formatRub(status?.availableRubBalance)}</strong>
            </span>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="create-form__submit"
          loading={mutation.isPending}
          disabled={banksUnavailable}
          icon={<Send size={17} />}
        >
          Создать заявку
        </Button>
      </form>
    </Card>
  )
}
