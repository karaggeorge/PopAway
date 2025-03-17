import { contextBridge, app } from "electron";
import { ipcRenderer } from 'electron-better-ipc'
import Store from 'electron-store';

const store = new Store({ name: 'task-history' })

contextBridge.exposeInMainWorld('main', {
  startAtLogin: ipcRenderer.callMain('start-at-login'),
  setStartAtLogin: (value: boolean) => {
    ipcRenderer.callMain('set-start-at-login', value);
  },
  getStore() {
    return store.store
  },
  setStore(key: string, value: unknown) {
    store.set(key, value);
  },
  openHistoryFile: () => {
    store.openInEditor();
  },
  getAccessibilityPermission: () => ipcRenderer.callMain('check-accessibility'),
  requestAccessibility: () => ipcRenderer.callMain('request-accessibility'),
  onFocus: (callback: () => void) => {
    return ipcRenderer.answerMain('window-focus', callback);
  },
  ready: () => ipcRenderer.callMain('ready'),
});
