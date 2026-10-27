/** A short, soft two-note chime, made in the browser (no audio file to download). */

let context: AudioContext | null = null

/** Browsers only allow sound after the person has interacted with the page; call this on the first click. */
export function unlockSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!context && Ctx) context = new Ctx()
    if (context?.state === "suspended") void context.resume()
  } catch {
    context = null
  }
}

export function playChime() {
  if (!context || context.state !== "running") return
  const now = context.currentTime
  ;[
    [880, 0],
    [1318.5, 0.14],
  ].forEach(([frequency, delay]) => {
    const osc = context!.createOscillator()
    const gain = context!.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.45)
    osc.connect(gain).connect(context!.destination)
    osc.start(now + delay)
    osc.stop(now + delay + 0.5)
  })
}
