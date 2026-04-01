// src/utils/userId.js

// Генерация случайного ID пользователя
export const generateUserId = () => {
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
};

// Миграция старых данных (если нужно)
const migrateOldData = () => {
  const consent = localStorage.getItem('vzorkino_cookie_consent');
  
  // Если согласие есть, но оно в старом формате (просто 'accepted')
  if (consent === 'accepted' || consent === 'rejected') {
    // Все ок, оставляем как есть
    return;
  }
  
  // Если есть старый объект настроек
  try {
    const oldSettings = JSON.parse(consent);
    if (oldSettings.analytics) {
      localStorage.setItem('vzorkino_cookie_consent', 'accepted');
    } else {
      localStorage.setItem('vzorkino_cookie_consent', 'rejected');
    }
  } catch (e) {
    // Не JSON, оставляем как есть
  }
};

// Вызываем миграцию при загрузке
migrateOldData();

// Создание пустого профиля (только при наличии согласия)
const createEmptyProfile = (userId) => {
  const profile = {
    id: userId,
    created_at: new Date().toISOString(),
    last_visit: new Date().toISOString(),
    saved_films: [],
    watch_history: [],
    preferences: {
      dark_mode: true,
      language: 'ru'
    }
  };
  
  localStorage.setItem(`vzorkino_profile_${userId}`, JSON.stringify(profile));
  return profile;
};

// ПРОВЕРКА: есть ли согласие на отслеживание
export const hasTrackingConsent = () => {
  const consent = localStorage.getItem('vzorkino_cookie_consent');
  return consent === 'accepted';
};

// ПРОВЕРКА: есть ли созданный профиль
export const hasUserProfile = () => {
  const userId = localStorage.getItem('vzorkino_user_id');
  if (!userId) return false;
  
  const profileKey = `vzorkino_profile_${userId}`;
  const profile = localStorage.getItem(profileKey);
  return profile !== null;
};

// Получение или создание ID пользователя (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const getOrCreateUserId = () => {
  // КРИТИЧЕСКИ ВАЖНО: проверяем согласие перед созданием ID
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, ID пользователя не создается');
    return null;
  }
  
  let userId = localStorage.getItem('vzorkino_user_id');
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('vzorkino_user_id', userId);
    console.log('Новый пользователь (после согласия):', userId);
    
    // Создаем пустой профиль при первом посещении
    createEmptyProfile(userId);
  }
  
  return userId;
};

// Получение профиля пользователя (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const getUserProfile = () => {
  // Проверяем согласие
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, профиль недоступен');
    return null;
  }
  
  const userId = getOrCreateUserId();
  if (!userId) return null;
  
  const profileKey = `vzorkino_profile_${userId}`;
  const profile = localStorage.getItem(profileKey);
  
  if (profile) {
    return JSON.parse(profile);
  }
  
  // Если профиля нет, создаем новый
  return createEmptyProfile(userId);
};

// Обновление профиля (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const updateUserProfile = (updates) => {
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, обновление профиля невозможно');
    return null;
  }
  
  const userId = getOrCreateUserId();
  if (!userId) return null;
  
  const profileKey = `vzorkino_profile_${userId}`;
  const currentProfile = getUserProfile();
  
  if (!currentProfile) return null;
  
  const updatedProfile = {
    ...currentProfile,
    ...updates,
    last_visit: new Date().toISOString()
  };
  
  localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
  return updatedProfile;
};

// Сохранение фильма (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const saveFilm = (filmId) => {
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, сохранение невозможно');
    return false;
  }
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  if (!profile.saved_films.includes(filmId)) {
    profile.saved_films.push(filmId);
    updateUserProfile({ saved_films: profile.saved_films });
    
    // Отправляем событие об обновлении
    window.dispatchEvent(new Event('savedFilmsUpdated'));
    
    return true;
  }
  
  return false;
};

// Удаление из сохраненных (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const unsaveFilm = (filmId) => {
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, удаление невозможно');
    return false;
  }
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  if (profile.saved_films.includes(filmId)) {
    profile.saved_films = profile.saved_films.filter(id => id !== filmId);
    updateUserProfile({ saved_films: profile.saved_films });
    
    // Отправляем событие об обновлении
    window.dispatchEvent(new Event('savedFilmsUpdated'));
    
    return true;
  }
  
  return false;
};

// Проверка, сохранен ли фильм (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const isFilmSaved = (filmId) => {
  if (!hasTrackingConsent()) return false;
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  return profile.saved_films.includes(filmId);
};

