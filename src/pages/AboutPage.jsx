// src/pages/AboutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="page-content">
      <div className="content-wrapper-1100" style={{ padding: '40px 0' }}>
        <div className="about-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '20px' }}>
            О проекте <span style={{ color: '#FF6A2B' }}>VzorRos</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#aaa', maxWidth: '800px', margin: '0 auto' }}>
            Ваш гид в мире легального кино
          </p>
        </div>

        <div className="about-section" style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '16px', 
          padding: '40px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 106, 43, 0.2)'
        }}>
          <h2 style={{ color: '#FF6A2B', marginBottom: '20px', fontSize: '28px' }}>Что такое VzorRos?</h2>
          <p style={{ color: '#ccc', lineHeight: '1.8', fontSize: '16px', marginBottom: '20px' }}>
            VzorRos — это единая платформа для навигации по легальному видеоконтенту в России. Мы объединяем фильмы, 
            сериалы и мультфильмы из всех популярных онлайн-кинотеатров — OKKO, IVI, KION, Premier, КиноПоиск и Wink — 
            в удобном и понятном интерфейсе.
          </p>
          <p style={{ color: '#ccc', lineHeight: '1.8', fontSize: '16px' }}>
            Наша миссия — сделать просмотр легального контента максимально комфортным. Мы помогаем вам ориентироваться 
            в огромном мире кино, находить то, что действительно стоит внимания, и мгновенно переходить к просмотру 
            на выбранной платформе. Мы не храним видео, но мы заботимся о вашем времени и впечатлениях.
          </p>
        </div>

        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '50px'
        }}>
          <div className="feature-card" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(255, 106, 43, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎬</div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>Всё в одном месте</h3>
            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              Больше не нужно открывать шесть разных сайтов, чтобы найти фильм. Мы показываем, где доступен контент, 
              и вы сразу попадаете на страницу просмотра в выбранном кинотеатре.
            </p>
          </div>

          <div className="feature-card" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(255, 106, 43, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔖</div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>Ваша коллекция</h3>
            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              Сохраняйте понравившиеся фильмы в личный профиль, формируйте собственную коллекцию и возвращайтесь 
              к ним в любой момент. Все данные хранятся локально — только вы решаете, чем делиться.
            </p>
          </div>

          <div className="feature-card" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(255, 106, 43, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚡</div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>Мгновенный переход</h3>
            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              Один клик — и вы уже на странице фильма в выбранном онлайн-кинотеатре. Никакой лишней информации, 
              только быстрый путь к просмотру.
            </p>
          </div>
        </div>

        <div className="partners-about" style={{
          background: 'linear-gradient(135deg, rgba(255, 106, 43, 0.1), rgba(0, 0, 0, 0.5))',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 106, 43, 0.3)'
        }}>
          <h2 style={{ color: 'white', marginBottom: '30px', fontSize: '28px', textAlign: 'center' }}>
            Платформы, с которыми мы работаем
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            alignItems: 'center'
          }}>
            {['OKKO', 'IVI', 'KION', 'Premier', 'КиноПоиск', 'Wink'].map(partner => (
              <div key={partner} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#FF6A2B',
                fontWeight: '600',
                fontSize: '18px',
                border: '1px solid rgba(255, 106, 43, 0.3)'
              }}>
                {partner}
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6A2B' }}>1000+</div>
            <div style={{ color: '#aaa' }}>Фильмов и сериалов</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6A2B' }}>6</div>
            <div style={{ color: '#aaa' }}>Платформ-партнёров</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6A2B' }}>24/7</div>
            <div style={{ color: '#aaa' }}>Доступность</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6A2B' }}>100%</div>
            <div style={{ color: '#aaa' }}>Легальный контент</div>
          </div>
        </div>

        <div className="about-footer" style={{
          textAlign: 'center',
          padding: '40px',
          borderTop: '1px solid #333'
        }}>
          <p style={{ color: '#888', fontSize: '14px' }}>
            VzorRos — это не онлайн-кинотеатр. Мы не храним видеофайлы. Наша задача — помогать вам находить 
            и выбирать легальный контент в российских онлайн-кинотеатрах. Все права на фильмы и сериалы 
            принадлежат их законным правообладателям.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;