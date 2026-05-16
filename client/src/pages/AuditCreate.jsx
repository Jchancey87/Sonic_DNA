import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

const LENS_META = {
  rhythm:      { emoji: '🥁', label: 'Rhythm',      desc: 'Drums, groove, pocket, timing' },
  texture:     { emoji: '🎛️', label: 'Texture',     desc: 'Timbre, EQ, reverb, space' },
  harmony:     { emoji: '🎹', label: 'Harmony',     desc: 'Chords, progressions, tonality' },
  arrangement: { emoji: '🎼', label: 'Arrangement', desc: 'Structure, transitions, energy arc' },
};

const AuditCreate = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const backend = useBackend();

  const [song, setSong] = useState(null);
  const [selectedLenses, setSelectedLenses] = useState([]);
  const [workflowType, setWorkflowType] = useState('quick');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSong(); }, [songId]);

  const loadSong = async () => {
    try {
      const response = await backend.getSong(songId);
      setSong(response);
    } catch {
      setError('Failed to load song');
    } finally {
      setLoading(false);
    }
  };

  const toggleLens = (lens) =>
    setSelectedLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens]
    );

  const handleStartAudit = async () => {
    if (selectedLenses.length === 0) {
      setError('Please select at least one lens');
      return;
    }
    setCreating(true);
    setError('');
    try {
      // Single-step creation: server generates + stores the template
      const { audit } = await backend.createAudit({
        songId,
        lenses: selectedLenses,
        workflowType,
      });
      // Navigate to form with the new audit ID — no sessionStorage needed
      navigate(`/audit/form/${audit._id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create audit');
      setCreating(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!song)   return <div className="error">Song not found</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="card">
        <h1>Create New Audit</h1>

        {error && <div className="error">{error}</div>}

        {/* Song info */}
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h3>{song.title}</h3>
          <p style={{ color: '#666' }}>by {song.artistName || song.artist}</p>
          {song.researchSummary?.summary && (
            <div style={{ marginTop: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
              <strong>Research Summary:</strong>
              <p style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
                {song.researchSummary.summary}
              </p>
            </div>
          )}
          {song.researchStatus === 'failed' && (
            <div style={{ marginTop: '10px', color: '#b26a00', fontSize: '13px' }}>
              ⚠ Research unavailable — you can still run an audit.
            </div>
          )}
        </div>

        {/* Lens selection */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Select Lenses</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Choose one or more angles to study this song:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
            {Object.entries(LENS_META).map(([lens, meta]) => {
              const active = selectedLenses.includes(lens);
              return (
                <button
                  key={lens}
                  id={`lens-${lens}`}
                  onClick={() => toggleLens(lens)}
                  style={{
                    background: active ? '#1976d2' : '#e0e0e0',
                    color: active ? 'white' : '#333',
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: active ? '2px solid #1565c0' : '2px solid transparent',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{meta.emoji}</div>
                  <div>{meta.label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '4px', opacity: 0.8 }}>
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workflow type */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Workflow Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {[
              { id: 'quick',   emoji: '⚡', label: 'Quick',   time: '5–15 min',  hint: 'All questions in one form' },
              { id: 'guided',  emoji: '🎓', label: 'Guided',  time: '30–60 min', hint: 'Listen → Sketch → Translate → Recreate → Log' },
            ].map((w) => {
              const active = workflowType === w.id;
              return (
                <button
                  key={w.id}
                  id={`workflow-${w.id}`}
                  onClick={() => setWorkflowType(w.id)}
                  style={{
                    background: active ? '#1976d2' : '#e0e0e0',
                    color: active ? 'white' : '#333',
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: active ? '2px solid #1565c0' : '2px solid transparent',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{w.emoji} {w.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.85 }}>{w.time}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '4px', opacity: 0.7 }}>{w.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          id="start-audit-btn"
          onClick={handleStartAudit}
          disabled={selectedLenses.length === 0 || creating}
          style={{ width: '100%', fontSize: '16px', padding: '15px' }}
        >
          {creating ? 'Creating Audit…' : 'Start Audit →'}
        </button>

        {creating && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '12px', fontSize: '13px' }}>
            Generating your custom questions…
          </p>
        )}
      </div>
    </div>
  );
};

export default AuditCreate;
