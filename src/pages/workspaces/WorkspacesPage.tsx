import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Mail, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { workspaceApi } from '@/entities/workspace/api/workspace-api'
import { useWorkspaceMembersQuery, workspaceKeys } from '@/entities/workspace/model/queries'
import type { Workspace } from '@/entities/workspace/model/types'
import { useAuth } from '@/features/auth/model/useAuth'
import { useWorkspace } from '@/features/workspace/model/useWorkspace'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatDateTime } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

const workspaceSchema = z.object({
  name: z.string().trim().min(1, 'Введите имя workspace').max(128),
  bybitApiKey: z.string().trim().min(1, 'Введите BYBIT_API_KEY'),
  bybitApiSecret: z.string().trim().min(1, 'Введите BYBIT_API_SECRET'),
  bybitP2pAdId: z.string().trim().min(1, 'Введите BYBIT_P2P_AD_ID'),
  receiptEmail: z.string().trim().email('Введите корректный email').or(z.literal('')),
  imapHost: z.string().trim().min(1, 'Введите IMAP host'),
  imapPort: z.number({ error: 'Введите IMAP port' }).int().min(1).max(65535),
  imapUsername: z.string().trim().min(1, 'Введите IMAP username'),
  imapPassword: z.string().min(1, 'Введите IMAP password'),
})

type WorkspaceFormValues = z.infer<typeof workspaceSchema>

const workspaceDefaults: WorkspaceFormValues = {
  name: '',
  bybitApiKey: '',
  bybitApiSecret: '',
  bybitP2pAdId: '',
  receiptEmail: '',
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  imapUsername: '',
  imapPassword: '',
}

