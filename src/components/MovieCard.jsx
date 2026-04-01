// src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PARTNERS } from '../utils/constants';
import { trackClick } from '../utils/userId';
import { isFilmSaved, saveFilm, unsaveFilm, addToWatchHistory } from '../utils/userId';

const MovieCard = ({ movie, onSaveChange }) => {
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const partnerInfo = PARTNERS[movie.partner?.toLowerCase()] || PARTNERS.okko;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Проверяем, сохранен ли фильм при загрузке
        setIsSaved(isFilmSaved(movie.id));
        
        return () => window.removeEventListener('resize', handleResize);
    }, [movie.id]);

    const handleCardClick = (e) => {
        // Проверяем, не кликнули ли по кнопке
        if (e.target.closest('.info-btn-compact') || 
            e.target.closest('.bookmark-btn-compact') ||
            e.target.closest('.partner-icon')) {
            return;
        }
        
        // Добавляем в историю просмотров
        addToWatchHistory(movie);
        
        // Открываем детальную страницу
        navigate(`/movie/${movie.id}`);
    };

    const handleInfoClick = (e) => {
        e.stopPropagation();
        
        // Добавляем в историю просмотров
        addToWatchHistory(movie);
        
        navigate(`/movie/${movie.id}`);
    };

    const handleBookmarkClick = (e) => {
        e.stopPropagation();
        
        if (isSaved) {
            unsaveFilm(movie.id);
            setIsSaved(false);
        } else {
            saveFilm(movie.id);
            setIsSaved(true);
        }
        
        // Вызываем колбэк если он есть
        if (onSaveChange) {
            onSaveChange();
        }
    };

    // Функция для отслеживания кликов по партнерским ссылкам
    const handlePartnerClick = async (e, partnerName, url) => {
        e.stopPropagation(); // Предотвращаем переход на детальную страницу
        
        if (!url) return;
        
        // Проверяем, согласился ли пользователь на отслеживание
        const consent = localStorage.getItem('vzorkino_cookie_consent');
        const trackingEnabled = consent === 'accepted';
        
        if (trackingEnabled) {
            // Отслеживаем клик только если есть согласие
            await trackClick(movie, partnerName, url);
        }
        
        // Открываем в новой вкладке
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Форматирование рейтинга (замена точки на запятую)
    const formatRating = (rating) => {
        if (!rating) return '7,0';
        return rating.toString().replace('.', ',');
    };

    // Форматирование длительности
    const formatDuration = (duration) => {
        if (!duration) return '';
        // Если длительность уже в формате "1ч 30м" или что-то подобное
        if (duration.includes('ч') || duration.includes('мин')) {
            return duration;
        }
        // Если просто число минут
        if (typeof duration === 'number' || !isNaN(parseInt(duration))) {
            const minutes = parseInt(duration);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) {
                return `${hours}ч ${mins}м`;
            }
            return `${mins}м`;
        }
        return duration;
    };

    return (
        <div className="movie-card" onClick={handleCardClick}>
            <div className="movie-card-inner">
                {/* Иконка партнера */}
                {partnerInfo && (
                    <div className="partner-icon">
                        <img 
                            className="partner-icon-img"
                            src={partnerInfo.icon}
                            alt={partnerInfo.name}
                            loading="lazy"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/partner-icons/default.png';
                            }}
                            onClick={(e) => handlePartnerClick(
                                e, 
                                movie.partner, 
                                movie.partnerLinks?.[movie.partner?.toLowerCase()]
                            )}
                        />
                    </div>
                )}
                
                {/* Рейтинг для всех устройств */}
                <div className={`rating-badge ${isMobile ? 'mobile' : 'desktop'}`}>
                    <span>{formatRating(movie.rating)}</span>
                </div>
                
                <img 
                    className="movie-poster" 
                    src={movie.img || `https://via.placeholder.com/300x450/1a1a24/FF6A2B?text=${encodeURIComponent(movie.title)}`} 
                    alt={movie.title}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/300x450/1a1a24/FF6A2B?text=${encodeURIComponent(movie.title)}`;
                    }}
                />
                
                <div className="movie-gradient-overlay"></div>
                
                <div className="movie-buttons-overlay">
                    <button 
                        className="info-btn-compact" 
                        onClick={handleInfoClick}
                        title="Информация"
                    >
                        Подробнее
                    </button>
                    <button 
                        className={`bookmark-btn-compact ${isSaved ? 'saved' : ''}`}
                        onClick={handleBookmarkClick}
                        title={isSaved ? 'Удалить из сохраненных' : 'Сохранить'}
                    >
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24"
                            style={{
                                display: 'block',
                                width: '16px',
                                height: '16px',
                                minWidth: '16px',
                                minHeight: '16px'
                            }}
                        >
                            <path 
                                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" 
                                fill={isSaved ? "white" : "none"} 
                                stroke="white" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Подпись под карточкой для мобильных устройств */}
            {isMobile && (
                <div className="movie-card-caption">
                    <div className="movie-caption-title" title={movie.title}>
                        {movie.title}
                    </div>
                    <div className="movie-caption-meta">
                        {movie.year}
                        {movie.duration && `, ${formatDuration(movie.duration)}`}
                        {isSaved && <span className="saved-indicator">✓ В сохраненных</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieCard;