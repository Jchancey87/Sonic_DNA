import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

const TYPE_COLORS = {
  intro: '#fbbf24',       // amber
  verse: '#34d399',       // emerald
  chorus: '#a78bfa',      // violet
  bridge: '#fb7185',      // rose
  outro: '#9ca3af',       // gray
  'pre-chorus': '#22d3ee', // cyan
  solo: '#f97316',        // orange
  custom: '#f472b6'       // pink
};

// ── Auto-expanding observations field ──
const AutoExpandingTextarea = ({ value, onChange, placeholder, disabled }) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '70px',
        maxHeight: '260px',
        background: '#161619',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '4px',
        padding: '10px 12px',
        color: '#ffffff',
        fontSize: '14px',
        lineHeight: '1.5',
        resize: 'none',
        outline: 'none',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    />
  );
};

const ArrangementTimelineWidget = ({ responses, onChange, song, lensData, readOnly = false, saveNow }) => {
  const { loadSong, activeSong, play, seekTo, currentTime } = useAudio();
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const trackRef = useRef(null);

  // Parse blocks array from responses
  const rawTimeline = responses['arrangement-timeline'];
  let blocks = [];
  try {
    blocks = typeof rawTimeline === 'string' 
      ? JSON.parse(rawTimeline) 
      : (rawTimeline || []);
  } catch (err) {
    console.error('Failed to parse arrangement timeline:', err);
  }

  // Ensure blocks are sorted by start time
  const sortedBlocks = [...blocks].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const totalDuration = song?.durationSeconds || sortedBlocks.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0) || 120;

  const selectedBlock = sortedBlocks.find(b => b.id === selectedBlockId);

  // Formatting helpers
  const formatTime = (seconds) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const parts = str.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return minutes * 60 + seconds;
    }
    return parseInt(str, 10) || 0;
  };

  const saveBlocks = (newBlocks) => {
    onChange('arrangement-timeline', JSON.stringify(newBlocks));
  };

  const addBlock = () => {
    const lastBlock = sortedBlocks[sortedBlocks.length - 1];
    const newStart = lastBlock 
      ? (lastBlock.startTime || 0) + (lastBlock.duration || 30) 
      : 0;

    const newBlock = {
      id: 'block-' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: 'New Section',
      type: 'verse',
      startTime: newStart,
      duration: 30,
      notes: ''
    };

    const newBlocks = [...blocks, newBlock];
    saveBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    if (saveNow) setTimeout(saveNow, 100);
  };

  const updateBlock = (blockId, fields) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...fields };
      }
      return b;
    });
    saveBlocks(newBlocks);
  };

  const deleteBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    saveBlocks(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    if (saveNow) setTimeout(saveNow, 100);
  };

  const handleSeek = (seconds) => {
    const sId = song?._id;
    if (!sId) return;

    if (activeSong && activeSong._id === sId) {
      seekTo(seconds);
      play();
    } else {
      loadSong(song);
      setTimeout(() => {
        seekTo(seconds);
        play();
      }, 800);
    }
  };

  // Compute active block based on player's currentTime
  const activeBlock = sortedBlocks.find((b) => {
    const start = b.startTime || 0;
    const end = start + (b.duration || 0);
    return currentTime >= start && currentTime < end;
  });

  // ── Keyboard shortcuts listener ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (selectedBlock) {
          handleSeek(selectedBlock.startTime || 0);
        } else {
          // Play the general track
          const playButton = document.querySelector('button[title*="Play"], button[title*="play"], button.play-btn');
          if (playButton) playButton.click();
        }
      }

      if (e.code === 'ArrowLeft' && sortedBlocks.length > 0) {
        e.preventDefault();
        const currentIndex = sortedBlocks.findIndex(b => b.id === selectedBlockId);
        if (currentIndex > 0) {
          setSelectedBlockId(sortedBlocks[currentIndex - 1].id);
        } else if (currentIndex === -1) {
          setSelectedBlockId(sortedBlocks[sortedBlocks.length - 1].id);
        }
      }

      if (e.code === 'ArrowRight' && sortedBlocks.length > 0) {
        e.preventDefault();
        const currentIndex = sortedBlocks.findIndex(b => b.id === selectedBlockId);
        if (currentIndex < sortedBlocks.length - 1 && currentIndex !== -1) {
          setSelectedBlockId(sortedBlocks[currentIndex + 1].id);
        } else if (currentIndex === -1) {
          setSelectedBlockId(sortedBlocks[0].id);
        }
      }

      if ((e.key === 'a' || e.key === 'A') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (!readOnly) {
          e.preventDefault();
          addBlock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, sortedBlocks, readOnly]);

  // ── Mouse Drag Resize Implementation ──
  const handleResizeStart = (e, block) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;

    const startX = e.clientX;
    const startDuration = block.duration || 30;
    const trackWidth = trackRef.current.getBoundingClientRect().width;
    const pxPerSecond = trackWidth / totalDuration;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = deltaX / pxPerSecond;
      const newDuration = Math.max(1, Math.round(startDuration + deltaSecs));
      
      const updatedBlocks = blocks.map(b => {
        if (b.id === block.id) {
          return { ...b, duration: newDuration };
        }
        return b;
      });
      onChange('arrangement-timeline', JSON.stringify(updatedBlocks));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (saveNow) saveNow();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ── Render ticks for the ruler ──
  const renderRulerTicks = () => {
    const tickInterval = totalDuration > 360 ? 60 : 30; // Every 60s for long songs, 30s otherwise
    const ticksCount = Math.floor(totalDuration / tickInterval);
    const ticks = [];
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(i * tickInterval);
    }

    return (
      <div style={{
        position: 'relative',
        height: '28px',
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontSize: '11px',
        fontFamily: '"Roboto Mono", monospace',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: '6px'
      }}>
        {ticks.map(t => {
          const leftPct = (t / totalDuration) * 100;
          if (leftPct > 98) return null; // Avoid boundary overflow
          return (
            <div key={t} style={{
              position: 'absolute',
              left: `${leftPct}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%'
            }}>
              <span>{formatTime(t)}</span>
              <div style={{ width: '1px', height: '6px', background: 'rgba(255,255,255,0.15)', marginTop: '2px' }} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '24px', 
      width: '100%', 
      margin: '10px 0 25px 0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* ── TOP SECTION: Workstation Timeline & Inspector ── */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        width: '100%'
      }}>
        
        {/* Workspace Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '13px', 
            fontFamily: '"Roboto Mono", monospace', 
            letterSpacing: '0.05em', 
            color: 'rgba(255,255,255,0.45)' 
          }}>
            🎹 WORKSPACE ARRANGEMENT TIMELINE {sortedBlocks.length > 0 && `(${formatTime(totalDuration)} total)`}
          </h3>
          {!readOnly && (
            <button 
              type="button" 
              onClick={addBlock}
              style={{ 
                padding: '8px 18px', 
                fontSize: '13px', 
                fontWeight: '600',
                background: '#d08f60', 
                color: '#151518', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: '"Roboto Mono", monospace',
                boxShadow: '0 2px 6px rgba(208, 143, 96, 0.25)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.96)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              + Add Section
            </button>
          )}
        </div>

        {/* Workstation view Container */}
        {sortedBlocks.length === 0 ? (
          <div style={{
            padding: '50px 20px',
            textAlign: 'center',
            background: '#111114',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '4px',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            No arrangement sections defined. Click "+ Add Section" (or press key 'A') to begin mapping.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Timeline Wrapper (Ruler + Track) */}
            <div style={{ 
              background: '#0c0c0f', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid rgba(255,255,255,0.05)' 
            }}>
              
              {/* Ruler */}
              {renderRulerTicks()}

              {/* Visual Track container */}
              <div 
                ref={trackRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '120px',
                  background: '#070709',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  padding: '6px',
                  gap: '6px',
                  overflowX: 'auto',
                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.7)',
                  alignItems: 'stretch'
                }}
              >
                {/* SVG audio waveform background overlay */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }} preserveAspectRatio="none">
                  {Array.from({ length: 90 }).map((_, i) => {
                    const height = Math.max(1, 15 + Math.sin(i * 0.18) * 20 + Math.cos(i * 0.45) * 12);
                    return (
                      <rect
                        key={i}
                        x={`${(i / 90) * 100}%`}
                        y={`${50 - height/2}%`}
                        width="2px"
                        height={`${height}%`}
                        fill="#ffffff"
                      />
                    );
                  })}
                </svg>

                {sortedBlocks.map((block, idx) => {
                  const duration = block.duration || 30;
                  const widthPct = (duration / totalDuration) * 100;
                  const isSelected = block.id === selectedBlockId;
                  const isCurrent = activeBlock && activeBlock.id === block.id;
                  const color = TYPE_COLORS[block.type] || TYPE_COLORS.custom;

                  // Active Playback Progress (0 to 100% inside current playing block)
                  let progressInBlock = 0;
                  if (isCurrent && activeBlock) {
                    const elapsed = currentTime - (activeBlock.startTime || 0);
                    progressInBlock = Math.min(100, Math.max(0, (elapsed / (activeBlock.duration || 1)) * 100));
                  }

                  return (
                    <div
                      key={block.id}
                      onClick={() => {
                        if (!readOnly) {
                          setSelectedBlockId(isSelected ? null : block.id);
                        } else {
                          handleSeek(block.startTime || 0);
                        }
                      }}
                      style={{
                        flex: `0 0 max(140px, ${widthPct}%)`,
                        background: isSelected ? 'rgba(255, 255, 255, 0.04)' : '#111114',
                        border: `1px solid ${isSelected ? '#d08f60' : 'rgba(255,255,255,0.05)'}`,
                        borderLeft: `4px solid ${color}`,
                        borderRadius: '3px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(208, 143, 96, 0.15)' : (isCurrent ? `0 0 8px ${color}30` : 'none'),
                        position: 'relative',
                        overflow: 'hidden',
                        userSelect: 'none'
                      }}
                      title={block.notes ? `Observations: ${block.notes}` : `Click to ${readOnly ? 'seek' : 'edit'}`}
                    >
                      {/* Playhead progress bar within the block */}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          bottom: 0,
                          height: '2px',
                          background: color,
                          width: `${progressInBlock}%`,
                          transition: 'width 0.4s linear',
                          zIndex: 1
                        }} />
                      )}

                      {/* Header block details */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ 
                            fontWeight: '600', 
                            fontSize: '13px', 
                            color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)', 
                            textOverflow: 'ellipsis', 
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {block.name}
                          </span>
                        </div>
                        {block.notes && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'rgba(255,255,255,0.35)', 
                            display: 'block', 
                            textOverflow: 'ellipsis', 
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            {block.notes}
                          </span>
                        )}
                      </div>

                      {/* Times Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '11px', color: color, fontWeight: 'bold' }}>
                          {formatTime(block.startTime)}
                        </span>
                        <span style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                          {block.duration}s
                        </span>
                      </div>

                      {/* DRAG-RESIZE HANDLE */}
                      {!readOnly && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, block)}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '6px',
                            cursor: 'col-resize',
                            background: isSelected ? 'rgba(208, 143, 96, 0.15)' : 'transparent',
                            transition: 'background 0.2s',
                            zIndex: 5
                          }}
                          title="Drag edge to resize duration"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{
                            width: '2px',
                            height: '18px',
                            background: isSelected ? '#d08f60' : 'rgba(255,255,255,0.15)',
                            margin: 'auto',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: '2px',
                            borderRadius: '1px'
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Global Playhead marker line */}
                {activeSong && song?._id === activeSong._id && currentTime > 0 && currentTime <= totalDuration && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${(currentTime / totalDuration) * 100}%`,
                      width: '1px',
                      background: '#f43f5e',
                      boxShadow: '0 0 8px #f43f5e',
                      pointerEvents: 'none',
                      zIndex: 10,
                      transition: 'left 0.4s linear'
                    }}
                  />
                )}
              </div>
            </div>

            {/* ── CONTEXTUAL SECTION INSPECTOR ── */}
            {!readOnly && selectedBlock && (
              <div 
                style={{
                  background: '#111114',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: TYPE_COLORS[selectedBlock.type] || TYPE_COLORS.custom,
                      boxShadow: `0 0 6px ${TYPE_COLORS[selectedBlock.type] || TYPE_COLORS.custom}`
                    }} />
                    <strong style={{ fontSize: '13px', fontFamily: '"Roboto Mono", monospace', color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      INSPECTOR: {selectedBlock.name}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBlock(selectedBlock.id)}
                    style={{ 
                      padding: '5px 12px', 
                      fontSize: '12px', 
                      border: '1px solid rgba(244, 63, 94, 0.3)', 
                      background: 'rgba(244, 63, 94, 0.05)',
                      color: '#f43f5e',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: '"Roboto Mono", monospace'
                    }}
                  >
                    Delete Section
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Basic fields grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    
                    {/* Section Name */}
                    <div className="form-group">
                      <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                        Section Name
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.name}
                        onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                        placeholder="e.g. Verse 1, Chorus A"
                        style={{
                          width: '100%',
                          background: '#161619',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                          padding: '10px 12px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Timing controls grouped */}
                    <div className="form-group">
                      <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                        Timing Boundaries
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            value={formatTime(selectedBlock.startTime)}
                            onChange={(e) => updateBlock(selectedBlock.id, { startTime: parseTime(e.target.value) })}
                            placeholder="Start mm:ss"
                            style={{
                              width: '100%',
                              background: '#161619',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '4px',
                              padding: '10px 12px',
                              color: '#ffffff',
                              fontSize: '14px',
                              outline: 'none',
                              fontFamily: '"Roboto Mono", monospace'
                            }}
                          />
                          <span style={{ position: 'absolute', right: '8px', top: '11px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                            Start
                          </span>
                        </div>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="number"
                            value={selectedBlock.duration}
                            onChange={(e) => updateBlock(selectedBlock.id, { duration: parseInt(e.target.value) || 0 })}
                            placeholder="Duration (s)"
                            style={{
                              width: '100%',
                              background: '#161619',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '4px',
                              padding: '10px 12px',
                              color: '#ffffff',
                              fontSize: '14px',
                              outline: 'none',
                              fontFamily: '"Roboto Mono", monospace'
                            }}
                          />
                          <span style={{ position: 'absolute', right: '8px', top: '11px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                            Secs
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateBlock(selectedBlock.id, { startTime: Math.floor(currentTime) })}
                          style={{ 
                            padding: '0 14px', 
                            fontSize: '13px', 
                            background: 'rgba(208, 143, 96, 0.1)', 
                            color: '#d08f60', 
                            border: '1px solid rgba(208, 143, 96, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Capture current player time"
                        >
                          🎯 Sync
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Category Swatch Picker */}
                  <div className="form-group">
                    <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
                      Category / Sound Type
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {Object.keys(TYPE_COLORS).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateBlock(selectedBlock.id, { type })}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: `1px solid ${selectedBlock.type === type ? TYPE_COLORS[type] : 'rgba(255,255,255,0.06)'}`,
                            background: selectedBlock.type === type ? `${TYPE_COLORS[type]}20` : '#161619',
                            color: selectedBlock.type === type ? '#ffffff' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: '"Roboto Mono", monospace',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: TYPE_COLORS[type] }} />
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progressive Disclosure Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#d08f60',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: '"Roboto Mono", monospace',
                        outline: 'none'
                      }}
                    >
                      <span>{showAdvanced ? '▼ Hide Advanced Production Cues' : '▶ Show Advanced Production Cues'}</span>
                    </button>
                  </div>

                  {/* Advanced Observations Panel */}
                  {showAdvanced && (
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                        Production Cues / Dynamic Actions
                      </label>
                      <AutoExpandingTextarea
                        value={selectedBlock.notes || ''}
                        onChange={(e) => updateBlock(selectedBlock.id, { notes: e.target.value })}
                        placeholder="e.g. Drums filter out, synth pad sweeps, vocal delays increase..."
                      />
                    </div>
                  )}

                  {/* Inspector Footer Actions */}
                  <div style={{ 
                    marginTop: '10px', 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'flex-end',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '14px'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleSeek(selectedBlock.startTime || 0)}
                      style={{ 
                        padding: '8px 18px', 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        background: '#d08f60',
                        color: '#151518',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: '"Roboto Mono", monospace'
                      }}
                    >
                      ▶ Play Section
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBlockId(null)}
                      style={{ 
                        padding: '8px 14px', 
                        fontSize: '13px', 
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.4)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: '"Roboto Mono", monospace'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                      onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                    >
                      Close Inspector
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM SECTION: Guidance & Prompt Responses (Analysis Matrix) ── */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        background: '#111114', 
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '4px',
        width: '100%'
      }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <h3 style={{ 
            margin: 0, 
            fontFamily: '"Roboto Mono", monospace', 
            fontSize: '14px', 
            color: '#d08f60', 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase' 
          }}>
            🔬 ANALYSIS MATRIX: ARRANGEMENT
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
            Map sections, transitions, and dynamic layers over the timeline.
          </p>
        </div>

        {/* Guidance and prompts */}
        {lensData?.description && (
          <div style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.6)', 
            lineHeight: '1.5',
            background: '#161619',
            padding: '14px 16px',
            borderLeft: '3px solid #d08f60',
            borderRadius: '2px'
          }}>
            {lensData.description}
          </div>
        )}

        {/* Practical tailored exercises */}
        {lensData?.exercises && lensData.exercises.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '12px', color: '#d08f60', textTransform: 'uppercase' }}>
              Exercises
            </span>
            {lensData.exercises.map((ex, idx) => (
              <div key={idx} style={{ background: '#0c0c0f', padding: '12px 14px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>{ex.name}</strong>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                  {ex.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Adaptive Questions */}
        {lensData?.questions && lensData.questions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '5px' }}>
            <span style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '12px', color: '#d08f60', textTransform: 'uppercase' }}>
              Structural Inquiries
            </span>
            {lensData.questions.map((question, idx) => {
              const key = `arrangement-q${idx}`;
              const val = responses[key] || '';
              return (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontWeight: '500', lineHeight: '1.4' }}>
                    {question}
                  </label>
                  {readOnly ? (
                    <div style={{ 
                      background: '#0c0c0f', 
                      padding: '12px 14px', 
                      borderRadius: '4px', 
                      border: '1px solid rgba(255,255,255,0.03)',
                      fontSize: '13px', 
                      color: 'rgba(255,255,255,0.7)', 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.4' 
                    }}>
                      {val || <em style={{ color: 'rgba(255,255,255,0.3)' }}>No response entered</em>}
                    </div>
                  ) : (
                    <textarea
                      value={val}
                      onChange={(e) => onChange(key, e.target.value)}
                      onBlur={saveNow}
                      placeholder="Add technical findings..."
                      style={{
                        width: '100%',
                        height: '80px',
                        background: '#161619',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '4px',
                        padding: '10px 12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'system-ui, sans-serif'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrangementTimelineWidget;
