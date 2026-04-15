// js/app.js
import { stateManager } from './core/storage.js';
import { eventBus } from './core/events.js';
import { initTasksModule } from './modules/tasks/tasks.init.js';
import { initBudgetModule } from './modules/budget/budget.init.js';
import { initGuestsModule } from './modules/guests/guests.init.js';
import { initSeatingModule } from './modules/seating/seating.init.js';

document.addEventListener('DOMContentLoaded', () => {
    // Получаем текущее состояние
    const state = stateManager.getState();

    // Инициализация всех модулей
    const tasksContainer = document.querySelector('#tasksContainer .section-content');
    const expensesContainer = document.querySelector('#expensesContainer .section-content');
    const guestsContainer = document.querySelector('#guestsContainer .section-content');
    const seatingContainer = document.querySelector('#seatingContainer .section-content');

    // Модули могут возвращать экземпляры контроллеров (не обязательно сохранять)
    initTasksModule(state, tasksContainer);
    initBudgetModule(state, expensesContainer);
    initGuestsModule(state, guestsContainer);
    initSeatingModule(state, seatingContainer);

    // Применяем начальное состояние сворачивания секций
    applySectionsCollapsed(state.sectionsCollapsed);

    // Навешиваем обработчики на заголовки для сворачивания/разворачивания
    document.querySelectorAll('.tg-header').forEach(header => {
        const section = header.dataset.section;
        if (!section) return;

        header.addEventListener('click', (e) => {
            // Игнорируем клики по кнопкам, инпутам и селектам внутри заголовка
            if (e.target.closest('button, input, select')) return;

            const container = document.getElementById(section + 'Container');
            const isCollapsed = container.classList.toggle('collapsed');

            // Обновляем состояние в глобальном хранилище
            const currentState = stateManager.getState();
            currentState.sectionsCollapsed[section] = isCollapsed;
            stateManager.setState({ sectionsCollapsed: currentState.sectionsCollapsed });
        });
    });

    // Подписываемся на события обновления состояния от модулей
    eventBus.on('state:update', (updates) => {
        // Модули передают частичные обновления (например, { tasks: newTasks })
        // Обновляем состояние через менеджер, который сохранит в localStorage и уведомит подписчиков
        stateManager.setState(updates);
    });

    // Дополнительно можно подписаться на глобальное изменение состояния,
    // чтобы обновлять сводки или другие элементы вне модулей
    stateManager.subscribe((newState) => {
        // Например, обновить общую сводку в заголовке страницы (если нужно)
        // Но каждый модуль уже подписан через eventBus на 'stateChanged'
        // Здесь можно делать что-то кросс-модульное
        eventBus.emit('stateChanged', newState);
    });

    // Закрытие модальных окон по клику на фон
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Инициализация drag & drop для рассадки (глобальные обработчики уже в seating.view)
    // Но можно также подписаться на события, если нужно
});

function applySectionsCollapsed(collapsedState) {
    Object.entries(collapsedState).forEach(([section, isCollapsed]) => {
        const container = document.getElementById(section + 'Container');
        if (container) {
            if (isCollapsed) {
                container.classList.add('collapsed');
            } else {
                container.classList.remove('collapsed');
            }
        }
    });
}