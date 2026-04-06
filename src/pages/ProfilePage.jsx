// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, clearWatchHistory, clearSavedFilms, clearAllHistory, hasTrackingConsent } from '../utils/userId';
import MovieCard from '../components/MovieCard';

const ProfilePage = ({ filmManager }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [savedFilms, setSavedFilms] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');
  const [loading, setLoading] = useState(true);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загрузка сохраненной темы при монтировании - ОДИН РАЗ
  useEffect(() => {
    const savedTheme = localStorage.getItem('vzorkino_theme');
    
    if (savedTheme === 'light') {
      setIsLightTheme(true);
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
      setIsLightTheme(false);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // По умолчанию тёмная тема
      setIsLightTheme(false);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setIsInitialized(true);
  }, []);

  // Применение темы при изменении - НЕ СБРАСЫВАЕМ ПРИ ПЕРЕХОДАХ
  useEffect(() => {
    if (!isInitialized) return;
    
    if (isLightTheme) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('vzorkino_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('vzorkino_theme', 'dark');
    }
  }, [isLightTheme, isInitialized]);

  useEffect(() => {
    const consent = hasTrackingConsent();
    setTrackingEnabled(consent);
    
    if (!consent) {
      setLoading(false);
      return;
    }
    
    loadProfile();
    
    const handleSavedUpdate = () => {
      if (hasTrackingConsent()) {
        refreshSavedFilms();
      }
    };
    
    const handleConsentChange = (event) => {
      const accepted = event.detail?.accepted || false;
      setTrackingEnabled(accepted);
      
      if (accepted) {
        loadProfile();
      } else {
        setProfile(null);
        setSavedFilms([]);
        setLoading(false);
      }
    };
    
    window.addEventListener('savedFilmsUpdated', handleSavedUpdate);
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    
    return () => {
      window.removeEventListener('savedFilmsUpdated', handleSavedUpdate);
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);

  const loadProfile = () => {
    const userProfile = getUserProfile();
    
    if (!userProfile) {
      setProfile(null);
      setSavedFilms([]);
      setLoading(false);
      return;
    }
    
    setProfile(userProfile);
    
    if (userProfile.saved_films && userProfile.saved_films.length > 0) {
      const films = userProfile.saved_films
        .map(id => filmManager.getFilmById(id))
        .filter(Boolean);
      setSavedFilms(films);
    } else {
      setSavedFilms([]);
    }
    
    setLoading(false);
  };

  const refreshSavedFilms = () => {
    const userProfile = getUserProfile();
    if (!userProfile) {
      setSavedFilms([]);
      return;
    }
    
    setProfile(userProfile);
    
    if (userProfile.saved_films && userProfile.saved_films.length > 0) {
      const films = userProfile.saved_films
        .map(id => filmManager.getFilmById(id))
        .filter(Boolean);
      setSavedFilms(films);
    } else {
      setSavedFilms([]);
    }
  };

  const handleClearSaved = () => {
    if (window.confirm('Очистить все сохраненные фильмы?')) {
      clearSavedFilms();
      setSavedFilms([]);
      const updatedProfile = getUserProfile();
      setProfile(updatedProfile);
      setShowClearMenu(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Очистить историю просмотров?')) {
      clearWatchHistory();
      const updatedProfile = getUserProfile();
      setProfile(updatedProfile);
      setShowClearMenu(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Очистить всю историю и все сохраненные фильмы?')) {
      clearAllHistory();
      setSavedFilms([]);
      const updatedProfile = getUserProfile();
      setProfile(updatedProfile);
      setShowClearMenu(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isLightTheme;
    setIsLightTheme(newTheme);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'неизвестно';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="content-wrapper-1100">
          <div className="loading-spinner">Загрузка профиля...</div>
        </div>
      </div>
    );
  }

  if (!trackingEnabled) {
    return (
      <div className="page-content">
        <div className="content-wrapper-1100">
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div className="empty-state-icon">🍪</div>
            <h3>Трекинг отключен</h3>
            <p>
              Вы не дали согласие на использование cookie, поэтому мы не сохраняем 
              историю просмотров и сохраненные фильмы.
            </p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#888' }}>
              Чтобы включить эти функции, примите политику конфиденциальности 
              при следующем посещении сайта.
            </p>
            <button 
              className="primary-button"
              onClick={() => navigate('/')}
              style={{ marginTop: '30px' }}
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-content">
        <div className="content-wrapper-1100">
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div className="empty-state-icon">👤</div>
            <h3>Профиль не найден</h3>
            <p>
              Произошла ошибка при загрузке профиля. Попробуйте обновить страницу.
            </p>
            <button 
              className="primary-button"
              onClick={() => window.location.reload()}
              style={{ marginTop: '30px' }}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="content-wrapper-1100">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {profile.id ? profile.id.slice(-2).toUpperCase() : '??'}
            </div>
          </div>
          <div className="profile-info">
            <h1>Ваш профиль</h1>
            <p className="profile-id">ID: {profile.id || 'неизвестно'}</p>
            <p className="profile-date">
              На сайте с {formatDate(profile.created_at)}
            </p>
            <div className="profile-stats">
              <span>📺 Просмотрено: {profile.watch_history?.length || 0}</span>
              <span>🔖 Сохранено: {profile.saved_films?.length || 0}</span>
            </div>
          </div>
          {/* Кнопка переключения темы в правой части хедера профиля */}
          <div className="profile-theme-toggle">
            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isLightTheme ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
            >
              {isLightTheme ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Тёмная тема</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span>Светлая тема</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Сохраненные фильмы ({profile.saved_films?.length || 0})
          </button>
          <button 
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            История просмотров ({profile.watch_history?.length || 0})
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'saved' && (
            <>
              {savedFilms.length > 0 ? (
                <>
                  <div className="content-grid">
                    {savedFilms.map(film => (
                      <MovieCard 
                        key={film.id} 
                        movie={film} 
                        onSaveChange={refreshSavedFilms}
                      />
                    ))}
                  </div>
                  {savedFilms.length > 0 && (
                    <div className="profile-actions">
                      <button 
                        className="clear-btn"
                        onClick={handleClearSaved}
                      >
                        Очистить все сохраненные
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔖</div>
                  <h3>У вас пока нет сохраненных фильмов</h3>
                  <p>Нажмите на иконку закладки на карточке фильма, чтобы сохранить его</p>
                  <button 
                    className="primary-button"
                    onClick={() => navigate('/movies')}
                  >
                    Перейти к фильмам
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {profile.watch_history && profile.watch_history.length > 0 ? (
                <>
                  <div className="watch-history">
                    {profile.watch_history.map((item, index) => (
                      <div key={index} className="history-item" onClick={() => navigate(`/movie/${item.id}`)}>
                        <img src={item.poster || item.img} alt={item.title} />
                        <div className="history-item-info">
                          <h3>{item.title}</h3>
                          <p>{item.year} • {item.genre || 'без жанра'}</p>
                          <small>Просмотрено: {new Date(item.watched_at).toLocaleString('ru-RU')}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="profile-actions">
                    <button 
                      className="clear-btn"
                      onClick={handleClearHistory}
                    >
                      Очистить историю просмотров
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📺</div>
                  <h3>История просмотров пуста</h3>
                  <p>Фильмы, которые вы открывали, появятся здесь</p>
                  <button 
                    className="primary-button"
                    onClick={() => navigate('/movies')}
                  >
                    Начать просмотр
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="profile-footer">
          <div className="clear-menu-container">
            <button 
              className="clear-menu-btn"
              onClick={() => setShowClearMenu(!showClearMenu)}
            >
               Очистить данные
            </button>
            
            {showClearMenu && (
              <div className="clear-dropdown">
                <button onClick={handleClearHistory}>
                    Очистить историю просмотров
                </button>
                <button onClick={handleClearSaved}>
                    Очистить сохраненные фильмы
                </button>
                <button onClick={handleClearAll} className="danger">
                    Очистить всё
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;