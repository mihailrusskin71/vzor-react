import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Ждем немного чтобы React успел отрисовать страницу
    const timer = setTimeout(() => {
      // Скроллим ВСЕ контейнеры наверх
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      
      // Также скроллим body на всякий случай
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Если есть центральный контейнер со скроллом
      const centerContent = document.getElementById('center-content');
      if (centerContent) {
        centerContent.scrollTop = 0;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export default ScrollToTop;