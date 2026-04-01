import React, { useState, useEffect } from 'react';
import HorizontalScrollRow from './HorizontalScrollRow';
import FiltersPanel from './FiltersPanel';
import MovieCard from './MovieCard';
import '../styles/pages/content.css';

const ContentPageTemplate = ({ 
  title, 
  description,
  contentType,
  films,
  customRows,
  filmManager
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeFilters, setActiveFilters] = useState({
    year: '',
    genre: '',
    country: '',
    rating: '',
    free: false
  });
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const shortDescription = description.length > 200 
    ? description.substring(0, 200) + '...' 
    : description;
  
  // Рекламный баннер (заглушка)
  const renderAdBanner = () => (
    <div className="ad-banner">
      <div className="ad-banner-content">
        <h3>Смотрите без рекламы на партнерских платформах</h3>
        <p>Тысячи фильмов и сериалов в отличном качестве</p>
        <div className="partner-logos">
          <span className="partner-logo">OKKO</span>
          <span className="partner-logo">IVI</span>
          <span className="partner-logo">Wink</span>
          <span className="partner-logo">KION</span>
        </div>
      </div>
    </div>
  );
  
  // Быстрые фильтры (кнопки с прокруткой)
  const renderQuickFilters = () => {
    const quickFilters = [
      '2025 год', '2024 год', '2023 год', '2022 год', '2021 год',
      '2020 год', '2019 год', '2018 год', 'Бесплатные',
      'Русские фильмы', 'Советские фильмы', 'Американские фильмы',
      'Индийские фильмы', 'Комедии', 'Ужасы', 'Фантастические',
      'Мелодрамы', 'Триллеры', 'Драмы', 'Военные', 'Документальные'
    ];
    
    return (
      <div className="quick-filters-section">
        <h3>Быстрый выбор</h3>
        <div className="quick-filters-container">
          <div className="quick-filters-scroll">
            {quickFilters.map(filter => (
              <button 
                key={filter}
                className={`quick-filter-btn ${activeFilters.genre === filter ? 'active' : ''}`}
                onClick={() => setActiveFilters(prev => ({...prev, genre: filter}))}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Основные фильтры (выпадающие)
  const renderMainFilters = () => (
    <FiltersPanel 
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      contentType={contentType}
    />
  );
  
  // Отфильтрованные фильмы
  const getFilteredFilms = () => {
    let filtered = films.filter(film => film.contentType === contentType);
    
    if (activeFilters.year) {
      const year = parseInt(activeFilters.year);
      if (!isNaN(year)) filtered = filtered.filter(f => f.year === year);
    }
    
    if (activeFilters.genre && activeFilters.genre !== 'Все жанры') {
      filtered = filtered.filter(f => f.genre === activeFilters.genre);
    }
    
    if (activeFilters.rating) {
      const minRating = parseFloat(activeFilters.rating);
      if (!isNaN(minRating)) filtered = filtered.filter(f => f.rating >= minRating);
    }
    
    return filtered;
  };
  
  // Ряды для этой страницы
  const getRowsForPage = () => {
    return Object.values(customRows).filter(row => 
      row.pageType === contentType && filmManager.getCustomRowFilms(row.id, 'row').length > 0
    );
  };
  
  const filteredFilms = getFilteredFilms();
  const pageRows = getRowsForPage();
  
  return (
    <div className="content-page">
      <div className="container">
        {/* Заголовок страницы */}
        <div className="page-header">
          <h1 className="page-title" style={isMobile ? { fontSize: '25px' } : {}}>
            {title} смотреть онлайн
          </h1>
          <div className="page-description">
            <p>{isExpanded ? description : shortDescription}</p>
            {description.length > 200 && (
              <button 
                className="expand-description-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Свернуть' : 'Развернуть'}
              </button>
            )}
          </div>
        </div>
        
        {/* Рекламный баннер */}
        {renderAdBanner()}
        
        {/* Быстрые фильтры */}
        {renderQuickFilters()}
        
        {/* Основные фильтры */}
        {renderMainFilters()}
        
        {/* Активные фильтры */}
        {Object.values(activeFilters).some(filter => filter) && (
          <div className="active-filters">
            <h4>Активные фильтры:</h4>
            <div className="filter-chips">
              {activeFilters.year && (
                <span className="filter-chip">
                  Год: {activeFilters.year}
                  <button onClick={() => setActiveFilters(prev => ({...prev, year: ''}))}>×</button>
                </span>
              )}
              {activeFilters.genre && (
                <span className="filter-chip">
                  Жанр: {activeFilters.genre}
                  <button onClick={() => setActiveFilters(prev => ({...prev, genre: ''}))}>×</button>
                </span>
              )}
              {activeFilters.rating && (
                <span className="filter-chip">
                  Рейтинг: {activeFilters.rating}+
                  <button onClick={() => setActiveFilters(prev => ({...prev, rating: ''}))}>×</button>
                </span>
              )}
              <button 
                className="clear-filters-btn"
                onClick={() => setActiveFilters({ year: '', genre: '', country: '', rating: '', free: false })}
              >
                Очистить все
              </button>
            </div>
          </div>
        )}
        
        {/* Кастомные ряды для этой страницы */}
        {pageRows.length > 0 ? (
          pageRows.map(row => {
            const rowFilms = filmManager.getCustomRowFilms(row.id, 'row');
            if (rowFilms.length === 0) return null;
            
            return (
              <HorizontalScrollRow
                key={row.id}
                title={row.name}
                movies={rowFilms}
                rowId={row.id}
                onViewAll={() => {
                  // Будет открывать отдельную страницу с полным списком
                  window.location.href = `/${contentType}/row/${row.id}`;
                }}
              />
            );
          })
        ) : (
          <div className="no-rows-message">
            <h3>Нет созданных подборок</h3>
            <p>Используйте админ-панель (1337) для создания подборок</p>
          </div>
        )}
        
        {/* Все фильмы этой категории */}
        {filteredFilms.length > 0 && (
          <section className="all-content-section">
            <div className="section-header">
              <h2>Все {title.toLowerCase()} ({filteredFilms.length})</h2>
              <div className="sort-options">
                <select>
                  <option>По популярности</option>
                  <option>По рейтингу</option>
                  <option>По дате добавления</option>
                  <option>По году выпуска</option>
                </select>
              </div>
            </div>
            
            <div className="content-grid">
              {filteredFilms.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            
            {filteredFilms.length > 60 && (
              <div className="pagination">
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span>...</span>
                <button className="pagination-btn">10</button>
                <button className="pagination-btn next">Далее →</button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ContentPageTemplate;