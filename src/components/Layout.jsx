// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import SidebarBackgroundEffects from './SidebarBackgroundEffects';
import CookieConsent from './CookieConsent';
import { getUserProfile } from '../utils/userId';
import '../styles/index.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        // Загружаем профиль пользователя
        const profile = getUserProfile();
        setUserProfile(profile);

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleSearchClick = (e) => {
        e.preventDefault();
        navigate('/search');
        setIsMobileMenuOpen(false);
    };

    const handleProfileClick = (e) => {
        e.preventDefault();
        navigate('/profile');
        setIsMobileMenuOpen(false);
    };

    const handleLogoClick = () => {
        setIsMobileMenuOpen(false);
    };

    const handleNavLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Верхняя панель */}
            <div id="top-full-width-panel">
                <div className="container">
                    <header className="site-header">
                        <div className="header-inner">
                            {/* Левая часть: гамбургер + лого */}
                            <div className="header-left">
                                {isMobile && (
                                    <button 
                                        className="hamburger-btn"
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        aria-label="Меню"
                                    >
                                        <div className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </button>
                                )}
                                
                                <Link to="/" className="logo" onClick={handleLogoClick}>
                                    <div className="logo-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 6V18L16 12L8 6Z" fill="#FF6A2B"/>
                                            <rect x="1" y="1" width="22" height="22" rx="4" stroke="#FF6A2B" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <span className="brand">Vzor<span className="brand-x">Ros</span></span>
                                </Link>

                                {/* Десктопная навигация */}
                                {!isMobile && (
                                    <nav className="main-nav">
                                        <NavLink 
                                            to="/" 
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                            end
                                        >
                                            Главная
                                        </NavLink>
                                        <NavLink 
                                            to="/movies" 
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        >
                                            Фильмы
                                        </NavLink>
                                        <NavLink 
                                            to="/series" 
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        >
                                            Сериалы
                                        </NavLink>
                                        <NavLink 
                                            to="/cartoons" 
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        >
                                            Мультфильмы
                                        </NavLink>
                                    </nav>
                                )}
                            </div>

                            {/* Правая часть: поиск + профиль */}
                            <div className="header-actions">
                                <a 
                                    href="/search" 
                                    className="search-trigger"
                                    onClick={handleSearchClick}
                                >
                                    <div className="search-icon">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"/>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                        </svg>
                                    </div>
                                    {!isMobile && <span className="search-text">Поиск</span>}
                                </a>
                                
                                <a 
                                    href="/profile" 
                                    className="profile-btn"
                                    onClick={handleProfileClick}
                                >
                                    <div className="user-icon-container">
                                        <div className="user-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                <circle cx="12" cy="7" r="4"/>
                                            </svg>
                                        </div>
                                        {userProfile && userProfile.saved_films?.length > 0 && (
                                            <span className="user-badge">
                                                {userProfile.saved_films.length}
                                            </span>
                                        )}
                                    </div>
                                    {!isMobile && <span className="profile-text">Профиль</span>}
                                </a>
                            </div>
                        </div>
                    </header>
                </div>
            </div>

            {/* Мобильное меню */}
            {isMobile && (
                <>
                    <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
                         onClick={() => setIsMobileMenuOpen(false)}>
                    </div>
                    
                    <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                        <nav className="mobile-nav">
                            <NavLink 
                                to="/" 
                                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                                onClick={handleNavLinkClick}
                                end
                            >
                                <span className="mobile-nav-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 10l9-7 9 7v11a2 2 0 0 1-2 2h-5v-8H9v8H4a2 2 0 0 1-2-2z"/>
                                    </svg>
                                </span>
                                Главная
                            </NavLink>
                            <NavLink 
                                to="/movies" 
                                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                                onClick={handleNavLinkClick}
                            >
                                <span className="mobile-nav-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                                        <path d="M8 8v8M16 8v8M2 12h20"/>
                                    </svg>
                                </span>
                                Фильмы
                            </NavLink>
                            <NavLink 
                                to="/series" 
                                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                                onClick={handleNavLinkClick}
                            >
                                <span className="mobile-nav-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="15" rx="2"/>
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                    </svg>
                                </span>
                                Сериалы
                            </NavLink>
                            <NavLink 
                                to="/cartoons" 
                                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                                onClick={handleNavLinkClick}
                            >
                                <span className="mobile-nav-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 12h8M12 8v8"/>
                                    </svg>
                                </span>
                                Мультфильмы
                            </NavLink>
                            <NavLink 
                                to="/profile" 
                                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                                onClick={handleNavLinkClick}
                            >
                                <span className="mobile-nav-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </span>
                                Профиль
                                {userProfile && userProfile.saved_films?.length > 0 && (
                                    <span className="mobile-badge">{userProfile.saved_films.length}</span>
                                )}
                            </NavLink>
                        </nav>
                        
                        <div className="mobile-menu-footer">
                            <p>© 2024 VzorRos</p>
                        </div>
                    </div>
                </>
            )}

            {/* Основной контейнер */}
            <div id="main-container">
                <div id="left-sidebar" className="sidebar">
                    <SidebarBackgroundEffects side="left" />
                </div>
                
                <div id="center-content">
                    <main className="main-content">
                        {children}
                    </main>
                </div>
                
                <div id="right-sidebar" className="sidebar">
                    <SidebarBackgroundEffects side="right" />
                </div>
            </div>

            {/* Нижняя панель */}
            <div id="bottom-full-width-panel">
                <div className="container">
                    <footer className="site-footer">
                        <div className="footer-content">
                            <div className="footer-brand">
                                <div className="logo">
                                    <span className="brand">Vzor<span className="brand-x">Ros</span></span>
                                </div>
                                <p>Официальный партнёр онлайн-кинотеатров в России</p>
                                <div className="legal-info">
                                    <p>Все права на контент принадлежат правообладателям</p>
                                    <p>Мы предоставляем только ссылки на официальные сервисы</p>
                                </div>
                            </div>
                            
                            <div className="footer-links">
    <div className="footer-column">
        <h4>Партнёры</h4>
        <a href="https://okko.tv" target="_blank" rel="noopener noreferrer">OKKO</a>
        <a href="https://ivi.ru" target="_blank" rel="noopener noreferrer">IVI</a>
        <a href="https://kion.ru" target="_blank" rel="noopener noreferrer">KION</a>
        <a href="https://premier.one" target="_blank" rel="noopener noreferrer">Premier</a>
        <a href="https://kinopoisk.ru" target="_blank" rel="noopener noreferrer">КиноПоиск</a>
        <a href="https://wink.ru" target="_blank" rel="noopener noreferrer">Wink</a>
    </div>
    
    <div className="footer-column">
        <h4>Информация</h4>
        <Link to="/about">О проекте</Link>
        <Link to="/privacy">Политика конфиденциальности</Link>
    </div>
    
    <div className="footer-column">
        <h4>Помощь</h4>
        <Link to="/faq">FAQ</Link>
        <a href="mailto:support@vzorros.ru">Техподдержка</a>
        <a href="mailto:partner@vzorros.ru">Сотрудничество</a>
    </div>
</div>
                        </div>
                        
                        <div className="footer-bottom">
                            <p>&copy; 2024 VzorRos. Официальный партнёр онлайн-кинотеатров. Все права защищены.</p>
                            <p>Все товарные знаки принадлежат их законным правообладателям.</p>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Cookie Consent Banner */}
            <CookieConsent />
        </>
    );
};

export default Layout;