import { useState, useRef, useCallback, useEffect } from 'react'

export type RecorderState = 'idle' | 'recording' | 'processing'

export interface AudioRecorderReturn {
  state: RecorderState
  transcript: string
  chunkCount: number
  elapsedSeconds: number
  analyserNode: AnalyserNode | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearTranscript: () => void
}

const CHUNK_INTERVAL_MS = 10_000
const MIME_TYPE = 'audio/webm;codecs=opus'

export function useAudioRecorder(): AudioRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [chunkCount, setChunkCount] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const currentRecorderRef = useRef<MediaRecorder | null>(null)
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const stoppedRef = useRef(false)

  const appendTranscript = useCallback((text: string) => {
    if (!text) return
    setTranscript((prev) => (prev ? `${prev} ${text}` : text))
  }, [])

  const createRecorder = useCallback(
    (stream: MediaStream): MediaRecorder => {
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        if (chunks.length === 0) return
        if (!stoppedRef.current) setState('processing')
        const blob = new Blob(chunks, { type: MIME_TYPE })
        const buffer = await blob.arrayBuffer()
        try {
          const text = await window.electronAPI.transcribeAudio(buffer)
          appendTranscript(text)
          setChunkCount((n) => n + 1)
        } catch (err) {
          appendTranscript(`[Erreur transcription]`)
        } finally {
          if (!stoppedRef.current) setState('recording')
        }
      }

      return recorder
    },
    [appendTranscript]
  )

  const rotateRecorder = useCallback(() => {
    if (!streamRef.current) return
    const newRecorder = createRecorder(streamRef.current)
    newRecorder.start()
    currentRecorderRef.current?.stop()
    currentRecorderRef.current = newRecorder
  }, [createRecorder])

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return
    stoppedRef.current = false

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    setAnalyserNode(analyser)

    const recorder = createRecorder(stream)
    recorder.start()
    currentRecorderRef.current = recorder
    setState('recording')
    setElapsedSeconds(0)

    rotationTimerRef.current = setInterval(rotateRecorder, CHUNK_INTERVAL_MS)
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
  }, [state, createRecorder, rotateRecorder])

  const stopRecording = useCallback(() => {
    stoppedRef.current = true
    if (rotationTimerRef.current) clearInterval(rotationTimerRef.current)
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)

    currentRecorderRef.current?.stop()
    currentRecorderRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setAnalyserNode(null)

    setState('idle')
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setChunkCount(0)
    setElapsedSeconds(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current)
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  return {
    state,
    transcript,
    chunkCount,
    elapsedSeconds,
    analyserNode,
    startRecording,
    stopRecording,
    clearTranscript
  }
}
