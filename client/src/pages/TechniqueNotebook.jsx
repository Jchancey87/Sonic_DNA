import React, { useState, useEffect } from 'react';
import { techniqueAPI } from '../utils/api';

const TechniqueNotebook = () => {
  const [techniques, setTechniques] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTechniques();
  }, []);

  const loadTechniques = async () => {
    try {
      const response = await techniqueAPI.getAll();
      setTechniques(response.data.techniques);
      setGrouped(response.data.grouped);
    } catch (err) {
      setError('Failed to load techniques');
    } finally {
      setLoading(false);
    }
  };

  const deleteTechnique = async (id) => {
    if (window.confirm('Delete this technique?')) {
      try {
        await techniqueAPI.delete(id);
        loadTechniques();
      } catch (err) {
        setError('Failed to delete technique');
      }
    }
  };

  const filteredTechniques = techniques.filter((tech) => {
    const matchesCategory = filterCategory === 'all' || tech.category === filterCategory;
    const matchesSearch =
      tech.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tech.notes && tech.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tech.artist && tech.artist.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="card">
        <h1>📚 Technique Notebook</h1>
        <p className="card-subtitle">
          Your personal collection of borrowed techniques and musical DNA
        </p>

        {error && <div className="error">{error}</div>}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search techniques..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Lenses</option>
            <option value="rhythm">Rhythm</option>
            <option value="texture">Texture</option>
            <option value="harmony">Harmony</option>
            <option value="arrangement">Arrangement</option>
          </select>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {['rhythm', 'texture', 'harmony', 'arrangement'].map((lens) => (
            <div key={lens} style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {grouped[lens]?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                {lens}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Techniques list */}
      {filteredTechniques.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No techniques found. Start creating audits to build your notebook!</p>
        </div>
      ) : (
        <div>
          {filterCategory === 'all'
            ? Object.entries(grouped).map(
                ([lens, lensT]) =>
                  lensT.length > 0 && (
                    <div key={lens} className="card">
                      <h2 style={{ textTransform: 'capitalize', marginBottom: '15px' }}>
                        {lens}
                      </h2>
                      <ul style={{ listStyle: 'none' }}>
                        {lensT
                          .filter((tech) =>
                            tech.description.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((tech) => (
                            <TechniqueItem
                              key={tech._id}
                              tech={tech}
                              onDelete={deleteTechnique}
                            />
                          ))}
                      </ul>
                    </div>
                  )
              )
            : filteredTechniques.map((tech) => (
                <div key={tech._id} className="card" style={{ marginBottom: '15px', padding: '15px' }}>
                  <TechniqueItem tech={tech} onDelete={deleteTechnique} />
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

const TechniqueItem = ({ tech, onDelete }) => (
  <li
    style={{
      background: '#f9f9f9',
      padding: '12px',
      marginBottom: '10px',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
    }}
  >
    <div style={{ flex: 1 }}>
      <strong>{tech.description}</strong>
      {tech.artist && <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>from {tech.artist}</p>}
      {tech.notes && <p style={{ fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>"{tech.notes}"</p>}
      <div style={{ marginTop: '8px' }}>
        <span className="badge" style={{ marginRight: '8px' }}>
          {tech.category}
        </span>
        {tech.tags?.map((tag) => (
          <span key={tag} className="badge" style={{ marginRight: '5px', fontSize: '11px' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
    <button
      onClick={() => onDelete(tech._id)}
      className="danger"
      style={{ padding: '5px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
    >
      Remove
    </button>
  </li>
);

export default TechniqueNotebook;
