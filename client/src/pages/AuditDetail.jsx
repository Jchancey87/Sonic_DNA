import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const backend = useBackend();
  const [audit, setAudit] = useState(null);
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const auditRes = await backend.getAudit(id);
      if (!auditRes) {
        setError('Audit not found');
        return;
      }
      setAudit(auditRes);
      
      const songRes = await backend.getSong(auditRes.songId?._id || auditRes.songId);
      setSong(songRes);
    } catch (err) {
      setError('Failed to load audit details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await backend.deleteAudit(id);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete audit');
      setIsDeleteModalOpen(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="loading">Loading audit details...</div>;
  if (error || !audit) return <div className="error">{error || 'Audit not found'}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div>
            <h1>{song?.title || 'Unknown Song'}</h1>
            <p className="card-subtitle">by {song?.artistName || song?.artist || 'Unknown Artist'}</p>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {audit.lensSelection.map((lens) => (
                <span key={lens} className="badge primary" style={{ textTransform: 'capitalize' }}>
                  {lens}
                </span>
              ))}
              <span className="badge" style={{ textTransform: 'capitalize' }}>{audit.workflowType} mode</span>
              <span className={`badge ${audit.status === 'completed' ? 'success' : 'warning'}`}>
                {audit.status}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsDeleteModalOpen(true)} className="danger">
              Delete
            </button>
            <button onClick={() => navigate('/dashboard')} className="secondary">
              Back to Library
            </button>
          </div>
        </div>

        {/* Audit responses */}
        {audit.responses && Object.keys(audit.responses).length > 0 && (
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2>Your Analysis</h2>
            <div style={{ marginTop: '20px' }}>
              {Object.entries(audit.responses).map(([key, value]) => {
                if (!value) return null;
                // Parse key like "rhythm-q0"
                const [lens, qRef] = key.split('-');
                return (
                  <div key={key} style={{ marginBottom: '25px', backgroundColor: '#fcfcfc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#1976d2', textTransform: 'capitalize', fontSize: '14px' }}>
                        {lens} Lens
                      </strong>
                    </div>
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#333' }}>
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bookmarks */}
        {audit.bookmarks && audit.bookmarks.length > 0 && (
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2>Bookmarks ({audit.bookmarks.length})</h2>
            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {audit.bookmarks.map((bookmark, idx) => (
                <div
                  key={bookmark._id || idx}
                  style={{
                    background: '#f9f9f9',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ color: '#1976d2' }}>{formatTimestamp(bookmark.timestampSeconds || bookmark.timestamp)}</strong>
                    {bookmark.lens && <span className="badge" style={{ fontSize: '10px' }}>{bookmark.lens}</span>}
                  </div>
                  {bookmark.label && <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '5px' }}>{bookmark.label}</div>}
                  {bookmark.note && <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>{bookmark.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Techniques */}
        {audit.techniques && audit.techniques.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2>Logged Techniques ({audit.techniques.length})</h2>
              <Link to="/techniques">
                <button className="secondary" style={{ padding: '5px 15px', fontSize: '13px' }}>View Notebook</button>
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {audit.techniques.map((tech, idx) => (
                <div
                  key={tech._id || idx}
                  style={{
                    background: '#f9f9f9',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{tech.techniqueName || tech.description}</div>
                      <span className="badge" style={{ marginTop: '5px', display: 'inline-block' }}>
                        {tech.lens || tech.category}
                      </span>
                    </div>
                    {tech.exampleTimestamp && (
                      <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '12px' }}>
                        {formatTimestamp(tech.exampleTimestamp)}
                      </span>
                    )}
                  </div>
                  {tech.techniqueName && tech.description && (
                    <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>{tech.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        type="audit"
        id={id}
        backend={backend}
      />
    </div>
  );
};

export default AuditDetail;
