import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import '../styles/pages/catalog.css';

const RowDetailPage = ({ films, filmManager }) => {
  const { rowId } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [allFilms, setAllFilms] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  
  useEffect(() => {
    if (!rowId || !filmManager) return;
    
    const rowData = filmManager.getCustomRow(rowId);
    if (!rowData) {
      navigate('/');
      return;
    }
    
    setRow(rowData);
    
    // Используем новую функцию getAllCustomRowFilms
    const allRowFilms = filmManager.getAllCustomRowFilms(rowId);
    setAllFilms(allRowFilms);
  }, [rowId, filmManager, navigate]);
  
  const getSortedFilms = (filmsToSort) => {
    const sorted = [...filmsToSort];
    
    switch(sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'year':
        return sorted.sort((a, b) => b.year - a.year);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };
  
  if (!row) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="loading-spinner">Загрузка подборки...</div>
        </div>
      </div>
    );
  }
  
  const sortedFilms = getSortedFilms(allFilms);
  
  return (
    <div className="row-detail-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{row.name}</h1>
        </div>
        
        {allFilms.length > 0 ? (
          <section className="row-section">
            <div className="section-header">
              <div className="sort-options" style={{ marginLeft: 'auto' }}>
                <span>Сортировка:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="default">По умолчанию</option>
                  <option value="rating">По рейтингу</option>
                  <option value="year">По году</option>
                  <option value="title">По названию</option>
                </select>
              </div>
            </div>
            
            <div className="content-grid">
              {sortedFilms.map(movie => (
                <div key={movie.id} className="grid-movie-card">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="no-results">
            <h3>Подборка пуста</h3>
            <button 
              className="primary-button"
              onClick={() => navigate('/')}
              style={{ marginTop: '20px' }}
            >
              На главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RowDetailPage;