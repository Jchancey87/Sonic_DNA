import React, { useState, useEffect } from 'react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, type, id, backend }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      loadPreview();
    }
  }, [isOpen, id]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      if (type === 'song') {
        const data = await backend.getSongDeletePreview(id);
        setPreview(data);
      } else if (type === 'audit') {
        const data = await backend.getAuditDeletePreview(id);
        setPreview(data);
      }
    } catch (err) {
      console.error('Failed to load delete preview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '90%', margin: '20px' }}>
        <h2>Confirm Deletion</h2>
        <p style={{ marginTop: '10px' }}>
          Are you sure you want to delete this {type}? This action can be undone later from the archives, but it will hide the following items:
        </p>

        {loading ? (
          <p style={{ margin: '20px 0', color: '#666' }}>Loading preview...</p>
        ) : (
          <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#fff8f1', borderRadius: '6px', border: '1px solid #ffe0b2' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>1 {type}</li>
              {preview?.auditCount > 0 && <li>{preview.auditCount} associated audits</li>}
              {preview?.techniqueCount > 0 && <li>{preview.techniqueCount} associated techniques</li>}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            className="danger" 
            onClick={onConfirm} 
            disabled={loading}
            style={{ flex: 1 }}
          >
            Yes, Delete
          </button>
          <button 
            className="secondary" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
