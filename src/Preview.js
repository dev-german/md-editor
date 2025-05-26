import React from 'react';
import ReactMarkdown from 'react-markdown';

function Preview({ markdown }) {
  return (
    <div className="preview-pane">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

export default Preview;
