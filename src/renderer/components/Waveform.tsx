import { useEffect, useRef } from 'react'

interface WaveformProps {
  analyserNode: AnalyserNode | null
  isActive: boolean
}

const BAR_COUNT = 32

export function Waveform({ analyserNode, isActive }: WaveformProps): JSX.Element {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)

    if (!analyserNode || !isActive) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = '3px'
      })
      return
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

    const draw = (): void => {
      analyserNode.getByteFrequencyData(dataArray)
      const step = Math.floor(dataArray.length / BAR_COUNT)

      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const value = dataArray[i * step] ?? 0
        const height = Math.max(3, (value / 255) * 28)
        bar.style.height = `${height}px`
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserNode, isActive])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      height: '32px',
      padding: '0 4px'
    }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el }}
          style={{
            width: '2px',
            height: '3px',
            borderRadius: '1px',
            backgroundColor: isActive ? '#6366f1' : '#374151',
            transition: 'background-color 0.3s ease',
            flexShrink: 0
          }}
        />
      ))}
    </div>
  )
}
