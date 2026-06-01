import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { Waveform } from './components/Waveform'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const btnBase: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  border: 'none',
  background: 'transparent',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '14px'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#f3f4f6',
  padding: '8px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  outline: 'none',
  fontFamily: 'monospace'
}

function maskApiKey(key: string): string {
  if (key.length <= 4) return '••••••••••••'
  return '••••••••••••' + key.slice(-4)
}

export function App(): JSX.Element {
  const { state, transcript, chunkCount, elapsedSeconds, analyserNode, startRecording, stopRecording, clearTranscript } =
    useAudioRecorder()

  const transcriptRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [storedKey, setStoredKey] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  useEffect(() => {
    window.electronAPI.getApiKey().then(({ apiKey, hasKey: hk }) => {
      setHasKey(hk)
      setStoredKey(apiKey)
      if (!hk) setShowSettings(true)
    }).catch(console.error)

    window.electronAPI.getAppVersion().then(setAppVersion).catch(console.error)
  }, [])

  const showToast = (msg: string): void => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSaveApiKey = async (): Promise<void> => {
    const value = apiKeyInput.trim()
    if (!value) return
    await window.electronAPI.saveApiKey(value)
    setHasKey(true)
    setStoredKey(value)
    setApiKeyInput('')
    showToast('Clé enregistrée ✓')
  }

  const isRecording = state === 'recording' || state === 'processing'

  const handleMicClick = (): void => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording().catch(console.error)
    }
  }

  const handleCopy = (): void => {
    if (transcript) navigator.clipboard.writeText(transcript).catch(console.error)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#111827',
      color: '#f3f4f6',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      userSelect: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>

      {/* Header — draggable */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          WebkitAppRegion: 'drag'
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isRecording ? '#ef4444' : '#6366f1' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>
            ECHOVOICE
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{ ...btnBase, color: showSettings ? '#818cf8' : '#6b7280' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Paramètres"
          >⚙</button>
          <button
            onClick={() => window.electronAPI.minimizeWindow()}
            style={btnBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >−</button>
          <button
            onClick={() => window.electronAPI.closeWindow()}
            style={btnBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >×</button>
        </div>
      </div>

      {/* Main content — swapped by AnimatePresence */}
      <AnimatePresence mode="wait">
        {showSettings ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px', gap: '14px', overflowY: 'auto' }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>Paramètres</span>

            {/* Groq API Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em' }}>GROQ API KEY</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasKey ? '#22c55e' : '#f97316' }} />
                  <span style={{ fontSize: '10px', color: hasKey ? '#22c55e' : '#f97316' }}>
                    {hasKey ? 'Configurée' : 'Non configurée'}
                  </span>
                </div>
              </div>

              {hasKey && !apiKeyInput && (
                <div style={{ ...inputStyle, color: '#6b7280', cursor: 'default' }}>
                  {storedKey ? maskApiKey(storedKey) : '••••••••••••'}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasKey ? 'Nouvelle clé pour remplacer...' : 'gsk_...'}
                  style={{ ...inputStyle, paddingRight: '32px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveApiKey().catch(console.error) }}
                />
                <button
                  onClick={() => setShowApiKey(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px'
                  }}
                  title={showApiKey ? 'Masquer' : 'Afficher'}
                >
                  {showApiKey ? '🙈' : '👁'}
                </button>
              </div>

              <button
                onClick={() => handleSaveApiKey().catch(console.error)}
                disabled={!apiKeyInput.trim()}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                  border: '1px solid rgba(99,102,241,0.3)',
                  backgroundColor: apiKeyInput.trim() ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: apiKeyInput.trim() ? '#818cf8' : '#4b5563',
                  transition: 'all 0.15s'
                }}
              >
                Enregistrer
              </button>
            </div>

            {/* Raccourci */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em' }}>RACCOURCI</span>
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#e5e7eb',
                letterSpacing: '0.05em'
              }}>
                Ctrl+Shift+Space
              </span>
            </div>

            {/* Version */}
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '10px', color: '#374151' }}>v{appVersion}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Waveform — compact */}
            <div style={{ padding: '10px 16px 6px' }}>
              <Waveform analyserNode={analyserNode} isActive={isRecording} />
            </div>

            {/* Transcript */}
            <div
              ref={transcriptRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 16px 8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#e5e7eb',
                scrollbarWidth: 'thin',
                scrollbarColor: '#374151 transparent'
              }}
            >
              <AnimatePresence mode="wait">
                {transcript ? (
                  <motion.p
                    key="transcript"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {transcript}
                  </motion.p>
                ) : (
                  <motion.p
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ margin: 0, color: '#4b5563', fontStyle: 'italic', fontSize: '12px' }}
                  >
                    {isRecording ? 'Écoute en cours...' : 'Prêt à enregistrer'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Status */}
            <div style={{ padding: '2px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#4b5563' }}>
                {chunkCount > 0 ? `chunk ${chunkCount} · ` : ''}{isRecording ? formatDuration(elapsedSeconds) : ''}
              </span>
              <AnimatePresence>
                {state === 'processing' && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ fontSize: '10px', color: '#818cf8' }}
                  >
                    transcription...
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px 12px',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
              <motion.button
                onClick={handleMicClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  backgroundColor: isRecording ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                  color: isRecording ? '#ef4444' : '#818cf8',
                  letterSpacing: '0.02em'
                }}
                animate={isRecording ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0.3)', '0 0 0 5px rgba(239,68,68,0)'] } : { boxShadow: 'none' }}
                transition={{ duration: 1.2, repeat: isRecording ? Infinity : 0 }}
                whileTap={{ scale: 0.96 }}
              >
                <span style={{ fontSize: '11px' }}>{isRecording ? '⏹' : '●'}</span>
                {isRecording ? 'Stop' : 'Start'}
              </motion.button>

              <button
                onClick={handleCopy}
                disabled={!transcript}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: transcript ? 'pointer' : 'not-allowed',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'transparent',
                  color: transcript ? '#9ca3af' : '#374151',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (transcript) (e.currentTarget as HTMLButtonElement).style.color = '#f3f4f6' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = transcript ? '#9ca3af' : '#374151' }}
              >
                Copy
              </button>

              <button
                onClick={clearTranscript}
                disabled={!transcript && chunkCount === 0}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: (transcript || chunkCount > 0) ? 'pointer' : 'not-allowed',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'transparent',
                  color: (transcript || chunkCount > 0) ? '#9ca3af' : '#374151',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (transcript || chunkCount > 0) { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = (transcript || chunkCount > 0) ? '#9ca3af' : '#374151' }}
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
