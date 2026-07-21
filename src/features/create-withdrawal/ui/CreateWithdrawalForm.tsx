import { zodResolver } from '@hookform/resolvers/zod'
import {
  Banknote,
  Building2,
  CreditCard,
  Hash,
  Info,
  Landmark,
  Phone,
  Send,
  UserRound,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch, type UseFormRegister } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useActiveBanksQuery } from '@/entities/bank/model/queries'
import { useSystemStatusQuery } from '@/entities/system/model/queries'
import {
  payerBankTypeLabels,
  withdrawalMethodLabels,
  type PayerBankType,
  type WithdrawalMethod,
} from '@/entities/withdrawal/model/types'
import { useCreateWithdrawal } from '@/features/create-withdrawal/model/useCreateWithdrawal'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatNumber, formatRub } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const payerBankTypeValues = ['TBANK_AUTO', 'SBERBANK', 'ANY_BANK'] as const
const withdrawalMethodValues = ['SBP', 'CARD_NUMBER', 'ACCOUNT_NUMBER'] as const

const payerBankTypeOptions = payerBankTypeValues.map((value) => ({
  value,
  label: payerBankTypeLabels[value],
})) satisfies Array<{ value: PayerBankType; label: string }>

const withdrawalMethodOptionsByPayerBank: Record<PayerBankType, readonly WithdrawalMethod[]> = {
  TBANK_AUTO: ['SBP', 'CARD_NUMBER'],
  SBERBANK: ['ACCOUNT_NUMBER'],
  ANY_BANK: ['SBP'],
}

