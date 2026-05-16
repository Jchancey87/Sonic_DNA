import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';
import EmptyState from '../components/EmptyState';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const Dashboard = () => {
  const backend = useBackend();
  const [songs, setSongs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);

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

  const openDeleteModal = (song) => {
    setSongToDelete(song);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;
    
    try {
      await backend.deleteSong(songToDelete._id);
      setSongs(songs.filter((s) => s._id !== songToDelete._id));
      setAudits(audits.filter((a) => (a.songId?._id || a.songId) !== songToDelete._id));
      setIsDeleteModalOpen(false);
      setSongToDelete(null);
    } catch (err) {
      setError('Failed to delete song');
    }
  };

  const songAuditCount = (songId) => audits.filter((a) => (a.songId?._id || a.songId) === songId).length;

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1>🎵 Your Song Library</h1>
          <Link to="/import">
            <button>+ Import Song</button>
          </Link>
        </div>
        
        <p className="card-subtitle">
          You have {songs.length} songs imported with {audits.length} total audits
        </p>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Search by title, artist, or research info..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {songs.length === 0 ? (
        <EmptyState 
          icon="🎧"
          title={search ? "No songs match your search" : "Your library is empty"}
          description={search ? "Try a different search term or clear the filter." : "Import your first YouTube song to start a deep-dive audit and build your technique notebook."}
          ctaLabel={search ? "Clear Search" : "Import First Song"}
          onCtaClick={search ? () => setSearch('') : null}
          ctaLink={search ? null : "/import"}
        />
      ) : (
        <div className="grid">
          {songs.map((song) => (
            <div key={song._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {(song.thumbnailUrl || song.thumbnail) && (
                <img
                  src={song.thumbnailUrl || song.thumbnail}
                  alt={song.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '15px',
                  }}
                />
              )}
              <h3 style={{ marginBottom: '5px' }}>{song.title}</h3>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                {song.artistName || song.artist}
              </p>

              <div style={{ marginBottom: 'auto', display: 'flex', gap: '8px' }}>
                <span className="badge primary">{songAuditCount(song._id)} audits</span>
                {song.researchStatus === 'success' && <span className="badge">Researched</span>}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Link to={`/audit/create/${song._id}`} style={{ flex: 1 }}>
                  <button style={{ width: '100%' }}>New Audit</button>
                </Link>
                <button
                  className="danger"
                  onClick={() => openDeleteModal(song)}
                  style={{ flex: 0 }}
                  title="Delete Song"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        type="song"
        id={songToDelete?._id}
        backend={backend}
      />
    </div>
  );
};

export default Dashboard;
