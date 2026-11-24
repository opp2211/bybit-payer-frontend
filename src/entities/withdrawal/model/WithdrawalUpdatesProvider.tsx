import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ContextType, type PropsWithChildren } from 'react'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { WithdrawalUpdate } from '@/entities/withdrawal/model/types'
import { WithdrawalUpdatesContext } from '@/entities/withdrawal/model/withdrawal-updates-context'

const RECONNECT_DELAY = 10_000
const HEARTBEAT_TIMEOUT = 45_000
const UPDATE_BATCH_DELAY = 75

const COMPLETED_LIST_EVENTS = new Set([
  'RELEASE_SUCCEEDED',
  'MANUAL_RELEASE_SUCCEEDED',
  'ORDER_COMPLETED_EXTERNALLY',
  'ORDER_APPEAL_STARTED',
  'ORDER_OBJECTION_REQUIRED',
  'COMPLETION_SEEN',
])

function parseUpdate(data: string): WithdrawalUpdate | null {
  try {
    const update = JSON.parse(data) as WithdrawalUpdate | null
    if (typeof update?.withdrawalPublicId === 'string' && typeof update.eventType === 'string') {
      return update
    }
  } catch {
    return null
  }
  return null
}

export function WithdrawalUpdatesProvider({
  workspacePublicId,
  chatPublicId,
  children,
}: PropsWithChildren<{ workspacePublicId: string | null; chatPublicId: string | null }>) {
  const queryClient = useQueryClient()
  const [connection, setConnection] = useState<ContextType<typeof WithdrawalUpdatesContext>>(null)

  useEffect(() => {
    if (!workspacePublicId || typeof EventSource === 'undefined') return
    const workspace = workspacePublicId
    let source: EventSource | undefined
    let reconnectTimer: number | undefined
    let heartbeatTimer: number | undefined
    let batchTimer: number | undefined
    let activeChanged = false
    let completedChanged = false
    let soundsChanged = false
    let refreshAllDetails = false
    const changedDetails = new Set<string>()

    const flush = () => {
      batchTimer = undefined
      if (activeChanged)
        void queryClient.invalidateQueries({ queryKey: withdrawalKeys.active(workspace) })
      if (completedChanged)
        void queryClient.invalidateQueries({ queryKey: withdrawalKeys.completed(workspace) })
      if (soundsChanged)
        void queryClient.invalidateQueries({ queryKey: withdrawalKeys.soundEvents(workspace) })
      if (refreshAllDetails) {
        void queryClient.invalidateQueries({ queryKey: withdrawalKeys.detailPages(workspace) })
      } else {
        for (const publicId of changedDetails) {
          void queryClient.invalidateQueries({
            queryKey: withdrawalKeys.details(workspace, publicId),
          })
        }
      }
      activeChanged = completedChanged = soundsChanged = refreshAllDetails = false
      changedDetails.clear()
    }

    const queueRefresh = () => {
      batchTimer ??= window.setTimeout(flush, UPDATE_BATCH_DELAY)
    }

    const reconnect = () => {
      window.clearTimeout(heartbeatTimer)
      source?.close()
      source = undefined
      setConnection(null)
      reconnectTimer ??= window.setTimeout(connect, RECONNECT_DELAY)
    }

    const watchHeartbeat = () => {
      window.clearTimeout(heartbeatTimer)
      heartbeatTimer = window.setTimeout(reconnect, HEARTBEAT_TIMEOUT)
    }

    function connect() {
      reconnectTimer = undefined
      const stream = new EventSource(withdrawalApi.getUpdatesUrl(workspace, chatPublicId))
      source = stream
      watchHeartbeat()

      stream.addEventListener('ready', (message: MessageEvent<string>) => {
        if (source !== stream) return
        setConnection({
          workspacePublicId: workspace,
          chatPublicId,
          chatSupported: message.data === 'chat',
        })
        watchHeartbeat()
        activeChanged = completedChanged = soundsChanged = refreshAllDetails = true
        queueRefresh()
      })

      stream.addEventListener('heartbeat', () => {
        if (source === stream) watchHeartbeat()
      })

      stream.addEventListener('withdrawal', (message: MessageEvent<string>) => {
        if (source !== stream) return
        watchHeartbeat()
        const update = parseUpdate(message.data)
        if (!update) return
        activeChanged ||= update.eventType !== 'COMPLETION_SEEN'
        completedChanged ||= COMPLETED_LIST_EVENTS.has(update.eventType)
        soundsChanged ||= update.soundEvent === true
        changedDetails.add(update.withdrawalPublicId)
        queueRefresh()
      })

      stream.addEventListener('chat', (message: MessageEvent<string>) => {
        if (source !== stream || !chatPublicId || message.data !== chatPublicId) return
        watchHeartbeat()
        changedDetails.add(chatPublicId)
        queueRefresh()
      })

      stream.onerror = () => {
        if (source !== stream) return
        setConnection(null)
        if (stream.readyState === EventSource.CLOSED) {
          reconnect()
        } else {
          watchHeartbeat()
        }
      }
    }

    connect()
    return () => {
      source?.close()
      source = undefined
      window.clearTimeout(reconnectTimer)
      window.clearTimeout(heartbeatTimer)
      window.clearTimeout(batchTimer)
    }
  }, [chatPublicId, queryClient, workspacePublicId])

  return (
    <WithdrawalUpdatesContext.Provider
      value={
        connection?.workspacePublicId === workspacePublicId &&
        connection.chatPublicId === chatPublicId
          ? connection
          : null
      }
    >
      {children}
    </WithdrawalUpdatesContext.Provider>
  )
}
