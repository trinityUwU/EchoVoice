import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  transcribeAudio: (buffer: ArrayBuffer): Promise<string> =>
    ipcRenderer.invoke('transcribe-audio', buffer),

  minimizeWindow: (): void => ipcRenderer.send('window-minimize'),
  closeWindow: (): void => ipcRenderer.send('window-close'),

  getApiKey: (): Promise<{ apiKey: string | null; hasKey: boolean }> =>
    ipcRenderer.invoke('get-api-key'),
  saveApiKey: (apiKey: string): Promise<void> =>
    ipcRenderer.invoke('save-api-key', { apiKey }),
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version')
})
