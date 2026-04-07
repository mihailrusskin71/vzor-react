// src/components/SubscriptionCalendar.jsx
import React, { useState, useEffect } from 'react';

const SubscriptionCalendar = ({ subscriptions, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Пустые дни в начале
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ date: null, subscriptions: [], isEmpty: true });
    }
    
    // Дни месяца
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

  useEffect(() => {
    generateCalendar();
  }, [currentDate, subscriptions]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const handleDateClick = (day) => {
    if (!day.isEmpty && day.date) {
      setSelectedDate(day.date);
      if (onDateClick) onDateClick(day.date, day.subscriptions);
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="subscription-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="calendar-month-year">
          <span className="calendar-month">{monthNames[currentDate.getMonth()]}</span>
          <span className="calendar-year">{currentDate.getFullYear()}</span>
        </div>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button className="calendar-today-btn" onClick={goToToday}>
          Сегодня
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
            onClick={() => handleDateClick(day)}
          >
            {!day.isEmpty && (
              <>
                <span className="day-number">{day.day}</span>
                {day.subscriptions.length > 0 && (
                  <div className="day-subscriptions">
                    {day.subscriptions.slice(0, 3).map(sub => (
                      <div 
                        key={sub.id} 
                        className="day-subscription-dot"
                        style={{ backgroundColor: PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === sub.partnerId)?.color || '#FF6A2B' }}
                        title={sub.partnerName}
                      />
                    ))}
                    {day.subscriptions.length > 3 && (
                      <span className="day-subscription-more">+{day.subscriptions.length - 3}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Импортируем PARTNERS_FOR_SUBSCRIPTIONS
import { PARTNERS_FOR_SUBSCRIPTIONS } from '../utils/subscriptionManager';

export default SubscriptionCalendar;