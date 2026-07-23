import { zodResolver } from '@hookform/resolvers/zod'
import {
  Banknote,
  Building2,
  CreditCard,
  FileText,
  Hash,
  Info,
  Landmark,
  Phone,
  Send,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch, type Resolver, type UseFormRegister } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useActiveBanksQuery } from '@/entities/bank/model/queries'
import { useSystemStatusQuery } from '@/entities/system/model/queries'
import { formatWithdrawalAmountRange } from '@/entities/withdrawal/lib/amounts'
import { useWithdrawalAdvertisementPreviewQuery } from '@/entities/withdrawal/model/queries'
import {
  payerBankTypeLabels,
  withdrawalMethodLabels,
  type CreateWithdrawalRequest,
  type PayerBankType,
  type WithdrawalAdvertisementPreview,
  type WithdrawalAmountMode,
  type WithdrawalMethod,
} from '@/entities/withdrawal/model/types'
import { useCreateWithdrawal } from '@/features/create-withdrawal/model/useCreateWithdrawal'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatNumber, formatRub } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const payerBankTypeValues = ['TBANK_AUTO', 'SBERBANK', 'ANY_BANK'] as const
const amountModeValues = ['FIXED', 'RANGE'] as const
const withdrawalMethodValues = ['SBP', 'CARD_NUMBER', 'ACCOUNT_NUMBER'] as const

const amountModeOptions = [
  { value: 'FIXED', label: 'Фиксированная сумма' },
  { value: 'RANGE', label: 'Диапазон' },
] satisfies Array<{ value: WithdrawalAmountMode; label: string }>

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

const emptyNumberToUndefined = (value: unknown) =>
  typeof value === 'number' && Number.isNaN(value) ? undefined : value

const optionalIntegerAmountSchema = z.preprocess(
  emptyNumberToUndefined,
  z
    .number()
    .int('Сумма должна быть целым числом')
    .positive('Сумма должна быть больше нуля')
    .optional(),
)

const schema = z
  .object({
    amountMode: z.enum(amountModeValues),
    amountRub: optionalIntegerAmountSchema,
    amountMinRub: optionalIntegerAmountSchema,
    amountMaxRub: optionalIntegerAmountSchema,
    payerBankType: z.enum(payerBankTypeValues),
    requireSenderFirstParty: z.boolean(),
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
    if (values.amountMode === 'FIXED') {
      if (values.amountRub == null) {
        ctx.addIssue({ code: 'custom', path: ['amountRub'], message: 'Введите сумму' })
      }
    } else {
      if (values.amountMinRub == null) {
        ctx.addIssue({ code: 'custom', path: ['amountMinRub'], message: 'Введите минимум' })
      }
      if (values.amountMaxRub == null) {
        ctx.addIssue({ code: 'custom', path: ['amountMaxRub'], message: 'Введите максимум' })
      }
      if (
        values.amountMinRub != null &&
        values.amountMaxRub != null &&
        values.amountMaxRub <= values.amountMinRub
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountMaxRub'],
          message: 'Максимум должен быть больше минимума',
        })
      }
    }

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
        ctx.addIssue({
          code: 'custom',
          path: ['recipientPhone'],
          message: 'Введите номер телефона',
        })
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