function WorkspaceCreateForm() {
  const queryClient = useQueryClient()
  const { selectWorkspace } = useWorkspace()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: workspaceDefaults,
  })

  const createMutation = useMutation({
    mutationFn: (values: WorkspaceFormValues) =>
      workspaceApi.create({
        ...values,
        name: values.name.trim(),
        bybitApiKey: values.bybitApiKey.trim(),
        bybitApiSecret: values.bybitApiSecret.trim(),
        bybitP2pAdId: values.bybitP2pAdId.trim(),
        receiptEmail: values.receiptEmail.trim() || undefined,
        imapHost: values.imapHost.trim(),
        imapUsername: values.imapUsername.trim(),
      }),
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
      selectWorkspace(workspace.publicId)
      reset(workspaceDefaults)
      toast.success(`Workspace ${workspace.name} создан`)
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
    } catch (error) {
      toast.error('Не удалось создать workspace', { description: getErrorMessage(error) })
    }
  })

  return (
    <Card
      className="workspace-form-card"
      title="Новый workspace"
      description="Backend проверит Bybit и IMAP до сохранения"
      icon={<Plus size={17} />}
    >
      <form className="workspace-form" onSubmit={submit} noValidate>
        <label className="form-field">
          <span>Имя</span>
          <input type="text" placeholder="ExPrime" {...register('name')} />
          {errors.name && <small className="form-field__error">{errors.name.message}</small>}
        </label>

        <div className="workspace-form__grid">
          <label className="form-field">
            <span>BYBIT_API_KEY</span>
            <input type="text" autoComplete="off" {...register('bybitApiKey')} />
            {errors.bybitApiKey && (
              <small className="form-field__error">{errors.bybitApiKey.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>BYBIT_API_SECRET</span>
            <input type="password" autoComplete="off" {...register('bybitApiSecret')} />
            {errors.bybitApiSecret && (
              <small className="form-field__error">{errors.bybitApiSecret.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>BYBIT_P2P_AD_ID</span>
            <input type="text" autoComplete="off" {...register('bybitP2pAdId')} />
            {errors.bybitP2pAdId && (
              <small className="form-field__error">{errors.bybitP2pAdId.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>Email для чеков в чате</span>
            <input type="email" autoComplete="email" {...register('receiptEmail')} />
            {errors.receiptEmail && (
              <small className="form-field__error">{errors.receiptEmail.message}</small>
            )}
          </label>
        </div>

        <div className="workspace-form__section-title">
          <Mail size={15} /> IMAP доступ к почте
        </div>
        <div className="workspace-form__grid">
          <label className="form-field">
            <span>IMAP host</span>
            <input type="text" {...register('imapHost')} />
            {errors.imapHost && (
              <small className="form-field__error">{errors.imapHost.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>IMAP port</span>
            <input
              type="number"
              min="1"
              max="65535"
              {...register('imapPort', { valueAsNumber: true })}
            />
            {errors.imapPort && (
              <small className="form-field__error">{errors.imapPort.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>IMAP username</span>
            <input type="text" autoComplete="username" {...register('imapUsername')} />
            {errors.imapUsername && (
              <small className="form-field__error">{errors.imapUsername.message}</small>
            )}
          </label>
          <label className="form-field">
            <span>IMAP password</span>
            <input type="password" autoComplete="new-password" {...register('imapPassword')} />
            {errors.imapPassword && (
              <small className="form-field__error">{errors.imapPassword.message}</small>
            )}
          </label>
        </div>

        <Button
          type="submit"
          icon={<KeyRound size={16} />}
          loading={createMutation.isPending}
          className="workspace-form__submit"
        >
          Создать workspace
        </Button>
      </form>
    </Card>
  )
}

function WorkspaceMembers({ workspace }: { workspace: Workspace }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const membersQuery = useWorkspaceMembersQuery(workspace.publicId)
  const [lookup, setLookup] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const isOwner = workspace.currentUserRole === 'OWNER'

  const addMemberMutation = useMutation({
    mutationFn: (value: string) => workspaceApi.addMember(workspace.publicId, { lookup: value }),
    onSuccess: async () => {
      setLookup('')
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspace.publicId) })
      toast.success('Участник добавлен')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userPublicId: string) =>
      workspaceApi.removeMember(workspace.publicId, userPublicId),
    onSuccess: async () => {
      setMemberToRemove(null)
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspace.publicId) })
      toast.success('Участник удалён')
    },
  })

  const addMember = async () => {
    const value = lookup.trim()
    if (!value) return

    try {
      await addMemberMutation.mutateAsync(value)
    } catch (error) {
      toast.error('Не удалось добавить участника', { description: getErrorMessage(error) })
    }
  }

  const removeMember = async () => {
    if (!memberToRemove) return

    try {
      await removeMemberMutation.mutateAsync(memberToRemove)
    } catch (error) {
      toast.error('Не удалось удалить участника', { description: getErrorMessage(error) })
    }
  }

  return (
    <>
      <Card
        title="Участники"
        description={
          isOwner ? 'Владелец может добавлять и удалять участников' : 'У вас полный рабочий доступ'
        }
        icon={<Users size={17} />}
      >
        {isOwner && (
          <div className="member-invite">
            <input
              type="text"
              value={lookup}
              placeholder="public ID, email или username"
              onChange={(event) => setLookup(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void addMember()
              }}
            />
            <Button
              type="button"
              icon={<UserPlus size={15} />}
              loading={addMemberMutation.isPending}
              onClick={() => void addMember()}
            >
              Добавить
            </Button>
          </div>
        )}

        {membersQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : membersQuery.error ? (
          <ErrorState
            message={getErrorMessage(membersQuery.error)}
            onRetry={() => void membersQuery.refetch()}
          />
        ) : (
          <div className="member-list">
            {(membersQuery.data ?? []).map((member) => (
              <div className="member-row" key={member.userPublicId}>
                <div>
                  <strong>{member.username}</strong>
                  <span>
                    {member.email} · <span className="mono">{member.userPublicId}</span>
                  </span>
                </div>
                <Badge tone={member.role === 'OWNER' ? 'primary' : 'neutral'}>
                  {member.role === 'OWNER' ? 'Владелец' : 'Участник'}
                </Badge>
                {isOwner && member.userPublicId !== user?.publicId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    aria-label={`Удалить ${member.username}`}
                    onClick={() => setMemberToRemove(member.userPublicId)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title="Удалить участника?"
        description={<p>Пользователь потеряет доступ к этому workspace.</p>}
        confirmLabel="Удалить"
        tone="danger"
        loading={removeMemberMutation.isPending}
        onClose={() => setMemberToRemove(null)}
        onConfirm={removeMember}
      />
    </>
  )
}

export function WorkspacesPage() {
  const queryClient = useQueryClient()
  const {
    workspaces,
    selectedWorkspace,
    selectedWorkspaceId,
    selectWorkspace,
    loading,
    error,
    refetchWorkspaces,
  } = useWorkspace()
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (workspacePublicId: string) => workspaceApi.delete(workspacePublicId),
    onSuccess: async () => {
      setWorkspaceToDelete(null)
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
      toast.success('Workspace удалён')
    },
  })

  const deleteWorkspace = async () => {
    if (!workspaceToDelete) return

    try {
      await deleteMutation.mutateAsync(workspaceToDelete.publicId)
    } catch (deleteError) {
      toast.error('Не удалось удалить workspace', { description: getErrorMessage(deleteError) })
    }
  }

  return (
    <>
      <div className="page workspaces-page">
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">Workspace</span>
            <h1>Рабочие пространства</h1>
            <p>Каждое пространство привязано к отдельному Bybit P2P аккаунту.</p>
          </div>
        </div>

        <div className="workspaces-layout">
          <WorkspaceCreateForm />

          <div className="workspaces-layout__main">
            <Card
              title="Доступные workspace"
              description="Выберите пространство для работы с заявками"
              action={<Badge tone="primary">{workspaces.length}</Badge>}
              icon={<Users size={17} />}
            >
              {loading ? (
                <LoadingState rows={4} />
              ) : error ? (
                <ErrorState
                  message={getErrorMessage(error)}
                  onRetry={() => void refetchWorkspaces()}
                />
              ) : workspaces.length === 0 ? (
                <EmptyState
                  title="Workspace пока нет"
                  description="Создайте первое пространство в форме слева."
                />
              ) : (
                <div className="workspace-list">
                  {workspaces.map((workspace) => (
                    <button
                      type="button"
                      key={workspace.publicId}
                      className={
                        workspace.publicId === selectedWorkspaceId
                          ? 'workspace-row is-active'
                          : 'workspace-row'
                      }
                      onClick={() => selectWorkspace(workspace.publicId)}
                    >
                      <span>
                        <strong>{workspace.name}</strong>
                        <small>
                          <span className="mono">{workspace.publicId}</span> · Bybit ad{' '}
                          <span className="mono">{workspace.bybitP2pAdId}</span>
                        </small>
                      </span>
                      <Badge tone={workspace.currentUserRole === 'OWNER' ? 'primary' : 'neutral'}>
                        {workspace.currentUserRole === 'OWNER' ? 'Владелец' : 'Участник'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {selectedWorkspace && (
              <div className="workspace-details-grid">
                <Card
                  title={selectedWorkspace.name}
                  description={`Создан ${formatDateTime(selectedWorkspace.createdAt)}`}
                  icon={<KeyRound size={17} />}
                  action={
                    selectedWorkspace.currentUserRole === 'OWNER' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setWorkspaceToDelete(selectedWorkspace)}
                      >
                        Удалить
                      </Button>
                    ) : undefined
                  }
                >
                  <div className="workspace-facts">
                    <div>
                      <span>Public ID</span>
                      <strong className="mono">{selectedWorkspace.publicId}</strong>
                    </div>
                    <div>
                      <span>Bybit ad</span>
                      <strong className="mono">{selectedWorkspace.bybitP2pAdId}</strong>
                    </div>
                    <div>
                      <span>IMAP</span>
                      <strong>
                        {selectedWorkspace.imapHost}:{selectedWorkspace.imapPort}
                      </strong>
                    </div>
                    <div>
                      <span>Почта</span>
                      <strong>{selectedWorkspace.imapUsername || '-'}</strong>
                    </div>
                    <div>
                      <span>Email для чеков</span>
                      <strong>{selectedWorkspace.receiptEmail || '-'}</strong>
                    </div>
                    <div>
                      <span>Владелец</span>
                      <strong>{selectedWorkspace.ownerUsername}</strong>
                    </div>
                  </div>
                </Card>

                <WorkspaceMembers workspace={selectedWorkspace} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(workspaceToDelete)}
        title="Удалить workspace?"
        description={
          <p>
            Backend сначала снимет объявление Bybit с публикации. Если Bybit вернёт ошибку, удаление
            будет заблокировано.
          </p>
        }
        confirmLabel="Удалить workspace"
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={deleteWorkspace}
      />
    </>
  )
}
