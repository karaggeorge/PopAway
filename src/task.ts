import path from 'node:path';
import { execa } from 'execa';
import Store from 'electron-store';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { app, Notification, shell, systemPreferences } from 'electron';
import { logger } from './logger';

const fixPathForAsarUnpack = (path: string): string => path.replace('app.asar', 'app.asar.unpacked');

const binary = fixPathForAsarUnpack(path.join(__dirname, 'popaway-cli'));

let taskProcess: ReturnType<typeof execa> | undefined;
let lastTaskArgs: string[] = [];
let taskCleanup: Promise<void> | undefined;

interface Popup {
  count: number;
  blocked: number;
  last: number;
  contents: string[];
  blocking: boolean;
}

const taskHistory = new Store<{
  popups: Record<string, Popup>;
}>({ name: 'task-history', watch: true }) as unknown as {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  path: string;
  onDidChange: (key: string, callback: (newValue: unknown, oldValue: unknown) => void) => () => void;
};

if (taskHistory.get('popups') === undefined) {
  taskHistory.set('popups', {
    'Turn On Reactions': {
      count: 0,
      blocked: 0,
      last: 0,
      contents: [],
      blocking: true,
    }
  });
}

taskHistory.onDidChange('popups', async (newValue, oldValue) => {
  console.log('Popups changed', newValue, oldValue);
  console.log('Task', taskProcess);
  console.log(getPopupKeys());

  if (taskProcess) {
    const newKeys = getPopupKeys();

    if (newKeys.join(',') !== lastTaskArgs.join(',')) {
      taskProcess.kill();
      taskProcess = undefined;
      await taskCleanup;

      console.log('Restarting task', lastTaskArgs, newKeys);

      taskCleanup = doStartTask();
    } else {
      console.log('Not restarting', lastTaskArgs, newKeys);
    }
  }
});

function recordEvent(event: { content: string[], closed: boolean }) {
  const now = Date.now();
  const [key, ...rest] = event.content;
  const popup = taskHistory.get(`popups.${key}`) as Popup ?? { count: 0, blocked: 0, blocking: false, last: 0, contents: [] };

  const value = rest.join('\n');
  popup.count++;

  if (event.closed) {
    popup.blocked++;
  }

  popup.last = now;
  const values = new Set(popup.contents);
  values.add(value);
  popup.contents = Array.from(values);

  taskHistory.set(`popups.${key}`, popup);
  logger.log(`Popup: ${key} - ${value}, closed: ${event.closed}`);

  if (event.closed) {
    const hasShownNotification = taskHistory.get('hasShownNotification') as boolean;

    if (hasShownNotification) {
      return;
    }

    notification = new Notification({
      title: 'PopAway has blocked a popup',
      body: 'This will only show once to let you know that PopAway is setup correctly.',
      silent: true,
      urgency: 'low',
      timeoutType: 'default',
    });

    notification.show();
    taskHistory.set('hasShownNotification', true);
  }
}

export function startTask() {
  // if (!systemPreferences.isTrustedAccessibilityClient(false)) {
  //   console.log('No permissions');
  //   return;
  // }
  taskCleanup = doStartTask();
}

function getPopupKeys() {
  return Object.entries(taskHistory.get('popups') as Record<string, Popup> ?? {}).filter(([, value]) => value.blocking).map(([key]) => key).sort();
}

async function temporaryWrite(contents: string, options: { name: string }) {
  const temporaryDirectory = await fs.realpath(os.tmpdir());
  const temporaryFile = path.join(temporaryDirectory, options.name);
  await fs.writeFile(temporaryFile, contents);
  return temporaryFile;
}

let notification: Notification | undefined;

async function doStartTask() {
  logger.log(`Staring task at ${binary}`);

  if (taskProcess) {
    console.log('Task already running');
    return;
  }

  const allLogs: string[] = [];
  const popups = getPopupKeys();

  logger.log('Starting task with popups', popups.join(', '));
  console.log('Starting with', popups);

  taskProcess = execa(binary, popups);
  lastTaskArgs = popups;

  taskProcess.once('exit', async (code) => {
    console.log('Exited with', code);
    if (code === 1) {
      const file = await temporaryWrite([
        ...allLogs,
        '\nThis application is still under development, please send me this log file so I can debug the failure.'
      ].join('\n'), { name: 'popaway.log' });

      notification = new Notification({
        title: 'PopAway process has crashed',
        body: 'Click to open the error logs',
        
      });

      notification.addListener('click', () => {
        shell.openPath(file);
      });

      notification.show();
      console.log('Showing', notification);
    }

    taskProcess = undefined;
  });

  const quitListener = () => {
    taskProcess?.kill();
    taskProcess = undefined;
  };
  app.addListener('will-quit', quitListener);

  try {
    for await (const raw of taskProcess) {
      const line = raw.toString().trim();
      logger.log('Task', line);
      allLogs.push(line);
  
      if (line.startsWith('j')) {
        try {
          const event = JSON.parse(line.slice(1));
          recordEvent(event);
        } catch (error) {
          console.error('Error parsing event', error);
        }
      }
    }
  } catch (error) {
    logger.log(`Task errored: ${error}`);
  }

  taskProcess = undefined;
  app.removeListener('will-quit', quitListener);
}
