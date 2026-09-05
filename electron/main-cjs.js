// Electron main process
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

ipcMain.handle('app-update-check', async () => {
  if (!app.isPackaged) return { available: false, unsupported: true };
  try {
    const result = await autoUpdater.checkForUpdates();
    const currentVersion = app.getVersion();
    const updateVersion = result?.updateInfo?.version || '';
    return {
      available: !!updateVersion && updateVersion !== currentVersion,
      currentVersion,
      version: updateVersion,
    };
  } catch (error) {
    return { available: false, error: error?.message || 'Update check failed' };
  }
});

ipcMain.handle('app-update-download', async () => {
  if (!app.isPackaged) return { ok: false, unsupported: true };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Update download failed' };
  }
});

ipcMain.handle('app-update-install', () => {
  if (!app.isPackaged) return { ok: false, unsupported: true };
  autoUpdater.quitAndInstall();
  return { ok: true };
});

console.log('🚀 Electron app starting...');
console.log('   Platform:', process.platform);
console.log('   Node version:', process.version);
console.log('   ELECTRON_DEV:', process.env.ELECTRON_DEV);

const createWindow = () => {
  console.log('📝 Creating BrowserWindow...');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    center: true,
    useContentSize: true,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1,
    },
  });

  const releaseAspectRatioLock = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setAspectRatio(0);
  };

  const fillDisplayWorkArea = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const workArea = display?.workArea;
    if (!workArea) return;
    mainWindow.setBounds(workArea);
  };

  releaseAspectRatioLock();
  mainWindow.webContents.setZoomFactor(1);
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && mainWindow?.isFullScreen()) {
      event.preventDefault();
      mainWindow.setFullScreen(false);
      return;
    }
    if (!(input.control || input.meta)) return;
    if (input.key === '+' || input.key === '-' || input.key === '=' || input.key === '0') {
      event.preventDefault();
      mainWindow?.webContents.setZoomFactor(1);
    }
  });

  const isDev = process.env.ELECTRON_DEV === 'true';
  const devBaseUrl = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173';
  const startUrl = isDev
    ? `${devBaseUrl}/?electron=1&cb=${Date.now()}`
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  console.log('🌍 isDev:', isDev);
  console.log('📍 Loading URL:', startUrl);

  if (isDev) {
    // Avoid stale world-select/UI CSS from old cache or service workers in Electron dev.
    mainWindow.webContents.session.clearCache().catch(() => {});
    mainWindow.webContents.session.clearStorageData({ storages: ['serviceworkers'] }).catch(() => {});
  }

  mainWindow.loadURL(startUrl);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('💥 Renderer process gone:', details.reason, details.exitCode);
  });

  mainWindow.on('maximize', () => {
    releaseAspectRatioLock();
    fillDisplayWorkArea();
  });
  mainWindow.on('unmaximize', releaseAspectRatioLock);
  mainWindow.on('enter-full-screen', releaseAspectRatioLock);
  mainWindow.on('leave-full-screen', releaseAspectRatioLock);

  console.log('📺 Window created at 1280x720 (windowed), maximize/fullscreen enabled');

  mainWindow.on('closed', () => {
    console.log('❌ Window closed');
    mainWindow = null;
  });
};

app.on('ready', () => {
  console.log('🎬 App ready - creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('⏹️ All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('♻️ App activated');
  if (mainWindow === null) {
    createWindow();
  }
});
