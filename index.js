const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process"); // Import child_process

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

ipcMain.handle("join-path", async (event, ...args) => {
  try {
    return path.join(...args);
  } catch (error) {
    console.error("Failed to join path:", error);
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
const marked = require("marked");

ipcMain.handle("parse-markdown", async (event, markdownText) => {
  try {
    return marked.parse(markdownText);
  } catch (error) {
    console.error("Failed to parse markdown in main process:", error);
    throw error;
  }
});

// Function to create the commit message dialog window
function createCommitDialogWindow() {
  const childWindow = new BrowserWindow({
    width: 400,
    height: 200,
    parent: BrowserWindow.getFocusedWindow(), // Make it a modal
    modal: true,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'commit-dialog-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  childWindow.loadFile('commit-dialog.html');

  childWindow.once('ready-to-show', () => {
    childWindow.show();
  });

  return childWindow;
}

ipcMain.handle('open-commit-dialog', async (event) => {
  return new Promise((resolve, reject) => {
    const dialogWindow = createCommitDialogWindow();

    ipcMain.once('commit-message-response', (event, commitMessage) => {
      dialogWindow.close();
      resolve(commitMessage);
    });

    dialogWindow.on('closed', () => {
      // If the dialog is closed without a message, resolve with null
      resolve(null);
    });
  });
});

ipcMain.handle('perform-git-operations', async (event, repoPath, commitMessage) => {
  return new Promise((resolve, reject) => {
    if (!commitMessage) {
      return reject(new Error('Commit message cannot be empty. Git operation cancelled.'));
    }

    const options = { cwd: repoPath }; // Execute commands in the selected folder

    exec('git add .', options, (err, stdout, stderr) => {
      if (err) {
        console.error(`git add error: ${stderr}`);
        return reject(new Error(`git add failed: ${stderr}`));
      }
      console.log(`git add stdout: ${stdout}`);

      exec(`git commit -m "${commitMessage}"`, options, (err, stdout, stderr) => {
        if (err) {
          console.error(`git commit error: ${stderr}`);
          if (stderr.includes('nothing to commit')) {
            return resolve('No changes to commit. Git status clean.');
          }
          return reject(new Error(`git commit failed: ${stderr}`));
        }
        console.log(`git commit stdout: ${stdout}`);

        exec('git push', options, (err, stdout, stderr) => {
          if (err) {
            console.error(`git push error: ${stderr}`);
            return reject(new Error(`git push failed: ${stderr}`));
          }
          console.log(`git push stdout: ${stdout}`);
          resolve('Changes committed and pushed successfully!');
        });
      });
    });
  });
});
