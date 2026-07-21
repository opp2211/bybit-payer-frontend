import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { adminBankApi } from '@/entities/admin-bank/api/admin-bank-api'
import { adminBankKeys, useAdminBanksQuery } from '@/entities/admin-bank/model/queries'
import type { AdminBank, AdminBankPayload } from '@/entities/admin-bank/model/types'
import { useActiveBanksQuery } from '@/entities/bank/model/queries'
import { useAuth } from '@/features/auth/model/useAuth'
import { getErrorMessage } from '@/shared/lib/errors'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

const bankSchema = z.object({
  code: z.string().trim().min(1, 'Введите code').max(32),
  title: z.string().trim().min(1, 'Введите название').max(128),
  enabled: z.boolean(),
  sortOrder: z.number({ error: 'Введите порядок' }).int(),
  aliasesText: z.string(),
})

type BankFormValues = z.infer<typeof bankSchema>

const emptyValues: BankFormValues = {
  code: '',
  title: '',
  enabled: true,
  sortOrder: 100,
  aliasesText: '',
}

function toPayload(values: BankFormValues): AdminBankPayload {
  return {
    code: values.code.trim(),
    title: values.title.trim(),
    enabled: values.enabled,
    sortOrder: values.sortOrder,
    aliases: values.aliasesText
      .split('\n')
      .map((alias) => alias.trim())
      .filter(Boolean),
  }
}

function toFormValues(bank: AdminBank): BankFormValues {
  return {
    code: bank.code,
    title: bank.title,
    enabled: bank.enabled,
    sortOrder: bank.sortOrder,
    aliasesText: bank.aliases.join('\n'),
  }
}

export function AdminBanksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const banksQuery = useAdminBanksQuery(user?.role === 'ADMIN')
  const activeBanksQuery = useActiveBanksQuery()
  const [editingBank, setEditingBank] = useState<AdminBank | null>(null)
  const [bankToDelete, setBankToDelete] = useState<AdminBank | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: emptyValues,
  })

  const banks = useMemo(
    () =>
      [...(banksQuery.data ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
      ),
    [banksQuery.data],
  )

  const saveMutation = useMutation({
    mutationFn: (values: BankFormValues) =>
      editingBank
        ? adminBankApi.update(editingBank.id, toPayload(values))
        : adminBankApi.create(toPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminBankKeys.list() })
      await activeBanksQuery.refetch()
      setEditingBank(null)
      reset(emptyValues)
      toast.success('Банк сохранён')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminBankApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminBankKeys.list() })
      await activeBanksQuery.refetch()
      setBankToDelete(null)
      toast.success('Банк удалён')
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync(values)
    } catch (error) {
      toast.error('Не удалось сохранить банк', { description: getErrorMessage(error) })
    }
  })

  const deleteBank = async () => {
    if (!bankToDelete) return

    try {
      await deleteMutation.mutateAsync(bankToDelete.id)
    } catch (error) {
      toast.error('Не удалось удалить банк', { description: getErrorMessage(error) })
    }
  }

  const startEdit = (bank: AdminBank) => {
    setEditingBank(bank)
    reset(toFormValues(bank))
  }

  const cancelEdit = () => {
    setEditingBank(null)
    reset(emptyValues)
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page admin-banks-page">
        <Card>
          <ErrorState
            title="Доступ закрыт"
            message="Админка доступна только пользователям с ролью ADMIN."
          />
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="page admin-banks-page">
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">Админка</span>
            <h1>Банки</h1>
            <p>Глобальный список банков и aliases для распознавания чеков.</p>
          </div>
        </div>

        <div className="admin-banks-layout">
          <Card
            title={editingBank ? 'Редактировать банк' : 'Новый банк'}
            description="Aliases вводятся по одному на строку"
            icon={editingBank ? <Pencil size={17} /> : <Plus size={17} />}
          >
            <form className="admin-bank-form" onSubmit={submit} noValidate>
              <label className="form-field">
                <span>Code</span>
                <input type="text" placeholder="TINKOFF" {...register('code')} />
                {errors.code && <small className="form-field__error">{errors.code.message}</small>}
              </label>
              <label className="form-field">
                <span>Название</span>
                <input type="text" placeholder="Т-Банк" {...register('title')} />
                {errors.title && (
                  <small className="form-field__error">{errors.title.message}</small>
                )}
              </label>
              <label className="form-field">
                <span>Порядок</span>
                <input type="number" {...register('sortOrder', { valueAsNumber: true })} />
                {errors.sortOrder && (
                  <small className="form-field__error">{errors.sortOrder.message}</small>
                )}
              </label>
              <label className="checkbox-field">
                <input type="checkbox" {...register('enabled')} />
                <span>Активен</span>
              </label>
              <label className="form-field">
                <span>Aliases</span>
                <textarea
                  rows={6}
                  placeholder="Tinkoff&#10;Тинькофф"
                  {...register('aliasesText')}
                />
              </label>
              <div className="admin-bank-form__actions">
                {editingBank && (
                  <Button type="button" variant="ghost" icon={<X size={15} />} onClick={cancelEdit}>
                    Отмена
                  </Button>
                )}
                <Button type="submit" icon={<Save size={15} />} loading={saveMutation.isPending}>
                  Сохранить
                </Button>
              </div>
            </form>
          </Card>

          <Card
            title="Список банков"
            description="Используется при создании заявок и проверке чеков"
            icon={<Building2 size={17} />}
            action={<Badge tone="primary">{banks.length}</Badge>}
          >
            {banksQuery.isLoading ? (
              <LoadingState rows={5} />
            ) : banksQuery.error ? (
              <ErrorState
                message={getErrorMessage(banksQuery.error)}
                onRetry={() => void banksQuery.refetch()}
              />
            ) : banks.length === 0 ? (
              <EmptyState
                title="Банков пока нет"
                description="Добавьте первый банк в форме слева."
              />
            ) : (
              <div className="admin-bank-list">
                {banks.map((bank) => (
                  <div className="admin-bank-row" key={bank.id}>
                    <div>
                      <strong>{bank.title}</strong>
                      <span>
                        <span className="mono">{bank.code}</span> · порядок {bank.sortOrder}
                      </span>
                      {bank.aliases.length > 0 && <small>{bank.aliases.join(', ')}</small>}
                    </div>
                    <Badge tone={bank.enabled ? 'success' : 'neutral'}>
                      {bank.enabled ? 'Активен' : 'Выключен'}
                    </Badge>
                    <div className="admin-bank-row__actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        aria-label={`Редактировать ${bank.title}`}
                        onClick={() => startEdit(bank)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        aria-label={`Удалить ${bank.title}`}
                        onClick={() => setBankToDelete(bank)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(bankToDelete)}
        title="Удалить банк?"
        description={
          <p>Если банк уже используется в заявках, backend вернёт ошибку и не удалит запись.</p>
        }
        confirmLabel="Удалить"
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setBankToDelete(null)}
        onConfirm={deleteBank}
      />
    </>
  )
}
