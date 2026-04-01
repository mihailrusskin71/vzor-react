import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import FiltersPanel from '../components/FiltersPanel';
import '../styles/index.css';

const CartoonsPage = ({ films, customRows, filmManager }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    year: '',
    genre: '',
    country: '',
    rating: '',
    age: ''
  });
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  
  const description = `Мультфильмы — это волшебный мир, который радует как детей, так и взрослых. Современная анимация достигла невероятных высот, предлагая зрителям не только развлекательные, но и глубокие, философские истории. Мультфильмы способны передавать сложные эмоции и идеи через яркие образы и захватывающие сюжеты.

Сегодня анимационные студии создают настоящие шедевры, которые получают признание на международных кинофестивалях и завоевывают сердца миллионов зрителей. От классических Disney и Pixar до современных студий вроде Studio Ghibli и Laika — каждая привносит свой уникальный стиль и подход к созданию анимации.

На VzorRos представлены лучшие мультфильмы различных форматов:
- Полнометражные анимационные фильмы
- Короткометражные анимационные работы
- Мультсериалы для детей и взрослых
- Классические советские мультфильмы
- Современные российские анимационные проекты

Среди популярных мультфильмов, которые стоит посмотреть:
- «Король Лев» — классика Disney
- «Тайна Коко» — трогательная история о семье
- «Головоломка» — психологическое исследование эмоций
- «Семейка Крудс» — веселое доисторическое приключение
- «Смешарики» — популярный российский мультсериал

Смотрите мультфильмы онлайн всей семьей на партнерских платформах!`;

  const shortDescription = description.length > 200 
    ? description.substring(0, 200) + '...' 
    : description;
  
  const matchesGenre = (film, selectedGenre) => {
    if (!selectedGenre || selectedGenre === '') return true;
    const filmGenres = film.genre.split(',').map(g => g.trim());
    return filmGenres.includes(selectedGenre);
  };
  
  const matchesCountry = (film, selectedCountry) => {
    if (!selectedCountry || selectedCountry === '') return true;
    const filmCountries = film.country.split(',').map(c => c.trim());
    return filmCountries.includes(selectedCountry);
  };
  
  const matchesAge = (film, selectedAge) => {
    if (!selectedAge || selectedAge === '') return true;
    
    let filmAge = film.ageRating || '';
    
    if (/^\d+$/.test(filmAge)) {
      filmAge = filmAge + '+';
    }
    
    if (filmAge === selectedAge) {
      return true;
    }
    
    const ageMap = {
      '0+': ['0+', 'Для детей'],
      '6+': ['6+', 'Для всей семьи'],
      '12+': ['12+', 'Для подростков'],
      '16+': ['16+', 'Для взрослых'],
      '18+': ['18+', 'Только для взрослых']
    };
    
    const allowedValues = ageMap[selectedAge] || [selectedAge];
    return allowedValues.includes(filmAge) || allowedValues.includes(film.ageRating);
  };
  
  useEffect(() => {
    const hasActiveFilters = Object.values(activeFilters).some(value => 
      value !== '' && value !== false
    );
    
    if (hasActiveFilters) {
      let filtered = [...films];
      
      if (activeFilters.year) {
        filtered = filtered.filter(film => film.year === parseInt(activeFilters.year));
      }
      
      // ИСПРАВЛЕНО: убрана проверка на 'Все жанры'
      if (activeFilters.genre && activeFilters.genre !== '') {
        filtered = filtered.filter(film => matchesGenre(film, activeFilters.genre));
      }
      
      // ИСПРАВЛЕНО: убрана проверка на 'Все страны'
      if (activeFilters.country && activeFilters.country !== '') {
        filtered = filtered.filter(film => matchesCountry(film, activeFilters.country));
      }
      
      if (activeFilters.rating) {
        const minRating = parseInt(activeFilters.rating);
        filtered = filtered.filter(film => film.rating >= minRating);
      }
      
      if (activeFilters.age) {
        filtered = filtered.filter(film => matchesAge(film, activeFilters.age));
      }
      
      setFilteredFilms(filtered);
      setShowFilteredResults(true);
    } else {
      setShowFilteredResults(false);
    }
  }, [activeFilters, films]);
  
  const getUniqueGenres = () => {
    const allGenres = [];
    films.forEach(film => {
      if (film.genre) {
        const genres = film.genre.split(',').map(g => g.trim());
        allGenres.push(...genres);
      }
    });
    return [...new Set(allGenres)].filter(g => g && g !== '').sort().slice(0, 15);
  };
  
  const getUniqueCountries = () => {
    const allCountries = [];
    films.forEach(film => {
      if (film.country) {
        const countries = film.country.split(',').map(c => c.trim());
        allCountries.push(...countries);
      }
    });
    return [...new Set(allCountries)].filter(c => c && c !== '').sort().slice(0, 10);
  };
  
  const getUniqueYears = () => {
    const allYears = films
      .map(film => film.year)
      .filter(year => year && !isNaN(year));
    return [...new Set(allYears)].sort((a, b) => b - a).slice(0, 10);
  };
  
  const renderQuickFilters = () => {
    const quickFiltersRef = useRef(null);
    const [showLeftBtn, setShowLeftBtn] = useState(false);
    const [showRightBtn, setShowRightBtn] = useState(true);
    
    const quickFilters = [
      ...getUniqueYears().map(y => `${y} год`),
      ...getUniqueGenres(),
      ...getUniqueCountries().map(c => `${c}`)
    ];
    
    const checkScrollButtons = () => {
      if (quickFiltersRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = quickFiltersRef.current;
        setShowLeftBtn(scrollLeft > 10);
        setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
    useEffect(() => {
      const scrollContainer = quickFiltersRef.current;
      if (scrollContainer) {
        checkScrollButtons();
        scrollContainer.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
        
        return () => {
          scrollContainer.removeEventListener('scroll', checkScrollButtons);
          window.removeEventListener('resize', checkScrollButtons);
        };
      }
    }, []);
    
    const scrollQuickFilters = (direction) => {
      if (quickFiltersRef.current) {
        const scrollAmount = 300;
        quickFiltersRef.current.scrollLeft += direction * scrollAmount;
      }
    };
    
    const handleQuickFilterClick = (filter) => {
      if (filter.includes('год')) {
        const year = filter.replace(' год', '');
        setActiveFilters(prev => ({
          ...prev, 
          year: prev.year === year ? '' : year,
          genre: '',
          country: '',
          age: ''
        }));
      } else if (getUniqueCountries().includes(filter)) {
        setActiveFilters(prev => ({
          ...prev,
          country: prev.country === filter ? '' : filter,
          year: '',
          genre: '',
          age: ''
        }));
      } else {
        setActiveFilters(prev => ({
          ...prev,
          genre: prev.genre === filter ? '' : filter,
          year: '',
          country: '',
          age: ''
        }));
      }
    };
    
    return (
      <div className="quick-filters-section">
        <h3>Быстрый выбор мультфильмов</h3>
        <div className="quick-filters-container">
          {showLeftBtn && (
            <button 
              className="quick-scroll-btn left" 
              onClick={() => scrollQuickFilters(-1)}
              aria-label="Прокрутить влево"
            >
              ❮
            </button>
          )}
          <div 
            className="quick-filters-scroll" 
            ref={quickFiltersRef}
          >
            {quickFilters.map(filter => (
              <button 
                key={filter}
                className={`quick-filter-btn ${
                  activeFilters.year === filter.replace(' год', '') ||
                  activeFilters.genre === filter ||
                  activeFilters.country === filter ? 'active' : ''
                }`}
                onClick={() => handleQuickFilterClick(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          {showRightBtn && (
            <button 
              className="quick-scroll-btn right" 
              onClick={() => scrollQuickFilters(1)}
              aria-label="Прокрутить вправо"
            >
              ❯
            </button>
          )}
        </div>
      </div>
    );
  };
  
  const getRowsForPage = () => {
    return Object.values(customRows).filter(row => 
      row.pageType === 'cartoon' &&
      filmManager.getCustomRowFilms(row.id, 'row').length > 0
    );
  };
  
  const pageRows = getRowsForPage();
  
  return (
    <div className="content-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Мультфильмы смотреть онлайн</h1>
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
        
        <div className="ad-banner">
          <div className="ad-banner-content">
            <h3>Смотрите мультфильмы всей семьей</h3>
            <p>Яркая анимация для детей и глубокие сюжеты для взрослых</p>
            <div className="partner-logos">
              <span className="partner-logo" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>OKKO</span>
              <span className="partner-logo" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>START</span>
              <span className="partner-logo" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>МУЛЬТ</span>
              <span className="partner-logo" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>Союзмультфильм</span>
            </div>
          </div>
        </div>
        
        {renderQuickFilters()}
        
        <FiltersPanel 
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          contentType="cartoon"
          films={films}
        />
        {showFilteredResults ? (
          <div className="filtered-results">
            <h2>Результаты фильтрации</h2>
            <p className="filtered-count">Найдено: {filteredFilms.length}</p>
            {filteredFilms.length > 0 ? (
              <div className="content-grid">
                {filteredFilms.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {pageRows.length > 0 ? (
              pageRows.map(row => {
                const rowFilms = filmManager.getCustomRowFilms(row.id, 'row');
                if (rowFilms.length === 0) return null;
                
                return (
                  <HorizontalScrollRow
                    key={row.id}
                    title={row.name}
                    rowId={row.id}
                    filmManager={filmManager}
                    onViewAll={() => navigate(`/row/${row.id}`)}
                  />
                );
              })
            ) : (
              <div className="no-rows-message">
                <h3>Нет созданных подборок для мультфильмов</h3>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartoonsPage;