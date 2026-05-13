import React from 'react';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background: #f5f5f5;
    color: #333;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Navigation */
  nav {
    background: white;
    border-bottom: 1px solid #e0e0e0;
    padding: 15px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  nav ul {
    list-style: none;
    display: flex;
    gap: 20px;
    align-items: center;
  }

  nav a {
    text-decoration: none;
    color: #1976d2;
    font-weight: 500;
    transition: color 0.2s;
  }

  nav a:hover {
    color: #1565c0;
  }

  nav .user-info {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  /* Buttons */
  button {
    background: #1976d2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  button:hover {
    background: #1565c0;
  }

  button.secondary {
    background: #757575;
  }

  button.secondary:hover {
    background: #616161;
  }

  button.danger {
    background: #d32f2f;
  }

  button.danger:hover {
    background: #c62828;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  /* Forms */
  input, textarea, select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  .form-group {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  label {
    font-weight: 500;
    color: #333;
  }

  /* Cards */
  .card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .card-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
  }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  /* Loading / Error */
  .loading {
    text-align: center;
    padding: 40px 20px;
    color: #999;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
    border-left: 4px solid #c62828;
  }

  .success {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
    border-left: 4px solid #2e7d32;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 4px 8px;
    background: #e0e0e0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }

  .badge.primary {
    background: #bbdefb;
    color: #1565c0;
  }

  .badge.success {
    background: #c8e6c9;
    color: #2e7d32;
  }

  /* Typography */
  h1 {
    font-size: 28px;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 22px;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  /* Spacing */
  .mb-10 { margin-bottom: 10px; }
  .mb-20 { margin-bottom: 20px; }
  .mb-30 { margin-bottom: 30px; }
  .mt-10 { margin-top: 10px; }
  .mt-20 { margin-top: 20px; }

  .p-20 { padding: 20px; }
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
