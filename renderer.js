const openFolderBtn = document.getElementById('open-folder-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const fileNavigator = document.getElementById('file-navigator');
const markdownEditor = document.getElementById('markdown-editor');
const currentFileDisplay = document.getElementById('current-file-display');
const markdownPreview = document.getElementById('markdown-preview'); // Added preview div

let currentOpenFilePath = null;

function updatePreview() {
  if (window.electronAPI && window.electronAPI.parseMarkdown) {
    try {
      const markdownText = markdownEditor.value;
      const htmlContent = window.electronAPI.parseMarkdown(markdownText);
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

window.electronAPI.onSelectedFolder((folderPath) => {
  console.log('Selected folder:', folderPath);
  fileNavigator.innerHTML = ''; 
  markdownEditor.value = ''; 
  markdownEditor.readOnly = true;
  markdownPreview.innerHTML = ''; // Clear preview
  currentFileDisplay.textContent = 'No file selected';
  currentOpenFilePath = null;
  updatePreview(); // Update preview (it will be empty)

  try {
    const items = window.electronAPI.readDir(folderPath);
    items.forEach(item => {
      const fullPath = window.electronAPI.joinPath(folderPath, item);
      try {
        const stats = window.electronAPI.getStats(fullPath);
        const itemElement = document.createElement('div');
        itemElement.textContent = stats.isDirectory() ? `[D] ${item}` : `[F] ${item}`;
        
        if (!stats.isDirectory()) {
          if (item.endsWith('.md') || item.endsWith('.mdx')) {
            itemElement.addEventListener('click', () => {
              try {
                currentOpenFilePath = fullPath;
                const content = window.electronAPI.readFile(fullPath);
                markdownEditor.value = content;
                markdownEditor.readOnly = false;
                currentFileDisplay.textContent = item;
                updatePreview(); // Update preview when file is loaded
              } catch (e) {
                console.error(`Error reading file ${fullPath}:`, e);
                markdownEditor.value = `Error reading file: ${e.message}`;
                markdownEditor.readOnly = true;
                currentFileDisplay.textContent = `Error: ${item}`;
                currentOpenFilePath = null;
                updatePreview(); // Update preview even on error
              }
            });
            itemElement.style.cursor = 'pointer';
          } else {
            itemElement.style.color = 'grey';
          }
        }
        fileNavigator.appendChild(itemElement);
      } catch (e) {
        console.error(`Error getting stats for ${fullPath}:`, e);
      }
    });
  } catch (e) {
    console.error(`Error reading directory ${folderPath}:`, e);
  }
});

window.electronAPI.onFileSaved((filePath) => {
  console.log(`File saved successfully: ${filePath}`);
  if (filePath === currentOpenFilePath) {
    const separator = filePath.includes('/') ? '/' : '\\';
    const filename = filePath.substring(filePath.lastIndexOf(separator) + 1);
    currentFileDisplay.textContent = `${filename} (Saved)`;
  }
});
