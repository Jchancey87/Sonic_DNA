import React, { useRef, useState } from 'react';
import YouTube from 'react-youtube';

const AudioPlayer = ({ youtubeId, onBookmark }) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bookmarkNote, setBookmarkNote] = useState('');

  const handleReady = (event) => {
    playerRef.current = event.target;
  };

  const handleStateChange = (event) => {
    // 1 = playing, 0 = stopped, -1 = unstarted
    setIsPlaying(event.data === 1);
  };

  const handlePlaybackRateChange = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      setCurrentTime(currentTime);
    }
  };

  const addBookmark = () => {
    if (playerRef.current) {
      const timestamp = playerRef.current.getCurrentTime();
      onBookmark({
        timestamp,
        note: bookmarkNote,
      });
      setBookmarkNote('');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const opts = {
    height: '200',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
    },
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>🎧 Audio Player</h3>

      {/* YouTube Player */}
      <YouTube
        videoId={youtubeId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
      />

      {/* Bookmark controls */}
      <div style={{ marginTop: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          📍 Bookmark this moment:
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Optional note for this bookmark"
            value={bookmarkNote}
            onChange={(e) => setBookmarkNote(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={addBookmark}
            className="secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            + Bookmark
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
