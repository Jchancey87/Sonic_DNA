import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

const ImportSong = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const backend = useBackend();

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

      setTimeout(() => {
        navigate(`/audit/create/${response.song._id}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to import song');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h1>Import Song from YouTube</h1>
        <p className="card-subtitle">Paste a YouTube URL to import a song for analysis</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleImport}>
          <div className="form-group">
            <label>YouTube URL</label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
            />
            <small style={{ color: '#666' }}>
              Supported: youtube.com, youtu.be, or any standard YouTube video link
            </small>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Importing...' : 'Import Song'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <h3>What happens next?</h3>
          <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>We'll extract the song title and artist from YouTube</li>
            <li>Tavily will research the song to provide context and production info</li>
            <li>You'll create an audit and choose which lenses to study (rhythm, texture, harmony, arrangement)</li>
            <li>GPT-4 will generate customized audit questions based on the song</li>
            <li>You'll fill out the audit while listening and capture techniques you discover</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ImportSong;
