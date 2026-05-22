import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useBackend } from './BackendContext';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const backend = useBackend();
  const [activeSong, setActiveSong] = useState(null);
  const [activeAudit, setActiveAudit] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  // Issue 2: track embed errors so we can show a fallback link
  const [embedError, setEmbedError] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);

  // Poll current time when playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Sync bookmarks if active audit updates
  useEffect(() => {
    if (activeAudit) {
      setBookmarks(activeAudit.bookmarks || []);
    } else {
      setBookmarks([]);
    }
  }, [activeAudit]);

  const loadSong = (song) => {
    if (!song) return;
    setActiveSong(song);
    setCurrentTime(0);
    setDuration(song.durationSeconds || 0);
    setEmbedError(false); // reset error on new song load
  };

  const play = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const seekTo = (seconds) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const changeVolume = (newVolume) => {
    const vol = Math.max(0, Math.min(100, newVolume));
    setVolume(vol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(vol);
    }
  };

  const toggleMute = () => {
    if (playerRef.current && typeof playerRef.current.mute === 'function') {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const addGlobalBookmark = async (note) => {
    if (!activeAudit) return null;
    try {
      const ts = Math.max(0, Math.floor(currentTime));
      const updated = await backend.addBookmark(activeAudit._id, {
        timestampSeconds: ts,
        label: '',
        note: note || '',
        lens: null,
      });
      const newBookmarks = updated.bookmarks || updated?.audit?.bookmarks || [];
      setBookmarks(newBookmarks);
      setActiveAudit((prev) => (prev ? { ...prev, bookmarks: newBookmarks } : prev));
      return newBookmarks;
    } catch (err) {
      console.error('Failed to add global bookmark:', err);
      return null;
    }
  };

  const handleReady = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
    if (isMuted) playerRef.current.mute();
    else playerRef.current.unMute();
    setDuration(playerRef.current.getDuration() || (activeSong ? activeSong.durationSeconds : 0));
  };

  const handleStateChange = (event) => {
    const state = event.data;
    setIsPlaying(state === 1);
    if (state === 1) {
      setDuration(playerRef.current.getDuration());
    }
  };

  // Issue 2: handle YouTube player errors (101/150 = embedding blocked)
  const handleError = (event) => {
    const code = event.data;
    console.warn('[YouTube Player] Error code:', code);
    // 101 & 150 = video not allowed to be embedded by owner
    if (code === 101 || code === 150) {
      setEmbedError(true);
    }
  };

  const youtubeId = activeSong?.sourceId || activeSong?.youtubeId;
  const youtubeWatchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null;

  // Issue 2: enable controls and add origin for trusted embedding
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,          // ← was 0; native controls needed for embedding trust + browser policy
      modestbranding: 1,
      rel: 0,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    },
  };

  const value = {
    activeSong,
    activeAudit,
    setActiveAudit,
    bookmarks,
    setBookmarks,
    youtubeId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    showVideo,
    setShowVideo,
    embedError,
    loadSong,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume: changeVolume,
    toggleMute,
    addGlobalBookmark,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}

      {/* Issue 2 & 5: Global YouTube monitor — always interactive (no pointerEvents:none) */}
      {youtubeId && (
        <div
          id="global-youtube-monitor"
          style={{
            position: 'fixed',
            bottom: showVideo ? '155px' : '-220px', // sit above the tape deck (tape deck ~140px tall)
            right: '15px',
            width: '240px',
            height: '160px',
            zIndex: 10000,
            background: '#0a0a0c',
            border: `1px solid ${embedError ? 'rgba(248,113,113,0.4)' : 'rgba(208,143,96,0.4)'}`,
            borderRadius: '2px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
            transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            // Issue 5: removed pointerEvents:none so the player is clickable
          }}
        >
          {embedError ? (
            /* Fallback when video embedding is blocked */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                textAlign: 'center',
                background: '#0c0c0e',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#f87171',
                  fontFamily: 'Roboto Mono',
                  marginBottom: '8px',
                  lineHeight: '1.4',
                }}
              >
                Embedding restricted by video owner
              </div>
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '10px',
                  color: '#d08f60',
                  fontFamily: 'Roboto Mono',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Open in YouTube →
              </a>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', fontFamily: 'Roboto Mono' }}>
                Tape deck controls still work
              </div>
            </div>
          ) : (
            <YouTube
              videoId={youtubeId}
              opts={opts}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onError={handleError}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      )}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
