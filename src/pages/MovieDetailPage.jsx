// src/pages/MovieDetailPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PARTNERS } from '../utils/constants';
import { getPartnerIcon, handleIconError } from '../utils/imageHelper';
import HorizontalScroll from '../components/HorizontalScroll';
import { isFilmSaved, saveFilm, unsaveFilm, addToWatchHistory, getWatchHistory } from '../utils/userId';
import '../styles/index.css';

const MovieDetailPage = ({ filmManager, films }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState('okko');
    const [similarFilms, setSimilarFilms] = useState([]);
    const [interestFilms, setInterestFilms] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [loadingInterest, setLoadingInterest] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSaved, setIsSaved] = useState(false);
    const titleRef = useRef(null);
    const titleContainerRef = useRef(null);
    
    const [backdropUrl, setBackdropUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [usePosterAsBackdrop, setUsePosterAsBackdrop] = useState(false);
    const [logoError, setLogoError] = useState(false);

    // Загрузка последних просмотренных фильмов
    const loadInterestFilms = useCallback(() => {
        setLoadingInterest(true);
        
        try {
            const watchHistory = getWatchHistory();
            
            if (!watchHistory || watchHistory.length === 0) {
                setInterestFilms([]);
                setLoadingInterest(false);
                return;
            }
            
            const recentHistoryIds = watchHistory.slice(0, 15).map(item => item.id);
            const recentFilms = recentHistoryIds
                .map(filmId => films.find(f => f.id === filmId))
                .filter(Boolean);
            
            setInterestFilms(recentFilms);
        } catch (error) {
            console.error('Ошибка загрузки истории просмотров:', error);
            setInterestFilms([]);
        } finally {
            setLoadingInterest(false);
        }
    }, [films]);

    // Определяем тип контента для заголовка
    const getSimilarTitle = () => {
        if (!movie) return 'Похожие фильмы';
        switch (movie.contentType) {
            case 'series':
                return 'Похожие сериалы';
            case 'cartoon':
                return 'Похожие мультфильмы';
            default:
                return 'Похожие фильмы';
        }
    };

    // Функция для адаптивного размера шрифта заголовка
    const adjustTitleFontSize = useCallback(() => {
        if (!titleRef.current || !titleContainerRef.current) return;
        
        const titleElement = titleRef.current;
        const container = titleContainerRef.current;
        const containerWidth = container.offsetWidth;
        
        // Базовые размеры шрифта
        const baseSize = isMobile ? 24 : 32;
        const minSize = isMobile ? 14 : 24;
        
        // Сначала устанавливаем базовый размер
        titleElement.style.fontSize = `${baseSize}px`;
        titleElement.style.lineHeight = '1.3';
        titleElement.style.whiteSpace = 'normal';
        titleElement.style.wordBreak = 'keep-all';
        titleElement.style.wordWrap = 'break-word';
        
        // Проверяем, помещается ли текст по ширине
        const textWidth = titleElement.scrollWidth;
        
        // Если текст помещается по ширине - оставляем базовый размер
        if (textWidth <= containerWidth) {
            return;
        }
        
        // Если не помещается, уменьшаем шрифт пропорционально
        // Рассчитываем коэффициент уменьшения
        const ratio = containerWidth / textWidth;
        
        // Начальный целевой размер
        let targetSize = Math.floor(baseSize * ratio * 0.95);
        
        // Ограничиваем минимальным размером
        targetSize = Math.max(minSize, targetSize);
        
        // Применяем новый размер
        titleElement.style.fontSize = `${targetSize}px`;
        
        // Проверяем, помещается ли теперь текст
        setTimeout(() => {
            if (titleElement.scrollWidth > containerWidth && targetSize > minSize) {
                // Если всё ещё не помещается, уменьшаем ещё
                const newRatio = containerWidth / titleElement.scrollWidth;
                const smallerSize = Math.max(minSize, Math.floor(targetSize * newRatio * 0.95));
                titleElement.style.fontSize = `${smallerSize}px`;
            }
        }, 0);
        
    }, [isMobile]);
    
    // Эффект для адаптивного заголовка
    useEffect(() => {
        if (titleRef.current && movie) {
            // Небольшая задержка для корректного расчета
            const timer = setTimeout(adjustTitleFontSize, 100);
            return () => clearTimeout(timer);
        }
    }, [movie, adjustTitleFontSize]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setTimeout(adjustTitleFontSize, 100);
        };
        
        window.addEventListener('resize', handleResize);
        
        const handleWatchHistoryUpdate = () => {
            loadInterestFilms();
        };
        
        window.addEventListener('watchHistoryUpdated', handleWatchHistoryUpdate);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('watchHistoryUpdated', handleWatchHistoryUpdate);
        };
    }, [loadInterestFilms, adjustTitleFontSize]);

    // Загрузка данных фильма
    useEffect(() => {
        const loadMovieData = () => {
            try {
                setLoading(true);
                setLogoError(false);
                
                const filmData = filmManager.getFilmById(id);
                
                if (filmData) {
                    setMovie(filmData);
                    setSelectedPartner(filmData.partner || 'okko');
                    setIsSaved(isFilmSaved(filmData.id));
                    
                    setLogoUrl(filmData.logoUrl || null);
                    setPosterUrl(filmData.img || filmManager.generatePlaceholder(filmData.title));
                    
                    if (filmData.backdropUrl) {
                        setBackdropUrl(filmData.backdropUrl);
                        setUsePosterAsBackdrop(false);
                    } else {
                        setBackdropUrl(filmData.img || filmManager.generatePlaceholder(filmData.title));
                        setUsePosterAsBackdrop(true);
                    }
                    
                    loadSimilarFilms(filmData);
                    loadInterestFilms();
                } else {
                    filmManager.loadFilmsFromSupabase().then(allFilms => {
                        const foundFilm = allFilms.find(f => f.id == id);
                        if (foundFilm) {
                            setMovie(foundFilm);
                            setSelectedPartner(foundFilm.partner || 'okko');
                            setIsSaved(isFilmSaved(foundFilm.id));
                            
                            setLogoUrl(foundFilm.logoUrl || null);
                            setPosterUrl(foundFilm.img || filmManager.generatePlaceholder(foundFilm.title));
                            
                            if (foundFilm.backdropUrl) {
                                setBackdropUrl(foundFilm.backdropUrl);
                                setUsePosterAsBackdrop(false);
                            } else {
                                setBackdropUrl(foundFilm.img || filmManager.generatePlaceholder(foundFilm.title));
                                setUsePosterAsBackdrop(true);
                            }
                            
                            loadSimilarFilms(foundFilm);
                            loadInterestFilms();
                        }
                    });
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки данных фильма:', error);
                setLoading(false);
            }
        };
        
        loadMovieData();
    }, [id, filmManager, loadInterestFilms]);

    // Добавление в историю просмотров
    useEffect(() => {
        if (movie) {
            addToWatchHistory(movie);
            setTimeout(() => {
                loadInterestFilms();
            }, 100);
        }
    }, [movie, loadInterestFilms]);

    const loadSimilarFilms = (filmData) => {
        setLoadingSimilar(true);
        
        try {
            let allOtherFilms = films.filter(f => f.id != filmData.id);
            
            const scoredFilms = allOtherFilms.map(f => {
                let score = 0;
                
                if (f.genre === filmData.genre) score += 10;
                if (f.contentType === filmData.contentType) score += 5;
                
                const yearDiff = Math.abs((f.year || 2020) - (filmData.year || 2020));
                if (yearDiff <= 1) score += 8;
                else if (yearDiff <= 3) score += 5;
                else if (yearDiff <= 5) score += 3;
                
                if (f.rating >= 8) score += 4;
                else if (f.rating >= 7) score += 2;
                else if (f.rating >= 6) score += 1;
                
                return { film: f, score };
            });
            
            scoredFilms.sort((a, b) => b.score - a.score);
            let similar = scoredFilms.slice(0, 15).map(item => item.film);
            
            if (similar.length < 15) {
                const remainingFilms = allOtherFilms.filter(f => !similar.includes(f));
                const additional = remainingFilms
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 15 - similar.length);
                similar = [...similar, ...additional];
            }
            
            setSimilarFilms(similar);
        } catch (error) {
            console.error('Ошибка загрузки похожих фильмов:', error);
        } finally {
            setLoadingSimilar(false);
        }
    };

    const handleSaveClick = () => {
        if (isSaved) {
            unsaveFilm(movie.id);
            setIsSaved(false);
        } else {
            saveFilm(movie.id);
            setIsSaved(true);
        }
    };

    const handleWatchMovie = () => {
        if (movie && movie.partnerLinks && movie.partnerLinks[selectedPartner]) {
            window.open(movie.partnerLinks[selectedPartner], '_blank');
        } else if (movie && movie.partner) {
            window.open(movie.partnerLinks?.[movie.partner], '_blank');
        }
    };

    const handleOpenTrailer = () => {
        if (movie.trailerUrl) {
            if (movie.trailerUrl.includes('youtube.com') || movie.trailerUrl.includes('youtu.be')) {
                window.open(movie.trailerUrl, '_blank');
            } else {
                setShowTrailer(true);
            }
        } else {
            const searchQuery = encodeURIComponent(`${movie.title} ${movie.year} трейлер`);
            window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
        }
    };

    const handleBackdropError = (e) => {
        if (movie) {
            setUsePosterAsBackdrop(true);
            e.target.src = movie.img || filmManager.generatePlaceholder(movie.title);
            e.target.style.objectFit = 'contain';
            e.target.style.objectPosition = 'center';
        }
    };

    const handleLogoError = (e) => {
        setLogoError(true);
        e.target.style.display = 'none';
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Загрузка...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="error-message">
                        <h2>Фильм не найден</h2>
                        <p>К сожалению, запрашиваемый фильм не существует или был удален.</p>
                        <button onClick={() => navigate(-1)} className="back-btn">
                            ← Вернуться назад
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const partnerInfo = PARTNERS[selectedPartner] || PARTNERS.okko;

    return (
        <div className="page-content movie-detail-new">
            <div className="container">
                <div className="movie-hero-container">
                    <div className={`movie-hero-wrapper ${usePosterAsBackdrop && isMobile ? 'vertical-poster-mode' : ''}`}>
                        <div className={`movie-hero-left ${usePosterAsBackdrop && isMobile ? 'vertical-poster-content' : ''}`}>
                            <div className="movie-logo-section" ref={titleContainerRef}>
                                <h1 
                                    ref={titleRef} 
                                    className="movie-title-fallback-new"
                                    style={{
                                        whiteSpace: 'normal',
                                        wordBreak: 'keep-all',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        lineHeight: '1.3',
                                        maxWidth: '100%',
                                        margin: 0,
                                        padding: 0,
                                        fontWeight: 800,
                                        color: 'white',
                                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                                    }}
                                >
                                    {movie.title}
                                </h1>
                            </div>
                            
                            <div className="movie-hero-meta">
                                <div className="movie-rating-large">
                                    <span className="rating-star">★</span>
                                    <span className="rating-value">{movie.rating}/10</span>
                                    <span className="age-rating-badge">{movie.ageRating || '16+'}</span>
                                </div>
                                
                                <div className="movie-info-row-compact">
                                    <span>{movie.year}</span>
                                    <span className="dot-separator">•</span>
                                    <span>{movie.genre}</span>
                                    <span className="dot-separator">•</span>
                                    <span>{movie.duration}</span>
                                    {movie.country && (
                                        <>
                                            <span className="dot-separator">•</span>
                                            <span>{movie.country}</span>
                                        </>
                                    )}
                                </div>
                                
                                {movie.seasons && movie.contentType === 'series' && (
                                    <div className="series-badge-container">
                                        <span className="series-badge">{movie.seasons} сезон{movie.seasons > 1 ? 'а' : ''}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className={`movie-hero-actions-compact ${usePosterAsBackdrop && isMobile ? 'vertical-poster-actions' : ''}`}>
                                <button className="watch-btn-primary-new" onClick={handleWatchMovie}>
                                    <span>Смотреть на {partnerInfo.name}</span>
                                    <span className="arrow-icon">→</span>
                                </button>
                                
                                <div className="movie-secondary-actions">
                                    <button 
                                        className={`bookmark-btn-secondary-new ${isSaved ? 'saved' : ''}`}
                                        onClick={handleSaveClick}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                        </svg>
                                        {isSaved ? 'В сохраненных' : 'Сохранить'}
                                    </button>
                                    
                                    <button 
                                        className="trailer-btn-secondary-new" 
                                        onClick={handleOpenTrailer}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5 3 19 12 5 21 5 3"/>
                                        </svg>
                                        Трейлер
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`movie-hero-right ${usePosterAsBackdrop && isMobile ? 'vertical-poster-right' : ''}`}>
                            <div className="backdrop-container">
                                <img 
                                    src={backdropUrl}
                                    alt={`${movie.title} постер`}
                                    className={`movie-backdrop ${usePosterAsBackdrop ? 'poster-as-backdrop' : ''}`}
                                    onError={handleBackdropError}
                                />
                                
                                <div className={`backdrop-dark-overlay ${usePosterAsBackdrop && isMobile ? 'vertical-poster-overlay' : ''}`}></div>
                                
                                {movie.partner && (
                                    <div className={`partner-icon-on-backdrop ${usePosterAsBackdrop && isMobile ? 'vertical-poster-icon' : ''}`}>
                                        <img 
                                            src={getPartnerIcon(movie.partner)}
                                            alt={PARTNERS[movie.partner]?.name || 'Партнер'}
                                            onError={(e) => handleIconError(e, movie.partner)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="movie-content-below">
                    <div className="description-section">
                        <h3 className="section-heading">Описание</h3>
                        <p className="description-text">{movie.description}</p>
                    </div>
                    
                    <div className="crew-section">
                        <div className="crew-grid">
                            <div className="crew-card">
                                <h4 className="crew-title">Режиссер</h4>
                                <p className="crew-value">{movie.director || 'Не указан'}</p>
                            </div>
                            <div className="crew-card">
                                <h4 className="crew-title">В ролях</h4>
                                <p className="crew-value">{movie.actors || 'Не указаны'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="platforms-section platforms-closer">
                        <h3 className="section-heading">Где посмотреть</h3>
                        <div className="platforms-grid">
                            {Object.entries(movie.partnerLinks || {}).map(([key, link]) => {
                                if (!link) return null;
                                const partner = PARTNERS[key];
                                if (!partner) return null;
                                
                                return (
                                    <a 
                                        key={key}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="platform-card"
                                        onClick={(e) => {
                                            if (key === selectedPartner) {
                                                e.preventDefault();
                                                handleWatchMovie();
                                            }
                                        }}
                                    >
                                        <div className="platform-icon-wrapper">
                                            <div className="platform-icon">
                                                <img 
                                                    src={getPartnerIcon(key)}
                                                    alt={partner.name}
                                                    onError={(e) => handleIconError(e, key)}
                                                />
                                            </div>
                                        </div>
                                        <div className="platform-info">
                                            <span className="platform-name">{partner.name}</span>
                                            <span className="platform-action">
                                                {key === selectedPartner ? 'Смотреть →' : 'Перейти →'}
                                            </span>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Ряд "Похожие фильмы/сериалы/мультфильмы" */}
                    <div className="similar-section" style={{ marginBottom: '20px' }}>
                        <div className="section-header">
                            <h3 className="section-heading">{getSimilarTitle()}</h3>
                        </div>
                        
                        {loadingSimilar ? (
                            <div className="loading-similar">
                                <div className="spinner-small"></div>
                                <p>Загрузка похожих фильмов...</p>
                            </div>
                        ) : similarFilms.length > 0 ? (
                            <HorizontalScroll className="similar-movies-scroll" itemsCount={similarFilms.length}>
                                {similarFilms.map(film => (
                                    <div key={film.id} className="similar-movie-card">
                                        <div className="movie-card" onClick={() => navigate(`/movie/${film.id}`)}>
                                            <div className="movie-card-inner">
                                                <img 
                                                    src={film.img} 
                                                    alt={film.title}
                                                    className="movie-poster"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = filmManager.generatePlaceholder(film.title);
                                                    }}
                                                />
                                                
                                                {film.partner && PARTNERS[film.partner] && (
                                                    <div className="partner-icon">
                                                        <img 
                                                            className="partner-icon-img"
                                                            src={getPartnerIcon(film.partner)}
                                                            alt={PARTNERS[film.partner].name}
                                                            onError={(e) => handleIconError(e, film.partner)}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="movie-gradient-overlay"></div>
                                                
                                                <div className="movie-buttons-overlay">
                                                    <button 
                                                        className="info-btn-compact"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/movie/${film.id}`);
                                                        }}
                                                    >
                                                        Подробнее
                                                    </button>
                                                    
                                                    <button className="bookmark-btn-compact">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="similar-movie-title">
                                            {film.title}
                                        </div>
                                    </div>
                                ))}
                            </HorizontalScroll>
                        ) : (
                            <div className="no-similar-films">
                                <p>Похожие фильмы не найдены</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Ряд "Вы интересовались" - показываем только если есть история просмотров */}
                    {!loadingInterest && interestFilms.length > 0 && (
                        <div className="similar-section interest-section" style={{ marginTop: '0' }}>
                            <div className="section-header">
                                <h3 className="section-heading">Вы интересовались</h3>
                            </div>
                            
                            <HorizontalScroll className="similar-movies-scroll" itemsCount={interestFilms.length}>
                                {interestFilms.map(film => (
                                    <div key={film.id} className="similar-movie-card">
                                        <div className="movie-card" onClick={() => navigate(`/movie/${film.id}`)}>
                                            <div className="movie-card-inner">
                                                <img 
                                                    src={film.img} 
                                                    alt={film.title}
                                                    className="movie-poster"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = filmManager.generatePlaceholder(film.title);
                                                    }}
                                                />
                                                
                                                {film.partner && PARTNERS[film.partner] && (
                                                    <div className="partner-icon">
                                                        <img 
                                                            className="partner-icon-img"
                                                            src={getPartnerIcon(film.partner)}
                                                            alt={PARTNERS[film.partner].name}
                                                            onError={(e) => handleIconError(e, film.partner)}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="movie-gradient-overlay"></div>
                                                
                                                <div className="movie-buttons-overlay">
                                                    <button 
                                                        className="info-btn-compact"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/movie/${film.id}`);
                                                        }}
                                                    >
                                                        Подробнее
                                                    </button>
                                                    
                                                    <button className="bookmark-btn-compact">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="similar-movie-title">
                                            {film.title}
                                        </div>
                                    </div>
                                ))}
                            </HorizontalScroll>
                        </div>
                    )}
                </div>
            </div>
            
            {showTrailer && movie.trailerUrl && (
                <div className="trailer-modal" onClick={() => setShowTrailer(false)}>
                    <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="trailer-close-btn" onClick={() => setShowTrailer(false)}>×</button>
                        <video 
                            src={movie.trailerUrl} 
                            controls 
                            autoPlay 
                            className="trailer-video"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieDetailPage;