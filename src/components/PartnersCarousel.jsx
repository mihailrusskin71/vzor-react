// src/components/PartnersCarousel.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/modules/partners-carousel.css';

const PARTNERS_DATA = [
  { id: 'wink', name: 'Wink', image: '/partners/wink.png', link: 'https://wink.ru' },
  { id: 'ivi', name: 'IVI', image: '/partners/ivi.png', link: 'https://ivi.ru' },
  { id: 'kinopoisk', name: 'Кинопоиск', image: '/partners/kinopoisk.png', link: 'https://kinopoisk.ru' },
  { id: 'kion', name: 'KION', image: '/partners/kion.png', link: 'https://kion.ru' },
  { id: 'okko', name: 'OKKO', image: '/partners/okko.png', link: 'https://okko.tv' },
  { id: 'premier', name: 'PREMIER', image: '/partners/premier.png', link: 'https://premier.one' }
];

const PartnersCarousel = ({ isMobile = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % PARTNERS_DATA.length);
      }, 8000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered]);

  const handlePrevClick = () => setCurrentIndex((prev) => prev === 0 ? PARTNERS_DATA.length - 1 : prev - 1);
  const handleNextClick = () => setCurrentIndex((prev) => (prev + 1) % PARTNERS_DATA.length);
  const handlePartnerClick = (link) => window.open(link, '_blank', 'noopener,noreferrer');

  return (
    <section className="partners-carousel-section">
      <div 
        className="partners-carousel-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={isMobile ? { 
          padding: '10px 0 5px 0',
          marginTop: '-5px'
        } : {}}
      >
        {/* Кнопка "Назад" - скрываем на мобильных */}
        {!isMobile && isHovered && (
          <button className="carousel-nav-btn prev-btn" onClick={handlePrevClick} aria-label="Предыдущий партнер">
            <span className="nav-arrow">❮</span>
          </button>
        )}

        {/* Карусель */}
        <div className="partners-carousel" style={isMobile ? { height: '280px' } : {}}>
          {PARTNERS_DATA.map((partner, index) => {
            let position = '';
            
            if (index === currentIndex) {
              position = 'center';
            } else if (index === (currentIndex - 1 + PARTNERS_DATA.length) % PARTNERS_DATA.length) {
              position = 'left';
            } else if (index === (currentIndex + 1) % PARTNERS_DATA.length) {
              position = 'right';
            } else {
              return null;
            }
            
            // На мобильных показываем только центральный плакат
            if (isMobile && position !== 'center') {
              return null;
            }
            
            return (
              <div 
                key={partner.id}
                className={`partner-card ${position}`}
                onClick={() => position === 'center' && handlePartnerClick(partner.link)}
                style={{ 
                  cursor: position === 'center' ? 'pointer' : 'default',
                  ...(isMobile && position === 'center' ? {
                    width: '95%',
                    height: 'auto',
                    maxWidth: '500px',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  } : {})
                }}
              >
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="partner-image"
                  loading="lazy"
                  style={isMobile && position === 'center' ? {
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px'
                  } : {}}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/1536x1024/1a1a24/ffffff?text=${partner.name}`;
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Кнопка "Вперед" - скрываем на мобильных */}
        {!isMobile && isHovered && (
          <button className="carousel-nav-btn next-btn" onClick={handleNextClick} aria-label="Следующий партнер">
            <span className="nav-arrow">❯</span>
          </button>
        )}

        {/* Индикаторы */}
        <div className="carousel-indicators" style={isMobile ? { marginTop: '-25px' } : {}}>
          {PARTNERS_DATA.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false);
              }}
              style={isMobile ? {
                width: '12px',
                height: '12px',
                margin: '0px'
              } : {}}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersCarousel;