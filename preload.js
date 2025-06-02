const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolderDialog: () => ipcRenderer.send('open-folder-dialog'),
  onSelectedFolder: (callback) => ipcRenderer.on('selected-folder', (_event, folderPath) => callback(folderPath)),
  readDir: (folderPath) => fs.readdirSync(folderPath),
  getStats: (itemPath) => fs.statSync(itemPath),
  joinPath: (...args) => path.join(...args),
  readFile: (filePath) => fs.readFileSync(filePath, 'utf-8'),
  saveFile: (filePath, content) => ipcRenderer.send('save-file', { filePath, content }),
  onFileSaved: (callback) => ipcRenderer.on('file-saved', (_event, filePath) => callback(filePath)),
  parseMarkdown: (markdownText) => marked.parse(markdownText)
});