const phoneIsValid = (value: string) => {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  return /^7\d{10}$/.test(normalized)
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const schema = z
  .object({
    amountRub: z
      .number({ error: 'Введите сумму' })
      .int('Сумма должна быть целым числом')
      .positive('Сумма должна быть больше нуля'),
    payerBankType: z.enum(payerBankTypeValues),
    withdrawalMethod: z.enum(withdrawalMethodValues),
    thirdPartyTransfer: z.boolean(),
    recipientPhone: z.string().trim(),
    recipientBank: z.string().trim(),
    recipientName: z.string().trim().max(120, 'Имя слишком длинное'),
    recipientCardNumber: z.string().trim(),
    recipientAccountNumber: z.string().trim(),
    recipientCardTbank: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const allowedMethods = withdrawalMethodOptionsByPayerBank[values.payerBankType]
    if (!allowedMethods.includes(values.withdrawalMethod)) {
      ctx.addIssue({
        code: 'custom',
        path: ['withdrawalMethod'],
        message: 'Метод недоступен для выбранного банка отправителя',
      })
      return
    }

    if (values.withdrawalMethod === 'SBP') {
      if (!values.recipientPhone) {
        ctx.addIssue({ code: 'custom', path: ['recipientPhone'], message: 'Введите номер телефона' })
      } else if (!phoneIsValid(values.recipientPhone)) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientPhone'],
          message: 'Введите российский номер из 11 цифр',
        })
      }
      if (!values.recipientBank) {
        ctx.addIssue({ code: 'custom', path: ['recipientBank'], message: 'Выберите банк' })
      }
      if (values.recipientName.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientName'],
          message: 'Введите имя получателя',
        })
      }
      return
    }

    if (values.withdrawalMethod === 'CARD_NUMBER') {
      if (digitsOnly(values.recipientCardNumber).length !== 16) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientCardNumber'],
          message: 'Введите 16 цифр номера карты',
        })
      }
      if (values.recipientCardTbank && values.recipientName.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['recipientName'],
          message: 'Введите имя получателя',
        })
      }
      return
    }

    if (digitsOnly(values.recipientAccountNumber).length !== 20) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipientAccountNumber'],
        message: 'Введите 20 цифр номера счета',
      })
    }
    if (values.recipientName.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipientName'],
        message: 'Введите имя получателя',
      })
    }
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
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipientPhone: '',
      recipientBank: '',
      recipientName: '',
      recipientCardNumber: '',
      recipientAccountNumber: '',
      recipientCardTbank: false,
      thirdPartyTransfer: true,
      payerBankType: 'TBANK_AUTO',
      withdrawalMethod: 'SBP',
    },
  })

  const payerBankType = useWatch({ control, name: 'payerBankType' })
  const withdrawalMethod = useWatch({ control, name: 'withdrawalMethod' })
  const recipientCardTbank = useWatch({ control, name: 'recipientCardTbank' })
  const withdrawalMethodOptions = withdrawalMethodOptionsByPayerBank[payerBankType]
  const methodLocked = withdrawalMethodOptions.length === 1
  const banks = banksQuery.data ?? []
  const banksUnavailable = banksQuery.isPending || banksQuery.isError || banks.length === 0
  const requiresRecipientBank = withdrawalMethod === 'SBP'

  useEffect(() => {
    if (!withdrawalMethodOptions.includes(withdrawalMethod)) {
      setValue('withdrawalMethod', withdrawalMethodOptions[0], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [setValue, withdrawalMethod, withdrawalMethodOptions])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const isSbp = values.withdrawalMethod === 'SBP'
      const isCard = values.withdrawalMethod === 'CARD_NUMBER'
      const isAccount = values.withdrawalMethod === 'ACCOUNT_NUMBER'
      const created = await mutation.mutateAsync({
        amountRub: values.amountRub,
        payerBankType: values.payerBankType,
        withdrawalMethod: values.withdrawalMethod,
        thirdPartyTransfer: values.thirdPartyTransfer,
        recipientCardTbank: isCard ? values.recipientCardTbank : false,
        recipientPhone: isSbp ? values.recipientPhone.trim() : '',
        recipientBank: isSbp ? values.recipientBank : '',
        recipientName:
          isSbp || isAccount || (isCard && values.recipientCardTbank)
            ? values.recipientName.trim()
            : '',
        recipientCardNumber: isCard ? digitsOnly(values.recipientCardNumber) : '',
        recipientAccountNumber: isAccount ? digitsOnly(values.recipientAccountNumber) : '',
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
      title="Новая заявка"
      description="Условия объявления и реквизиты получателя"
      icon={<Send size={17} />}
    >
      <form className="create-form" onSubmit={onSubmit} noValidate>
        <fieldset className="form-field payer-bank-field">
          <legend>
            <Landmark size={14} />
            Банк отправителя
          </legend>
          <div className="payer-bank-toggle" role="radiogroup" aria-label="Банк отправителя">
            {payerBankTypeOptions.map((option) => (
              <label key={option.value} className="payer-bank-toggle__option">
                <input type="radio" value={option.value} {...register('payerBankType')} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.payerBankType && (
            <span className="form-field__error">{errors.payerBankType.message}</span>
          )}
        </fieldset>

        <div className="form-field">
          <label htmlFor="amountRub">Сумма</label>
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
            <span className="form-field__hint">Диапазон объявления: {rangeText}</span>
          )}
        </div>

        <fieldset className="form-field payer-bank-field">
          <legend>
            <CreditCard size={14} />
            Метод вывода
          </legend>
          <div
            className="payer-bank-toggle withdrawal-method-toggle"
            role="radiogroup"
            aria-label="Метод вывода"
          >
            {withdrawalMethodOptions.map((value) => (
              <label key={value} className="payer-bank-toggle__option">
                <input
                  type="radio"
                  value={value}
                  disabled={methodLocked}
                  {...register('withdrawalMethod')}
                />
                <span>{withdrawalMethodLabels[value]}</span>
              </label>
            ))}
          </div>
          {errors.withdrawalMethod && (
            <span className="form-field__error">{errors.withdrawalMethod.message}</span>
          )}
        </fieldset>

        <label className="form-checkbox">
          <input type="checkbox" {...register('thirdPartyTransfer')} />
          <span>Перевод на 3 лицо</span>
        </label>

        {withdrawalMethod === 'SBP' && (
          <>
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

            <RecipientNameField
              register={register}
              error={errors.recipientName?.message}
              hint="Как указано в реквизитах получателя"
            />

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
                <span className="form-field__hint">Нет активных банков для выбора</span>
              ) : (
                <span className="form-field__hint">Банк для входящего платежа по СБП</span>
              )}
            </div>
          </>
        )}

        {withdrawalMethod === 'CARD_NUMBER' && (
          <>
            <div className="form-field">
              <label htmlFor="recipientCardNumber">Номер карты</label>
              <div className="input-shell">
                <CreditCard size={17} />
                <input
                  id="recipientCardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="2200 0000 0000 1234"
                  aria-invalid={Boolean(errors.recipientCardNumber)}
                  {...register('recipientCardNumber')}
                />
              </div>
              {errors.recipientCardNumber ? (
                <span className="form-field__error">{errors.recipientCardNumber.message}</span>
              ) : (
                <span className="form-field__hint">Пробелы и дефисы можно вводить свободно</span>
              )}
            </div>

            <label className="form-checkbox">
              <input type="checkbox" {...register('recipientCardTbank')} />
              <span>Карта Т-банка</span>
            </label>

            {recipientCardTbank && (
              <RecipientNameField
                register={register}
                error={errors.recipientName?.message}
                hint="В чеке Т-банка обычно формат «Имя Ф.»"
              />
            )}
          </>
        )}

        {withdrawalMethod === 'ACCOUNT_NUMBER' && (
          <>
            <div className="form-field">
              <label htmlFor="recipientAccountNumber">Номер счета</label>
              <div className="input-shell">
                <Hash size={17} />
                <input
                  id="recipientAccountNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="4081 7810 0999 1000 4312"
                  aria-invalid={Boolean(errors.recipientAccountNumber)}
                  {...register('recipientAccountNumber')}
                />
              </div>
              {errors.recipientAccountNumber ? (
                <span className="form-field__error">{errors.recipientAccountNumber.message}</span>
              ) : (
                <span className="form-field__hint">Пробелы и дефисы можно вводить свободно</span>
              )}
            </div>

            <RecipientNameField
              register={register}
              error={errors.recipientName?.message}
              hint="Для сверки с переводом Сбер-Сбер"
            />
          </>
        )}

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
          disabled={requiresRecipientBank && banksUnavailable}
          icon={<Send size={17} />}
        >
          Создать заявку
        </Button>
      </form>
    </Card>
  )
}

type RecipientNameFieldProps = {
  register: UseFormRegister<FormValues>
  error?: string
  hint: string
}

function RecipientNameField({ register, error, hint }: RecipientNameFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor="recipientName">Имя получателя</label>
      <div className="input-shell">
        <UserRound size={17} />
        <input
          id="recipientName"
          type="text"
          autoComplete="name"
          placeholder="Кирилл М."
          aria-invalid={Boolean(error)}
          {...register('recipientName')}
        />
      </div>
      {error ? (
        <span className="form-field__error">{error}</span>
      ) : (
        <span className="form-field__hint">{hint}</span>
      )}
    </div>
  )
}
