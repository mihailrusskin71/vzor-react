import React, { useEffect, useRef } from 'react';

const SidebarBackgroundEffects = ({ side }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаем звезды
    const stars = [];
    const starCount = 25;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star-particle';
      
      // Позиционируем
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      star.style.animationDuration = `${2 + Math.random() * 3}s`;
      
      // Размер
      const size = 1 + Math.random() * 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      container.appendChild(star);
      stars.push(star);
    }

    // Добавляем градиентные элементы
    const gradient1 = document.createElement('div');
    gradient1.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 300px;
      background: radial-gradient(circle at ${side === 'left' ? '30%' : '70%'} 20%, 
        rgba(255, 106, 43, 0.08) 0%, 
        transparent 70%);
      pointer-events: none;
      z-index: -1;
    `;
    container.appendChild(gradient1);

    const gradient2 = document.createElement('div');
    gradient2.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 300px;
      background: radial-gradient(circle at ${side === 'left' ? '70%' : '30%'} 80%, 
        rgba(255, 69, 0, 0.05) 0%, 
        transparent 70%);
      pointer-events: none;
      z-index: -1;
    `;
    container.appendChild(gradient2);

    return () => {
      // Убираем все созданные элементы
      container.innerHTML = '';
    };
  }, [side]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }} 
    />
  );
};

export default SidebarBackgroundEffects;