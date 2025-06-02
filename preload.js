const { contextBridge, ipcRenderer } = require("electron");
console.log("Preload script loaded!"); // Add this line
contextBridge.exposeInMainWorld("electronAPI", {
  openFolderDialog: () => ipcRenderer.send("open-folder-dialog"),
  onSelectedFolder: (callback) =>
    ipcRenderer.on("selected-folder", (_event, folderPath) =>
      callback(folderPath)
    ),
  readDir: (folderPath) => ipcRenderer.invoke('read-dir', folderPath),
  getStats: (itemPath) => ipcRenderer.invoke('get-stats', itemPath),
  joinPath: (...args) => ipcRenderer.invoke('join-path', ...args), // Now also via IPC
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath, content) =>
    ipcRenderer.send("save-file", { filePath, content }),
  onFileSaved: (callback) =>
    ipcRenderer.on("file-saved", (_event, filePath) => callback(filePath)),
  parseMarkdown: (markdownText) => ipcRenderer.invoke('parse-markdown', markdownText)
});
