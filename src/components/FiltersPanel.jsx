import React, { useState, useEffect } from 'react';

const FiltersPanel = ({ activeFilters, onFilterChange, contentType, films }) => {
  const [isOpen, setIsOpen] = useState(() => {
    // При инициализации проверяем, есть ли сохраненное состояние
    const savedState = sessionStorage.getItem('filtersPanelOpen');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [localFilters, setLocalFilters] = useState({
    year: '',
    genre: '',
    country: '',
    rating: '',
    age: '',
    seasons: ''
  });
  
  // Сохраняем состояние в sessionStorage при каждом изменении
  useEffect(() => {
    if (isMobile) {
      sessionStorage.setItem('filtersPanelOpen', JSON.stringify(isOpen));
    }
  }, [isOpen, isMobile]);
  
  // Определяем мобильное устройство
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // На ПК фильтры всегда открыты по умолчанию
      if (window.innerWidth > 768) {
        setIsOpen(true);
        sessionStorage.setItem('filtersPanelOpen', JSON.stringify(true));
      }
    };
    
    // Устанавливаем начальное состояние
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Получаем уникальные значения из фильмов
  const getUniqueValues = (key) => {
    const values = new Set();
    films.forEach(film => {
      if (film[key]) {
        if (key === 'genre' || key === 'country') {
          film[key].split(',').map(item => item.trim()).forEach(item => {
            if (item) values.add(item);
          });
        } else {
          values.add(film[key]);
        }
      }
    });
    return Array.from(values).sort();
  };
  
  const uniqueGenres = getUniqueValues('genre');
  const uniqueCountries = getUniqueValues('country');
  const uniqueYears = getUniqueValues('year').sort((a, b) => b - a);
  
  // Возрастные рейтинги
  const ageRatings = ['0+', '6+', '12+', '16+', '18+'];
  
  // Рейтинги
  const ratingOptions = ['7', '8', '9'];
  
  // Сезоны для сериалов
  const seasonOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);
  
  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };
  
  const applyFilters = () => {
    const cleanFilters = {};
    Object.keys(localFilters).forEach(key => {
      if (localFilters[key] && localFilters[key] !== '') {
        cleanFilters[key] = localFilters[key];
      }
    });
    onFilterChange(cleanFilters);
    // На мобильных закрываем после применения
    if (isMobile) {
      setIsOpen(false);
      sessionStorage.setItem('filtersPanelOpen', JSON.stringify(false));
    }
  };
  
  const resetFilters = () => {
    const emptyFilters = {
      year: '',
      genre: '',
      country: '',
      rating: '',
      age: '',
      seasons: ''
    };
    setLocalFilters(emptyFilters);
    onFilterChange({});
    if (isMobile) {
      setIsOpen(false);
      sessionStorage.setItem('filtersPanelOpen', JSON.stringify(false));
    }
  };
  
  const toggleFilters = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    sessionStorage.setItem('filtersPanelOpen', JSON.stringify(newState));
  };
  
  return (
    <div className="filters-panel-container">
      {/* Кнопка открытия/закрытия фильтров - показываем всегда */}
      <button 
        className={`filters-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleFilters}
      >
        <div className="filters-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round"/>
            <circle cx="8" cy="6" r="2" fill="none"/>
            <circle cx="16" cy="12" r="2" fill="none"/>
            <circle cx="12" cy="18" r="2" fill="none"/>
          </svg>
        </div>
        <span className="filters-toggle-text">
          {isOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
        </span>
      </button>
      
      {/* Панель фильтров */}
      {isOpen && (
        <div className="filters-panel">
          <div className={`filters-grid ${contentType === 'series' ? 'with-seasons' : ''}`}>
            {/* Год */}
            <div className="filter-item">
              <label>Год</label>
              <select 
                value={localFilters.year || ''}
                onChange={(e) => handleChange('year', e.target.value)}
              >
                <option value="">Все годы</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Жанр */}
            <div className="filter-item">
              <label>Жанр</label>
              <select 
                value={localFilters.genre || ''}
                onChange={(e) => handleChange('genre', e.target.value)}
              >
                <option value="">Все жанры</option>
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            {/* Страна */}
            <div className="filter-item">
              <label>Страна</label>
              <select 
                value={localFilters.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
              >
                <option value="">Все страны</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            {/* Рейтинг */}
            <div className="filter-item">
              <label>Рейтинг</label>
              <select 
                value={localFilters.rating || ''}
                onChange={(e) => handleChange('rating', e.target.value)}
              >
                <option value="">Любой</option>
                {ratingOptions.map(rating => (
                  <option key={rating} value={rating}>{rating}+</option>
                ))}
              </select>
            </div>
            
            {/* Возраст */}
            <div className="filter-item">
              <label>Возраст</label>
              <select 
                value={localFilters.age || ''}
                onChange={(e) => handleChange('age', e.target.value)}
              >
                <option value="">Любой</option>
                {ageRatings.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>
            
            {/* Сезоны (только для сериалов) */}
            {contentType === 'series' && (
              <div className="filter-item">
                <label>Сезонов</label>
                <select 
                  value={localFilters.seasons || ''}
                  onChange={(e) => handleChange('seasons', e.target.value)}
                >
                  <option value="">Любое</option>
                  {seasonOptions.map(season => (
                    <option key={season} value={season}>{season}+</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="filters-actions">
            <button className="apply-btn" onClick={applyFilters}>
              Применить фильтры
            </button>
            <button className="reset-btn" onClick={resetFilters}>
              Сбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;