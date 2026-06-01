import log from 'electron-log'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3-turbo'
const DEFAULT_LANGUAGE = 'fr'

export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const formData = new FormData()
  formData.append(
    'file',
    new Blob([audioBuffer], { type: 'audio/webm' }),
    'audio.webm'
  )
  formData.append('model', WHISPER_MODEL)
  formData.append('language', DEFAULT_LANGUAGE)
  formData.append('response_format', 'json')

  log.info(`[groq] sending ${audioBuffer.byteLength} bytes to Whisper`)

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    log.error(`[groq] API error ${response.status}: ${errorText}`)
    throw new Error(`Groq API error ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as { text: string }
  log.info(`[groq] transcript: "${data.text}"`)
  return data.text.trim()
}
