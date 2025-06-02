const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('commitDialogAPI', {
    sendCommitMessage: (message) => ipcRenderer.send('commit-message-response', message)
});
