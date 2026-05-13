import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { songAPI, auditAPI } from '../utils/api';

const AuditCreate = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [selectedLenses, setSelectedLenses] = useState([]);
  const [workflowType, setWorkflowType] = useState('quick');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  useEffect(() => {
    loadSong();
  }, [songId]);

  const loadSong = async () => {
    try {
      const response = await songAPI.getById(songId);
      setSong(response.data);
    } catch (err) {
      setError('Failed to load song');
    } finally {
      setLoading(false);
    }
  };

  const toggleLens = (lens) => {
    setSelectedLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens]
    );
  };

  const handleStartAudit = async () => {
    if (selectedLenses.length === 0) {
      setError('Please select at least one lens');
      return;
    }

    setGeneratingTemplate(true);
    try {
      const response = await auditAPI.generateTemplate(songId, selectedLenses, workflowType);
      // Store template in session/state and navigate
      sessionStorage.setItem('auditTemplate', JSON.stringify(response.data));
      navigate(`/audit/form/${songId}`);
    } catch (err) {
      setError('Failed to generate audit template');
      setGeneratingTemplate(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!song) return <div className="error">Song not found</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="card">
        <h1>Create New Audit</h1>

        {error && <div className="error">{error}</div>}

        {/* Song info */}
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h3>{song.title}</h3>
          <p style={{ color: '#666' }}>by {song.artist}</p>
          {song.researchSummary?.summary && (
            <div style={{ marginTop: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
              <strong>Research Summary:</strong>
              <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
                {song.researchSummary.summary}
              </p>
            </div>
          )}
        </div>

        {/* Lens selection */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Select Lenses</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Choose one or more lenses to study this song:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
            {['rhythm', 'texture', 'harmony', 'arrangement'].map((lens) => (
              <button
                key={lens}
                onClick={() => toggleLens(lens)}
                style={{
                  background: selectedLenses.includes(lens) ? '#1976d2' : '#e0e0e0',
                  color: selectedLenses.includes(lens) ? 'white' : '#333',
                  padding: '15px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
              >
                {lens.charAt(0).toUpperCase() + lens.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow type */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Workflow Type</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Choose how you want to work through this audit:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button
              onClick={() => setWorkflowType('quick')}
              style={{
                background: workflowType === 'quick' ? '#1976d2' : '#e0e0e0',
                color: workflowType === 'quick' ? 'white' : '#333',
                padding: '15px',
                textAlign: 'center',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              ⚡ Quick
              <br />
              <small style={{ fontSize: '12px', fontWeight: 'normal' }}>5-15 min</small>
            </button>
            <button
              onClick={() => setWorkflowType('guided')}
              style={{
                background: workflowType === 'guided' ? '#1976d2' : '#e0e0e0',
                color: workflowType === 'guided' ? 'white' : '#333',
                padding: '15px',
                textAlign: 'center',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              🎓 Guided
              <br />
              <small style={{ fontSize: '12px', fontWeight: 'normal' }}>30-60 min</small>
            </button>
          </div>

          <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>
            <strong>Quick:</strong> Form-based audit with all questions visible
            <br />
            <strong>Guided:</strong> Step through Listen → Sketch → Recreate → Translate → Log
          </small>
        </div>

        {/* Start button */}
        <button
          onClick={handleStartAudit}
          disabled={selectedLenses.length === 0 || generatingTemplate}
          style={{ width: '100%', fontSize: '16px', padding: '15px' }}
        >
          {generatingTemplate ? 'Generating Audit...' : 'Start Audit'}
        </button>
      </div>
    </div>
  );
};

export default AuditCreate;
