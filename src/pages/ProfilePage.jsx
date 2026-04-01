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

  useEffect(() => {
    // Проверяем, есть ли согласие на трекинг
    const consent = hasTrackingConsent();
    setTrackingEnabled(consent);
    
    if (!consent) {
      setLoading(false);
      return;
    }
    
    loadProfile();
    
    // Слушаем событие обновления сохраненных фильмов
    const handleSavedUpdate = () => {
      if (hasTrackingConsent()) {
        refreshSavedFilms();
      }
    };
    
    // Слушаем изменение согласия на cookie
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
    
    // Если профиля нет (нет согласия), показываем пустое состояние
    if (!userProfile) {
      setProfile(null);
      setSavedFilms([]);
      setLoading(false);
      return;
    }
    
    setProfile(userProfile);
    
    // Загружаем сохраненные фильмы
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

  // Если трекинг отключен - показываем специальное сообщение
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

  // Если профиля нет (должно быть, но на всякий случай)
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