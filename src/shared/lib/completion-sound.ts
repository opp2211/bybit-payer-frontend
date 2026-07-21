const STORAGE_KEY = 'flowpay:completion-sounds'

function getPlayedIds(): Set<string> {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function persistPlayedIds(ids: Set<string>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function wasCompletionSoundPlayed(id: string): boolean {
  return getPlayedIds().has(id)
}

export function markCompletionSoundPlayed(id: string) {
  const ids = getPlayedIds()
  ids.add(id)
  persistPlayedIds(ids)
}

export async function playCompletionSound(): Promise<void> {
  const context = new AudioContext()

  try {
    if (context.state === 'suspended') {
      await context.resume()
    }

    const now = context.currentTime
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65)
    gain.connect(context.destination)
    ;[659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      oscillator.start(now + index * 0.14)
      oscillator.stop(now + 0.45 + index * 0.14)
    })

    window.setTimeout(() => void context.close(), 900)
  } catch {
    await context.close()
  }
}
