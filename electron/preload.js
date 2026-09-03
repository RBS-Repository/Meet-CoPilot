const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('window-set-always-on-top', value),
  getAlwaysOnTop: () => ipcRenderer.invoke('window-get-always-on-top'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-always-on-top'),
  setOpacity: (value) => ipcRenderer.invoke('window-set-opacity', value),
  enableLoopbackAudio: () => ipcRenderer.invoke('enable-loopback-audio'),
  disableLoopbackAudio: () => ipcRenderer.invoke('disable-loopback-audio'),
  isElectron: () => ipcRenderer.invoke('is-electron'),
  getCaptureSources: () => ipcRenderer.invoke('get-capture-sources'),
  setCaptureSourceId: (sourceId) => ipcRenderer.invoke('set-capture-source-id', sourceId),
});
