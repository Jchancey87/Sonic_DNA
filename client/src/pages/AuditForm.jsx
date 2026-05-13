import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditAPI } from '../utils/api';
import AudioPlayer from '../components/AudioPlayer';

const AuditForm = () => {
  const { songId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [song, setSong] = useState(null);
  const [responses, setResponses] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [currentTechnique, setCurrentTechnique] = useState({ description: '', category: 'rhythm' });
  const [savingAudit, setSavingAudit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('auditTemplate');
    if (stored) {
      const data = JSON.parse(stored);
      setTemplate(data.template);
      setSong(data.song);
      sessionStorage.removeItem('auditTemplate');

      // Initialize responses object
      const initialResponses = {};
      Object.keys(data.template.lenses || {}).forEach((lens) => {
        data.template.lenses[lens].questions?.forEach((q, idx) => {
          initialResponses[`${lens}-q${idx}`] = '';
        });
      });
      setResponses(initialResponses);
    }
  }, []);

  const handleResponseChange = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };
Bookmark = (bookmark) => {
    setBookmarks((prev) => [...prev, bookmark]);
    setSuccess(`Bookmarked at ${formatTime(bookmark.timestamp)}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const addTechnique = () => {
    if (currentTechnique.description.trim()) {
      setTechniques((prev) => [
        ...prev,
        { ...currentTechnique, id: Date.now() },
      ]);
      setCurrentTechnique({ description: '', category: 'rhythm' });
      setSuccess('Technique added to notebook');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`; setTimeout(() => setSuccess(''), 3000);
    }
  };

  const removeTechnique = (id) => {
    setTechniques((prev) => prev.filter((t) => t.id !== id));
  };

  const saveAudit = async () => {
    if (!songId) {
      setError('Song ID missing');
      return;
    }

    setSavingAudit(true);
    try {
      const lensSelection = template?.lenses ? Object.keys(template.lenses) : [];
      await auditAPI.create(
        songId,
        lensSelection,
        responses,
        bookmarks,
        techniques.map(({ id, ...rest }) => rest) // Remove the temporary ID
      );

      setSuccess('Audit saved successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save audit');
    } finally {
      setSavingAudit(false);
    }
  };

  if (!template || !song) {
    return <div className="loading">Loading audit...</div>;
  }

  const lenses = Object.keys(template.lenses || {});

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div

        {/* Audio Player */}
        {song.youtubeId && (
          <AudioPlayer
            youtubeId={song.youtubeId}
            onBookmark={addBookmark}
          />
        )} className="card">
        <h1>{template.title}</h1>
        <p className="card-subtitle">{song.artist}</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Workflow guidance */}
        {template.workflow_guidance && (
          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '4px', marginBottom: '30px' }}>
            <strong>💡 How to approach this audit:</strong>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>{template.workflow_guidance}</p>
          </div>
        )}

        {/* Audit questions by lens */}
        {lenses.map((lens) => {
          const lensData = template.lenses[lens];
          return (
            <div
              key={lens}
              style={{
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <h2 style={{ textTransform: 'capitalize', color: '#1976d2', marginBottom: '10px' }}>
                {lens}
              </h2>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                {lensData.description}
              </p>

              {lensData.questions?.map((question, idx) => {
                const key = `${lens}-q${idx}`;
                return (
                  <div key={key} className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', marginBottom: '8px' }}>
                      Q{idx + 1}: {question}
                    </label>
                    <textarea
                      value={responses[key] || ''}
                      onChange={(e) => handleResponseChange(key, e.target.value)}
                      placeholder="Your answer here..."
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Technique logging */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <h2>📝 Log Techniques You Discover</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            As you listen, capture techniques you want to borrow and study further
          </p>

          <div className="form-group">
            <label>Technique Description</label>
            <textarea
              value={currentTechnique.description}
              onChange={(e) =>
                setCurrentTechnique({ ...currentTechnique, description: e.target.value })
              }
              placeholder="e.g., 'Jamerson-style 2-bar pickup into bar 1'"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={currentTechnique.category}
              onChange={(e) =>
                setCurrentTechnique({ ...currentTechnique, category: e.target.value })
              }
            >
              <option value="rhythm">Rhythm</option>
              <option value="texture">Texture</option>
              <option value="harmony">Harmony</option>
              <option value="arrangement">Arrangement</option>
            </select>
          </div>

          <button onClick={addTechnique} className="secondary">
            + Add Technique
          </button>

          {techniques.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Techniques Logged ({techniques.length})</h3>
              <ul style={{ listStyle: 'none' }}>
                {techniques.map((tech) => (
                  <li
                    key={tech.id}
                    style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      marginBottom: '10px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{tech.description}</strong>
                      <br />
                      <span className="badge" style={{ marginTop: '5px' }}>
                        {tech.category}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTechnique(tech.id)}
                      className="danger"
                      style={{ padding: '5px 10px' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bookmarks Display */}
        {bookmarks.length > 0 && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <h2>🔖 Bookmarks ({bookmarks.length})</h2>
            <ul style={{ listStyle: 'none' }}>
              {bookmarks.map((bookmark, idx) => (
                <li
                  key={idx}
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                  }}
                >
                  <strong>{formatTime(bookmark.timestamp)}</strong>
                  {bookmark.note && <p style={{ marginTop: '5px' }}>{bookmark.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save button */}
        <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
          <button
            onClick={saveAudit}
            disabled={savingAudit}
            style={{ flex: 1, fontSize: '16px', padding: '15px' }}
          >
            {savingAudit ? 'Saving...' : '✓ Save Audit'}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="secondary"
            style={{ flex: 1, fontSize: '16px', padding: '15px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditForm;
