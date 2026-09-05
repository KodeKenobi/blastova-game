const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('BlastovaDesktopUpdater', {
	check: () => ipcRenderer.invoke('app-update-check'),
	download: () => ipcRenderer.invoke('app-update-download'),
	install: () => ipcRenderer.invoke('app-update-install'),
});
