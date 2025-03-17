import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let logFile: string | undefined;

export const logger = {
  log: (...messages: string[]) => {
    logFile = logFile ?? path.join(app.getPath('logs'), 'popaway.log');
    
    if (import.meta.env.DEV) {
      console.log(...messages);
    }

    fs.promises.appendFile(logFile, `[${new Date().toISOString()}] ${messages.join(' ')}\n`);
  }
}
