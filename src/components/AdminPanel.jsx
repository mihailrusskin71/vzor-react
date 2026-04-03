import React, { useState, useEffect, useRef } from 'react';
import '../styles/index.css';

const AdminPanel = ({ onClose, visible, filmManager }) => {
  const [activeTab, setActiveTab] = useState('auto');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({
    width: '900px',
    height: '600px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  });
  const [editFilm, setEditFilm] = useState(null);
  
  // Для drag-and-drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Для ресайза
  const [isResizing, setIsResizing] = useState(false);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Данные для редактирования фильма
  const [filmEditData, setFilmEditData] = useState({
    id: null,
    title: '',
    year: '',
    rating: '',
    genre: '',
    contentType: 'movie',
    duration: '',
    seasons: '1',
    country: '',
    partner: 'OKKO',
    tags: '',
    img: '',
    description: '',
    director: '',
    actors: '',
    partnerLinks: {
      okko: '',
      ivi: '',
      wink: '',
      kion: '',
      premier: '',
      kinopoisk: ''
    }
  });
  
  const panelRef = useRef(null);
  const headerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  const [autoAddForm, setAutoAddForm] = useState({
    title: '',
    year: '',
    contentType: 'movie'
  });
  
  // Состояние для массового добавления
  const [bulkAddText, setBulkAddText] = useState('');
  const [bulkContentType, setBulkContentType] = useState('movie');
  const [bulkAddResults, setBulkAddResults] = useState([]);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  const [customRowForm, setCustomRowForm] = useState({
    name: '',
    pageType: 'all'
  });
  
  const [selectedRow, setSelectedRow] = useState(null);
  
  // Состояния для мультивыбора
  const [isDraggingSelect, setIsDraggingSelect] = useState(false);
  const [selectedFilmIds, setSelectedFilmIds] = useState([]);
  const [selectType, setSelectType] = useState(null);
  const [dropdownRef, setDropdownRef] = useState(null);
  const dragStartRef = useRef(null);
  
  // Состояния для поиска в модальном окне (левая колонка)
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isModalSearchOpen, setIsModalSearchOpen] = useState(false);
  
  // Состояния для поиска в ряду (правая колонка)
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [isRowSearchOpen, setIsRowSearchOpen] = useState(false);
  
  const [filmToAdd, setFilmToAdd] = useState('');
  const [filmToAddToRow, setFilmToAddToRow] = useState('');
  
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState([]);
  const notificationIdRef = useRef(0);
  
  const [films, setFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customRows, setCustomRows] = useState({});
  
  // Множество для быстрой проверки дубликатов (синхронизируется с films)
  const [filmKeysSet, setFilmKeysSet] = useState(new Set());
  
  // Проверяем сохранённую сессию при загрузке
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setAuthenticated(true);
    }
  }, []);
  
  // Обновляем множество ключей фильмов при изменении films
  useEffect(() => {
    const keys = new Set();
    films.forEach(film => {
      // Создаем уникальный ключ: тип_название_год (в нижнем регистре, без пробелов)
      const key = `${film.contentType}_${film.title.toLowerCase().trim()}_${film.year}`;
      keys.add(key);
      
      // Также добавляем ключ без года (для проверки названия)
      const keyWithoutYear = `${film.contentType}_${film.title.toLowerCase().trim()}`;
      keys.add(keyWithoutYear);
    });
    setFilmKeysSet(keys);
  }, [films]);
  
  // Фильтрация фильмов при поиске
  useEffect(() => {
    if (!films) return;
    
    if (searchQuery.trim() === '') {
      setFilteredFilms(films);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = films.filter(film => 
        film.title.toLowerCase().includes(query) ||
        (film.year && film.year.toString().includes(query)) ||
        (film.genre && film.genre.toLowerCase().includes(query))
      );
      setFilteredFilms(filtered);
    }
  }, [searchQuery, films]);
  
  // Drag-and-drop функциональность
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && panelRef.current) {
        const newLeft = e.clientX - dragOffset.x;
        const newTop = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - panelRef.current.offsetWidth;
        const maxY = window.innerHeight - panelRef.current.offsetHeight;
        
        setPanelStyle(prev => ({
          ...prev,
          left: `${Math.max(0, Math.min(newLeft, maxX))}px`,
          top: `${Math.max(0, Math.min(newTop, maxY))}px`,
          transform: 'none'
        }));
      }
      
      if (isResizing && panelRef.current) {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        
        const minWidth = 500;
        const minHeight = 400;
        const maxWidth = window.innerWidth - 20;
        const maxHeight = window.innerHeight - 20;
        
        let newWidth = Math.max(minWidth, Math.min(startSize.width + dx, maxWidth));
        let newHeight = Math.max(minHeight, Math.min(startSize.height + dy, maxHeight));
        
        const currentLeft = parseInt(panelStyle.left);
        const currentTop = parseInt(panelStyle.top);
        
        if (currentLeft + newWidth > window.innerWidth) {
          newWidth = window.innerWidth - currentLeft - 10;
        }
        
        if (currentTop + newHeight > window.innerHeight) {
          newHeight = window.innerHeight - currentTop - 10;
        }
        
        setPanelStyle(prev => ({
          ...prev,
          width: `${newWidth}px`,
          height: `${newHeight}px`
        }));
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, startSize, startPos, panelStyle]);
  
  useEffect(() => {
    if (visible && filmManager) {
      updateData();
    }
  }, [visible, filmManager]);
  
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    if (headerRef.current && headerRef.current.contains(e.target)) {
      e.preventDefault();
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: parseInt(panelStyle.width), 
      height: parseInt(panelStyle.height) 
    });
  };
  
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setPanelStyle({
        width: '95vw',
        height: '90vh',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
      setIsFullscreen(true);
    } else {
      setPanelStyle({
        width: '900px',
        height: '600px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
      setIsFullscreen(false);
    }
  };
  
  const updateData = () => {
    if (!filmManager) return;
    
    setFilms([...filmManager.films]);
    setFilteredFilms([...filmManager.films]);
    setCustomRows({...filmManager.customRows});
  };
  
  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://qolbgrvlkadqnfnprbgr.supabase.co/functions/v1/check-admin-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.valid === true) {
        setAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
        showNotification('✅ Успешный вход в админку', 'success');
        setPassword('');
      } else {
        showNotification('❌ Неверный пароль', 'error');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('❌ Ошибка соединения с сервером', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция для уведомлений
  const showNotification = (text, type = 'info', duration = 1000) => {
    const id = notificationIdRef.current++;
    const newNotification = { id, text, type };
    
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };
  
  // УЛУЧШЕННАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ СУЩЕСТВОВАНИЯ ФИЛЬМА
  // Использует актуальные данные из filmManager.films и локальное множество
  const isFilmExists = (title, year, contentType, addedTitles = new Set()) => {
    const searchTitle = title.toLowerCase().trim();
    const searchYear = parseInt(year);
    
    // Проверка по уже добавленным в текущей сессии (для массового добавления)
    const tempKey = `${contentType}_${searchTitle}_${searchYear || ''}`;
    if (addedTitles.has(tempKey)) {
      return true;
    }
    
    // Получаем актуальные фильмы из filmManager (самый свежий источник)
    const currentFilms = filmManager?.films || films;
    
    return currentFilms.some(film => {
      const filmTitle = film.title.toLowerCase().trim();
      const filmYear = parseInt(film.year);
      const filmContentType = film.contentType;
      
      // Строгое совпадение: название, год и тип
      if (filmTitle === searchTitle && 
          filmYear === searchYear && 
          filmContentType === contentType) {
        return true;
      }
      
      // Строгое совпадение названия и типа (независимо от года)
      // Это считается дубликатом, так как у фильма не может быть двух одинаковых названий с одним типом
      if (filmTitle === searchTitle && filmContentType === contentType) {
        return true;
      }
      
      // Проверка на очень похожие названия (если указан год)
      if (searchYear) {
        const titleSimilar = filmTitle.includes(searchTitle) || searchTitle.includes(filmTitle);
        const yearClose = Math.abs(filmYear - searchYear) <= 1;
        
        if (titleSimilar && yearClose && filmContentType === contentType) {
          return true;
        }
      }
      
      return false;
    });
  };
  
  const handleAutoAdd = async () => {
    if (!autoAddForm.title.trim()) {
      showNotification('Введите название фильма', 'error');
      return;
    }
    
    setIsLoading(true);
    showNotification('⏳ Ищем фильм и генерируем партнерские ссылки...', 'info');
    
    try {
      // Проверяем, существует ли уже такой фильм
      const exists = isFilmExists(
        autoAddForm.title, 
        autoAddForm.year, 
        autoAddForm.contentType
      );
      
      if (exists) {
        const yearText = autoAddForm.year ? ` ${autoAddForm.year} года` : '';
        const typeText = autoAddForm.contentType === 'movie' ? 'Фильм' : 
                        autoAddForm.contentType === 'series' ? 'Сериал' : 'Мультфильм';
        showNotification(`⚠️ ${typeText} "${autoAddForm.title}"${yearText} уже существует в базе данных`, 'error');
        setIsLoading(false);
        return;
      }
      
      const result = await filmManager.autoAddFilm(
        autoAddForm.title,
        autoAddForm.year || null,
        autoAddForm.contentType
      );
      
      if (result) {
        showNotification(`✅ "${result.title}" добавлен в базу!`, 'success');
        setAutoAddForm({ title: '', year: '', contentType: 'movie' });
        updateData();
        window.dispatchEvent(new Event('filmsUpdated'));
      }
    } catch (error) {
      showNotification('❌ Ошибка при добавлении', 'error');
      console.error('Auto add error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Массовое добавление фильмов с учетом выбранного типа
  const parseBulkText = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const filmsList = [];
    
    lines.forEach(line => {
      // Формат: "Название, год" или просто "Название"
      const parts = line.split(',').map(p => p.trim());
      const title = parts[0];
      const year = parts.length > 1 ? parts[1] : '';
      
      if (title) {
        filmsList.push({ 
          title, 
          year, 
          contentType: bulkContentType
        });
      }
    });
    
    return filmsList;
  };
  
  const handleBulkAdd = async () => {
    if (!bulkAddText.trim()) {
      showNotification('Введите список фильмов', 'error');
      return;
    }
    
    const filmsToAdd = parseBulkText(bulkAddText);
    
    if (filmsToAdd.length === 0) {
      showNotification('Нет валидных записей для добавления', 'error');
      return;
    }
    
    const typeText = bulkContentType === 'movie' ? 'Фильмов' : 
                    bulkContentType === 'series' ? 'Сериалов' : 'Мультфильмов';
    
    if (!window.confirm(`Добавить ${filmsToAdd.length} ${typeText} как "${bulkContentType === 'movie' ? 'Фильмы' : bulkContentType === 'series' ? 'Сериалы' : 'Мультфильмы'}"?`)) {
      return;
    }
    
    setIsBulkAdding(true);
    setBulkProgress({ current: 0, total: filmsToAdd.length });
    setBulkAddResults([]);
    
    const results = [];
    const addedInThisBatch = new Set(); // Отслеживаем дубликаты в текущей сессии
    
    for (let i = 0; i < filmsToAdd.length; i++) {
      const film = filmsToAdd[i];
      setBulkProgress({ current: i + 1, total: filmsToAdd.length });
      
      try {
        // Проверяем, существует ли уже такой фильм (с учетом уже добавленных в этой сессии)
        const exists = isFilmExists(film.title, film.year, film.contentType, addedInThisBatch);
        
        if (exists) {
          const yearText = film.year ? `, ${film.year}` : '';
          results.push({
            title: film.title,
            status: 'skipped',
            message: `⚠️ Уже существует (${film.contentType === 'movie' ? 'Фильм' : film.contentType === 'series' ? 'Сериал' : 'Мультфильм'}${yearText})`
          });
        } else {
          const result = await filmManager.autoAddFilm(
            film.title,
            film.year || null,
            film.contentType
          );
          
          if (result) {
            // Добавляем в Set для отслеживания дубликатов в этой сессии
            const key = `${film.contentType}_${film.title.toLowerCase().trim()}_${film.year || ''}`;
            addedInThisBatch.add(key);
            
            const yearText = film.year ? `, ${film.year}` : '';
            results.push({
              title: film.title,
              status: 'success',
              message: `✅ Добавлен (${film.contentType === 'movie' ? 'Фильм' : film.contentType === 'series' ? 'Сериал' : 'Мультфильм'}${yearText})`
            });
          } else {
            results.push({
              title: film.title,
              status: 'error',
              message: `❌ Ошибка при добавлении`
            });
          }
        }
      } catch (error) {
        results.push({
          title: film.title,
          status: 'error',
          message: `❌ Ошибка: ${error.message}`
        });
      }
      
      setBulkAddResults([...results]);
      
      // Задержка между добавлениями для безопасности
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsBulkAdding(false);
    const successCount = results.filter(r => r.status === 'success').length;
    showNotification(`✅ Добавлено ${successCount} из ${filmsToAdd.length}`, 'success');
    updateData();
    window.dispatchEvent(new Event('filmsUpdated'));
  };
  
  const handleCreateCustomRow = () => {
    if (!customRowForm.name.trim()) {
      showNotification('Введите название ряда', 'error');
      return;
    }
    
    try {
      const rowId = 'custom_' + Date.now();
      const newRow = filmManager.createCustomRow(
        rowId,
        customRowForm.name,
        customRowForm.pageType
      );
      
      showNotification(`✅ Ряд "${newRow.name}" создан`, 'success');
      setCustomRowForm({ name: '', pageType: 'all' });
      updateData();
      window.dispatchEvent(new Event('customRowsUpdated'));
    } catch (error) {
      showNotification('❌ Ошибка создания ряда', 'error');
      console.error('Create row error:', error);
    }
  };
  
  const handleManageRow = (rowId) => {
    const row = customRows[rowId];
    if (row) {
      setSelectedRow(row);
      setActiveTab('manageRow');
      // Сбрасываем состояния
      setSelectedFilmIds([]);
      setIsDraggingSelect(false);
      setSelectType(null);
      setModalSearchQuery('');
      setIsModalSearchOpen(false);
      setRowSearchQuery('');
      setIsRowSearchOpen(false);
    }
  };
  
  // Функции для мультивыбора
  const handleSelectMouseDown = (e, filmId, type) => {
    if (!selectedRow) return;
    
    e.preventDefault();
    setIsDraggingSelect(true);
    setSelectType(type);
    dragStartRef.current = filmId;
    
    const dropdownElement = e.currentTarget.closest('.admin-row-section');
    if (dropdownElement) {
      setDropdownRef(dropdownElement);
    }
    
    const options = Array.from(e.currentTarget.parentElement.querySelectorAll('.admin-film-option'));
    const startIndex = options.findIndex(opt => opt.dataset.filmId === filmId.toString());
    
    if (startIndex !== -1) {
      setSelectedFilmIds([filmId]);
      dragStartRef.current = { id: filmId, index: startIndex };
    }
  };
  
  const handleSelectMouseMove = (e, filmId, type) => {
    if (!isDraggingSelect || selectType !== type || !selectedRow) return;
    
    e.preventDefault();
    
    const options = Array.from(e.currentTarget.parentElement.querySelectorAll('.admin-film-option'));
    const currentIndex = options.findIndex(opt => opt.dataset.filmId === filmId.toString());
    const startIndex = dragStartRef.current?.index || 
                      options.findIndex(opt => opt.dataset.filmId === dragStartRef.current?.toString());
    
    if (currentIndex === -1 || startIndex === -1) return;
    
    const minIndex = Math.min(startIndex, currentIndex);
    const maxIndex = Math.max(startIndex, currentIndex);
    
    const selectedIds = options
      .slice(minIndex, maxIndex + 1)
      .map(opt => parseInt(opt.dataset.filmId));
    
    setSelectedFilmIds(selectedIds);
  };
  
  const handleSelectMouseUp = (type) => {
    if (!isDraggingSelect || selectType !== type || !selectedRow) {
      setIsDraggingSelect(false);
      return;
    }
    
    setIsDraggingSelect(false);
    
    if (type === 'modal') {
      if (selectedFilmIds.length > 0) {
        setFilmToAdd(selectedFilmIds[0]);
        showNotification(`✅ Выделено ${selectedFilmIds.length} фильмов для добавления в модальное окно`, 'success');
      }
    } else {
      if (selectedFilmIds.length > 0) {
        setFilmToAddToRow(selectedFilmIds[0]);
        showNotification(`✅ Выделено ${selectedFilmIds.length} фильмов для добавления в ряд`, 'success');
      }
    }
  };
  
  // Функция для добавления всех выделенных фильмов
  const handleAddSelectedFilms = (type) => {
    if (!selectedRow || selectedFilmIds.length === 0) {
      showNotification('Нет выделенных фильмов', 'error');
      return;
    }
    
    let addedCount = 0;
    let skippedCount = 0;
    
    if (type === 'modal') {
      selectedFilmIds.forEach(filmId => {
        if (!selectedRow.modalItems.includes(filmId)) {
          filmManager.addToCustomRowModal(selectedRow.id, filmId);
          addedCount++;
        } else {
          skippedCount++;
        }
      });
      showNotification(`✅ Добавлено ${addedCount} фильмов в модальное окно${skippedCount > 0 ? `, ${skippedCount} уже были` : ''}`, 'success');
    } else {
      const availableSlots = selectedRow.maxRowItems - selectedRow.rowItems.length;
      
      selectedFilmIds.forEach((filmId, index) => {
        if (index < availableSlots && !selectedRow.rowItems.includes(filmId)) {
          if (!selectedRow.modalItems.includes(filmId)) {
            filmManager.addToCustomRowModal(selectedRow.id, filmId);
          }
          filmManager.addToCustomRowDisplay(selectedRow.id, filmId);
          addedCount++;
        } else {
          skippedCount++;
        }
      });
      
      showNotification(`✅ Добавлено ${addedCount} фильмов в ряд (макс. ${selectedRow.maxRowItems})${skippedCount > 0 ? `, ${skippedCount} пропущено` : ''}`, 'success');
    }
    
    updateData();
    window.dispatchEvent(new Event('customRowsUpdated'));
    
    setSelectedFilmIds([]);
    setFilmToAdd('');
    setFilmToAddToRow('');
  };
  
  const handleAddFilmToRow = (type = 'modal') => {
    if (!selectedRow) return;
    
    if (selectedFilmIds.length > 1) {
      handleAddSelectedFilms(type);
      return;
    }
    
    const filmId = parseInt(type === 'modal' ? filmToAdd : filmToAddToRow);
    if (!filmId) {
      showNotification('Выберите фильм', 'error');
      return;
    }
    
    try {
      if (type === 'modal') {
        filmManager.addToCustomRowModal(selectedRow.id, filmId);
        showNotification('✅ Фильм добавлен в модальное окно', 'success');
        setFilmToAdd('');
      } else {
        filmManager.addToCustomRowDisplay(selectedRow.id, filmId);
        showNotification('✅ Фильм добавлен в ряд', 'success');
        setFilmToAddToRow('');
      }
      updateData();
      window.dispatchEvent(new Event('customRowsUpdated'));
    } catch (error) {
      showNotification('❌ Не удалось добавить фильм', 'error');
    }
  };
  
  const handleRemoveFilmFromRow = (filmId, type = 'row') => {
    if (!selectedRow) return;
    
    try {
      if (type === 'row') {
        filmManager.removeFromCustomRowDisplay(selectedRow.id, filmId);
        showNotification('✅ Фильм удален из ряда', 'success');
      } else {
        filmManager.removeFromCustomRowModal(selectedRow.id, filmId);
        showNotification('✅ Фильм удален из модального окна', 'success');
      }
      updateData();
      window.dispatchEvent(new Event('customRowsUpdated'));
    } catch (error) {
      showNotification('❌ Ошибка удаления', 'error');
    }
  };
  
  const handleDeleteRow = (rowId) => {
    const row = customRows[rowId];
    if (!row) return;
    
    if (window.confirm(`Удалить ряд "${row.name}"?`)) {
      try {
        filmManager.deleteCustomRow(rowId);
        showNotification('✅ Ряд удален', 'success');
        if (selectedRow && selectedRow.id === rowId) {
          setSelectedRow(null);
          setActiveTab('rows');
        }
        updateData();
        window.dispatchEvent(new Event('customRowsUpdated'));
      } catch (error) {
        showNotification('❌ Ошибка удаления ряда', 'error');
      }
    }
  };
  
  const handleDeleteFilm = async (filmId) => {
    if (window.confirm('Удалить этот фильм из базы данных? Фильм также будет удален из всех рядов.')) {
      try {
        setIsLoading(true);
        
        const success = await filmManager.deleteFilm(filmId);
        
        if (success) {
          showNotification('✅ Фильм удален из базы и всех рядов', 'success');
          
          updateData();
          
          if (selectedRow) {
            const updatedRow = filmManager.getCustomRow(selectedRow.id);
            if (updatedRow) {
              setSelectedRow(updatedRow);
            }
          }
          
          window.dispatchEvent(new Event('filmsUpdated'));
          window.dispatchEvent(new Event('customRowsUpdated'));
        } else {
          showNotification('❌ Ошибка удаления', 'error');
        }
      } catch (error) {
        showNotification('❌ Ошибка удаления', 'error');
        console.error('Delete film error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleEditFilm = (film) => {
    setFilmEditData({
      id: film.id,
      title: film.title || '',
      year: film.year || '',
      rating: film.rating || '',
      genre: film.genre || '',
      contentType: film.contentType || 'movie',
      duration: film.duration || '',
      seasons: film.seasons || '1',
      country: film.country || '',
      partner: film.partner || 'OKKO',
      tags: Array.isArray(film.tags) ? film.tags.join(', ') : (film.tags || ''),
      img: film.img || '',
      description: film.description || '',
      director: film.director || '',
      actors: film.actors || '',
      ageRating: film.ageRating || '16+',
      trailerUrl: film.trailerUrl || '',
      partnerLinks: {
        okko: film.partnerLinks?.okko || '',
        ivi: film.partnerLinks?.ivi || '',
        wink: film.partnerLinks?.wink || '',
        kion: film.partnerLinks?.kion || '',
        premier: film.partnerLinks?.premier || '',
        kinopoisk: film.partnerLinks?.kinopoisk || ''
      }
    });
    
    setEditFilm(film);
  };
  
  const handleSaveFilmEdit = async () => {
    if (!filmEditData.id) return;
    
    try {
      const tagsArray = filmEditData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const updatedFilm = {
        title: filmEditData.title,
        year: filmEditData.year,
        rating: parseFloat(filmEditData.rating) || 7.0,
        genre: filmEditData.genre,
        content_type: filmEditData.contentType,
        duration: filmEditData.duration,
        seasons: filmEditData.contentType === 'series' ? parseInt(filmEditData.seasons) : 1,
        country: filmEditData.country,
        partner: filmEditData.partner.toLowerCase(),
        tags: tagsArray,
        img: filmEditData.img,
        description: filmEditData.description,
        director: filmEditData.director,
        actors: filmEditData.actors,
        partner_data: filmEditData.partnerLinks,
        age_rating: filmEditData.ageRating || '16+',
        trailer_url: filmEditData.trailerUrl || null,
        updated_at: new Date().toISOString()
      };
      
      const success = await filmManager.updateFilmInSupabase(filmEditData.id, updatedFilm);
      if (success) {
        const filmIndex = filmManager.films.findIndex(f => f.id == filmEditData.id);
        if (filmIndex !== -1) {
          filmManager.films[filmIndex] = {
            ...filmManager.films[filmIndex],
            ...updatedFilm,
            partnerLinks: filmEditData.partnerLinks
          };
          
          localStorage.setItem('vzorkino_films_cache', JSON.stringify(filmManager.films));
        }
        
        showNotification('✅ Фильм обновлен', 'success');
        updateData();
        window.dispatchEvent(new Event('filmsUpdated'));
        setEditFilm(null);
        setFilmEditData({
          id: null,
          title: '',
          year: '',
          rating: '',
          genre: '',
          contentType: 'movie',
          duration: '',
          seasons: '1',
          country: '',
          partner: 'OKKO',
          tags: '',
          img: '',
          description: '',
          director: '',
          actors: '',
          partnerLinks: {
            okko: '',
            ivi: '',
            wink: '',
            kion: '',
            premier: '',
            kinopoisk: ''
          }
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification('❌ Ошибка обновления фильма', 'error');
    }
  };
  
  const renderFilmsList = () => {
    return filteredFilms.slice(0, 50).map(film => {
      const isEditing = editFilm?.id === film.id;
      
      return (
        <div key={film.id} className="admin-film-item">
          <img 
            src={film.img} 
            alt={film.title} 
            width="40" 
            height="60" 
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#fff' }}>
              {film.title} ({film.year})
            </div>
            <div className="admin-film-meta">
              {film.genre} • {film.partner} • ⭐ {film.rating}
              {film.reviews && film.reviews.length > 0 && ` • 💬 ${film.reviews.length}`}
            </div>
          </div>
          <div className="admin-row-actions">
            <button 
              className="admin-btn secondary"
              onClick={() => handleEditFilm(film)}
            >
              ✏️
            </button>
            <button 
              className="admin-btn danger"
              onClick={() => handleDeleteFilm(film.id)}
              disabled={isLoading}
            >
              Удалить
            </button>
          </div>
        </div>
      );
    });
  };
  
  const renderCustomRows = () => {
    return Object.values(customRows).map(row => {
      const rowFilms = filmManager.getCustomRowFilms(row.id, 'row');
      const modalFilms = filmManager.getCustomRowFilms(row.id, 'modal');
      
      return (
        <div key={row.id} className="admin-row-item">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#fff' }}>{row.name}</div>
            <div className="admin-row-meta">
              {row.pageType === 'all' ? 'Главная' : row.pageType} • 
              {rowFilms.length} в ряду • {modalFilms.length} в модалке
            </div>
          </div>
          <div className="admin-row-actions">
            <button 
              className="admin-btn secondary"
              onClick={() => handleManageRow(row.id)}
            >
              Управлять
            </button>
            <button 
              className="admin-btn danger"
              onClick={() => handleDeleteRow(row.id)}
              disabled={isLoading}
            >
              Удалить
            </button>
          </div>
        </div>
      );
    });
  };
  
  const renderEditFilmModal = () => {
    if (!editFilm) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
        padding: '20px'
      }}>
        <div style={{
          background: '#1a1a24',
          borderRadius: '12px',
          width: '800px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid #FF6A2B',
          padding: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, color: 'white' }}>✏️ Редактирование контента</h3>
            <button 
              onClick={() => {
                setEditFilm(null);
                setFilmEditData({
                  id: null,
                  title: '',
                  year: '',
                  rating: '',
                  genre: '',
                  contentType: 'movie',
                  duration: '',
                  seasons: '1',
                  country: '',
                  partner: 'OKKO',
                  tags: '',
                  img: '',
                  description: '',
                  director: '',
                  actors: '',
                  ageRating: '16+',
                  trailerUrl: '',
                  partnerLinks: {
                    okko: '',
                    ivi: '',
                    wink: '',
                    kion: '',
                    premier: '',
                    kinopoisk: ''
                  }
                });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Название</label>
              <input
                type="text"
                value={filmEditData.title}
                onChange={(e) => setFilmEditData(prev => ({...prev, title: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Год</label>
              <input
                type="number"
                value={filmEditData.year}
                onChange={(e) => setFilmEditData(prev => ({...prev, year: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Рейтинг</label>
              <input
                type="number"
                step="0.1"
                value={filmEditData.rating}
                onChange={(e) => setFilmEditData(prev => ({...prev, rating: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Жанр</label>
              <input
                type="text"
                value={filmEditData.genre}
                onChange={(e) => setFilmEditData(prev => ({...prev, genre: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Тип контента</label>
              <select
                value={filmEditData.contentType}
                onChange={(e) => setFilmEditData(prev => ({...prev, contentType: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              >
                <option value="movie">Фильм</option>
                <option value="series">Сериал</option>
                <option value="cartoon">Мультфильм</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Длительность</label>
              <input
                type="text"
                value={filmEditData.duration}
                onChange={(e) => setFilmEditData(prev => ({...prev, duration: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Сезоны (для сериалов)</label>
              <input
                type="number"
                value={filmEditData.seasons}
                onChange={(e) => setFilmEditData(prev => ({...prev, seasons: e.target.value}))}
                disabled={filmEditData.contentType !== 'series'}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white',
                  opacity: filmEditData.contentType !== 'series' ? 0.5 : 1
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Страна</label>
              <input
                type="text"
                value={filmEditData.country}
                onChange={(e) => setFilmEditData(prev => ({...prev, country: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a3a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Возрастное ограничение</label>
            <select
              value={filmEditData.ageRating || '16+'}
              onChange={(e) => setFilmEditData(prev => ({...prev, ageRating: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            >
              <option value="0+">0+</option>
              <option value="6+">6+</option>
              <option value="12+">12+</option>
              <option value="16+">16+</option>
              <option value="18+">18+</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Ссылка на трейлер (YouTube или видеофайл)</label>
            <input
              type="text"
              value={filmEditData.trailerUrl || ''}
              onChange={(e) => setFilmEditData(prev => ({...prev, trailerUrl: e.target.value}))}
              placeholder="https://youtube.com/watch?v=... или прямой URL видео"
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Партнер</label>
            <select
              value={filmEditData.partner}
              onChange={(e) => setFilmEditData(prev => ({...prev, partner: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            >
              <option value="OKKO">OKKO</option>
              <option value="IVI">IVI</option>
              <option value="Wink">Wink</option>
              <option value="KION">KION</option>
              <option value="Премьер">Премьер</option>
              <option value="КиноПоиск">КиноПоиск</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Теги (через запятую)</label>
            <input
              type="text"
              value={filmEditData.tags}
              onChange={(e) => setFilmEditData(prev => ({...prev, tags: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Ссылка на постер</label>
            <input
              type="text"
              value={filmEditData.img}
              onChange={(e) => setFilmEditData(prev => ({...prev, img: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Описание</label>
            <textarea
              value={filmEditData.description}
              onChange={(e) => setFilmEditData(prev => ({...prev, description: e.target.value}))}
              rows="6"
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Режиссер</label>
            <input
              type="text"
              value={filmEditData.director}
              onChange={(e) => setFilmEditData(prev => ({...prev, director: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Актеры</label>
            <input
              type="text"
              value={filmEditData.actors}
              onChange={(e) => setFilmEditData(prev => ({...prev, actors: e.target.value}))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>🔗 Партнерские ссылки</h4>
            {Object.entries(filmEditData.partnerLinks).map(([platform, url]) => (
              <div key={platform} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '13px', textTransform: 'capitalize' }}>
                  {platform}
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setFilmEditData(prev => ({
                    ...prev,
                    partnerLinks: { ...prev.partnerLinks, [platform]: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2a3a',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button 
              className="admin-btn secondary"
              onClick={() => {
                setEditFilm(null);
                setFilmEditData({
                  id: null,
                  title: '',
                  year: '',
                  rating: '',
                  genre: '',
                  contentType: 'movie',
                  duration: '',
                  seasons: '1',
                  country: '',
                  partner: 'OKKO',
                  tags: '',
                  img: '',
                  description: '',
                  director: '',
                  actors: '',
                  ageRating: '16+',
                  trailerUrl: '',
                  partnerLinks: {
                    okko: '',
                    ivi: '',
                    wink: '',
                    kion: '',
                    premier: '',
                    kinopoisk: ''
                  }
                });
              }}
            >
              Отмена
            </button>
            <button 
              className="admin-btn primary"
              onClick={handleSaveFilmEdit}
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderRowManagement = () => {
    if (!selectedRow) return null;
    
    const rowFilms = filmManager.getCustomRowFilms(selectedRow.id, 'row');
    const modalFilms = filmManager.getCustomRowFilms(selectedRow.id, 'modal');
    const availableFilms = films.filter(f => !modalFilms.some(mf => mf.id === f.id));
    
    // Фильтрованные списки для поиска (левая колонка)
    const filteredAvailableFilms = modalSearchQuery.trim() === '' 
      ? availableFilms 
      : availableFilms.filter(film => {
          const query = modalSearchQuery.toLowerCase();
          return film.title.toLowerCase().includes(query) ||
                 (film.year && film.year.toString().includes(query)) ||
                 (film.genre && film.genre.toLowerCase().includes(query));
        });
    
    // Фильтрованные списки для поиска (правая колонка)
    const availableForRow = modalFilms.filter(f => !rowFilms.some(rf => rf.id === f.id));
    const filteredRowFilms = rowSearchQuery.trim() === ''
      ? availableForRow
      : availableForRow.filter(film => {
          const query = rowSearchQuery.toLowerCase();
          return film.title.toLowerCase().includes(query) ||
                 (film.year && film.year.toString().includes(query)) ||
                 (film.genre && film.genre.toLowerCase().includes(query));
        });
    
    // Функция для рендера опций с поддержкой мультивыбора
    const renderFilmOptions = (filmsList, type) => {
      if (filmsList.length === 0) {
        return (
          <option value="" disabled style={{ color: '#888', fontStyle: 'italic' }}>
            {(type === 'modal' && modalSearchQuery) || (type === 'row' && rowSearchQuery) 
              ? 'Ничего не найдено' 
              : 'Нет доступных фильмов'}
          </option>
        );
      }
      
      return filmsList.map(film => {
        const isSelected = selectedFilmIds.includes(film.id) && selectType === type;
        
        return (
          <option 
            key={film.id} 
            value={film.id}
            data-film-id={film.id}
            className={`admin-film-option ${isSelected ? 'selected' : ''}`}
            onMouseDown={(e) => handleSelectMouseDown(e, film.id, type)}
            onMouseMove={(e) => handleSelectMouseMove(e, film.id, type)}
            onMouseUp={() => handleSelectMouseUp(type)}
            style={{
              background: isSelected ? 'rgba(255, 106, 43, 0.3)' : '',
              fontWeight: isSelected ? 'bold' : 'normal',
              padding: '8px'
            }}
          >
            {film.title} ({film.year}) • {film.genre}
            {isSelected && ' ✓'}
          </option>
        );
      });
    };
    
    return (
      <div className="admin-row-management">
        <div className="admin-row-header">
          <button 
            className="admin-btn secondary"
            onClick={() => {
              setSelectedRow(null);
              setActiveTab('rows');
              setModalSearchQuery('');
              setIsModalSearchOpen(false);
              setRowSearchQuery('');
              setIsRowSearchOpen(false);
            }}
          >
            ← Назад к списку
          </button>
          <h3>Управление рядом: {selectedRow.name}</h3>
          <div className="admin-row-info">
            Страница: {selectedRow.pageType === 'all' ? 'Главная' : selectedRow.pageType} • 
            Макс. в ряду: {selectedRow.maxRowItems}
          </div>
          {selectedFilmIds.length > 0 && (
            <div style={{ marginTop: '10px', color: '#FF6A2B' }}>
              Выделено фильмов: {selectedFilmIds.length}
            </div>
          )}
        </div>
        
        <div className="admin-row-sections">
          {/* Левая колонка - Добавление в модальное окно и список модальных фильмов */}
          <div className="admin-row-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>➕ Добавить фильм в модальное окно</h4>
              <button
                className="admin-btn secondary small"
                onClick={() => setIsModalSearchOpen(!isModalSearchOpen)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                title="Поиск"
              >
                🔍 {isModalSearchOpen ? 'Скрыть' : 'Поиск'}
              </button>
            </div>
            
            {/* Поиск в левой колонке */}
            {isModalSearchOpen && (
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="🔍 Поиск по названию, году или жанру..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2a3a',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#aaa' }}>
                  <span>Найдено: {filteredAvailableFilms.length} из {availableFilms.length}</span>
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF6A2B',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline'
                      }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <select 
              value={selectedFilmIds.length > 1 && selectType === 'modal' ? 'multiple' : filmToAdd}
              onChange={(e) => {
                if (!isDraggingSelect) {
                  setFilmToAdd(e.target.value);
                }
              }}
              size="8"
              style={{ 
                width: '100%', 
                marginBottom: '10px',
                background: '#2a2a3a',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '5px',
                minHeight: '200px'
              }}
              onMouseLeave={() => {
                if (isDraggingSelect && selectType === 'modal') {
                  handleSelectMouseUp('modal');
                }
              }}
            >
              <option value="">{filteredAvailableFilms.length > 0 ? 'Выберите фильмы (зажмите и тяните)' : 'Нет доступных фильмов'}</option>
              {renderFilmOptions(filteredAvailableFilms, 'modal')}
            </select>
            
            <button 
              className="admin-btn primary"
              onClick={() => handleAddFilmToRow('modal')}
              disabled={selectedFilmIds.length === 0 || filteredAvailableFilms.length === 0}
              style={{ marginBottom: '20px', width: '100%' }}
            >
              {selectedFilmIds.length > 1 
                ? `➕ Добавить ${selectedFilmIds.length} фильмов в модальное окно` 
                : '➕ Добавить в модальное окно'}
            </button>
            
            <h4 style={{ marginTop: '30px' }}>📦 Фильмы в модальном окне ({modalFilms.length})</h4>
            <div className="admin-films-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {modalFilms.length === 0 ? (
                <div className="admin-empty">Модальное окно пусто</div>
              ) : (
                modalFilms.map(film => (
                  <div key={film.id} className="admin-film-card">
                    <img src={film.img} alt={film.title} />
                    <div className="admin-film-card-info">
                      <div className="admin-film-card-title">{film.title}</div>
                      <div className="admin-film-card-meta">{film.year} • {film.genre}</div>
                      {rowFilms.some(rf => rf.id === film.id) && (
                        <div className="admin-film-card-status">В ряду</div>
                      )}
                    </div>
                    <button 
                      className="admin-btn danger small"
                      onClick={() => handleRemoveFilmFromRow(film.id, 'modal')}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      Удалить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Правая колонка - Добавление в ряд и список фильмов в ряду */}
          <div className="admin-row-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>➕ Добавить фильм в ряд (макс {selectedRow.maxRowItems})</h4>
              <button
                className="admin-btn secondary small"
                onClick={() => setIsRowSearchOpen(!isRowSearchOpen)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                title="Поиск"
              >
                🔍 {isRowSearchOpen ? 'Скрыть' : 'Поиск'}
              </button>
            </div>
            
            {/* Поиск в правой колонке */}
            {isRowSearchOpen && (
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="🔍 Поиск по названию, году или жанру..."
                  value={rowSearchQuery}
                  onChange={(e) => setRowSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2a3a',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#aaa' }}>
                  <span>Найдено: {filteredRowFilms.length} из {availableForRow.length}</span>
                  {rowSearchQuery && (
                    <button
                      onClick={() => setRowSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF6A2B',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline'
                      }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <select 
              value={selectedFilmIds.length > 1 && selectType === 'row' ? 'multiple' : filmToAddToRow}
              onChange={(e) => {
                if (!isDraggingSelect) {
                  setFilmToAddToRow(e.target.value);
                }
              }}
              size="8"
              style={{ 
                width: '100%', 
                marginBottom: '10px',
                background: '#2a2a3a',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '5px',
                minHeight: '200px'
              }}
              onMouseLeave={() => {
                if (isDraggingSelect && selectType === 'row') {
                  handleSelectMouseUp('row');
                }
              }}
            >
              <option value="">{filteredRowFilms.length > 0 ? 'Выберите фильмы из модального окна (зажмите и тяните)' : 'Нет доступных фильмов'}</option>
              {renderFilmOptions(filteredRowFilms, 'row')}
            </select>
            
            <button 
              className="admin-btn primary"
              onClick={() => handleAddFilmToRow('row')}
              disabled={selectedFilmIds.length === 0 || rowFilms.length >= selectedRow.maxRowItems || filteredRowFilms.length === 0}
              style={{ marginBottom: '20px', width: '100%' }}
            >
              {rowFilms.length >= selectedRow.maxRowItems 
                ? 'Ряд заполнен' 
                : selectedFilmIds.length > 1
                  ? `➕ Добавить ${Math.min(selectedFilmIds.length, selectedRow.maxRowItems - rowFilms.length)} фильмов в ряд`
                  : '➕ Добавить в ряд'}
            </button>
            
            <h4 style={{ marginTop: '30px' }}>🎬 Фильмы в ряду ({rowFilms.length}/{selectedRow.maxRowItems})</h4>
            <div className="admin-films-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {rowFilms.length === 0 ? (
                <div className="admin-empty">Ряд пуст</div>
              ) : (
                rowFilms.map(film => (
                  <div key={film.id} className="admin-film-card">
                    <img src={film.img} alt={film.title} />
                    <div className="admin-film-card-info">
                      <div className="admin-film-card-title">{film.title}</div>
                      <div className="admin-film-card-meta">{film.year} • {film.genre}</div>
                    </div>
                    <button 
                      className="admin-btn danger small"
                      onClick={() => handleRemoveFilmFromRow(film.id, 'row')}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      Удалить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (!visible) return null;
  
  return (
    <>
      <div 
        ref={panelRef}
        className="admin-panel"
        style={{
          position: 'fixed',
          background: '#1a1a24',
          borderRadius: '12px',
          border: '2px solid #FF6A2B',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          overflow: 'hidden',
          minWidth: '500px',
          minHeight: '400px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          cursor: 'default',
          ...panelStyle
        }}
      >
        {/* КОНТЕЙНЕР ДЛЯ УВЕДОМЛЕНИЙ */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10002,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: 'auto',
          maxWidth: '80%'
        }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                background: notification.type === 'success' ? 'rgba(34, 197, 94, 0.95)' :
                           notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
                           notification.type === 'info' ? 'rgba(59, 130, 246, 0.95)' :
                           'rgba(255, 106, 43, 0.95)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                animation: 'slideDown 0.3s ease'
              }}
            >
              {notification.text}
            </div>
          ))}
        </div>
        
        <div 
          ref={headerRef}
          className="admin-header"
          onMouseDown={handleMouseDown}
          style={{
            background: '#2a2a3a',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #444',
            cursor: isDragging ? 'grabbing' : 'move',
            userSelect: 'none'
          }}
        >
          <h2 style={{ margin: 0, color: 'white' }}>🎬 Панель управления VzorRos</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '4px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
              title={isFullscreen ? 'Свернуть' : 'Развернуть'}
            >
              {isFullscreen ? '❐' : '□'}
            </button>
            <button 
              className="admin-close-btn"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '4px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              ×
            </button>
          </div>
        </div>
        
        {!authenticated ? (
          <div className="admin-login" style={{ padding: '40px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>
              🔒 Вход в админ-панель
            </h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: '#2a2a3a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button 
              className="admin-btn primary"
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#FF6A2B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {isLoading ? '⏳ Проверка...' : 'Войти'}
            </button>
          </div>
        ) : (
          <div className="admin-content" style={{ height: 'calc(100% - 80px)', overflow: 'hidden' }}>
            <div className="admin-tabs">
              <button 
                className={`admin-tab-btn ${activeTab === 'auto' ? 'active' : ''}`}
                onClick={() => setActiveTab('auto')}
              >
                🤖 Автодобавление
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'rows' ? 'active' : ''}`}
                onClick={() => setActiveTab('rows')}
              >
                🎬 Управление рядами
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'films' ? 'active' : ''}`}
                onClick={() => setActiveTab('films')}
              >
                📝 Все фильмы
              </button>
              {selectedRow && activeTab === 'manageRow' && (
                <button 
                  className={`admin-tab-btn ${activeTab === 'manageRow' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manageRow')}
                >
                  🔧 {selectedRow.name}
                </button>
              )}
            </div>
            
            <div className="admin-tab-content" style={{ height: 'calc(100% - 60px)', overflowY: 'auto' }}>
              {activeTab === 'auto' && (
                <div className="admin-auto-add">
                  <h3>Автоматическое добавление контента</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    {/* Левая колонка - одиночное добавление */}
                    <div>
                      <h4>Одиночное добавление</h4>
                      <div className="admin-form">
                        <input
                          type="text"
                          placeholder="Название фильма/сериала (рус/англ)"
                          value={autoAddForm.title}
                          onChange={(e) => setAutoAddForm(prev => ({...prev, title: e.target.value}))}
                          disabled={isLoading}
                        />
                        <input
                          type="number"
                          placeholder="Год (необязательно)"
                          value={autoAddForm.year}
                          onChange={(e) => setAutoAddForm(prev => ({...prev, year: e.target.value}))}
                          disabled={isLoading}
                        />
                        <select
                          value={autoAddForm.contentType}
                          onChange={(e) => setAutoAddForm(prev => ({...prev, contentType: e.target.value}))}
                          disabled={isLoading}
                        >
                          <option value="movie">Фильм</option>
                          <option value="series">Сериал</option>
                          <option value="cartoon">Мультфильм</option>
                        </select>
                        <button 
                          className="admin-btn primary" 
                          onClick={handleAutoAdd}
                          disabled={isLoading}
                        >
                          {isLoading ? '⏳ Добавление...' : '🎯 Добавить контент'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Правая колонка - массовое добавление */}
                    <div>
                      <h4>Массовое добавление</h4>
                      <div className="admin-form">
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>
                            Тип контента для всех:
                          </label>
                          <select
                            value={bulkContentType}
                            onChange={(e) => setBulkContentType(e.target.value)}
                            disabled={isBulkAdding}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: '#2a2a3a',
                              border: '1px solid #444',
                              borderRadius: '6px',
                              color: 'white'
                            }}
                          >
                            <option value="movie">🎬 Фильмы</option>
                            <option value="series">📺 Сериалы</option>
                            <option value="cartoon">🖍️ Мультфильмы</option>
                          </select>
                        </div>
                        
                        <textarea
                          placeholder={`Введите названия ${bulkContentType === 'movie' ? 'фильмов' : bulkContentType === 'series' ? 'сериалов' : 'мультфильмов'}, каждое с новой строки. Можно добавить год через запятую.\nПример:\nДюна, 2021\nБэтмен, 2022\nВо все тяжкие, 2008\nИгра престолов, 2011`}
                          value={bulkAddText}
                          onChange={(e) => setBulkAddText(e.target.value)}
                          disabled={isBulkAdding}
                          rows="6"
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#2a2a3a',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            color: 'white',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            fontSize: '13px'
                          }}
                        />
                        
                        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                          Всего строк: {bulkAddText.split('\n').filter(line => line.trim() !== '').length}
                        </div>
                        
                        <button 
                          className="admin-btn primary" 
                          onClick={handleBulkAdd}
                          disabled={isBulkAdding || !bulkAddText.trim()}
                          style={{ width: '100%' }}
                        >
                          {isBulkAdding ? (
                            <>
                              ⏳ Добавление {bulkProgress.current} из {bulkProgress.total}...
                            </>
                          ) : `📦 Добавить несколько (как ${bulkContentType === 'movie' ? 'Фильмы' : bulkContentType === 'series' ? 'Сериалы' : 'Мультфильмы'})`}
                        </button>
                        
                        {/* Результаты массового добавления */}
                        {bulkAddResults.length > 0 && (
                          <div style={{
                            marginTop: '20px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: '#1a1a24',
                            borderRadius: '8px',
                            padding: '10px',
                            border: '1px solid #444'
                          }}>
                            <h5 style={{ color: 'white', margin: '0 0 10px 0' }}>Результаты:</h5>
                            {bulkAddResults.map((result, index) => (
                              <div key={index} style={{
                                padding: '5px 10px',
                                marginBottom: '5px',
                                background: result.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                           result.status === 'skipped' ? 'rgba(255, 193, 7, 0.1)' : 
                                           'rgba(239, 68, 68, 0.1)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: 'white'
                              }}>
                                {result.message} - {result.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'rows' && (
                <div className="admin-rows">
                  <h3>Управление кастомными рядами</h3>
                  
                  <div className="admin-create-row">
                    <h4>Создать новый ряд</h4>
                    <div className="admin-form">
                      <input
                        type="text"
                        placeholder="Название ряда (например: 'Лучшие комедии')"
                        value={customRowForm.name}
                        onChange={(e) => setCustomRowForm(prev => ({...prev, name: e.target.value}))}
                        disabled={isLoading}
                      />
                      <select
                        value={customRowForm.pageType}
                        onChange={(e) => setCustomRowForm(prev => ({...prev, pageType: e.target.value}))}
                        disabled={isLoading}
                      >
                        <option value="all">Главная страница</option>
                        <option value="movie">Страница фильмов</option>
                        <option value="series">Страница сериалов</option>
                        <option value="cartoon">Страница мультфильмов</option>
                      </select>
                      <button 
                        className="admin-btn primary" 
                        onClick={handleCreateCustomRow}
                        disabled={isLoading}
                      >
                        {isLoading ? '⏳ Создание...' : 'Создать ряд'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="admin-rows-list">
                    <h4>Существующие ряды ({Object.keys(customRows).length})</h4>
                    {Object.keys(customRows).length === 0 ? (
                      <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        Нет созданных рядов
                      </p>
                    ) : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {renderCustomRows()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'films' && (
                <div className="admin-all-films">
                  <h3>Всего фильмов: {films.length}</h3>
                  
                  {/* Поиск */}
                  <div className="admin-search" style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Поиск по названию, году или жанру..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#2a2a3a',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div className="admin-films-list">
                    {filteredFilms.length === 0 ? (
                      <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        {films.length === 0 ? 'Нет фильмов в базе' : 'Ничего не найдено по вашему запросу'}
                      </p>
                    ) : (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {renderFilmsList()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'manageRow' && renderRowManagement()}
            </div>
          </div>
        )}
        
        <div 
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '15px',
            height: '15px',
            cursor: 'se-resize',
            background: isResizing 
              ? 'linear-gradient(135deg, transparent 50%, rgba(255, 106, 43, 0.8) 50%)'
              : 'linear-gradient(135deg, transparent 50%, rgba(255, 106, 43, 0.3) 50%)',
            borderRadius: '2px',
            transition: 'background 0.2s'
          }}
        />
      </div>
      
      {renderEditFilmModal()}
    </>
  );
};

export default AdminPanel;