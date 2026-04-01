// Хелпер для работы с иконками партнеров
export const getPartnerIcon = (partnerKey) => {
    const iconMap = {
        okko: '/partner-icons/okko.png',
        ivi: '/partner-icons/ivi.png',
        wink: '/partner-icons/wink.png',
        kion: '/partner-icons/kion.png',
        premier: '/partner-icons/premier.png',
        kinopoisk: '/partner-icons/kinopoisk.png'
    };
    
    return iconMap[partnerKey] || '/partner-icons/default.svg';
};

// Функция для обработки ошибок загрузки изображений
export const handleIconError = (e, partnerKey) => {
    e.target.onerror = null;
    
    // Пробуем разные форматы
    const formats = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    const partner = partnerKey || 'okko';
    
    for (let format of formats) {
        if (format === 'svg') {
            e.target.src = '/partner-icons/default.svg';
            break;
        }
        // Пробуем загрузить с другим расширением
        const newSrc = `/partner-icons/${partner}.${format}`;
        if (newSrc !== e.target.src) {
            e.target.src = newSrc;
            break;
        }
    }
};