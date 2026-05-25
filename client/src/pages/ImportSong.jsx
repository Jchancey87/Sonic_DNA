import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

const ImportSong = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const navigate = useNavigate();
  const backend = useBackend();

  useEffect(() => {
    let timer;
    if (loading) {
      setProgressStep(0);
      timer = setInterval(() => {
        setProgressStep((prev) => Math.min(prev + 1, 4));
      }, 3000);
    } else {
      setProgressStep(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleImport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const response = await backend.importSong(youtubeUrl);
      setSuccess('Song imported successfully!');
      setYoutubeUrl('');
      setTimeout(() => navigate(`/audit/create/${response.song._id}`), 1000);
    } catch (err) {
      const data = err.response?.data;
      // 409: song already imported — redirect to existing song
      if (data?.error === 'already_imported' && data?.songId) {
        setSuccess("You've already imported this song — taking you there now.");
        setTimeout(() => navigate(`/audit/create/${data.songId}`), 1200);
      } else {
        setError(data?.error || err.message || 'Failed to import song');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="panel" style={{ background: '#151518', borderBottom: '2px solid #d08f60' }}>
        <h1>Import Song from YouTube</h1>
        <p className="card-subtitle">Paste a YouTube URL to import a song for analysis</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleImport}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ marginBottom: '6px' }}>YouTube URL</label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
              style={{ background: '#0a0a0c', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            />
            <small style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'Roboto Mono', fontSize: '9px', marginTop: '6px', display: 'block' }}>
              Supported: youtube.com, youtu.be, or any standard YouTube video link
            </small>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Importing...' : 'Import Song'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '11px', fontFamily: 'Roboto Mono', color: '#d08f60', marginBottom: '10px' }}>
            Signal Extraction Sequence
          </h3>
          <ul style={{ paddingLeft: '5px', lineHeight: '1.8', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            {[
              "Extract song metadata from the video signal source",
              "Deploy Tavily researcher to index historical production details",
              "Initiate audit worksheet configuration across selected lenses",
              "Generate customized GPT synthesis questions for the track",
              "Log reference observations and export portable production techniques"
            ].map((step, idx) => {
              const isDone = loading && idx < progressStep;
              const isActive = loading && idx === progressStep;
              const isPending = loading && idx > progressStep;
              
              let itemColor = 'rgba(255, 255, 255, 0.65)';
              let marker = `${idx + 1}. `;
              if (isDone) {
                itemColor = '#4ade80';
                marker = '✓ ';
              } else if (isActive) {
                itemColor = '#d08f60';
                marker = '● ';
              } else if (isPending) {
                itemColor = 'rgba(255, 255, 255, 0.25)';
              }

              return (
                <li key={idx} style={{ color: itemColor, fontWeight: isActive ? 'bold' : 'normal', transition: 'color 0.3s ease', listStyleType: 'none' }}>
                  {marker}{step}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportSong;
