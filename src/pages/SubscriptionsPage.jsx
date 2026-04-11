// src/pages/SubscriptionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { subscriptionManager, PARTNERS_FOR_SUBSCRIPTIONS } from '../utils/subscriptionManager';
import { hasTrackingConsent } from '../utils/userId';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDateSubscriptions, setSelectedDateSubscriptions] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [swipeState, setSwipeState] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [formData, setFormData] = useState({
    partnerId: 'okko',
    plan: 'Месячная',
    price: '199',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    autoRenew: false,
    reminderDays: 3,
    notes: ''
  });
  
  const modalRef = useRef(null);
  const touchStartRef = useRef({});
  const hideTimeoutRef = useRef({});
  const calendarRef = useRef(null);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const consent = hasTrackingConsent();
    setTrackingEnabled(consent);
    
    if (consent) {
      loadSubscriptions();
      subscriptionManager.checkAndShowReminders();
    }
    
    setTimeout(() => setAnimateIn(true), 100);
    
    const handleUpdate = () => loadSubscriptions();
    window.addEventListener('subscriptionsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('subscriptionsUpdated', handleUpdate);
      Object.keys(hideTimeoutRef.current).forEach(id => {
        if (hideTimeoutRef.current[id]) clearTimeout(hideTimeoutRef.current[id]);
      });
    };
  }, []);
  
  useEffect(() => {
    generateCalendar();
  }, [currentMonth, subscriptions, isMobile]);
  
  const loadSubscriptions = () => {
    setSubscriptions(subscriptionManager.getSubscriptions());
  };
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, subscriptions: [], isEmpty: true });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const daySubscriptions = subscriptions.filter(sub => {
        const start = new Date(sub.startDate);
        const end = new Date(sub.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      });
      
      days.push({
        date: date,
        day: i,
        subscriptions: daySubscriptions,
        isEmpty: false,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    setCalendarDays(days);
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const handleDateClick = (date, subs) => {
    setSelectedDate(date);
    setSelectedDateSubscriptions(subs);
  };
  
  const handleTouchStart = (e, id) => {
    touchStartRef.current[id] = e.touches[0].clientX;
    if (hideTimeoutRef.current[id]) {
      clearTimeout(hideTimeoutRef.current[id]);
      hideTimeoutRef.current[id] = null;
    }
  };
  
  const handleTouchMove = (e, id) => {
    if (!touchStartRef.current[id]) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartRef.current[id] - currentX;
    if (diff > 5) {
      const offset = Math.min(diff, 80);
      setSwipeState(prev => ({ ...prev, [id]: { ...prev[id], offset: offset } }));
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (id) => {
    const state = swipeState[id];
    if (state && state.offset > 40) {
      setSwipeState(prev => ({ ...prev, [id]: { ...prev[id], offset: 80, showDelete: true } }));
      if (hideTimeoutRef.current[id]) clearTimeout(hideTimeoutRef.current[id]);
      hideTimeoutRef.current[id] = setTimeout(() => {
        setSwipeState(prev => ({ ...prev, [id]: { offset: 0, showDelete: false } }));
        hideTimeoutRef.current[id] = null;
      }, 3000);
    } else {
      setSwipeState(prev => ({ ...prev, [id]: { offset: 0, showDelete: false } }));
    }
    touchStartRef.current[id] = null;
  };
  
  const handleCardClick = (e, subscription) => {
    const state = swipeState[subscription.id];
    if (state && state.showDelete) {
      e.stopPropagation();
      return;
    }
    setSelectedSubscription(subscription);
  };
  
  const handleDeleteFromSwipe = (e, id) => {
    e.stopPropagation();
    if (hideTimeoutRef.current[id]) {
      clearTimeout(hideTimeoutRef.current[id]);
      hideTimeoutRef.current[id] = null;
    }
    subscriptionManager.deleteSubscription(id);
    loadSubscriptions();
    setSwipeState(prev => ({ ...prev, [id]: { offset: 0, showDelete: false } }));
    if (selectedSubscription?.id === id) {
      setSelectedSubscription(null);
    }
  };
  
  const handleAddSubscription = () => {
    if (!trackingEnabled) {
      alert('Для сохранения подписок необходимо принять политику конфиденциальности');
      return;
    }
    
    if (subscriptions.length >= subscriptionManager.getMaxSubscriptions()) {
      alert(`Достигнут лимит подписок (максимум ${subscriptionManager.getMaxSubscriptions()})`);
      return;
    }
    
    const newSubscription = subscriptionManager.addSubscription({
      partnerId: formData.partnerId,
      plan: formData.plan,
      price: formData.price,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      autoRenew: formData.autoRenew,
      notes: formData.notes,
      reminderDays: parseInt(formData.reminderDays)
    });
    
    if (newSubscription) {
      setShowAddModal(false);
      setFormData({
        partnerId: 'okko',
        plan: 'Месячная',
        price: '199',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        autoRenew: false,
        reminderDays: 3,
        notes: ''
      });
      loadSubscriptions();
    }
  };
  
  const handleDeleteSubscription = (id) => {
    if (window.confirm('Удалить эту подписку?')) {
      subscriptionManager.deleteSubscription(id);
      loadSubscriptions();
      if (selectedSubscription?.id === id) {
        setSelectedSubscription(null);
      }
    }
  };
  
  const handleUpdateSubscription = () => {
    if (selectedSubscription) {
      subscriptionManager.updateSubscription(selectedSubscription.id, {
        plan: selectedSubscription.plan,
        price: selectedSubscription.price,
        autoRenew: selectedSubscription.autoRenew,
        notes: selectedSubscription.notes,
        reminderDays: selectedSubscription.reminderDays
      });
      loadSubscriptions();
      setSelectedSubscription(null);
    }
  };
  
  const getDaysLeft = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };
  
  const getStatusBadge = (subscription) => {
    const daysLeft = getDaysLeft(subscription.endDate);
    if (daysLeft < 0) {
      return <span className="subscription-status expired">Истекла</span>;
    } else if (daysLeft <= 3) {
      return <span className="subscription-status expiring">Заканчивается</span>;
    } else if (daysLeft <= 7) {
      return <span className="subscription-status soon">Скоро закончится</span>;
    }
    return <span className="subscription-status active">Активна</span>;
  };
  
  const activeSubscriptions = subscriptionManager.getActiveSubscriptions();
  const expiredSubscriptions = subscriptionManager.getExpiredSubscriptions();
  const expiringSoon = subscriptionManager.getExpiringSoon();
  const totalSpent = subscriptionManager.getTotalSpent();
  
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  const maxCalendarDots = isMobile ? 2 : 3;
  
  if (!trackingEnabled) {
    return (
      <div className="page-content">
        <div className="content-wrapper-1100">
          <div className={`subscriptions-page ${animateIn ? 'animate-in' : ''}`}>
            <div className="empty-state" style={{ marginTop: '60px' }}>
              <div className="empty-state-icon">📅</div>
              <h3>Трекинг отключен</h3>
              <p>Для управления подписками необходимо принять политику конфиденциальности.</p>
              <button className="primary-button" onClick={() => window.location.href = '/'}>
                Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-content">
      <div className="content-wrapper-1100">
        <div className={`subscriptions-page ${animateIn ? 'animate-in' : ''}`}>
          <div className="subscriptions-header">
            <div className="subscriptions-title-section">
              <h1 className="subscriptions-title">Мои подписки</h1>
              <p className="subscriptions-subtitle">
                Управляйте подписками на онлайн-кинотеатры, получайте напоминания об окончании
              </p>
            </div>
            <button className="add-subscription-btn" onClick={() => setShowAddModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Добавить подписку
              {subscriptions.length >= subscriptionManager.getMaxSubscriptions() && (
                <span className="limit-badge">Лимит {subscriptions.length}/{subscriptionManager.getMaxSubscriptions()}</span>
              )}
            </button>
          </div>
          
          <div className="subscriptions-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <line x1="16" y1="21" x2="16" y2="17" />
                  <line x1="8" y1="21" x2="8" y2="17" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{activeSubscriptions.length}</div>
                <div className="stat-label">Активных подписок</div>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="13" r="8" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{expiringSoon.length}</div>
                <div className="stat-label">Заканчиваются скоро</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{totalSpent.toLocaleString()} ₽</div>
                <div className="stat-label">Всего потрачено</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16v16H4z" />
                  <line x1="8" y1="8" x2="16" y2="16" />
                  <line x1="8" y1="16" x2="16" y2="8" />
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{subscriptions.length}</div>
                <div className="stat-label">Всего подписок</div>
              </div>
            </div>
          </div>
          
          <div className="calendar-section">
            <h2 className="section-heading-with-icon"></h2>
            
            <div className="subscription-calendar" ref={calendarRef}>
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Предыдущий месяц">
                  <span className="nav-arrow-left">◀</span>
                </button>
                <div className="calendar-month-year">
                  <span className="calendar-month">{monthNames[currentMonth.getMonth()]}</span>
                  <span className="calendar-year">{currentMonth.getFullYear()}</span>
                </div>
                <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Следующий месяц">
                  <span className="nav-arrow-right">▶</span>
                </button>
              </div>
              
              <div className="calendar-weekdays">
                {weekDays.map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              
              <div className="calendar-days">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${day.isEmpty ? 'empty' : ''} ${day.isToday ? 'today' : ''} ${selectedDate && day.date && selectedDate.toDateString() === day.date.toDateString() ? 'selected' : ''}`}
                    onClick={() => !day.isEmpty && day.date && handleDateClick(day.date, day.subscriptions)}
                  >
                    {!day.isEmpty && (
                      <>
                        <span className="day-number">{day.day}</span>
                        {day.subscriptions.length > 0 && (
                          <div className="day-subscriptions">
                            {day.subscriptions.slice(0, maxCalendarDots).map(sub => (
                              <div 
                                key={sub.id} 
                                className="day-subscription-dot"
                                style={{ backgroundColor: PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === sub.partnerId)?.color || '#FF6A2B' }}
                                title={sub.partnerName}
                              />
                            ))}
                            {day.subscriptions.length > maxCalendarDots && (
                              <span className="day-subscription-more">+{day.subscriptions.length - maxCalendarDots}</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {selectedDate && selectedDateSubscriptions && selectedDateSubscriptions.length > 0 && (
              <div className="selected-date-info">
                <h4>{selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                <div className="selected-date-subscriptions">
                  {selectedDateSubscriptions.map(sub => (
                    <div key={sub.id} className="selected-subscription-item">
                      <div className="subscription-color-dot" style={{ backgroundColor: PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === sub.partnerId)?.color }} />
                      <span className="subscription-name">{sub.partnerName}</span>
                      <span className="subscription-plan">{sub.plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="subscriptions-list-section">
            <div className="subscriptions-tabs">
              <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
                Активные ({activeSubscriptions.length})
              </button>
              <button className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveTab('expired')}>
                Истекшие ({expiredSubscriptions.length})
              </button>
            </div>
            
            <div className="subscriptions-list">
              {(activeTab === 'active' ? activeSubscriptions : expiredSubscriptions).map((subscription, index) => {
                const daysLeft = getDaysLeft(subscription.endDate);
                const partner = PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === subscription.partnerId);
                const swipeOffset = swipeState[subscription.id]?.offset || 0;
                const showDelete = swipeState[subscription.id]?.showDelete || false;
                
                return (
                  <div key={subscription.id} className={`subscription-card-wrapper ${daysLeft <= 3 && daysLeft >= 0 ? 'expiring' : ''}`}>
                    <div 
                      className="subscription-card"
                      style={{ transform: `translateX(-${swipeOffset}px)` }}
                      onTouchStart={(e) => handleTouchStart(e, subscription.id)}
                      onTouchMove={(e) => handleTouchMove(e, subscription.id)}
                      onTouchEnd={() => handleTouchEnd(subscription.id)}
                      onClick={(e) => handleCardClick(e, subscription)}
                    >
                      <div className="subscription-card-left">
                        <div className="subscription-icon" style={{ backgroundColor: `${partner?.color}20`, borderColor: partner?.color }}>
                          <img src={partner?.icon} alt={subscription.partnerName} />
                        </div>
                        <div className="subscription-info">
                          <h3 className="subscription-name">{subscription.partnerName}</h3>
                          <div className="subscription-meta">
                            <span className="subscription-plan-badge">{subscription.plan}</span>
                            <span className="subscription-price">{subscription.price}</span>
                          </div>
                          <div className="subscription-dates">
                            {new Date(subscription.startDate).toLocaleDateString('ru-RU')} — {new Date(subscription.endDate).toLocaleDateString('ru-RU')}
                          </div>
                          {subscription.notes && (
                            <div className="subscription-notes-preview">{subscription.notes.slice(0, 50)}</div>
                          )}
                        </div>
                      </div>
                      <div className="subscription-card-right">
                        {getStatusBadge(subscription)}
                        {daysLeft > 0 && daysLeft <= 30 && (
                          <div className="days-left">
                            Осталось {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`subscription-swipe-delete ${showDelete ? 'visible' : ''}`} onClick={(e) => handleDeleteFromSwipe(e, subscription.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M5 6h14v14c0 1-1 2-2 2H7c-1 0-2-1-2-2z" />
                      </svg>
                      <span>Удалить</span>
                    </div>
                  </div>
                );
              })}
              
              {(activeTab === 'active' ? activeSubscriptions : expiredSubscriptions).length === 0 && (
                <div className="empty-subscriptions">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p>Нет {activeTab === 'active' ? 'активных' : 'истекших'} подписок</p>
                  <button className="primary-button" onClick={() => setShowAddModal(true)}>
                    Добавить подписку
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="subscription-modal add-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить подписку</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Онлайн-кинотеатр</label>
                <div className="partner-select-grid three-cols">
                  {PARTNERS_FOR_SUBSCRIPTIONS.map(partner => (
                    <button
                      key={partner.id}
                      className={`partner-select-btn ${formData.partnerId === partner.id ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, partnerId: partner.id })}
                    >
                      <img src={partner.icon} alt={partner.name} />
                      <span>{partner.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Тариф</label>
                  <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
                    <option value="Месячная">Месячная</option>
                    <option value="3 месяца">3 месяца</option>
                    <option value="6 месяцев">6 месяцев</option>
                    <option value="Годовая">Годовая</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Стоимость (₽)</label>
                  <input type="number" placeholder="199" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Дата начала</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                
                <div className="form-group">
                  <label>Дата окончания</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Напоминать</label>
                  <select value={formData.reminderDays} onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}>
                    <option value="1">За 1 день</option>
                    <option value="3">За 3 дня</option>
                    <option value="7">За 7 дней</option>
                    <option value="14">За 14 дней</option>
                  </select>
                </div>
                
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={formData.autoRenew} onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })} />
                    Автопродление
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Заметки</label>
                <textarea rows="2" placeholder="Дополнительная информация..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Отмена</button>
              <button className="save-btn" onClick={handleAddSubscription}>Добавить</button>
            </div>
          </div>
        </div>
      )}
      
      {selectedSubscription && (
        <div className="modal-overlay" onClick={() => setSelectedSubscription(null)}>
          <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Редактировать подписку</h2>
              <button className="modal-close" onClick={() => setSelectedSubscription(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Платформа</label>
                <input type="text" value={selectedSubscription.partnerName} disabled style={{ opacity: 0.7 }} />
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Тариф</label>
                  <input type="text" value={selectedSubscription.plan} onChange={(e) => setSelectedSubscription({ ...selectedSubscription, plan: e.target.value })} />
                </div>
                
                <div className="form-group">
                  <label>Стоимость</label>
                  <input type="text" value={selectedSubscription.price.replace(' ₽', '')} onChange={(e) => setSelectedSubscription({ ...selectedSubscription, price: e.target.value })} />
                </div>
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Дата начала</label>
                  <input type="date" value={new Date(selectedSubscription.startDate).toISOString().split('T')[0]} disabled style={{ opacity: 0.7 }} />
                </div>
                
                <div className="form-group">
                  <label>Дата окончания</label>
                  <input type="date" value={new Date(selectedSubscription.endDate).toISOString().split('T')[0]} disabled style={{ opacity: 0.7 }} />
                </div>
              </div>
              
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Напоминать</label>
                  <select value={selectedSubscription.reminderDays} onChange={(e) => setSelectedSubscription({ ...selectedSubscription, reminderDays: parseInt(e.target.value) })}>
                    <option value="1">За 1 день</option>
                    <option value="3">За 3 дня</option>
                    <option value="7">За 7 дней</option>
                    <option value="14">За 14 дней</option>
                  </select>
                </div>
                
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={selectedSubscription.autoRenew} onChange={(e) => setSelectedSubscription({ ...selectedSubscription, autoRenew: e.target.checked })} />
                    Автопродление
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Заметки</label>
                <textarea rows="2" value={selectedSubscription.notes} onChange={(e) => setSelectedSubscription({ ...selectedSubscription, notes: e.target.value })} />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="delete-btn" onClick={() => { handleDeleteSubscription(selectedSubscription.id); setSelectedSubscription(null); }}>
                Удалить
              </button>
              <button className="save-btn" onClick={handleUpdateSubscription}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;