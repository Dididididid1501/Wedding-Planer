// js/core/events.js
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

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

    clear() {
        this.events = {};
    }
}

export const eventBus = new EventBus();

// Предопределённые события (для удобства)
export const EVENTS = {
    STATE_CHANGED: 'stateChanged',
    STATE_UPDATE: 'state:update',
    PROJECT_SWITCHED: 'project:switched',
    PROJECT_CREATED: 'project:created',
    PROJECT_DELETED: 'project:deleted',
    GUESTS_UPDATED: 'guests:updated',
    BUDGET_UPDATED: 'budget:updated',
    TASKS_UPDATED: 'tasks:updated'
};