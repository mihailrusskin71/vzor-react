// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import SeriesPage from './pages/SeriesPage';
import CartoonsPage from './pages/CartoonsPage';
import MovieDetailPage from './pages/MovieDetailPage';
import RowDetailPage from './pages/RowDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import SearchPage from './pages/SearchPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AdminPanel from './components/AdminPanel';
import { filmManager } from './services/filmManager';
import { initTracking, hasTrackingConsent } from './utils/userId';
import './styles/index.css';

const ADMIN_COMBO = import.meta.env.VITE_ADMIN_COMBO || '1337';

function App() {
  const [films, setFilms] = useState([]);
  const [customRows, setCustomRows] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keySequence, setKeySequence] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  
  // Инициализация отслеживания пользователя (НЕ создает ID, только проверяет)
  useEffect(() => {
    const trackingInfo = initTracking();
    setTrackingEnabled(trackingInfo.trackingEnabled);
    console.log('🔍 Инициализация трекинга:', trackingInfo.trackingEnabled ? 'включен' : 'отключен');
    
    // Слушаем изменения согласия на cookie
    const handleConsentChange = (event) => {
      setTrackingEnabled(event.detail?.accepted || false);
      // Если согласие дано, можно обновить данные профиля
      if (event.detail?.accepted) {
        // Профиль уже создан в handleCookieAccept, просто обновляем состояние
        console.log('✅ Cookie приняты, трекинг включен');
      } else {
        console.log('❌ Cookie отклонены, трекинг отключен');
      }
    };
    
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);
  
  // Секретная комбинация для вызова админ-панели (только триггер!)
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = keySequence + e.key;
      setKeySequence(newSequence.slice(-4));
      
      if (newSequence.slice(-4) === ADMIN_COMBO) {
        console.log('🎬 Вызов окна входа в админ-панель');
        setShowAdmin(true);
        setKeySequence('');
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence]);
  
  // Загрузка данных фильмов и рядов
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await filmManager.init();
        
        setFilms([...filmManager.films]);
        setCustomRows({...filmManager.customRows});
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
    
    // Слушаем события обновления данных
    const handleFilmsUpdated = () => {
      setFilms([...filmManager.films]);
    };
    
    const handleRowsUpdated = () => {
      setCustomRows({...filmManager.customRows});
    };
    
    window.addEventListener('filmsUpdated', handleFilmsUpdated);
    window.addEventListener('customRowsUpdated', handleRowsUpdated);
    
    return () => {
      window.removeEventListener('filmsUpdated', handleFilmsUpdated);
      window.removeEventListener('customRowsUpdated', handleRowsUpdated);
    };
  }, []);
  
  // Создаем простые эффекты в сайдбарах (декоративные элементы)
  useEffect(() => {
    const createSidebarEffects = () => {
      const leftSidebar = document.getElementById('left-sidebar');
      const rightSidebar = document.getElementById('right-sidebar');
      
      if (leftSidebar) {
        for (let i = 0; i < 15; i++) {
          const star = document.createElement('div');
          star.className = 'star-particle';
          star.style.left = `${Math.random() * 100}%`;
          star.style.top = `${Math.random() * 100}%`;
          star.style.animationDelay = `${Math.random() * 3}s`;
          leftSidebar.appendChild(star);
        }
      }
      
      if (rightSidebar) {
        for (let i = 0; i < 15; i++) {
          const star = document.createElement('div');
          star.className = 'star-particle';
          star.style.left = `${Math.random() * 100}%`;
          star.style.top = `${Math.random() * 100}%`;
          star.style.animationDelay = `${Math.random() * 3}s`;
          rightSidebar.appendChild(star);
        }
      }
    };
    
    const addSidebarGradients = () => {
      const leftSidebar = document.getElementById('left-sidebar');
      const rightSidebar = document.getElementById('right-sidebar');
      
      if (leftSidebar) {
        const gradient = document.createElement('div');
        gradient.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 40%, rgba(255, 106, 43, 0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        `;
        leftSidebar.appendChild(gradient);
      }
      
      if (rightSidebar) {
        const gradient = document.createElement('div');
        gradient.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 60%, rgba(255, 87, 34, 0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        `;
        rightSidebar.appendChild(gradient);
      }
    };
    
    setTimeout(() => {
      createSidebarEffects();
      addSidebarGradients();
    }, 100);
    
    return () => {
      const stars = document.querySelectorAll('.star-particle');
      stars.forEach(star => star.remove());
      
      const gradients = document.querySelectorAll('#left-sidebar > div, #right-sidebar > div');
      gradients.forEach(gradient => {
        if (gradient.style.background?.includes('radial-gradient')) {
          gradient.remove();
        }
      });
    };
  }, []);
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111113 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ 
            fontSize: '24px', 
            marginBottom: '20px',
            fontWeight: 'bold',
            color: '#FF6A2B'
          }}>
            VzorRos
          </div>
          <div>Фильмов: {filmManager.films.length}</div>
          <div>Рядов: {Object.keys(filmManager.customRows).length}</div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={
              <HomePage 
                films={films}
                customRows={customRows}
                filmManager={filmManager}
              />
            } />
            
            {/* Основные страницы контента */}
            <Route path="/movies" element={
              <MoviesPage 
                films={films.filter(f => f.contentType === 'movie')}
                customRows={Object.values(customRows).filter(r => 
                  r.pageType === 'movie' || r.pageType === 'all'
                )}
                filmManager={filmManager}
              />
            } />
            
            <Route path="/series" element={
              <SeriesPage 
                films={films.filter(f => f.contentType === 'series')}
                customRows={Object.values(customRows).filter(r => 
                  r.pageType === 'series' || r.pageType === 'all'
                )}
                filmManager={filmManager}
              />
            } />
            
            <Route path="/cartoons" element={
              <CartoonsPage 
                films={films.filter(f => f.contentType === 'cartoon')}
                customRows={Object.values(customRows).filter(r => 
                  r.pageType === 'cartoon' || r.pageType === 'all'
                )}
                filmManager={filmManager}
              />
            } />
            
            {/* Страница поиска */}
            <Route path="/search" element={
              <SearchPage 
                films={films}
                filmManager={filmManager}
              />
            } />
            
            {/* Страница подписок */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            
            {/* Страница деталей фильма */}
            <Route path="/movie/:id" element={
              <MovieDetailPage filmManager={filmManager} films={films} />
            } />
            
            {/* Страницы рядов */}
            <Route path="/row/:rowId" element={
              <RowDetailPage 
                films={films}
                filmManager={filmManager}
              />
            } />
            
            {/* Страница профиля */}
            <Route path="/profile" element={
              <ProfilePage filmManager={filmManager} />
            } />
            
            {/* Информационные страницы */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* 404 страница */}
            <Route path="*" element={
              <div className="page-content">
                <div className="content-wrapper-1100">
                  <h1>404 - Страница не найдена</h1>
                  <p>Запрошенная страница не существует.</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                      marginTop: '20px',
                      padding: '12px 24px',
                      background: '#FF6A2B',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Вернуться на главную
                  </button>
                </div>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
      
      <AdminPanel 
        visible={showAdmin}
        onClose={() => setShowAdmin(false)}
        filmManager={filmManager}
      />
    </>
  );
}

export default App;