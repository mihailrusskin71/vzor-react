// src/components/CookieConsent.jsx
import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vzorkino_cookie_consent');
    if (!consent) {
      // Показываем баннер через небольшую задержку для лучшего UX
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const acceptCookies = () => {
    // Импортируем функцию динамически, чтобы избежать циклических зависимостей
    import('../utils/userId').then(({ handleCookieAccept }) => {
      handleCookieAccept();
      
      // Отправляем событие о принятии cookie
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
        detail: { accepted: true } 
      }));
    });
    
    // Анимация закрытия
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShow(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const rejectCookies = () => {
    import('../utils/userId').then(({ handleCookieReject }) => {
      handleCookieReject();
      
      // Отправляем событие об отказе
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
        detail: { accepted: false } 
      }));
    });
    
    // Анимация закрытия
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShow(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <>
      {/* Затемнение и блюр фона */}
      <div className="cookie-overlay" />
      
      {/* Баннер согласия */}
      <div className={`cookie-consent ${isAnimatingOut ? 'closing' : ''}`}>
        <div className="cookie-consent-content">
          <h3 className="cookie-consent-title">
            🍪 Ваша конфиденциальность важна для нас
          </h3>
          <p className="cookie-consent-text">
            Мы используем файлы cookie для сбора статистики и сохранения ваших предпочтений 
            (сохраненные фильмы, история просмотров). Это помогает нам улучшать сервис.
            <br />
            <strong>Без вашего согласия мы не сохраняем никакую информацию о вас.</strong>
          </p>
          <div className="cookie-consent-actions">
            <a 
              href="/privacy" 
              className="cookie-consent-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Подробнее о политике конфиденциальности
            </a>
            <div className="cookie-buttons">
              <button 
                onClick={rejectCookies}
                className="cookie-btn reject"
              >
                Отклонить
              </button>
              <button 
                onClick={acceptCookies}
                className="cookie-btn accept"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;