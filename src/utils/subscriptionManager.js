// src/utils/subscriptionManager.js
import { hasTrackingConsent } from './userId';

const SUBSCRIPTIONS_KEY = 'vzorkino_subscriptions';
const NOTIFICATIONS_KEY = 'vzorkino_subscription_notifications';
const MAX_SUBSCRIPTIONS = 10;

export const PARTNERS_FOR_SUBSCRIPTIONS = [
  { id: 'okko', name: 'OKKO', color: '#FF6A2B', icon: '/partner-icons/okko.png', price: '199 ₽/мес' },
  { id: 'ivi', name: 'IVI', color: '#FF4D4D', icon: '/partner-icons/ivi.png', price: '199 ₽/мес' },
  { id: 'wink', name: 'Wink', color: '#00A3FF', icon: '/partner-icons/wink.png', price: '199 ₽/мес' },
  { id: 'kion', name: 'KION', color: '#7C3AED', icon: '/partner-icons/kion.png', price: '199 ₽/мес' },
  { id: 'premier', name: 'PREMIER', color: '#E11D48', icon: '/partner-icons/premier.png', price: '199 ₽/мес' },
  { id: 'kinopoisk', name: 'КиноПоиск', color: '#F59E0B', icon: '/partner-icons/kinopoisk.png', price: '399 ₽/мес' }
];

class SubscriptionManager {
  constructor() {
    this.subscriptions = [];
    this.notificationsEnabled = false;
    this.loadFromStorage();
    this.checkExpiringSoon();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(SUBSCRIPTIONS_KEY);
      if (saved) {
        this.subscriptions = JSON.parse(saved).map(sub => ({
          ...sub,
          startDate: new Date(sub.startDate),
          endDate: new Date(sub.endDate)
        }));
      }
      
      const notificationsSetting = localStorage.getItem(NOTIFICATIONS_KEY);
      this.notificationsEnabled = notificationsSetting === 'true';
    } catch (error) {
      console.error('Ошибка загрузки подписок:', error);
      this.subscriptions = [];
    }
  }

  saveToStorage() {
    try {
      const toSave = this.subscriptions.map(sub => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString()
      }));
      localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(toSave));
      
      // Триггерим событие обновления
      window.dispatchEvent(new CustomEvent('subscriptionsUpdated', { 
        detail: { subscriptions: this.subscriptions } 
      }));
    } catch (error) {
      console.error('Ошибка сохранения подписок:', error);
    }
  }

  getSubscriptions() {
    return [...this.subscriptions];
  }

  canAddSubscription() {
    return this.subscriptions.length < MAX_SUBSCRIPTIONS;
  }

  getMaxSubscriptions() {
    return MAX_SUBSCRIPTIONS;
  }

  addSubscription(subscription) {
    const consent = hasTrackingConsent();
    if (!consent) {
      console.warn('Трекинг отключен, подписки не сохраняются');
      return null;
    }

    if (this.subscriptions.length >= MAX_SUBSCRIPTIONS) {
      console.warn('Достигнут лимит подписок');
      return null;
    }

    // Парсим цену из строки (убираем всё кроме цифр)
    let priceValue = subscription.price || PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === subscription.partnerId)?.price || '0 ₽';
    // Если цена уже в формате с валютой, оставляем как есть
    if (!priceValue.includes('₽')) {
      priceValue = `${parseInt(priceValue) || 0} ₽`;
    }

    const newSubscription = {
      id: Date.now().toString(),
      partnerId: subscription.partnerId,
      partnerName: PARTNERS_FOR_SUBSCRIPTIONS.find(p => p.id === subscription.partnerId)?.name || subscription.partnerId,
      plan: subscription.plan || 'Месячная',
      price: priceValue,
      startDate: new Date(subscription.startDate),
      endDate: new Date(subscription.endDate),
      autoRenew: subscription.autoRenew || false,
      notes: subscription.notes || '',
      reminderDays: subscription.reminderDays || 3,
      createdAt: new Date(),
      lastRemindedAt: null
    };

    this.subscriptions.push(newSubscription);
    this.saveToStorage();
    return newSubscription;
  }

  updateSubscription(id, updates) {
    const index = this.subscriptions.findIndex(sub => sub.id === id);
    if (index === -1) return null;

    // Если обновляется цена, форматируем её
    let price = updates.price;
    if (price && !price.includes('₽')) {
      price = `${parseInt(price) || 0} ₽`;
    }

    this.subscriptions[index] = {
      ...this.subscriptions[index],
      ...updates,
      price: price || this.subscriptions[index].price,
      startDate: updates.startDate ? new Date(updates.startDate) : this.subscriptions[index].startDate,
      endDate: updates.endDate ? new Date(updates.endDate) : this.subscriptions[index].endDate
    };
    
    this.saveToStorage();
    return this.subscriptions[index];
  }

  deleteSubscription(id) {
    this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    this.saveToStorage();
    return true;
  }

  getSubscriptionsByMonth(year, month) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    return this.subscriptions.filter(sub => 
      sub.startDate <= endOfMonth && sub.endDate >= startOfMonth
    );
  }

  getSubscriptionForDate(date) {
    return this.subscriptions.filter(sub => 
      sub.startDate <= date && sub.endDate >= date
    );
  }

  getExpiringSoon(days = 3) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return this.subscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today && endDate <= futureDate;
    });
  }

  getActiveSubscriptions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.subscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate >= today;
    });
  }

  getExpiredSubscriptions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.subscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    });
  }

  checkExpiringSoon() {
    const expiring = this.getExpiringSoon();
    if (expiring.length > 0 && this.notificationsEnabled) {
      const today = new Date().toDateString();
      expiring.forEach(sub => {
        const lastReminded = sub.lastRemindedAt ? new Date(sub.lastRemindedAt).toDateString() : null;
        if (lastReminded !== today) {
          this.showNotification(sub);
          this.updateSubscription(sub.id, { lastRemindedAt: new Date() });
        }
      });
    }
    return expiring;
  }

  showNotification(subscription) {
    const daysLeft = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'subscription-notification';
    notificationDiv.innerHTML = `
      <div class="notification-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="13" r="8" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div class="notification-content">
        <div class="notification-title">Подписка заканчивается!</div>
        <div class="notification-text">
          Подписка на ${subscription.partnerName} заканчивается через ${daysLeft} ${this.getDaysWord(daysLeft)}.
          ${daysLeft <= 1 ? 'Продлите подписку, чтобы не потерять доступ!' : ''}
        </div>
      </div>
      <button class="notification-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    `;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => notificationDiv.classList.add('show'), 10);
    
    setTimeout(() => {
      notificationDiv.classList.remove('show');
      setTimeout(() => notificationDiv.remove(), 300);
    }, 10000);
    
    notificationDiv.querySelector('.notification-close').onclick = () => {
      notificationDiv.classList.remove('show');
      setTimeout(() => notificationDiv.remove(), 300);
    };
  }

  getDaysWord(days) {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
  }

  setNotificationsEnabled(enabled) {
    this.notificationsEnabled = enabled;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(enabled));
  }

  getTotalSpent() {
    let total = 0;
    const now = new Date();
    
    this.subscriptions.forEach(sub => {
      const start = new Date(sub.startDate);
      const end = new Date(sub.endDate);
      const price = parseFloat(sub.price.replace(/[^0-9]/g, '')) || 0;
      
      if (end < now) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        total += price * months;
      } else {
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        total += price * Math.max(0, months);
      }
    });
    
    return total;
  }
}

export const subscriptionManager = new SubscriptionManager();