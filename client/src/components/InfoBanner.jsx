import React from 'react';

const InfoBanner = ({ type = 'info', message, children }) => {
  const styles = {
    info: {
      backgroundColor: '#e3f2fd',
      color: '#0d47a1',
      border: '1px solid #bbdefb'
    },
    warning: {
      backgroundColor: '#fff8e1',
      color: '#795548',
      border: '1px solid #ffe082'
    },
    error: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      border: '1px solid #ffcdd2'
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div style={{
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'start',
      gap: '12px',
      fontSize: '14px',
      lineHeight: '1.5',
      ...currentStyle
    }}>
      <div style={{ fontSize: '18px' }}>
        {type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}
      </div>
      <div>
        {message && <strong>{message}</strong>}
        {children && <div style={{ marginTop: message ? '5px' : '0' }}>{children}</div>}
      </div>
    </div>
  );
};

export default InfoBanner;
