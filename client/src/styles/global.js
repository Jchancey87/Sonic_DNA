import React from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Noto+Sans:wght@400;700&family=Roboto+Mono:wght@400;500;700&display=swap');

  :root {
    --bg-app: #141414;
    --bg-workspace: #1e1e1e;
    --bg-panel: #282828;
    --bg-header: #282828;
    --accent-orange: #ff6600;
    --accent-orange-hover: #e65c00;
    --border-color: #383838;
    --text-muted: #8a8a8a;
    --text-active: #ffffff;
    
    /* Track/Category Multi-Colors */
    --color-audio: #00e5ff;
    --color-metadata: #ffd700;
    --color-structure: #e0b0ff;
    --color-error: #ff5252;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-app);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--accent-orange);
  }

  body {
    font-family: 'Noto Sans', sans-serif;
    font-size: 18px;
    font-weight: 400;
    background: var(--bg-app);
    color: var(--text-active);
    overflow: hidden; /* Main window doesn't scroll, panels do */
    height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Noto Sans', sans-serif;
    font-weight: 700;
    color: var(--text-active);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h1 { 
    font-size: 1.6rem; 
    margin-bottom: 12px; 
    border-bottom: 1px solid var(--border-color); 
    padding-bottom: 6px; 
  }
  h2 { font-size: 1.3rem; margin-bottom: 10px; }
  h3 { font-size: 1.1rem; margin-bottom: 8px; }

  p {
    font-size: 18px;
    line-height: 1.6;
    color: var(--text-muted);
  }

  /* Layout Base */
  .container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Grid & Flex Utilities */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  /* Hard-edged Panels (replacing Cards) */
  .card, .panel {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 2px;
    padding: 12px;
    margin-bottom: 12px;
    transition: border-color 0.2s ease, background 0.2s ease;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .card:hover, .panel:hover {
    border-color: rgba(255, 102, 0, 0.3);
  }

  .song-card-thumbnail {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  }
  .panel:hover .song-card-thumbnail {
    transform: scale(1.02);
    opacity: 0.85 !important;
  }

  .card-title {
    font-family: 'Barlow', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-active);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-subtitle {
    font-size: 10px;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-family: 'Roboto Mono', monospace;
  }

  /* Buttons (Analog/Instrument theme) */
  button, .btn {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    background: linear-gradient(180deg, #333333 0%, #222222 100%);
    color: var(--accent-orange);
    border: 1px solid var(--border-color);
    padding: 6px 12px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  button:hover:not(:disabled), .btn:hover:not(:disabled) {
    background: var(--accent-orange);
    color: #ffffff;
    border-color: var(--accent-orange);
    box-shadow: 0 0 6px rgba(255, 102, 0, 0.4);
  }

  button.secondary, button.btn-secondary {
    background: linear-gradient(180deg, #282828 0%, #1e1e1e 100%);
    color: var(--text-muted);
    border-color: var(--border-color);
  }

  button.secondary:hover:not(:disabled), button.btn-secondary:hover:not(:disabled) {
    background: linear-gradient(180deg, #383838 0%, #2a2a2a 100%);
    color: var(--text-active);
    border-color: #444444;
    box-shadow: none;
  }

  button.danger {
    background: linear-gradient(180deg, #442222 0%, #2c1616 100%);
    color: var(--color-error);
    border-color: #5a2a2a;
  }

  button.danger:hover:not(:disabled) {
    background: var(--color-error);
    color: #ffffff;
    border-color: var(--color-error);
    box-shadow: 0 0 6px rgba(255, 82, 82, 0.4);
  }

  button:disabled, .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--border-color);
    color: var(--text-muted);
    background: #1e1e1e;
    box-shadow: none;
  }

  /* Forms & Inputs */
  .form-group {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-family: 'Barlow', sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input, textarea, select {
    background: #111111;
    border: 1px solid var(--border-color);
    color: var(--text-active);
    padding: 6px 10px;
    border-radius: 2px;
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    width: 100%;
    transition: border-color 0.15s ease;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--accent-orange);
  }

  textarea {
    min-height: 70px;
    resize: vertical;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 1px 5px;
    background: var(--bg-workspace);
    border: 1px solid var(--border-color);
    border-radius: 2px;
    font-family: 'Roboto Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    color: var(--text-muted);
  }

  .badge.primary {
    background: rgba(255, 102, 0, 0.08);
    color: var(--accent-orange);
    border-color: rgba(255, 102, 0, 0.25);
  }

  .badge.success {
    background: rgba(74, 222, 128, 0.08);
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.2);
  }

  .badge.warning {
    background: rgba(251, 191, 36, 0.08);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.2);
  }

  /* Info / Error boxes */
  .error {
    background: rgba(255, 82, 82, 0.08);
    color: var(--color-error);
    border: 1px solid rgba(255, 82, 82, 0.2);
    border-left: 3px solid var(--color-error);
    padding: 8px 12px;
    font-size: 11px;
    margin-bottom: 12px;
    border-radius: 2px;
    font-family: 'Roboto Mono', monospace;
  }

  .success {
    background: rgba(74, 222, 128, 0.08);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-left: 3px solid #4ade80;
    padding: 8px 12px;
    font-size: 11px;
    margin-bottom: 12px;
    border-radius: 2px;
    font-family: 'Roboto Mono', monospace;
  }

  /* Spacing helpers */
  .mb-10 { margin-bottom: 10px; }
  .mb-20 { margin-bottom: 20px; }
  .mb-30 { margin-bottom: 30px; }
  .mt-10 { margin-top: 10px; }
  .mt-20 { margin-top: 20px; }

  /* Interactive Elements */
  a {
    color: var(--accent-orange);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  a:hover {
    color: var(--accent-orange-hover);
  }

  /* Loading indicator */
  .loading {
    text-align: center;
    padding: 20px 10px;
    font-family: 'Roboto Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
  }
`;

const StyleProvider = () => {
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};

export default StyleProvider;

