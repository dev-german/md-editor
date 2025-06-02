const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled === false && result.filePaths.length > 0) {
    event.sender.send('selected-folder', result.filePaths[0])
  }
})

ipcMain.on('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error('Failed to save file:', err);
        // Optionally, send an error message back to renderer
        return;
      }
      console.log('File saved successfully by main process:', filePath);
      event.sender.send('file-saved', filePath);
    });
  } catch (err) {
    console.error('Error during save-file event:', err);
    // Optionally, send an error message back to renderer
  }
})
