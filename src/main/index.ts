import { app, BrowserWindow, ipcMain, screen, Menu, Tray, globalShortcut, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { createServer, Server } from 'net'
import { unlinkSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import log from 'electron-log'
import { config } from 'dotenv'
import { transcribeAudio } from './groq-client'

config({ path: join(app.getAppPath(), '.env') })

function getConfigPath(): string {
  return join(app.getPath('home'), '.config', 'echovoice', 'config.json')
}

function loadApiKey(): void {
  const configPath = getConfigPath()
  try {
    if (existsSync(configPath)) {
      const data = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (data.apiKey) process.env.GROQ_API_KEY = data.apiKey
    }
  } catch { /* ignore */ }
}

log.transports.file.level = 'info'
log.transports.console.level = 'debug'

const TOGGLE_SHORTCUT = 'CommandOrControl+Shift+Space'
const SOCKET_PATH = '/tmp/echovoice.sock'

let win: BrowserWindow | null = null
let tray: Tray | null = null
let socketServer: Server | null = null
let isQuitting = false

function getIconPath(): string {
  // __dirname = out/main/ in prod, src/main/ in dev — go up to project root then resources/
  return join(__dirname, '../../resources/tray-icon.png')
}

function toggleWindow(): void {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
}

function startSocketServer(): void {
  if (existsSync(SOCKET_PATH)) {
    try { unlinkSync(SOCKET_PATH) } catch { /* ignore */ }
  }

  socketServer = createServer((conn) => {
    conn.on('data', (data) => {
      if (data.toString().trim() === 'toggle') toggleWindow()
    })
  })

  socketServer.listen(SOCKET_PATH, () => {
    log.info(`[main] socket listening at ${SOCKET_PATH}`)
  })
}

function createTray(): void {
  const icon = nativeImage.createFromPath(getIconPath())
  tray = new Tray(icon.resize({ width: 20, height: 20 }))
  tray.setToolTip('EchoVoice')

  const menu = Menu.buildFromTemplate([
    { label: 'Afficher / Masquer', click: toggleWindow },
    { label: `Raccourci : ${TOGGLE_SHORTCUT}`, enabled: false },
    { type: 'separator' },
    { label: 'Quitter', click: () => { isQuitting = true; app.quit() } }
  ])

  tray.setContextMenu(menu)
  tray.on('click', toggleWindow)
}

function createWindow(): void {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 400,
    height: 280,
    x: screenWidth - 420,
    y: 20,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  Menu.setApplicationMenu(null)
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('close', (e) => {
    if (isQuitting) return
    e.preventDefault()
    win?.hide()
  })

  log.info('[main] window created')
}

app.whenReady().then(() => {
  loadApiKey()
  createWindow()
  createTray()
  startSocketServer()

  // Fallback: globalShortcut works on XWayland/X11, silently fails on pure Wayland
  const registered = globalShortcut.register(TOGGLE_SHORTCUT, toggleWindow)
  log.info(`[main] globalShortcut registered: ${registered} (use evdev daemon on Wayland)`)

  app.on('activate', () => {
    if (!win) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  socketServer?.close()
  try { if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH) } catch { /* ignore */ }
})

// Prevent quit when all windows closed — tray keeps app alive
app.on('window-all-closed', () => { /* noop */ })

ipcMain.on('window-minimize', () => win?.hide())
ipcMain.on('window-close', () => win?.hide())

ipcMain.handle('get-api-key', (): { apiKey: string | null; hasKey: boolean } => {
  const configPath = getConfigPath()
  try {
    if (existsSync(configPath)) {
      const data = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (data.apiKey) return { apiKey: data.apiKey, hasKey: true }
    }
  } catch { /* ignore */ }
  return { apiKey: null, hasKey: false }
})

ipcMain.handle('save-api-key', (_event, { apiKey }: { apiKey: string }): void => {
  const configPath = getConfigPath()
  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2), 'utf-8')
  process.env.GROQ_API_KEY = apiKey
  log.info('[main] API key saved to config')
})

ipcMain.handle('get-app-version', (): string => app.getVersion())

ipcMain.handle('transcribe-audio', async (_event, buffer: ArrayBuffer): Promise<string> => {
  try {
    return await transcribeAudio(buffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error(`[main] transcribe-audio failed: ${message}`)
    return `[Erreur: ${message}]`
  }
})
