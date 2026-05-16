import React, { useState, useEffect } from 'react';
import { useBackend } from '../context/BackendContext';
import EmptyState from '../components/EmptyState';

const TechniqueNotebook = () => {
  const [techniques, setTechniques] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLens, setFilterLens] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
  const backend = useBackend();

  useEffect(() => {
    loadTechniques();
  }, [searchTerm, filterLens, sortBy, order]);

  const loadTechniques = async () => {
    try {
      setLoading(true);
      const filters = {
        q: searchTerm,
        lens: filterLens === 'all' ? undefined : filterLens,
        sortBy,
        order
      };
      const response = await backend.getTechniques(filters);
      setTechniques(response.techniques);
      setGrouped(response.grouped);
    } catch (err) {
      setError('Failed to load techniques');
    } finally {
      setLoading(false);
    }
  };

  const deleteTechnique = async (id) => {
    if (window.confirm('Delete this technique from your notebook?')) {
      try {
        await backend.deleteTechnique(id);
        loadTechniques();
      } catch (err) {
        setError('Failed to delete technique');
      }
    }
  };

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && techniques.length === 0) return <div className="loading">Loading notebook...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card">
        <h1>📚 Technique Notebook</h1>
        <p className="card-subtitle">
          Your personal collection of musical DNA, portable patterns, and sonic discoveries.
        </p>

        {error && <div className="error">{error}</div>}

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', marginTop: '20px' }}>
          <div style={{ flex: 2, minWidth: '300px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Search</label>
            <input
              type="text"
              placeholder="Search by name, description, artist, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Lens</label>
            <select
              value={filterLens}
              onChange={(e) => setFilterLens(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">All Lenses</option>
              <option value="rhythm">Rhythm</option>
              <option value="texture">Texture</option>
              <option value="harmony">Harmony</option>
              <option value="arrangement">Arrangement</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="createdAt">Date Added</option>
              <option value="techniqueName">Name</option>
              <option value="lens">Lens</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        </div>

        {/* Lens Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          {['rhythm', 'texture', 'harmony', 'arrangement'].map((lens) => (
            <div key={lens} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                {grouped[lens]?.length || 0}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {lens}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Techniques list */}
      {techniques.length === 0 ? (
        <EmptyState 
          icon="📓"
          title={searchTerm || filterLens !== 'all' ? "No matching techniques" : "Notebook is empty"}
          description={searchTerm || filterLens !== 'all' ? "Try adjusting your filters or search terms." : "Start an audit on a song to discover and log techniques. Your notebook is where you collect the 'how' behind the music you love."}
          ctaLabel={searchTerm || filterLens !== 'all' ? "Clear All Filters" : "Go to Library"}
          onCtaClick={searchTerm || filterLens !== 'all' ? () => { setSearchTerm(''); setFilterLens('all'); } : null}
          ctaLink={searchTerm || filterLens !== 'all' ? null : "/dashboard"}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {techniques.map((tech) => (
            <div key={tech._id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{tech.techniqueName || 'Untitled Technique'}</h3>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <span className="badge primary">{tech.lens}</span>
                    {tech.confidence && <span className="badge">Confidence: {tech.confidence}/5</span>}
                    {tech.nextAction && <span className="badge warning">{tech.nextAction}</span>}
                  </div>
                </div>
                <button
                  onClick={() => deleteTechnique(tech._id)}
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '14px' }}
                  title="Remove from notebook"
                >
                  🗑️
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#333', marginBottom: '15px' }}>
                  {tech.description}
                </p>
                
                {(tech.artist || tech.exampleTimestamp) && (
                  <div style={{ backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                    {tech.artist && <span>📍 <strong>Source:</strong> {tech.artist}</span>}
                    {tech.exampleTimestamp !== undefined && (
                      <span style={{ marginLeft: '10px' }}>⏱️ <strong>Timestamp:</strong> {formatTimestamp(tech.exampleTimestamp)}</span>
                    )}
                  </div>
                )}

                {tech.notes && (
                  <div style={{ marginTop: '15px', borderLeft: '3px solid #ddd', paddingLeft: '12px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                    {tech.notes}
                  </div>
                )}

                {tech.tags?.length > 0 && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {tech.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', color: '#1976d2', background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechniqueNotebook;
