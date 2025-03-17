import { app, BrowserWindow, systemPreferences } from 'electron';
import path from 'node:path';
import { startTask } from './task';
import { ipcMain } from 'electron-better-ipc';
import { logger } from './logger';

const createWindow = () => {
  startTask();

  let requested = false;

  ipcMain.answerRenderer('start-at-login', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.answerRenderer('set-start-at-login', (value: boolean) => {
    return app.setLoginItemSettings({
      openAtLogin: value,
    });
  });

  ipcMain.answerRenderer('check-accessibility', () => {
    return systemPreferences.isTrustedAccessibilityClient(false);
  });

  ipcMain.answerRenderer('request-accessibility', () => {
    requested = true;
    return systemPreferences.isTrustedAccessibilityClient(true);
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 800,
    titleBarStyle: 'hiddenInset',
    paintWhenInitiallyHidden: true,
    show: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  ipcMain.answerRenderer(mainWindow, 'ready', () => {
    mainWindow.show();
  });

  mainWindow.addListener('focus', () => {
    ipcMain.callRenderer(mainWindow, 'window-focus');

    if (requested) {
      startTask();
    }
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  logger.log('Dir', __dirname);
  logger.log('File', __filename);
  logger.log('cwd', process.cwd());
  logger.log('env', JSON.stringify(process.argv), JSON.stringify(process.versions));

  if (import.meta.env.DEV) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  process.addListener('unhandledRejection', (error) => {
    logger.log(`Unhandled Rejection: ${error}`);
  });

  process.addListener('uncaughtException', (error) => {
    logger.log(`Uncaught Exception: ${error}`);
  });

  logger.log('App started');
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
