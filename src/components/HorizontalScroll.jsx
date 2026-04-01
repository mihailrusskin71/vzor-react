import React, { useRef, useState } from 'react';

const HorizontalScroll = ({ children, className = '' }) => {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 1075;
      scrollRef.current.scrollLeft += direction * scrollAmount;
    }
  };

  return (
    <div 
      className={`horizontal-scroll-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <button 
          className="custom-scroll-btn left" 
          onClick={() => scroll(-1)}
          aria-label="Прокрутить влево"
        >
          <span className="nav-arrow">❮</span>
        </button>
      )}
      
      <div className="horizontal-scroll" ref={scrollRef}>
        {children}
      </div>
      
      {isHovered && (
        <button 
          className="custom-scroll-btn right" 
          onClick={() => scroll(1)}
          aria-label="Прокрутить вправо"
        >
          <span className="nav-arrow">❯</span>
        </button>
      )}
    </div>
  );
};

export default HorizontalScroll;