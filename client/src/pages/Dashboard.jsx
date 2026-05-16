import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

const Dashboard = () => {
  const backend = useBackend();
  const [songs, setSongs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [songsRes, auditsRes] = await Promise.all([
        backend.getSongs(search ? { search } : {}),
        backend.getAudits(),
      ]);
      setSongs(songsRes);
      setAudits(auditsRes);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deleteSong = async (songId) => {
    if (window.confirm('Delete this song and all its audits?')) {
      try {
        await backend.deleteSong(songId);
        setSongs(songs.filter((s) => s._id !== songId));
        setAudits(audits.filter((a) => a.songId?._id !== songId));
      } catch (err) {
        setError('Failed to delete song');
      }
    }
  };


  const songAuditCount = (songId) => audits.filter((a) => a.songId._id === songId).length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="card">
        <h1>🎵 Your Song Library</h1>
        <p className="card-subtitle">
          You have {songs.length} songs imported with {audits.length} total audits
        </p>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Link to="/import">
            <button>+ Import Song</button>
          </Link>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No songs imported yet.</p>
          <Link to="/import">
            <button style={{ marginTop: '15px' }}>Import your first song</button>
          </Link>
        </div>
      ) : (
        <div className="grid">
          {songs.map((song) => (
            <div key={song._id} className="card">
              {song.thumbnail && (
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '15px',
                  }}
                />
              )}
              <h3>{song.title}</h3>
              <p style={{ color: '#666', marginBottom: '10px' }}>{song.artist}</p>

              <div style={{ marginBottom: '15px' }}>
                <span className="badge primary">{songAuditCount(song._id)} audits</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to={`/audit/create/${song._id}`} style={{ flex: 1 }}>
                  <button style={{ width: '100%' }}>New Audit</button>
                </Link>
                <button
                  className="danger"
                  onClick={() => deleteSong(song._id)}
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
