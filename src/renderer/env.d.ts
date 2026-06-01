/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    transcribeAudio: (buffer: ArrayBuffer) => Promise<string>
    minimizeWindow: () => void
    closeWindow: () => void
    getApiKey: () => Promise<{ apiKey: string | null; hasKey: boolean }>
    saveApiKey: (apiKey: string) => Promise<void>
    getAppVersion: () => Promise<string>
  }
}
