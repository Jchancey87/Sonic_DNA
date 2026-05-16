import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';
import AudioPlayer from '../components/AudioPlayer';

// ── Autosave hook ────────────────────────────────────────────────────────────
function useAutosave(auditId, data, backend, delay = 3000) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty' | 'error'
  const timerRef = useRef(null);
  const isDirtyRef = useRef(false);

  const save = useCallback(async () => {
    if (!auditId || !isDirtyRef.current) return;
    setSaveStatus('saving');
    try {
      await backend.updateAudit(auditId, data);
      setSaveStatus('saved');
      isDirtyRef.current = false;
    } catch {
      setSaveStatus('error');
    }
  }, [auditId, data, backend]);

  // Mark dirty and schedule debounced save
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);
  }, [save, delay]);

  // Warn on page exit if dirty
  useEffect(() => {
    const handler = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Flush on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { saveStatus, markDirty, saveNow: save };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const s = Math.floor(seconds ?? 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SAVE_LABEL = {
  saved:  '✓ Saved',
  saving: 'Saving…',
  dirty:  '● Unsaved',
  error:  '✗ Save failed',
};
const SAVE_COLOR = {
  saved:  '#388e3c',
  saving: '#888',
  dirty:  '#b26a00',
  error:  '#c62828',
};

// ── AuditForm ────────────────────────────────────────────────────────────────
const AuditForm = () => {
  const { auditId } = useParams();   // route is now /audit/form/:auditId
  const navigate = useNavigate();
  const backend = useBackend();

  const [audit, setAudit]           = useState(null);
  const [song, setSong]             = useState(null);
  const [responses, setResponses]   = useState({});
  const [bookmarks, setBookmarks]   = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [currentTechnique, setCurrentTechnique] = useState({ description: '', lens: 'rhythm' });
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Autosave — only saves responses (bookmarks/techniques are saved immediately)
  const { saveStatus, markDirty, saveNow } = useAutosave(
    auditId,
    { responses },
    backend
  );

  // ── Load audit + song on mount ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const auditData = await backend.getAudit(auditId);
        if (!auditData) {
          setError('Audit not found');
          return;
        }
        setAudit(auditData);
        setResponses(auditData.responses || {});
        setBookmarks(auditData.bookmarks || []);
        setTechniques(auditData.techniques || []);

        const songData = await backend.getSong(
          auditData.songId?._id ?? auditData.songId
        );
        setSong(songData);
      } catch {
        setError('Failed to load audit');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auditId]);

  // ── Responses ──────────────────────────────────────────────────────────────
  const handleResponseChange = (key, value) => {
    setResponses((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    markDirty();
  };

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const addBookmark = async (bookmark) => {
    if (!playerReady) return;
    const ts = bookmark.timestampSeconds ?? bookmark.timestamp ?? 0;
    try {
      const updated = await backend.addBookmark(auditId, {
        timestampSeconds: Math.max(0, ts),
        label: '',
        note: bookmark.note || '',
        lens: null,
      });
      const newBookmarks = updated.bookmarks || updated?.audit?.bookmarks || bookmarks;
      setBookmarks(newBookmarks);
      flash(`Bookmarked at ${formatTime(ts)}`);
    } catch {
      setError('Failed to save bookmark');
    }
  };

  // ── Techniques ─────────────────────────────────────────────────────────────
  const addTechnique = () => {
    if (!currentTechnique.description.trim()) return;
    setTechniques((prev) => [
      ...prev,
      { ...currentTechnique, _tempId: Date.now() },
    ]);
    setCurrentTechnique({ description: '', lens: 'rhythm' });
    flash('Technique added');
  };

  const removeTechnique = (tempId) =>
    setTechniques((prev) => prev.filter((t) => t._tempId !== tempId));

  // ── Save (manual / final) ─────────────────────────────────────────────────
  const saveAudit = async () => {
    try {
      await backend.updateAudit(auditId, {
        responses,
        techniques: techniques.map(({ _tempId, ...rest }) => rest),
        status: 'completed',
      });
      flash('Audit saved!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save audit');
    }
  };

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };

  // ── Guided Step Actions ───────────────────────────────────────────────────
  const handleAdvanceStep = async () => {
    try {
      const updated = await backend.advanceStep(auditId);
      setAudit(updated);
      flash('Step completed!');
    } catch (err) {
      setError(err.message || 'Failed to advance step');
    }
  };

  const handleGoBackStep = async () => {
    try {
      const updated = await backend.goBackStep(auditId);
      setAudit(updated);
    } catch (err) {
      setError(err.message || 'Failed to go back');
    }
  };

  const handleSkipStep = async () => {
    try {
      const updated = await backend.skipStep(auditId);
      setAudit(updated);
    } catch (err) {
      setError(err.message || 'Failed to skip step');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading">Loading audit…</div>;
  if (error && !audit) return <div className="error">{error}</div>;
  if (!audit) return <div className="loading">Loading audit…</div>;

  const template = audit.templateQuestions;
  const lenses = template?.lenses ? Object.keys(template.lenses) : audit.lensSelection || [];
  const isGuided = audit.workflowType === 'guided';
  const currentStep = isGuided ? audit.guidedSteps.find(s => s.status === 'active') : null;
  const stepIndex = isGuided ? audit.guidedSteps.findIndex(s => s.status === 'active') : -1;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">

        {/* Save status indicator */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: SAVE_COLOR[saveStatus] }}>
            {SAVE_LABEL[saveStatus]}
          </span>
        </div>

        {/* Audio Player */}
        {song?.youtubeId && (
          <div style={{ position: 'sticky', top: '20px', zIndex: 100, marginBottom: '30px' }}>
            <AudioPlayer
              youtubeId={song.sourceId || song.youtubeId}
              onBookmark={addBookmark}
              onReady={() => setPlayerReady(true)}
            />
          </div>
        )}

        <h1>{template?.title || `${song?.title} DNA Audit`}</h1>
        <p className="card-subtitle">{song?.artistName || song?.artist}</p>

        {error   && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Guided Workflow Progress Tracker */}
        {isGuided && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              {audit.guidedSteps.map((step, idx) => (
                <div 
                  key={step.name} 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: step.status === 'complete' ? '#388e3c' : step.status === 'active' ? '#1976d2' : '#999',
                    borderBottom: `4px solid ${step.status === 'complete' ? '#388e3c' : step.status === 'active' ? '#1976d2' : '#eee'}`,
                    paddingBottom: '8px',
                    margin: '0 2px'
                  }}
                >
                  {idx + 1}. {step.name}
                </div>
              ))}
            </div>

            {currentStep && (
              <div style={{ background: '#f0f7ff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                <h3 style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Step {currentStep.stepNumber}: {currentStep.name}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{currentStep.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Template banner: fallback notice */}
        {audit.templateVersion?.startsWith('fallback') && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
            ℹ Using a standard template — custom AI questions were unavailable.
          </div>
        )}

        {/* Content area: varies by mode/step */}
        <div style={{ marginTop: '30px' }}>
          
          {/* STEP 1: LISTEN */}
          {isGuided && currentStep?.name === 'Listen' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎧</div>
              <p style={{ fontSize: '18px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                Full focus. Close your eyes. Don't take notes yet. Just experience the track from start to finish.
              </p>
            </div>
          )}

          {/* STEP 2: SKETCH */}
          {isGuided && currentStep?.name === 'Sketch' && (
            <div className="form-group">
              <label>Raw Impressions & Sketches</label>
              <textarea
                placeholder="What sonics surprised you? What's the mood? Note any 'wow' moments here. Use the bookmark button in the player to mark exact timestamps."
                style={{ height: '200px' }}
                value={responses['sketch'] || ''}
                onChange={(e) => handleResponseChange('sketch', e.target.value)}
              />
            </div>
          )}

          {/* QUICK MODE or GUIDED STEP 3: TRANSLATE (The main audit questions) */}
          {(!isGuided || currentStep?.name === 'Translate') && (
            <>
              {template?.workflow_guidance && !isGuided && (
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '6px', marginBottom: '30px' }}>
                  <strong>💡 How to approach this audit:</strong>
                  <p style={{ marginTop: '8px', fontSize: '14px' }}>{template.workflow_guidance}</p>
                </div>
              )}

              {lenses.map((lens) => {
                const lensData = template?.lenses?.[lens];
                const questions = lensData?.questions || [];
                return (
                  <div key={lens} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                    <h2 style={{ textTransform: 'capitalize', color: '#1976d2', marginBottom: '8px' }}>
                      {lens} Lens
                    </h2>
                    {lensData?.description && (
                      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                        {lensData.description}
                      </p>
                    )}
                    {questions.map((question, idx) => {
                      const key = `${lens}-q${idx}`;
                      return (
                        <div key={key} className="form-group" style={{ marginBottom: '20px' }}>
                          <label style={{ fontWeight: '600', marginBottom: '8px' }}>
                            {question}
                          </label>
                          <textarea
                            id={`response-${key}`}
                            value={responses[key] || ''}
                            onChange={(e) => handleResponseChange(key, e.target.value)}
                            onBlur={saveNow}
                            placeholder="Your technical observations…"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 4: RECREATE */}
          {isGuided && currentStep?.name === 'Recreate' && (
            <div className="form-group">
              <label>Recreation Notes</label>
              <textarea
                placeholder="If you were to transcribe or recreate a part of this, what would it be? Describe the tools, settings, or performance choices needed."
                style={{ height: '200px' }}
                value={responses['recreation'] || ''}
                onChange={(e) => handleResponseChange('recreation', e.target.value)}
              />
            </div>
          )}

          {/* QUICK MODE or GUIDED STEP 5: LOG (Techniques) */}
          {(!isGuided || currentStep?.name === 'Log') && (
            <div style={{ marginTop: '30px', paddingTop: '20px' }}>
              <h2>📝 Technique Log</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Distill your observations into portable techniques for your notebook.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Lens</label>
                  <select
                    id="technique-lens"
                    value={currentTechnique.lens}
                    onChange={(e) => setCurrentTechnique({ ...currentTechnique, lens: e.target.value })}
                  >
                    <option value="rhythm">Rhythm</option>
                    <option value="texture">Texture</option>
                    <option value="harmony">Harmony</option>
                    <option value="arrangement">Arrangement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Technique Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Ghost Note Pocket"
                    value={currentTechnique.techniqueName || ''}
                    onChange={(e) => setCurrentTechnique({ ...currentTechnique, techniqueName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  id="technique-description"
                  value={currentTechnique.description}
                  onChange={(e) => setCurrentTechnique({ ...currentTechnique, description: e.target.value })}
                  placeholder="Explain why this technique works and how to use it."
                  style={{ height: '80px' }}
                />
              </div>

              <button id="add-technique-btn" onClick={addTechnique} className="secondary" style={{ width: '100%' }}>
                + Add to Notebook
              </button>

              {techniques.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3>Logged in this session ({techniques.length})</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {techniques.map((tech) => (
                      <div
                        key={tech._tempId || tech._id}
                        style={{
                          background: '#f9f9f9',
                          padding: '12px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid #eee'
                        }}
                      >
                        <div>
                          <strong>{tech.techniqueName || 'Untitled Technique'}</strong>
                          <div style={{ fontSize: '13px', color: '#666' }}>{tech.description}</div>
                        </div>
                        <span className="badge">{tech.lens}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bookmarks: Always visible but minimized in guided mode if not relevant */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <h3>🔖 Session Bookmarks ({bookmarks.length})</h3>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
            {bookmarks.map((bm, idx) => (
              <div key={bm._id || idx} style={{ background: '#eee', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {formatTime(bm.timestampSeconds || bm.timestamp)}
              </div>
            ))}
            {bookmarks.length === 0 && <span style={{ color: '#999', fontSize: '13px' }}>No bookmarks yet.</span>}
          </div>
        </div>

        {/* Navigation / Save Footer */}
        <div style={{ marginTop: '40px', display: 'flex', gap: '10px', pt: '20px', borderTop: '2px solid #eee' }}>
          {isGuided ? (
            <>
              {stepIndex > 0 && (
                <button onClick={handleGoBackStep} className="secondary">← Back</button>
              )}
              {stepIndex < audit.guidedSteps.length - 1 ? (
                <>
                  <button onClick={handleSkipStep} className="secondary">Skip</button>
                  <button onClick={handleAdvanceStep} style={{ flex: 1 }}>Next Step →</button>
                </>
              ) : (
                <button onClick={saveAudit} style={{ flex: 1 }}>✓ Complete Audit</button>
              )}
            </>
          ) : (
            <>
              <button onClick={saveAudit} style={{ flex: 1, fontSize: '16px', padding: '15px' }}>
                ✓ Complete Audit
              </button>
              <button onClick={saveNow} className="secondary" style={{ padding: '15px' }}>
                Save Draft
              </button>
            </>
          )}
          <button onClick={() => navigate('/dashboard')} className="secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AuditForm;
