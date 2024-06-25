function playSlideUpSound(duration: number) {
  const audioContext = new window.AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime) // Start frequency
  oscillator.frequency.linearRampToValueAtTime(
    800,
    audioContext.currentTime + duration
  ) // End frequency

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // Start volume
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration) // End volume

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.start()
  oscillator.stop(audioContext.currentTime + duration)
}

function playTwoToneDing(startTime: number) {
  const audioContext = new window.AudioContext()

  const playTone = (frequency: number, startTime: number, duration: number) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.currentTime + startTime
    )

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + startTime)
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + startTime + duration
    )

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start(audioContext.currentTime + startTime)
    oscillator.stop(audioContext.currentTime + startTime + duration)
  }

  playTone(1400, startTime, 0.2) // First tone
  playTone(1900, startTime + 0.1, 0.15) // Second tone
}

playSlideUpSound(2)
playTwoToneDing(2)
