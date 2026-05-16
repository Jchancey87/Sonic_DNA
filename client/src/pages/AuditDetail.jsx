import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const backend = useBackend();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAudit();
  }, [id]);

  const loadAudit = async () => {
    try {
      const response = await backend.getAudit(id);
      setAudit(response);
    } catch (err) {
      setError('Failed to load audit');
    } finally {
      setLoading(false);
    }
  };

  const deleteAudit = async () => {
    if (window.confirm('Delete this audit?')) {
      try {
        await backend.deleteAudit(id);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to delete audit');
      }

    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !audit) return <div className="error">{error || 'Audit not found'}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div>
            <h1>{audit.songId.title}</h1>
            <p className="card-subtitle">by {audit.songId.artist}</p>
            <div style={{ marginTop: '10px' }}>
              {audit.lensSelection.map((lens) => (
                <span key={lens} className="badge primary" style={{ marginRight: '8px' }}>
                  {lens}
                </span>
              ))}
              <span className="badge">{audit.workflowType}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={deleteAudit}
              className="danger"
            >
              Delete
            </button>
            <button onClick={() => navigate('/dashboard')} className="secondary">
              Back
            </button>
          </div>
        </div>

        {/* Audit responses */}
        {audit.responses && Object.keys(audit.responses).length > 0 && (
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2>Your Responses</h2>
            <div style={{ marginTop: '15px' }}>
              {Object.entries(audit.responses).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '20px' }}>
                  <strong style={{ color: '#1976d2', textTransform: 'capitalize' }}>{key}</strong>
                  <p style={{ marginTop: '8px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarks */}
        {audit.bookmarks && audit.bookmarks.length > 0 && (
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2>Bookmarks</h2>
            <ul style={{ listStyle: 'none' }}>
              {audit.bookmarks.map((bookmark, idx) => (
                <li
                  key={idx}
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                  }}
                >
                  <strong>{formatTimestamp(bookmark.timestamp)}</strong>
                  {bookmark.note && <p style={{ marginTop: '5px' }}>{bookmark.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Techniques */}
        {audit.techniques && audit.techniques.length > 0 && (
          <div>
            <h2>Techniques Logged ({audit.techniques.length})</h2>
            <ul style={{ listStyle: 'none' }}>
              {audit.techniques.map((tech, idx) => (
                <li
                  key={idx}
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong>{tech.description}</strong>
                      <br />
                      <span className="badge" style={{ marginTop: '5px' }}>
                        {tech.category}
                      </span>
                    </div>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {new Date(tech.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const formatTimestamp = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default AuditDetail;
