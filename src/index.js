import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // App.css is imported in App.js
import App from './App'; // This is the Markdown editor App

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
