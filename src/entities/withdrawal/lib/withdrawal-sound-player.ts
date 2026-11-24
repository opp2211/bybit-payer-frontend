const TONES = {
  orderFound: [523.25],
  attention: [659.25, 659.25],
  error: [311.13, 220],
  orderCancelled: [440, 329.63],
  appeal: [739.99, 523.25, 739.99],
  completed: [659.25, 783.99],
}

export type WithdrawalSound = keyof typeof TONES

const NOTE_SPACING = 0.14
const NOTE_DURATION = 0.45
const SOUND_GAP = 0.2

export function createWithdrawalSoundPlayer() {
  let context: AudioContext | undefined
  let nextStart = 0
  const pending = new Set<WithdrawalSound>()

  const getContext = () => {
    try {
      return (context ??= new AudioContext())
    } catch {
      return undefined
    }
  }

  const playPending = () => {
    if (context?.state !== 'running') return

    for (const sound of pending) {
      const start = Math.max(nextStart, context.currentTime)
      for (const [index, frequency] of TONES[sound].entries()) {
        const noteStart = start + index * NOTE_SPACING
        const noteEnd = noteStart + NOTE_DURATION
        const gain = context.createGain()
        gain.gain.setValueAtTime(0.0001, noteStart)
        gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)
        gain.connect(context.destination)

        const oscillator = context.createOscillator()
        oscillator.frequency.setValueAtTime(frequency, noteStart)
        oscillator.connect(gain)
        oscillator.onended = () => gain.disconnect()
        oscillator.start(noteStart)
        oscillator.stop(noteEnd)
        nextStart = noteEnd + SOUND_GAP
      }
    }
    pending.clear()
  }

  return {
    enqueue(sounds: Iterable<WithdrawalSound>) {
      for (const sound of sounds) pending.add(sound)
      if (pending.size) {
        getContext()
        playPending()
      }
    },
    unlock() {
      const audio = getContext()
      if (audio && audio.state !== 'running' && audio.state !== 'closed') {
        void audio
          .resume()
          .then(playPending)
          .catch(() => {})
      } else {
        playPending()
      }
    },
    dispose() {
      if (context && context.state !== 'closed') void context.close().catch(() => {})
      context = undefined
      nextStart = 0
    },
  }
}
