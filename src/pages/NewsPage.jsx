// src/pages/NewsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/pages/news.css';

// Иконки
const FireIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const NewsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M18 10h-6" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Все новости');
  const [error, setError] = useState(null);

  const categories = ['Все новости', 'Премьеры', 'Сериалы', 'Фестивали', 'Рецензии', 'Трейлеры'];

  // Улучшенное определение категории
  const getCategory = (title, description) => {
    const text = (title + ' ' + description).toLowerCase();
    
    // Премьеры
    if (text.includes('премьер') || text.includes('вышел') || text.includes('старт') || 
        text.includes('релиз') || text.includes('показ') || text.includes('дата')) {
      return 'Премьеры';
    }
    
    // Трейлеры
    if (text.includes('трейлер') || text.includes('тизер') || text.includes('ролик') ||
        text.includes('кадры') || text.includes('фрагмент') || text.includes('смотреть')) {
      return 'Трейлеры';
    }
    
    // Сериалы
    if (text.includes('сериал') || text.includes('сезон') || text.includes('эпизод') ||
        text.includes('шоу') || text.includes('спин-офф')) {
      return 'Сериалы';
    }
    
    // Фестивали
    if (text.includes('фестиваль') || text.includes('канн') || text.includes('оскар') ||
        text.includes('премия') || text.includes('кинофест') || text.includes('венециан')) {
      return 'Фестивали';
    }
    
    // Рецензии
    if (text.includes('рецензия') || text.includes('критик') || text.includes('обзор') ||
        text.includes('отзыв') || text.includes('оценка') || text.includes('вердикт')) {
      return 'Рецензии';
    }
    
    return 'Новости';
  };

  const parseKinoNewsRss = (xmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('Ошибка парсинга XML:', parseError.textContent);
      return [];
    }
    
    const items = doc.querySelectorAll('item');
    console.log(`📰 Найдено новостей: ${items.length}`);
    
    const parsedNews = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      const enclosure = item.querySelector('enclosure');
      const imageUrl = enclosure?.getAttribute('url') || null;
      
      if (!title) continue;
      
      const category = getCategory(title, description);
      
      parsedNews.push({
        id: `news-${i}-${Date.now()}`,
        title,
        link,
        description: description || 'Подробности по ссылке...',
        pubDate: pubDate || new Date().toISOString(),
        category,
        imageUrl: imageUrl || `https://picsum.photos/seed/${i}/300/200`,
        source: 'KinoNews.ru'
      });
    }
    
    return parsedNews;
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const SUPABASE_FUNCTION_URL = 'https://qolbgrvlkadqnfnprbgr.supabase.co/functions/v1/news-rss';
      
      console.log('📡 Запрос новостей через Supabase Function...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const xmlText = await response.text();
      console.log(`📦 Получено ${xmlText.length} символов`);
      
      if (!xmlText.includes('<item>')) {
        console.error('❌ Ответ не содержит элементов <item>');
        throw new Error('Неверный формат данных');
      }
      
      const parsedNews = parseKinoNewsRss(xmlText);
      
      if (parsedNews.length === 0) {
        throw new Error('Не удалось найти новости');
      }
      
      console.log(`✅ Успешно загружено ${parsedNews.length} новостей`);
      setNews(parsedNews);
      
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError(err.message);
      setNews(getFallbackNews());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackNews = () => {
    const fallback = [
      { title: 'Фестиваль Comic Con Игромир 2026 перенесли на декабрь', description: 'Объявлена новые даты проведения крупнейшего фестиваля поп-культуры в России', category: 'Фестивали' },
      { title: 'Критики назвали третий сезон "Эйфории" "безумной катастрофой"', description: 'Появились первые отзывы на сериал с Зендаей', category: 'Сериалы' },
      { title: 'Зак Снайдер представит фильм "Последняя фотография" в Каннах', description: 'Режиссёр "Мятежной Луны" возвращается на набережную Круазетт', category: 'Фестивали' },
      { title: '"История игрушек 5" возглавила список ожиданий зрителей', description: 'Рейтинг самых ожидаемых кинопроектов летнего сезона', category: 'Премьеры' },
      { title: 'Вышел первый трейлер "Человек-паук: За пределами вселенных"', description: 'Sony показала продолжение культовой дилогии', category: 'Трейлеры' },
      { title: 'Крис Хемсворт и Идрис Эльба сыграют в третьей части "Тайлера Рейка"', description: 'Актёры вновь встретятся на съёмках боевика', category: 'Новости' },
      { title: 'Рецензия на "Миссия невыполнима: Финальная расплата"', description: 'Идеальный финал саги с Томом Крузом', category: 'Рецензии' },
      { title: 'Энди Серкис повторит роль Альфреда в "Бэтмене 2"', description: 'Актёр сумеет совместить съёмки с работой над "Властелином колец"', category: 'Новости' },
    ];
    
    return fallback.map((item, i) => ({
      id: `fb-${i}`,
      ...item,
      link: '#',
      pubDate: new Date(Date.now() - i * 86400000).toISOString(),
      imageUrl: `https://picsum.photos/seed/fallback${i}/300/200`,
      source: 'KinoNews.ru'
    }));
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  };

  const filteredNews = useMemo(() => {
    if (activeFilter === 'Все новости') return news;
    return news.filter(item => item.category === activeFilter);
  }, [news, activeFilter]);

  const mainNews = filteredNews[0];
  const secondaryNews = filteredNews.slice(1, 4);
  const otherNews = filteredNews.slice(4);

  if (loading) {
    return <div className="news-page"><div className="container"><div className="news-loading"><div className="loading-spinner"></div><p>Загружаем новости кино...</p></div></div></div>;
  }

  return (
    <div className="news-page">
      <div className="container">
        <div className="news-header">
          <h1 className="news-title">Новости кино</h1>
          <p className="news-subtitle">Свежие новости от KinoNews.ru</p>
        </div>
        <div className="news-filters-section">
          <div className="news-filters-scroll">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`news-filter-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {mainNews && (
          <section className="main-news-section">
            <h2 className="section-title">
              <span className="section-icon"><FireIcon /></span>
              Главные новости
            </h2>
            <div className="main-news-grid">
              <div className="main-news-card large">
                <NewsCard item={mainNews} isLarge={true} formatDate={formatDate} showCategory={true} />
              </div>
              <div className="secondary-news-grid">
                {secondaryNews.map(item => <div key={item.id} className="secondary-news-card">
                  <NewsCard item={item} isSmall={true} formatDate={formatDate} showCategory={false} />
                </div>)}
              </div>
            </div>
          </section>
        )}
        <section className="all-news-section">
          <h2 className="section-title">
            <span className="section-icon"><NewsIcon /></span>
            Лента новостей
          </h2>
          <div className="news-feed">
            {otherNews.map(item => <NewsCard key={item.id} item={item} isFeed={true} formatDate={formatDate} showCategory={true} />)}
          </div>
          {filteredNews.length === 0 && (
            <div className="no-news">
              <p>Новостей в этой категории пока нет</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const NewsCard = ({ item, isLarge, isSmall, isFeed, formatDate, showCategory = true }) => {
  const handleClick = () => { if (item.link && item.link !== '#') window.open(item.link, '_blank', 'noopener,noreferrer'); };
  const cardClass = `news-card ${isLarge ? 'large' : ''} ${isSmall ? 'small' : ''} ${isFeed ? 'feed' : ''}`;
  return (
    <article className={cardClass} onClick={handleClick}>
      <div className="news-card-image">
        <img src={item.imageUrl} alt={item.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = 'https://picsum.photos/300/200'; }} />
        {showCategory && item.category && <span className="news-category">{item.category}</span>}
      </div>
      <div className="news-card-content">
        <div className="news-meta"><span className="news-source">{item.source}</span><span className="news-date">{formatDate(item.pubDate)}</span></div>
        <h3 className="news-card-title">{item.title}</h3>
        <p className="news-card-description">{item.description}</p>
        <div className="news-card-footer"><span className="read-more">Читать далее <ArrowIcon /></span></div>
      </div>
    </article>
  );
};

export default NewsPage;