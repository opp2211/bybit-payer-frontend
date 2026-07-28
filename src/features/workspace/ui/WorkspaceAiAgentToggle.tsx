import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Bot } from 'lucide-react'
import { toast } from 'sonner'

import { workspaceApi } from '@/entities/workspace/api/workspace-api'
import { workspaceKeys } from '@/entities/workspace/model/queries'
import type { Workspace } from '@/entities/workspace/model/types'
import { getErrorMessage } from '@/shared/lib/errors'

type Props = {
  workspace: Workspace
  className?: string
}

export function WorkspaceAiAgentToggle({ workspace, className }: Props) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => workspaceApi.updateAiChatAgent(workspace.publicId, enabled),
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData<Workspace[]>(workspaceKeys.list(), (current) =>
        current?.map((item) =>
          item.publicId === updatedWorkspace.publicId ? updatedWorkspace : item,
        ),
      )
      toast.success(updatedWorkspace.aiChatAgentEnabled ? 'ИИ-агент включён' : 'ИИ-агент выключен')
    },
  })

  const toggle = async () => {
    try {
      await mutation.mutateAsync(!workspace.aiChatAgentEnabled)
    } catch (error) {
      toast.error('Не удалось изменить настройку ИИ-агента', {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <div className={clsx('workspace-ai-agent-toggle', className)}>
      <span className="workspace-ai-agent-toggle__icon">
        <Bot size={18} />
      </span>
      <span className="workspace-ai-agent-toggle__copy">
        <strong>ИИ-агент</strong>
        <small>
          {workspace.aiChatAgentEnabled
            ? 'Новые ордера будет вести ИИ-агент'
            : 'В новых ордерах реквизиты отправятся сразу'}
        </small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={workspace.aiChatAgentEnabled}
        aria-label="ИИ-агент для новых ордеров"
        className="workspace-ai-agent-toggle__switch"
        disabled={mutation.isPending}
        onClick={() => void toggle()}
      >
        <span>{workspace.aiChatAgentEnabled ? 'Включён' : 'Выключен'}</span>
        <span className="workspace-ai-agent-toggle__track" aria-hidden="true">
          <span className="workspace-ai-agent-toggle__thumb" />
        </span>
      </button>
    </div>
  )
}
