// utils/constants.js - полная версия

export const PARTNERS = {
    okko: {
        name: "OKKO",
        color: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
        icon: "/partner-icons/okko.png"
    },
    ivi: {
        name: "IVI",
        color: "linear-gradient(135deg, #EC4899, #DB2777)",
        icon: "/partner-icons/ivi.png"
    },
    wink: {
        name: "Wink",
        color: "linear-gradient(135deg, #F97316, #EA580C)",
        icon: "/partner-icons/wink.png"
    },
    kion: {
        name: "KION",
        color: "linear-gradient(135deg, #DC2626, #B91C1C)",
        icon: "/partner-icons/kion.png"
    },
    premier: {
        name: "Премьер",
        color: "linear-gradient(135deg, #FBBF24, #F59E0B)",
        icon: "/partner-icons/premier.png"
    },
    kinopoisk: {
        name: "КиноПоиск",
        color: "linear-gradient(135deg, #EA580C, #C2410C)",
        icon: "/partner-icons/kinopoisk.png"
    }
};

export const GENRES = [
    "Боевик", "Драма", "Комедия", "Фантастика", "Триллер", 
    "Ужасы", "Мультфильм", "Сериал", "Приключения", "Детектив",
    "Мелодрама", "Военный", "Исторический", "Биография", "Спорт",
    "Криминал", "Вестерн", "Мюзикл", "Аниме", "Семейный"
];

export const COUNTRIES = [
    "США", "Россия", "Великобритания", "Франция", "Германия",
    "Япония", "Южная Корея", "Китай", "Индия", "Канада",
    "Испания", "Италия", "Австралия", "Бразилия", "Мексика",
    "Турция", "Польша", "Украина", "Швеция", "Норвегия"
];

export const YEARS = Array.from({length: 50}, (_, i) => (new Date().getFullYear() - i).toString());

export const RATINGS = ["Все", "7+", "8+", "9+"];

// Для обратной совместимости
export default {
    PARTNERS,
    GENRES,
    COUNTRIES,
    YEARS,
    RATINGS
};