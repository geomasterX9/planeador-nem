import { app, BrowserWindow } from 'electron'
import path from 'path'

// Determina las rutas dependiendo de si estamos en desarrollo o producción
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Planeador Didáctico NEM - Fase 6",
    // Icono opcional (si no existe no pasa nada, usa el default)
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'), 
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // Carga la URL de desarrollo (Vite) o el archivo local (Producción)
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(createWindow)