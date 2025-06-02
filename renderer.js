const openFolderBtn = document.getElementById('open-folder-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const commitPushBtn = document.getElementById('commit-push-btn'); // Get the new button
const fileNavigator = document.getElementById('file-navigator');
const markdownEditorElement = document.getElementById('markdown-editor'); // Renamed to avoid conflict
const currentFileDisplay = document.getElementById('current-file-display');
const markdownPreview = document.getElementById('markdown-preview');

let currentOpenFilePath = null;
let currentRootFolder = null; // To keep track of the root folder

// Initialize EasyMDE
const easyMDE = new EasyMDE({
  element: markdownEditorElement,
  spellChecker: false, // Disable spell checker if not needed
  forceSync: true, // Ensure textarea value is always in sync
  status: false, // Disable status bar if not needed
  toolbar: [
    "bold", "italic", "heading", "|",
    "quote", "unordered-list", "ordered-list", "|",
    "link", "image", "table", "|",
    "code", "guide"
  ]
});

async function updatePreview() {
  if (window.electronAPI && window.electronAPI.parseMarkdown) {
    try {
      const markdownText = easyMDE.value(); // Get content from EasyMDE
      const htmlContent = await window.electronAPI.parseMarkdown(markdownText);
      markdownPreview.innerHTML = htmlContent;
    } catch (e) {
      console.error('Error parsing Markdown:', e);
      markdownPreview.innerHTML = '<p>Error parsing Markdown. Check console.</p>';
    }
  }
}

// Listen for changes in EasyMDE
easyMDE.codemirror.on("change", updatePreview);

openFolderBtn.addEventListener('click', () => {
  window.electronAPI.openFolderDialog();
});

saveFileBtn.addEventListener('click', () => {
  if (currentOpenFilePath) {
    const newContent = easyMDE.value(); // Get content from EasyMDE
    window.electronAPI.saveFile(currentOpenFilePath, newContent);
  } else {
    console.warn('No file is currently open. Cannot save.');
  }
});

commitPushBtn.addEventListener('click', async () => {
  try {
    const commitMessage = await window.electronAPI.openCommitDialog();
    if (commitMessage !== null) { // If user didn't cancel the dialog
      const result = await window.electronAPI.performGitOperations(currentRootFolder, commitMessage);
      alert(result); // Show success or error message
    } else {
      alert('Git operation cancelled.');
    }
  } catch (error) {
    alert(`Git operation failed: ${error.message}`);
    console.error('Git operation failed:', error);
  }
});

async function renderDirectoryContents(containerElement, folderPath) {
  try {
    const items = await window.electronAPI.readDir(folderPath);
    const ul = document.createElement('ul');
    ul.classList.add('folder-list');
    containerElement.appendChild(ul);

    for (const item of items) {
      const fullPath = await window.electronAPI.joinPath(folderPath, item);
      try {
        const stats = await window.electronAPI.getStats(fullPath);
        const li = document.createElement('li');
        li.classList.add('list-item');

        if (stats.isDirectory) {
          const folderSpan = document.createElement('span');
          folderSpan.textContent = `📁 ${item}`;
          folderSpan.classList.add('folder-name');
          folderSpan.style.cursor = 'pointer';
          li.appendChild(folderSpan);

          const subFolderContainer = document.createElement('div');
          subFolderContainer.classList.add('subfolder-container');
          subFolderContainer.style.display = 'none'; // Hidden by default
          li.appendChild(subFolderContainer);

          folderSpan.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevent parent folder from collapsing
            if (subFolderContainer.style.display === 'none') {
              subFolderContainer.innerHTML = ''; // Clear before re-rendering
              await renderDirectoryContents(subFolderContainer, fullPath);
              subFolderContainer.style.display = 'block';
            } else {
              subFolderContainer.style.display = 'none';
            }
          });
        } else if (stats.isFile) { // Ensure it's a file before proceeding
          const fileSpan = document.createElement('span');
          fileSpan.textContent = `📄 ${item}`;
          fileSpan.classList.add('file-name');
          
          if (item.endsWith('.md') || item.endsWith('.mdx')) {
            fileSpan.style.cursor = 'pointer';
            fileSpan.addEventListener('click', async () => {
              try {
                currentOpenFilePath = fullPath;
                const content = await window.electronAPI.readFile(fullPath);
                easyMDE.value(content); // Set content using EasyMDE
                easyMDE.codemirror.setOption("readOnly", false); // Enable editing
                currentFileDisplay.textContent = item;
                updatePreview();
              } catch (e) {
                console.error(`Error reading file ${fullPath}:`, e);
                easyMDE.value(`Error reading file: ${e.message}`); // Set error content
                easyMDE.codemirror.setOption("readOnly", true); // Disable editing
                currentFileDisplay.textContent = `Error: ${item}`;
                currentOpenFilePath = null;
                updatePreview();
              }
            });
          } else {
            fileSpan.style.color = 'grey'; // Non-editable files
          }
          li.appendChild(fileSpan);
        }
        ul.appendChild(li);
      } catch (e) {
        console.error(`Error getting stats for ${fullPath}:`, e);
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${folderPath}:`, e);
  }
}

window.electronAPI.onSelectedFolder(async (folderPath) => {
  console.log('Selected folder:', folderPath);
  currentRootFolder = folderPath; // Set the root folder
  fileNavigator.innerHTML = '';
  easyMDE.value(''); // Clear EasyMDE content
  easyMDE.codemirror.setOption("readOnly", true); // Set EasyMDE to read-only
  markdownPreview.innerHTML = '';
  currentFileDisplay.textContent = 'No file selected';
  currentOpenFilePath = null;
  updatePreview();

  // Render the root folder contents
  await renderDirectoryContents(fileNavigator, folderPath);
});

window.electronAPI.onFileSaved((filePath) => {
  console.log(`File saved successfully: ${filePath}`);
  if (filePath === currentOpenFilePath) {
    const separator = filePath.includes('/') ? '/' : '\\';
    const filename = filePath.substring(filePath.lastIndexOf(separator) + 1);
    currentFileDisplay.textContent = `${filename} (Saved)`;
  }
});
