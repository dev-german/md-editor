import React from 'react';

function Editor({ markdown, onMarkdownChange }) {
  return (
    <div className="editor-pane">
      <textarea
        className="editor-textarea"
        value={markdown}
        onChange={onMarkdownChange}
        placeholder="Enter Markdown here..."
      />
    </div>
  );
}

export default Editor;