const isValidIntegerAmount = (value: number | undefined) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

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
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      amountMode: 'FIXED',
      amountRub: undefined,
      amountMinRub: undefined,
      amountMaxRub: undefined,
      recipientPhone: '',
      recipientBank: '',
      recipientName: '',
      recipientCardNumber: '',
      recipientAccountNumber: '',
      recipientCardTbank: false,
      thirdPartyTransfer: true,
      payerBankType: 'TBANK_AUTO',
      requireSenderFirstParty: false,
      withdrawalMethod: 'SBP',
    },
  })

  const amountMode = useWatch({ control, name: 'amountMode' })
  const amountRub = useWatch({ control, name: 'amountRub' })
  const amountMinRub = useWatch({ control, name: 'amountMinRub' })
  const amountMaxRub = useWatch({ control, name: 'amountMaxRub' })
  const payerBankType = useWatch({ control, name: 'payerBankType' })
  const requireSenderFirstParty = useWatch({ control, name: 'requireSenderFirstParty' })
  const withdrawalMethod = useWatch({ control, name: 'withdrawalMethod' })
  const thirdPartyTransfer = useWatch({ control, name: 'thirdPartyTransfer' })
  const recipientCardTbank = useWatch({ control, name: 'recipientCardTbank' })
  const previousAmountModeRef = useRef<WithdrawalAmountMode>(amountMode)
  const withdrawalMethodOptions = withdrawalMethodOptionsByPayerBank[payerBankType]
  const methodLocked = withdrawalMethodOptions.length === 1
  const banks = banksQuery.data ?? []
  const banksUnavailable = banksQuery.isPending || banksQuery.isError || banks.length === 0
  const requiresRecipientBank = withdrawalMethod === 'SBP'
  const status = systemQuery.data
  const currentAdRangeText =
    status?.currentMinRub != null && status.currentMaxRub != null
      ? `${formatRub(status.currentMinRub)} - ${formatRub(status.currentMaxRub)}`
      : 'рассчитывается после синхронизации'

  useEffect(() => {
    if (previousAmountModeRef.current === amountMode) return
    setValue('amountRub', undefined, { shouldDirty: true, shouldValidate: true })
    setValue('amountMinRub', undefined, { shouldDirty: true, shouldValidate: true })
    setValue('amountMaxRub', undefined, { shouldDirty: true, shouldValidate: true })
    previousAmountModeRef.current = amountMode
  }, [amountMode, setValue])

  const previewPayload = useMemo<CreateWithdrawalRequest | null>(() => {
    const fixedMode = amountMode === 'FIXED'
    const rangeMode = amountMode === 'RANGE'
    if (fixedMode && !isValidIntegerAmount(amountRub)) return null
    if (
      rangeMode &&
      (!isValidIntegerAmount(amountMinRub) ||
        !isValidIntegerAmount(amountMaxRub) ||
        amountMaxRub! <= amountMinRub!)
    ) {
      return null
    }

    return {
      amountMode,
      amountRub: fixedMode ? amountRub! : null,
      amountMinRub: rangeMode ? amountMinRub! : null,
      amountMaxRub: rangeMode ? amountMaxRub! : null,
      payerBankType,
      requireSenderFirstParty: Boolean(requireSenderFirstParty),
      withdrawalMethod,
      thirdPartyTransfer: Boolean(thirdPartyTransfer),
      recipientCardTbank: withdrawalMethod === 'CARD_NUMBER' && Boolean(recipientCardTbank),
      recipientPhone: '',
      recipientBank: '',
      recipientName: '',
      recipientCardNumber: '',
      recipientAccountNumber: '',
    }
  }, [
    amountMaxRub,
    amountMinRub,
    amountMode,
    amountRub,
    payerBankType,
    recipientCardTbank,
    requireSenderFirstParty,
    thirdPartyTransfer,
    withdrawalMethod,
  ])
  const previewQuery = useWithdrawalAdvertisementPreviewQuery(
    workspacePublicId,
    previewPayload,
    status?.currentRate,
  )

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
      const fixedMode = values.amountMode === 'FIXED'
      const created = await mutation.mutateAsync({
        amountMode: values.amountMode,
        amountRub: fixedMode ? values.amountRub! : null,
        amountMinRub: fixedMode ? null : values.amountMinRub!,
        amountMaxRub: fixedMode ? null : values.amountMaxRub!,
        payerBankType: values.payerBankType,
        requireSenderFirstParty: values.requireSenderFirstParty,
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

        <label className="form-checkbox">
          <input type="checkbox" {...register('requireSenderFirstParty')} />
          <span>Требовать 1 лицо от отправителя</span>
        </label>

        <fieldset className="form-field payer-bank-field">
          <legend>
            <Banknote size={14} />
            Диапазон заявки
          </legend>
          <div
            className="payer-bank-toggle amount-mode-toggle"
            role="radiogroup"
            aria-label="Диапазон заявки"
          >
            {amountModeOptions.map((option) => (
              <label key={option.value} className="payer-bank-toggle__option">
                <input type="radio" value={option.value} {...register('amountMode')} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.amountMode && <span className="form-field__error">{errors.amountMode.message}</span>}
        </fieldset>

        {amountMode === 'FIXED' ? (
          <div className="form-field">
            <label htmlFor="amountRub">Сумма заявки</label>
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
              <span className="form-field__hint">Диапазон объявления: {currentAdRangeText}</span>
            )}
          </div>
        ) : (
          <div className="form-field">
            <label>Диапазон заявки</label>
            <div className="amount-range-grid">
              <div className="form-field">
                <div className="input-shell">
                  <Banknote size={17} />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="20000"
                    aria-label="Минимальная сумма заявки"
                    aria-invalid={Boolean(errors.amountMinRub)}
                    {...register('amountMinRub', { valueAsNumber: true })}
                  />
                  <span className="input-shell__suffix">MIN</span>
                </div>
                {errors.amountMinRub && (
                  <span className="form-field__error">{errors.amountMinRub.message}</span>
                )}
              </div>
              <div className="form-field">
                <div className="input-shell">
                  <Banknote size={17} />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="25000"
                    aria-label="Максимальная сумма заявки"
                    aria-invalid={Boolean(errors.amountMaxRub)}
                    {...register('amountMaxRub', { valueAsNumber: true })}
                  />
                  <span className="input-shell__suffix">MAX</span>
                </div>
                {errors.amountMaxRub && (
                  <span className="form-field__error">{errors.amountMaxRub.message}</span>
                )}
              </div>
            </div>
            {!errors.amountMinRub && !errors.amountMaxRub && (
              <span className="form-field__hint">Диапазон объявления: {currentAdRangeText}</span>
            )}
          </div>
        )}

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

        {previewPayload && (
          <AdvertisementPreviewBlock
            error={previewQuery.error}
            isLoading={previewQuery.isPending}
            isRefreshing={previewQuery.isFetching && !previewQuery.isPending}
            preview={previewQuery.data}
          />
        )}

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

type AdvertisementPreviewBlockProps = {
  preview?: WithdrawalAdvertisementPreview
  isLoading: boolean
  isRefreshing: boolean
  error: unknown
}

function AdvertisementPreviewBlock({
  preview,
  isLoading,
  isRefreshing,
  error,
}: AdvertisementPreviewBlockProps) {
  const rateText =
    preview?.rate == null ? formatNumber(null) : `${formatNumber(preview.rate)} RUB/USDT`
  const quantityText =
    preview?.quantityUsdt == null
      ? formatNumber(null)
      : `${formatNumber(preview.quantityUsdt)} USDT`
  const adRangeText =
    preview == null ? formatNumber(null) : formatWithdrawalAmountRange(preview.minRub, preview.maxRub)
  const requestRangeText =
    preview == null
      ? formatNumber(null)
      : preview.amountMinRub === preview.amountMaxRub
        ? formatRub(preview.amountMinRub)
        : formatWithdrawalAmountRange(preview.amountMinRub, preview.amountMaxRub)

  return (
    <section className="ad-preview" aria-live="polite">
      <header className="ad-preview__header">
        <span>
          <FileText size={16} />
          Превью объявления
        </span>
        {isRefreshing && <small>Обновляем...</small>}
      </header>

      {isLoading ? (
        <p className="ad-preview__state">Формируем превью...</p>
      ) : error ? (
        <p className="ad-preview__state ad-preview__state--error">
          Не удалось сформировать превью: {getErrorMessage(error)}
        </p>
      ) : preview ? (
        <>
          <dl className="ad-preview__metrics">
            <div>
              <dt>Курс</dt>
              <dd>{rateText}</dd>
            </div>
            <div>
              <dt>Диапазон объявления</dt>
              <dd>{adRangeText}</dd>
            </div>
            <div>
              <dt>Диапазон заявки</dt>
              <dd>{requestRangeText}</dd>
            </div>
            <div>
              <dt>Объем USDT</dt>
              <dd>{quantityText}</dd>
            </div>
          </dl>
          <div className="ad-preview__description">
            <span>Описание</span>
            <p>{preview.description}</p>
          </div>
        </>
      ) : (
        <p className="ad-preview__state">Превью пока недоступно.</p>
      )}
    </section>
  )
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
