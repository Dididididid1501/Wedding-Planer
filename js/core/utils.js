// Вспомогательные утилиты

// Генерация уникального идентификатора
export const generateId = () => {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
};

// Экранирование HTML (защита от XSS)
export const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Преобразование первой буквы в заглавную
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Форматирование числа как денежной суммы (рубли)
export const formatMoney = (amount) => {
    return amount.toLocaleString('ru-RU') + ' ₽';
};

// Глубокое клонирование объекта
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Дебаунс (отложенный вызов функции)
export const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

// Получение значения из объекта по пути (например, 'user.address.city')
export const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Проверка, является ли значение пустым (null, undefined, '', [], {})
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// Преобразование строки в число (безопасно)
export const parseNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
};

// Форматирование даты в строку YYYY-MM-DD (для input type="date")
export const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Сравнение двух массивов на равенство (поверхностное)
export const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
};

// Уникальные значения массива
export const unique = (arr) => [...new Set(arr)];