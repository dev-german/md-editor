const openFolderBtn = document.getElementById('open-folder-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const fileNavigator = document.getElementById('file-navigator');
const markdownEditor = document.getElementById('markdown-editor');
const currentFileDisplay = document.getElementById('current-file-display');
const markdownPreview = document.getElementById('markdown-preview');

let currentOpenFilePath = null;
let currentRootFolder = null; // To keep track of the root folder

async function updatePreview() {
  if (window.electronAPI && window.electronAPI.parseMarkdown) {
    try {
      const markdownText = markdownEditor.value;
      const htmlContent = await window.electronAPI.parseMarkdown(markdownText);
      markdownPreview.innerHTML = htmlContent;
    } catch (e) {
      console.error('Error parsing Markdown:', e);
      markdownPreview.innerHTML = '<p>Error parsing Markdown. Check console.</p>';
    }
  }
}

markdownEditor.addEventListener('input', updatePreview);

openFolderBtn.addEventListener('click', () => {
  window.electronAPI.openFolderDialog();
});

saveFileBtn.addEventListener('click', () => {
  if (currentOpenFilePath) {
    const newContent = markdownEditor.value;
    window.electronAPI.saveFile(currentOpenFilePath, newContent);
  } else {
    console.warn('No file is currently open. Cannot save.');
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
                markdownEditor.value = content;
                markdownEditor.readOnly = false;
                currentFileDisplay.textContent = item;
                updatePreview();
              } catch (e) {
                console.error(`Error reading file ${fullPath}:`, e);
                markdownEditor.value = `Error reading file: ${e.message}`;
                markdownEditor.readOnly = true;
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
  markdownEditor.value = '';
  markdownEditor.readOnly = true;
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
