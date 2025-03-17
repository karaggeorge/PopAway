import { app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { ipcMain } from 'electron-better-ipc';

const logFile = path.join(app.getPath('logs'), 'popaway.log');

app.whenReady().then(() => {
  ipcMain.answerRenderer('log-file', () => logFile);

  ipcMain.answerRenderer('open-log-file', () => {
    shell.openPath(logFile);
  });
});

export const logger = {
  log: (...messages: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(...messages);
    }

    fs.promises.appendFile(logFile, `[${new Date().toISOString()}] ${messages.join(' ')}\n`);
  }
}
