const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  console.log("Preload script path b:", path.join(__dirname, "preload.js"));

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  console.log("Preload script path a:", path.join(__dirname, "preload.js"));

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("open-folder-dialog", async (event) => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled === false && result.filePaths.length > 0) {
    event.sender.send("selected-folder", result.filePaths[0]);
  }
});

ipcMain.on("save-file", async (event, { filePath, content }) => {
  try {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error("Failed to save file:", err);
        // Optionally, send an error message back to renderer
        return;
      }
      console.log("File saved successfully by main process:", filePath);
      event.sender.send("file-saved", filePath);
    });
  } catch (err) {
    console.error("Error during save-file event:", err);
    // Optionally, send an error message back to renderer
  }
});

ipcMain.handle("read-dir", async (event, folderPath) => {
  try {
    const files = await fs.promises.readdir(folderPath);
    return files;
  } catch (error) {
    console.error("Failed to read directory:", error);
    throw error;
  }
});

ipcMain.handle('join-path', async (event, ...args) => {
  try {
    return path.join(...args);
  } catch (error) {
    console.error('Failed to join path:', error);
    throw error;
  }
});

ipcMain.handle("get-stats", async (event, itemPath) => {
  try {
    const stats = await fs.promises.stat(itemPath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      // Add other stats properties if needed
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Failed to read file:", error);
    throw error;
  }
});

// Add marked to the main process
const marked = require('marked');

ipcMain.handle('parse-markdown', async (event, markdownText) => {
  try {
    return marked.parse(markdownText);
  } catch (error) {
    console.error('Failed to parse markdown in main process:', error);
    throw error;
  }
});
