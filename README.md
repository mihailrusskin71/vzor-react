
## 🚀 Технологии

- **React 19** + **React Router DOM 7**
- **Vite 7** — сборка проекта
- **Supabase** — бэкенд (база данных, аутентификация)
- **ESLint** — линтинг кода

## 📁 Структура проекта
src/
├── components/ # UI компоненты (админка, карточки, карусели)
├── pages/ # Страницы приложения
├── services/ # Сервисы (filmManager, Supabase)
├── styles/ # Модульные CSS (base, components, layout, modules, pages)
├── utils/ # Утилиты (константы, helpers)
└── App.jsx # Корневой компонент

text

## 🛠️ Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build

# Предпросмотр сборки
npm run preview

# Линтинг кода
npm run lint
🔧 Переменные окружения
Создай файл .env в корне проекта:

env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
📦 Основные компоненты
AdminPanel — панель администратора для управления контентом

MovieCard — карточка фильма/сериала

HorizontalScrollRow — горизонтальный скроллируемый ряд

FiltersPanel — панель фильтров по жанрам, годам и странам

PartnersCarousel — карусель логотипов партнёров

CookieConsent — модальное окно согласия на cookies

ClickStats — отслеживание кликов и аналитика

🌐 Страницы
HomePage — главная страница

MoviesPage — все фильмы

SeriesPage — все сериалы

CartoonsPage — мультфильмы

MovieDetailPage — детальная страница фильма/сериала

ProfilePage — личный кабинет пользователя

AboutPage — о сайте

FAQPage — часто задаваемые вопросы

PrivacyPage — политика конфиденциальности

📝 Лицензия
MIT