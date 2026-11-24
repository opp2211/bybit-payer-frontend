import { useEffect, useRef, useState } from 'react'

import {
  createWithdrawalSoundPlayer,
  type WithdrawalSound,
} from '@/entities/withdrawal/lib/withdrawal-sound-player'
import {
  useCompletedWithdrawalsQuery,
  useWithdrawalSoundEventsQuery,
} from '@/entities/withdrawal/model/queries'

const COMPLETIONS_KEY = 'flowpay:completion-sounds'
const SOUND_BY_EVENT: Partial<Record<string, WithdrawalSound>> = {
  ORDER_FOUND: 'orderFound',
  ATTENTION_REQUIRED: 'attention',
  VERIFICATION_FAILED: 'error',
  RELEASE_FAILED: 'error',
  BYBIT_API_ERROR: 'error',
  IMAPS_ERROR: 'error',
  PDF_PARSER_ERROR: 'error',
  WITHDRAWAL_CANCELLATION_ABORTED: 'error',
  ORDER_CANCELLED: 'orderCancelled',
  ORDER_APPEAL_STARTED: 'appeal',
  ORDER_OBJECTION_REQUIRED: 'appeal',
}

function readPlayedCompletions(): Set<string> {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem(COMPLETIONS_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function WithdrawalSoundMonitor({ workspacePublicId }: { workspacePublicId: string }) {
  const events = useWithdrawalSoundEventsQuery(workspacePublicId)
  const completed = useCompletedWithdrawalsQuery(workspacePublicId)
  const previousEventIds = useRef<Set<number> | null>(null)
  const playedCompletions = useRef<Set<string> | null>(null)
  const [player] = useState(createWithdrawalSoundPlayer)

  useEffect(() => {
    window.addEventListener('pointerup', player.unlock)
    window.addEventListener('keydown', player.unlock)
    return () => {
      window.removeEventListener('pointerup', player.unlock)
      window.removeEventListener('keydown', player.unlock)
      player.dispose()
    }
  }, [player])

  useEffect(() => {
    if (!events.data || !events.isFetchedAfterMount) return
    const previous = previousEventIds.current
    previousEventIds.current = new Set(events.data.map((event) => event.id))
    if (!previous) return

    const sounds = new Set<WithdrawalSound>()
    for (const event of [...events.data].reverse()) {
      const sound = SOUND_BY_EVENT[event.eventType]
      if (sound && !previous.has(event.id)) sounds.add(sound)
    }
    player.enqueue(sounds)
  }, [events.data, events.isFetchedAfterMount, player])

  useEffect(() => {
    const played = (playedCompletions.current ??= readPlayedCompletions())
    const unseen = completed.data?.filter(
      (withdrawal) => !withdrawal.completionSeen && !played.has(withdrawal.publicId),
    )
    if (!unseen?.length) return
    for (const withdrawal of unseen) played.add(withdrawal.publicId)
    try {
      sessionStorage.setItem(COMPLETIONS_KEY, JSON.stringify([...played]))
    } catch {
      // The in-memory set still prevents repeats while this monitor is mounted.
    }
    player.enqueue(['completed'])
  }, [completed.data, player])

  return null
}
