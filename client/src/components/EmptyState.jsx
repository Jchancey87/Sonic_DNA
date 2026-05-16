import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon, title, description, ctaLabel, ctaLink, onCtaClick }) => {
  return (
    <div className="card" style={{ 
      textAlign: 'center', 
      padding: '60px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#fdfdfd',
      border: '2px dashed #eee'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>{icon}</div>
      <h2 style={{ marginBottom: '10px' }}>{title}</h2>
      <p style={{ color: '#666', maxWidth: '400px', marginBottom: '30px', lineHeight: '1.6' }}>
        {description}
      </p>
      
      {ctaLink ? (
        <Link to={ctaLink}>
          <button style={{ padding: '12px 30px', fontSize: '16px' }}>{ctaLabel}</button>
        </Link>
      ) : ctaLabel ? (
        <button onClick={onCtaClick} style={{ padding: '12px 30px', fontSize: '16px' }}>
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
