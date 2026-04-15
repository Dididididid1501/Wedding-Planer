// js/app.js
import { stateManager } from './core/storage.js';
import { eventBus, EVENTS } from './core/events.js';
import { initProjectsModule } from './modules/projects/projects.init.js';
import { initTasksModule } from './modules/tasks/tasks.init.js';
import { initBudgetModule } from './modules/budget/budget.init.js';
import { initGuestsModule } from './modules/guests/guests.init.js';
import { initSeatingModule } from './modules/seating/seating.init.js';

let currentModules = {};

// Обработчик сворачивания секций (вынесен отдельно)
function headerClickHandler(e) {
    if (e.target.closest('button, input, select')) return;
    const header = e.currentTarget;
    const section = header.dataset.section;
    const container = document.getElementById(section + 'Container');
    const isCollapsed = container.classList.toggle('collapsed');

    const project = stateManager.getActiveProject();
    if (project) {
        if (!project.data.sectionsCollapsed) project.data.sectionsCollapsed = {};
        project.data.sectionsCollapsed[section] = isCollapsed;
        stateManager.updateActiveProject({ sectionsCollapsed: project.data.sectionsCollapsed });
    }
}

function attachHeaderListeners() {
    document.querySelectorAll('.tg-header').forEach(header => {
        const section = header.dataset.section;
        if (!section) return;
        // Удаляем старый обработчик
        header.removeEventListener('click', headerClickHandler);
        header.addEventListener('click', headerClickHandler);
    });
}

function applySectionsCollapsed(collapsedState) {
    if (!collapsedState) return;
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

function showProjectsList() {
    // Скрываем основной интерфейс, показываем рабочий стол
    document.getElementById('projectsContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';

    // Очищаем модули, чтобы не было утечек памяти
    currentModules = {};

    const container = document.getElementById('projectsContainer');
    container.innerHTML = '';

    // Инициализируем модуль проектов
    initProjectsModule(stateManager.getState(), container, (projectId) => {
        // Колбэк при выборе проекта
        stateManager.setActiveProject(projectId);
        showActiveProject();
    });
}

function showActiveProject() {
    document.getElementById('projectsContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';

    const project = stateManager.getActiveProject();
    if (!project) {
        showProjectsList();
        return;
    }

    // Обновляем название в хедере
    document.getElementById('currentProjectName').textContent = project.name;

    // Очищаем контейнеры модулей перед инициализацией
    const tasksContainer = document.querySelector('#tasksContainer .section-content');
    const expensesContainer = document.querySelector('#expensesContainer .section-content');
    const guestsContainer = document.querySelector('#guestsContainer .section-content');
    const seatingContainer = document.querySelector('#seatingContainer .section-content');

    if (tasksContainer) tasksContainer.innerHTML = '';
    if (expensesContainer) expensesContainer.innerHTML = '';
    if (guestsContainer) guestsContainer.innerHTML = '';
    if (seatingContainer) seatingContainer.innerHTML = '';

    // Инициализация модулей (без передачи state)
    if (tasksContainer) currentModules.tasks = initTasksModule(tasksContainer);
    if (expensesContainer) currentModules.budget = initBudgetModule(expensesContainer);
    if (guestsContainer) currentModules.guests = initGuestsModule(guestsContainer);
    if (seatingContainer) currentModules.seating = initSeatingModule(seatingContainer);

    // Применяем состояние сворачивания секций
    const collapsedState = project.data.sectionsCollapsed || stateManager.getState().sectionsCollapsed;
    applySectionsCollapsed(collapsedState);

    // Навешиваем обработчики сворачивания
    attachHeaderListeners();
}

// ========== Глобальные обработчики ==========
document.addEventListener('click', (e) => {
    if (e.target.closest('#switchProjectBtn')) {
        showProjectsList();
    }
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Подписка на события обновления состояния
eventBus.on(EVENTS.STATE_UPDATE, (updates) => {
    stateManager.updateActiveProject(updates);
});

// Старт приложения
document.addEventListener('DOMContentLoaded', () => {
    const state = stateManager.getState();
    if (state.activeProjectId) {
        showActiveProject();
    } else {
        showProjectsList();
    }
});