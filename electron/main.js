import { app, BrowserWindow, Menu, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    useContentSize: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1,
    },
  });

  const releaseAspectRatioLock = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    mainWindow.setAspectRatio(0);
  };

  const fillDisplayWorkArea = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const workArea = display?.workArea;
    if (!workArea) {
      return;
    }
    mainWindow.setBounds(workArea);
  };

  releaseAspectRatioLock();
  mainWindow.webContents.setZoomFactor(1);
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {
    // Ignore if platform/runtime does not support visual zoom limits.
  });
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && mainWindow?.isFullScreen()) {
      event.preventDefault();
      mainWindow.setFullScreen(false);
      return;
    }
    if (!(input.control || input.meta)) {
      return;
    }
    if (input.key === '+' || input.key === '-' || input.key === '=' || input.key === '0') {
      event.preventDefault();
      mainWindow?.webContents.setZoomFactor(1);
    }
  });

  const isDev = process.env.ELECTRON_DEV === 'true';
  const startUrl = isDev
    ? (process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173')
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);
  mainWindow.maximize();

  mainWindow.on('maximize', () => {
    releaseAspectRatioLock();
    fillDisplayWorkArea();
  });
  mainWindow.on('unmaximize', releaseAspectRatioLock);
  mainWindow.on('enter-full-screen', releaseAspectRatioLock);
  mainWindow.on('leave-full-screen', releaseAspectRatioLock);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow?.reload();
        },
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => {
          mainWindow?.webContents.toggleDevTools();
        },
      },
      {
        label: 'Toggle Full Screen',
        accelerator: 'F11',
        click: () => {
          if (!mainWindow) {
            return;
          }
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
