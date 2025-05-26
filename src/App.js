import React, { useState } from 'react';
import './App.css';
import Editor from './Editor';
import Preview from './Preview';

function App() {
  const [markdown, setMarkdown] = useState('# Hello, Markdown!\n\nRendered by react-markdown.');

  const handleMarkdownChange = (event) => {
    setMarkdown(event.target.value);
  };

  return (
    <div className="app-container">
      <Editor markdown={markdown} onMarkdownChange={handleMarkdownChange} />
      <Preview markdown={markdown} />
    </div>
  );
}

export default App;
