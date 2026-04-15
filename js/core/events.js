// Шина событий (EventBus) для межмодульного взаимодействия
class EventBus {
    constructor() {
        this.events = {};
    }

    // Подписка на событие
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        // Возвращаем функцию для отписки
        return () => this.off(event, callback);
    }

    // Отписка от события
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    // Публикация события с данными
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Ошибка в обработчике события "${event}":`, error);
            }
        });
    }

    // Очистить все подписки (для тестов или перезагрузки)
    clear() {
        this.events = {};
    }
}

// Экспортируем синглтон
export const eventBus = new EventBus();