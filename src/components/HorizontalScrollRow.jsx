import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from './MovieCard';

const HorizontalScrollRow = ({ 
  title, 
  rowId, 
  filmManager, 
  onViewAll 
}) => {
  const scrollRef = useRef(null);
  const [films, setFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (filmManager && rowId) {
      try {
        const rowFilms = filmManager.getCustomRowFilms(rowId, 'row');
        setFilms(rowFilms);
      } catch (error) {
        console.error(`Ошибка загрузки фильмов для ряда ${rowId}:`, error);
        setFilms([]);
      }
    } else {
      setFilms([]);
    }
    setIsLoading(false);
  }, [filmManager, rowId, title]);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 1075;
      scrollRef.current.scrollLeft += direction * scrollAmount;
    }
  };
  
  const handleTitleClick = () => {
    if (rowId && rowId.startsWith('custom_')) {
      navigate(`/row/${rowId}`);
    }
  };
  
  const handleViewAllClick = () => {
    if (rowId && rowId.startsWith('custom_')) {
      navigate(`/row/${rowId}`);
    } else if (onViewAll) {
      onViewAll(rowId, title);
    }
  };
  
  if (isLoading) {
    return (
      <section className="custom-row-section">
        <div className="section-header">
          <h2 className="section-header-title">
            {title} <span className="arrow-icon">›</span>
          </h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
          Загрузка...
        </div>
      </section>
    );
  }
  
  if (films.length === 0) {
    return null;
  }
  
  return (
    <section className="custom-row-section">
      <div className="section-header">
        <h2 
          className="section-header-title"
          onClick={handleTitleClick}
          style={{ 
            cursor: rowId && rowId.startsWith('custom_') ? 'pointer' : 'default' 
          }}
        >
          {title} <span className="arrow-icon">›</span>
        </h2>
      </div>
      
      <div 
        className="horizontal-scroll-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* КНОПКА "НАЗАД" */}
        {isHovered && (
          <button 
            className="custom-scroll-btn left" 
            onClick={() => scroll(-1)}
            aria-label="Прокрутить влево"
          >
            <span className="nav-arrow">❮</span>
          </button>
        )}
        
        <div className="horizontal-scroll" ref={scrollRef}>
          {films.map(movie => (
            <div key={movie.id} className="custom-row-movie-card">
              <MovieCard movie={movie} />
            </div>
          ))}
          
          {/* Кнопка "Посмотреть все" */}
          <div 
            className="custom-row-view-all-card"
            onClick={handleViewAllClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="movie-card-inner">
              <div className="custom-view-all-placeholder">
                <div className="custom-view-all-icon">››</div>
                <div className="custom-view-all-text">Посмотреть все</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* КНОПКА "ВПЕРЕД" */}
        {isHovered && (
          <button 
            className="custom-scroll-btn right" 
            onClick={() => scroll(1)}
            aria-label="Прокрутить вправо"
          >
            <span className="nav-arrow">❯</span>
          </button>
        )}
      </div>
    </section>
  );
};

export default HorizontalScrollRow;