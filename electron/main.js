const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const VITE_URL = 'http://localhost:5173';

let mainWindow = null;
let loopbackEnabled = false;
let selectedCaptureSourceId = null;

function setupLoopbackHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 0, height: 0 },
        });

        if (sources.length === 0) {
          callback({});
          return;
        }

        // Prefer selected source, or default to first screen source for loopback audio
        let source = sources.find((s) => s.id === selectedCaptureSourceId);
        if (!source) {
          source = sources.find((s) => s.id.startsWith('screen:')) ?? sources[0];
        }

        callback({
          video: source,
          audio: loopbackEnabled ? 'loopback' : undefined,
        });
      } catch (err) {
        console.error('Display media handler error:', err);
        callback({});
      }
    },
    { useSystemPicker: false }
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 600,
    minWidth: 360,
    minHeight: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(VITE_URL);
    if (process.env.ELECTRON_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupLoopbackHandler();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-set-always-on-top', (_event, value) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(Boolean(value));
  }
});

ipcMain.handle('window-get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : true;
});

ipcMain.handle('window-toggle-always-on-top', () => {
  if (mainWindow) {
    const next = !mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(next);
    return next;
  }
  return true;
});

ipcMain.handle('window-set-opacity', (_event, opacity) => {
  if (mainWindow && typeof opacity === 'number') {
    const clamped = Math.max(0.15, Math.min(1.0, opacity));
    mainWindow.setOpacity(clamped);
    return clamped;
  }
  return 1.0;
});

ipcMain.handle('enable-loopback-audio', () => {
  loopbackEnabled = true;
});

ipcMain.handle('disable-loopback-audio', () => {
  loopbackEnabled = false;
});

ipcMain.handle('is-electron', () => true);

ipcMain.handle('get-capture-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 150, height: 150 },
  });

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    type: source.id.startsWith('screen:') ? 'screen' : 'window',
  }));
});

ipcMain.handle('set-capture-source-id', (_event, sourceId) => {
  selectedCaptureSourceId = sourceId || null;
});
