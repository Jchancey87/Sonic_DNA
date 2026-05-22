import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LENS_META = {
  rhythm:      { emoji: '🥁', label: 'Rhythm',      desc: 'Groove, pocket, and timing' },
  texture:     { emoji: '🎛️', label: 'Texture',     desc: 'Timbre, space, and mixing' },
  harmony:     { emoji: '🎹', label: 'Harmony',     desc: 'Chords, progressions, keys' },
  arrangement: { emoji: '🎼', label: 'Arrangement', desc: 'Transitions and energy arcs' },
};

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const Settings = () => {
  const { user, updateUserPreferences } = useAuth();

  const currentPrefs = user?.preferences || {};
  const [defaultWorkflow, setDefaultWorkflow] = useState(currentPrefs.defaultWorkflow || 'quick');
  const [preferredLenses, setPreferredLenses] = useState(currentPrefs.preferredLenses || []);
  const [timezone, setTimezone] = useState(currentPrefs.timezone || 'UTC');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const toggleLens = (lens) => {
    setPreferredLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await updateUserPreferences({
        defaultWorkflow,
        preferredLenses,
        timezone,
      });
      setSuccess('Preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="panel" style={{ background: '#151518', borderBottom: '2px solid #d08f60' }}>
        <h1>Preferences & Settings</h1>
        <p className="card-subtitle">Customize the default behavior of your Sonic DNA workshop</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSave}>
          {/* User profile info */}
          <div style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ color: '#d08f60', fontSize: '12px', fontFamily: 'Roboto Mono', textTransform: 'uppercase' }}>
              Account Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Email:</span>
              <span style={{ fontFamily: 'Roboto Mono' }}>{user?.email}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Name:</span>
              <span>{user?.name || user?.displayName || 'User'}</span>
            </div>
          </div>

          {/* Workflow setting */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>Default Workflow</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.45)', marginBottom: '15px', fontSize: '12px' }}>
              Choose which workflow sequence opens by default when configuring a new audit:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {[
                { id: 'quick',   emoji: '⚡', label: 'Quick',   desc: 'Unified single-page form workflow' },
                { id: 'guided',  emoji: '🎓', label: 'Guided',  desc: 'Interactive step-by-step audit sequence' },
              ].map((w) => {
                const active = defaultWorkflow === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setDefaultWorkflow(w.id)}
                    style={{
                      background: active ? '#d08f60' : '#1c1c22',
                      color: active ? '#0c0c0e' : '#d08f60',
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: `1px solid ${active ? '#d08f60' : 'rgba(208, 143, 96, 0.3)'}`,
                      borderRadius: '2px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontFamily: 'Roboto Mono', textTransform: 'uppercase' }}>
                      {w.emoji} {w.label}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      fontFamily: 'Inter',
                      fontWeight: 'normal',
                      color: active ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.3'
                    }}>
                      {w.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lenses setting */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>Preferred Lenses</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.45)', marginBottom: '15px', fontSize: '12px' }}>
              Select which lenses are pre-checked by default for new audits:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {Object.entries(LENS_META).map(([lens, meta]) => {
                const active = preferredLenses.includes(lens);
                return (
                  <button
                    key={lens}
                    type="button"
                    onClick={() => toggleLens(lens)}
                    style={{
                      background: active ? '#d08f60' : '#1c1c22',
                      color: active ? '#0c0c0e' : '#d08f60',
                      padding: '12px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: `1px solid ${active ? '#d08f60' : 'rgba(208, 143, 96, 0.3)'}`,
                      borderRadius: '2px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{meta.emoji}</div>
                    <div style={{ fontFamily: 'Roboto Mono', fontSize: '10px', textTransform: 'uppercase' }}>
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone setting */}
          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label style={{ marginBottom: '6px' }}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ background: '#0a0a0c', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px' }}>
            {saving ? 'SAVING CONFIGURATION...' : 'SAVE PREFERENCES'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