// Добавление в историю просмотров (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const addToWatchHistory = (film) => {
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен, история не сохраняется');
    return false;
  }
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  // Удаляем дубликаты
  profile.watch_history = profile.watch_history.filter(item => item.id !== film.id);
  
  // Добавляем в начало с полной информацией о фильме
  profile.watch_history.unshift({
    id: film.id,
    title: film.title,
    year: film.year,
    genre: film.genre,
    contentType: film.contentType,
    img: film.img,
    rating: film.rating,
    watched_at: new Date().toISOString(),
    timestamp: Date.now()
  });
  
  // Ограничиваем историю 50 элементами
  if (profile.watch_history.length > 50) {
    profile.watch_history = profile.watch_history.slice(0, 50);
  }
  
  updateUserProfile({ watch_history: profile.watch_history });
  
  // Отправляем событие об обновлении
  window.dispatchEvent(new Event('watchHistoryUpdated'));
  
  return true;
};

// Получение истории просмотров (ТОЛЬКО ПОСЛЕ СОГЛАСИЯ)
export const getWatchHistory = () => {
  if (!hasTrackingConsent()) return [];
  
  const profile = getUserProfile();
  if (!profile) return [];
  
  return profile.watch_history || [];
};

// Получение полной информации о просмотренных фильмах с деталями
export const getFullWatchHistory = (films) => {
  if (!hasTrackingConsent()) return [];
  
  const history = getWatchHistory();
  if (!films || history.length === 0) return [];
  
  return history
    .map(historyItem => {
      const film = films.find(f => f.id === historyItem.id);
      return film ? { ...film, watched_at: historyItem.watched_at } : null;
    })
    .filter(Boolean);
};

// Очистка только истории просмотров
export const clearWatchHistory = () => {
  if (!hasTrackingConsent()) return false;
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  profile.watch_history = [];
  updateUserProfile({ watch_history: [] });
  
  // Отправляем событие об обновлении
  window.dispatchEvent(new Event('watchHistoryUpdated'));
  
  return true;
};

// Очистка только сохраненных фильмов
export const clearSavedFilms = () => {
  if (!hasTrackingConsent()) return false;
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  profile.saved_films = [];
  updateUserProfile({ saved_films: [] });
  
  // Отправляем событие об обновлении
  window.dispatchEvent(new Event('savedFilmsUpdated'));
  
  return true;
};

// Очистка всего (и история, и сохраненные)
export const clearAllHistory = () => {
  if (!hasTrackingConsent()) return false;
  
  const profile = getUserProfile();
  if (!profile) return false;
  
  profile.watch_history = [];
  profile.saved_films = [];
  updateUserProfile({ 
    watch_history: [],
    saved_films: []
  });
  
  // Отправляем события об обновлении
  window.dispatchEvent(new Event('savedFilmsUpdated'));
  window.dispatchEvent(new Event('watchHistoryUpdated'));
  
  return true;
};

// Для обратной совместимости
export const clearUserData = clearAllHistory;

// Отслеживание клика по партнерской ссылке
export const trackClick = async (film, partner, url) => {
  // Проверяем согласие на отслеживание
  if (!hasTrackingConsent()) {
    console.log('Трекинг отключен пользователем');
    return false;
  }
  
  const userId = getOrCreateUserId();
  if (!userId) return false;
  
  // Сохраняем в localStorage для истории
  const clickHistory = JSON.parse(localStorage.getItem('vzorkino_clicks') || '[]');
  clickHistory.push({
    filmId: film.id,
    filmTitle: film.title,
    partner,
    url,
    userId,
    timestamp: Date.now()
  });
  
  // Храним последние 50 кликов
  localStorage.setItem('vzorkino_clicks', JSON.stringify(clickHistory.slice(-50)));
  
  console.log('Клик отслежен:', { film: film.title, partner, userId });
  
  return true;
};

// Функция для принятия cookie - СОЗДАЕТ ПРОФИЛЬ ТОЛЬКО ЗДЕСЬ
export const handleCookieAccept = () => {
  localStorage.setItem('vzorkino_cookie_consent', 'accepted');
  
  // ТОЛЬКО ЗДЕСЬ создаем профиль после получения согласия
  let userId = localStorage.getItem('vzorkino_user_id');
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('vzorkino_user_id', userId);
    createEmptyProfile(userId);
    console.log('✅ Создан профиль после принятия cookie:', userId);
  } else {
    // Если ID есть, но профиля нет (был удален) - создаем
    const profileKey = `vzorkino_profile_${userId}`;
    const existingProfile = localStorage.getItem(profileKey);
    if (!existingProfile) {
      createEmptyProfile(userId);
      console.log('✅ Восстановлен профиль после принятия cookie:', userId);
    }
  }
  
  return userId;
};

