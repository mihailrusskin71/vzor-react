// src/pages/SearchPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import HorizontalScroll from '../components/HorizontalScroll';
import '../styles/pages/search.css';

// СТАТИЧЕСКИЙ СПИСОК "ЧАСТО ИЩУТ"
// ВЫ МОЖЕТЕ МЕНЯТЬ ЭТИ НАЗВАНИЯ В КОДЕ
const DEFAULT_POPULAR_SEARCHES = [
  'Дюна', 'Бэтмен', 'Аватар', 'Интерстеллар', 'Начало',
  'Джокер', 'Оппенгеймер', 'Барби', 'Гладиатор', 'Матрица',
  'Титаник', 'Форрест Гамп', 'Зеленая книга', 'Паразиты',
  'Джон Уик', 'Форсаж', 'Мстители', 'Дедпул', 'Драйв', 'Ла-Ла Ленд'
];

const SearchPage = ({ films, filmManager }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState(DEFAULT_POPULAR_SEARCHES);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Refs для каруселей
  const popularScrollRef = useRef(null);
  const historyScrollRef = useRef(null);
  
  // Состояния для автоматической прокрутки
  const [autoScrollActive, setAutoScrollActive] = useState({ popular: true, history: true });
  const autoScrollTimeouts = useRef({ popular: null, history: null });
  const autoScrollIntervals = useRef({ popular: null, history: null });
  const isDraggingRef = useRef({ popular: false, history: false });
  const dragStartXRef = useRef({ popular: 0, history: 0 });
  const dragStartScrollLeftRef = useRef({ popular: 0, history: 0 });

  // Загрузка истории поиска из localStorage (только для истории, не для популярных)
  useEffect(() => {
    const loadSearchHistory = () => {
      try {
        const history = localStorage.getItem('vzorkino_search_history');
        if (history) {
          const parsed = JSON.parse(history);
          setSearchHistory(parsed.slice(0, 20));
        }
      } catch (error) {
        console.error('Ошибка загрузки истории поиска:', error);
      }
    };
    
    loadSearchHistory();
  }, []);

  // Запуск автоматической прокрутки для популярных запросов (влево)
  const startPopularAutoScroll = useCallback(() => {
    if (autoScrollIntervals.current.popular) {
      clearInterval(autoScrollIntervals.current.popular);
    }
    
    const scrollContainer = popularScrollRef.current;
    if (!scrollContainer) return;
    
    autoScrollIntervals.current.popular = setInterval(() => {
      if (autoScrollActive.popular && !isDraggingRef.current.popular && scrollContainer) {
        scrollContainer.scrollLeft -= 1;
        
        if (scrollContainer.scrollLeft <= 0) {
          scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        }
      }
    }, 30);
  }, [autoScrollActive.popular]);

  // Запуск автоматической прокрутки для истории поиска (вправо)
  const startHistoryAutoScroll = useCallback(() => {
    if (autoScrollIntervals.current.history) {
      clearInterval(autoScrollIntervals.current.history);
    }
    
    const scrollContainer = historyScrollRef.current;
    if (!scrollContainer) return;
    
    autoScrollIntervals.current.history = setInterval(() => {
      if (autoScrollActive.history && !isDraggingRef.current.history && scrollContainer) {
        scrollContainer.scrollLeft += 1;
        
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
    }, 30);
  }, [autoScrollActive.history]);

  // Остановка автоматической прокрутки на 3 секунды
  const pauseAutoScroll = useCallback((type) => {
    setAutoScrollActive(prev => ({ ...prev, [type]: false }));
    
    if (autoScrollTimeouts.current[type]) {
      clearTimeout(autoScrollTimeouts.current[type]);
    }
    
    autoScrollTimeouts.current[type] = setTimeout(() => {
      setAutoScrollActive(prev => ({ ...prev, [type]: true }));
    }, 3000);
  }, []);

  // Обработчики событий для популярных запросов
  const handlePopularMouseDown = (e) => {
    if (e.button !== 0) return;
    
    isDraggingRef.current.popular = true;
    const scrollContainer = popularScrollRef.current;
    if (scrollContainer) {
      dragStartXRef.current.popular = e.clientX;
      dragStartScrollLeftRef.current.popular = scrollContainer.scrollLeft;
      scrollContainer.style.cursor = 'grabbing';
      scrollContainer.style.userSelect = 'none';
    }
    
    pauseAutoScroll('popular');
  };

  const handlePopularMouseMove = (e) => {
    if (!isDraggingRef.current.popular) return;
    
    const scrollContainer = popularScrollRef.current;
    if (scrollContainer) {
      const dx = e.clientX - dragStartXRef.current.popular;
      scrollContainer.scrollLeft = dragStartScrollLeftRef.current.popular - dx;
    }
  };

  const handlePopularMouseUp = () => {
    if (isDraggingRef.current.popular) {
      isDraggingRef.current.popular = false;
      const scrollContainer = popularScrollRef.current;
      if (scrollContainer) {
        scrollContainer.style.cursor = '';
        scrollContainer.style.userSelect = '';
      }
    }
  };

  const handlePopularMouseLeave = () => {
    if (isDraggingRef.current.popular) {
      isDraggingRef.current.popular = false;
      const scrollContainer = popularScrollRef.current;
      if (scrollContainer) {
        scrollContainer.style.cursor = '';
        scrollContainer.style.userSelect = '';
      }
    }
  };

  // Обработчики событий для истории поиска
  const handleHistoryMouseDown = (e) => {
    if (e.button !== 0) return;
    
    isDraggingRef.current.history = true;
    const scrollContainer = historyScrollRef.current;
    if (scrollContainer) {
      dragStartXRef.current.history = e.clientX;
      dragStartScrollLeftRef.current.history = scrollContainer.scrollLeft;
      scrollContainer.style.cursor = 'grabbing';
      scrollContainer.style.userSelect = 'none';
    }
    
    pauseAutoScroll('history');
  };

  const handleHistoryMouseMove = (e) => {
    if (!isDraggingRef.current.history) return;
    
    const scrollContainer = historyScrollRef.current;
    if (scrollContainer) {
      const dx = e.clientX - dragStartXRef.current.history;
      scrollContainer.scrollLeft = dragStartScrollLeftRef.current.history - dx;
    }
  };

  const handleHistoryMouseUp = () => {
    if (isDraggingRef.current.history) {
      isDraggingRef.current.history = false;
      const scrollContainer = historyScrollRef.current;
      if (scrollContainer) {
        scrollContainer.style.cursor = '';
        scrollContainer.style.userSelect = '';
      }
    }
  };

  const handleHistoryMouseLeave = () => {
    if (isDraggingRef.current.history) {
      isDraggingRef.current.history = false;
      const scrollContainer = historyScrollRef.current;
      if (scrollContainer) {
        scrollContainer.style.cursor = '';
        scrollContainer.style.userSelect = '';
      }
    }
  };

  // Запуск автопрокрутки при монтировании и обновлении данных
  useEffect(() => {
    if (popularSearches.length > 0 && popularScrollRef.current) {
      startPopularAutoScroll();
    }
    
    return () => {
      if (autoScrollIntervals.current.popular) {
        clearInterval(autoScrollIntervals.current.popular);
      }
      if (autoScrollTimeouts.current.popular) {
        clearTimeout(autoScrollTimeouts.current.popular);
      }
    };
  }, [popularSearches.length, startPopularAutoScroll]);

  useEffect(() => {
    if (searchHistory.length > 0 && historyScrollRef.current) {
      startHistoryAutoScroll();
    }
    
    return () => {
      if (autoScrollIntervals.current.history) {
        clearInterval(autoScrollIntervals.current.history);
      }
      if (autoScrollTimeouts.current.history) {
        clearTimeout(autoScrollTimeouts.current.history);
      }
    };
  }, [searchHistory.length, startHistoryAutoScroll]);

  // Глобальные обработчики для отлова событий мыши
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handlePopularMouseMove(e);
      handleHistoryMouseMove(e);
    };
    
    const handleGlobalMouseUp = () => {
      handlePopularMouseUp();
      handleHistoryMouseUp();
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Сохранение поискового запроса в историю (только для истории)
  const saveToHistory = useCallback((query) => {
    if (!query || query.trim().length < 2) return;
    
    const normalizedQuery = query.trim();
    
    setSearchHistory(prev => {
      const newHistory = [normalizedQuery, ...prev.filter(q => q !== normalizedQuery)];
      const limitedHistory = newHistory.slice(0, 20);
      localStorage.setItem('vzorkino_search_history', JSON.stringify(limitedHistory));
      return limitedHistory;
    });
  }, []);

  // Очистка истории поиска
  const clearSearchHistory = () => {
    if (window.confirm('Очистить историю поиска?')) {
      localStorage.removeItem('vzorkino_search_history');
      setSearchHistory([]);
    }
  };

  // Функция поиска фильмов
  const performSearch = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = films.filter(film => 
      film.title.toLowerCase().includes(searchTerm) ||
      (film.genre && film.genre.toLowerCase().includes(searchTerm)) ||
      (film.director && film.director.toLowerCase().includes(searchTerm)) ||
      (film.actors && film.actors.toLowerCase().includes(searchTerm)) ||
      (film.year && film.year.toString().includes(searchTerm))
    );
    
    const sortedResults = results.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
      const bTitleMatch = b.title.toLowerCase().includes(searchTerm);
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      return (b.rating || 0) - (a.rating || 0);
    });
    
    setSearchResults(sortedResults);
    setIsSearching(true);
  }, [films]);

  // Обработчик изменения поискового запроса с debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length > 0) {
      const term = value.toLowerCase().trim();
      const matches = films
        .filter(film => film.title.toLowerCase().includes(term))
        .slice(0, 5)
        .map(film => film.title);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Обработчик отправки формы
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      saveToHistory(searchQuery);
      performSearch(searchQuery);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Обработчик выбора подсказки
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    saveToHistory(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
  };

  // Обработчик клика по популярному запросу
  const handlePopularSearchClick = (query) => {
    setSearchQuery(query);
    saveToHistory(query);
    performSearch(query);
    setShowSuggestions(false);
    pauseAutoScroll('popular');
  };

  // Обработчик клика по истории поиска
  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    performSearch(query);
    setShowSuggestions(false);
    pauseAutoScroll('history');
  };

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="search-page">
      <div className="container">
        {/* Заголовок страницы */}
        <div className="search-header">
          <h1 className="search-title"> Поиск фильмов, сериалов и мультфильмов</h1>
          <p className="search-subtitle">
            Найдите любимый контент по названию, жанру, режиссёру или актёру
          </p>
        </div>
        
        {/* Строка поиска */}
        <div className="search-input-wrapper">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <span className="search-icon-large">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                placeholder="Введите название фильма, сериала или мультфильма..."
                className="search-input"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsSearching(false);
                    setSuggestions([]);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                >
                  ×
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Найти
              </button>
            </div>
            
            {/* Подсказки */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="search-suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
        
        {/* Результаты поиска */}
        {isSearching && searchQuery.trim().length >= 2 && (
          <div className="search-results-section">
            <div className="search-results-header">
              <h2>
                Результаты поиска
                {searchResults.length > 0 && (
                  <span className="results-count">({searchResults.length})</span>
                )}
              </h2>
              {searchResults.length === 0 && (
                <p className="no-results-message">
                  По запросу "{searchQuery}" ничего не найдено.<br />
                  Попробуйте изменить запрос или проверьте правильность написания.
                </p>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="content-grid">
                {searchResults.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Блок рекомендаций - показываем только когда нет активного поиска */}
        {(!isSearching || searchQuery.trim().length < 2) && (
          <div className="search-suggestions-section">
            
            {/* Часто ищут - СТАТИЧЕСКИЙ СПИСОК */}
            {popularSearches.length > 0 && (
              <div className="popular-searches-carousel">
                <div className="section-header-with-icon">
                  <div className="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <h2>Часто ищут</h2>
                </div>
                <div 
                  className="search-carousel-scroll"
                  ref={popularScrollRef}
                  onMouseDown={handlePopularMouseDown}
                  onMouseLeave={handlePopularMouseLeave}
                  style={{ cursor: 'grab' }}
                >
                  {popularSearches.map((query, index) => (
                    <button
                      key={index}
                      className="search-carousel-item"
                      onClick={() => handlePopularSearchClick(query)}
                    >
                      <span className="carousel-item-rank">{index + 1}</span>
                      <span className="carousel-item-text">{query}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </button>
                  ))}
                  {popularSearches.map((query, index) => (
                    <button
                      key={`dup-${index}`}
                      className="search-carousel-item duplicate"
                      onClick={() => handlePopularSearchClick(query)}
                    >
                      <span className="carousel-item-rank">{index + 1}</span>
                      <span className="carousel-item-text">{query}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* История поиска */}
            {searchHistory.length > 0 && (
              <div className="history-searches-carousel">
                <div className="section-header-with-icon">
                  <div className="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <h2>История поиска</h2>
                  <button className="clear-history-btn" onClick={clearSearchHistory}>
                    Очистить
                  </button>
                </div>
                <div 
                  className="search-carousel-scroll history"
                  ref={historyScrollRef}
                  onMouseDown={handleHistoryMouseDown}
                  onMouseLeave={handleHistoryMouseLeave}
                  style={{ cursor: 'grab' }}
                >
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      className="search-carousel-item history-item"
                      onClick={() => handleHistoryClick(query)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="carousel-item-text">{query}</span>
                    </button>
                  ))}
                  {searchHistory.map((query, index) => (
                    <button
                      key={`dup-${index}`}
                      className="search-carousel-item history-item duplicate"
                      onClick={() => handleHistoryClick(query)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="carousel-item-text">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Рекомендации */}
            {films.length > 0 && (
              <div className="recommended-section">
                <div className="section-header-with-icon">
                  <div className="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12h4M22 12h-4M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </div>
                  <h2>Популярные фильмы</h2>
                </div>
                <HorizontalScroll className="recommended-scroll">
                  {films.slice(0, 20).map(movie => (
                    <div key={movie.id} className="recommended-movie-card">
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </HorizontalScroll>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;