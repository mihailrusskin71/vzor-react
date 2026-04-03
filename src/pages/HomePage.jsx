// HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import PartnersCarousel from '../components/PartnersCarousel';
import '../styles/index.css';

function HomePage({ films, customRows, filmManager }) {
  const navigate = useNavigate();
  const [homeCustomRows, setHomeCustomRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (filmManager) {
      const rowsForHome = Object.values(customRows).filter(row => {
        return row.pageType === 'all';
      });
      setHomeCustomRows(rowsForHome);
    }
    setIsLoading(false);
  }, [films, customRows, filmManager]);
  
  return (
    <div className="page-content">
      <div className="content-wrapper-1100">
        {/* Карусель партнеров */}
        <div style={{ marginBottom: isMobile ? '30px' : '50px' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: isMobile ? '-80px' : '-130px',
            fontSize: isMobile ? '36px' : '43px',
            fontWeight: '600',
            background: 'linear-gradient(90deg, #fff 0%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            transform: isMobile ? 'translateY(-15px)' : 'translateY(-30px)'
          }}>
            Наши партнёры
          </h2>
          <PartnersCarousel isMobile={isMobile} />
        </div>
        
        {/* Отображаем все ряды для главной */}
        <div className="rows-container" style={{ 
          marginTop: isMobile ? '-20px' : '0'
        }}>
          {homeCustomRows.map(row => (
            <HorizontalScrollRow
              key={row.id}
              title={row.name}
              rowId={row.id}
              filmManager={filmManager}
              onViewAll={() => navigate(`/row/${row.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
export default HomePage;