// Функция для отказа от cookie - УДАЛЯЕТ ВСЕ ДАННЫЕ
export const handleCookieReject = () => {
  localStorage.setItem('vzorkino_cookie_consent', 'rejected');
  
  // Удаляем все данные пользователя при отказе
  const userId = localStorage.getItem('vzorkino_user_id');
  if (userId) {
    const profileKey = `vzorkino_profile_${userId}`;
    localStorage.removeItem(profileKey);
    localStorage.removeItem('vzorkino_user_id');
    console.log('🗑️ Все данные пользователя удалены при отказе от cookie');
  }
  
  // Также очищаем историю кликов
  localStorage.removeItem('vzorkino_clicks');
  
  console.log('Пользователь отклонил cookie, трекинг отключен, данные удалены');
};

// Инициализация отслеживания - НЕ СОЗДАЕТ ID, ТОЛЬКО ПРОВЕРЯЕТ
export const initTracking = () => {
  // Проверяем согласие на cookie
  const consent = localStorage.getItem('vzorkino_cookie_consent');
  const trackingEnabled = consent === 'accepted';
  
  // НЕ СОЗДАЕМ ID здесь! Только проверяем существование
  let userId = null;
  
  if (trackingEnabled) {
    // Если есть согласие, получаем или создаем ID
    userId = getOrCreateUserId();
  } else {
    // Если согласия нет - просто проверяем, что ID нет
    const existingId = localStorage.getItem('vzorkino_user_id');
    if (existingId) {
      // Если ID есть, но согласия нет - удаляем (защита от багов)
      localStorage.removeItem('vzorkino_user_id');
      const profileKey = `vzorkino_profile_${existingId}`;
      localStorage.removeItem(profileKey);
      console.log('🧹 Удалены данные пользователя (не было согласия)');
    }
  }
  
  // Возвращаем информацию о том, можно ли отслеживать
  return {
    userId,
    trackingEnabled
  };
};

// Получение статистики кликов
export const getClickStats = () => {
  if (!hasTrackingConsent()) {
    return { total: 0, byPartner: {} };
  }
  
  const clicks = JSON.parse(localStorage.getItem('vzorkino_clicks') || '[]');
  const userId = getOrCreateUserId();
  
  if (!userId) return { total: 0, byPartner: {} };
  
  // Группируем по партнерам
  const byPartner = {};
  clicks.forEach(click => {
    if (click.userId === userId) {
      byPartner[click.partner] = (byPartner[click.partner] || 0) + 1;
    }
  });
  
  return {
    total: clicks.filter(c => c.userId === userId).length,
    byPartner
  };
};

// Получение статистики просмотров
export const getWatchStats = () => {
  if (!hasTrackingConsent()) return null;
  
  const history = getWatchHistory();
  if (history.length === 0) return null;
  
  const stats = {
    total: history.length,
    byType: {},
    byGenre: {},
    lastWeek: 0,
    lastMonth: 0
  };
  
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  history.forEach(entry => {
    // По типам контента
    const type = entry.contentType || 'movie';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // По жанрам
    if (entry.genre) {
      stats.byGenre[entry.genre] = (stats.byGenre[entry.genre] || 0) + 1;
    }
    
    // По времени (используем timestamp если есть, иначе watched_at)
    const entryTime = entry.timestamp || new Date(entry.watched_at).getTime();
    if (entryTime > weekAgo) stats.lastWeek++;
    if (entryTime > monthAgo) stats.lastMonth++;
  });
  
  return stats;
};

// Экспорт всех данных пользователя (для бэкапа)
export const exportUserData = () => {
  if (!hasTrackingConsent()) {
    return { error: 'Трекинг отключен, данные недоступны' };
  }
  
  const userId = getOrCreateUserId();
  if (!userId) return { error: 'Нет данных пользователя' };
  
  const profile = getUserProfile();
  const clicks = JSON.parse(localStorage.getItem('vzorkino_clicks') || '[]')
    .filter(c => c.userId === userId);
  
  return {
    userId,
    profile,
    clicks,
    consent: localStorage.getItem('vzorkino_cookie_consent'),
    exportDate: new Date().toISOString()
  };
};

// Делаем функции доступными глобально для отладки (только в dev режиме)
if (process.env.NODE_ENV === 'development') {
  window.tracking = {
    hasConsent: hasTrackingConsent,
    getUserId: () => getOrCreateUserId(),
    getProfile: getUserProfile,
    getWatchHistory,
    getWatchStats,
    saveFilm,
    unsaveFilm,
    isFilmSaved,
    addToWatchHistory,
    clearWatchHistory,
    clearSavedFilms,
    clearAllHistory,
    trackClick,
    getClickStats,
    exportData: exportUserData,
    handleCookieAccept,
    handleCookieReject
  };
  
  console.log('📊 Tracking utilities available in window.tracking');
}