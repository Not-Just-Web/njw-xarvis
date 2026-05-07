import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidepanelApp } from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Sidepanel root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <SidepanelApp />
  </React.StrictMode>
);
