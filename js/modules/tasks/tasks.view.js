import { escapeHtml, capitalize } from '../../core/utils.js';
import { MONTHS, COLOR_PALETTE } from './tasks.model.js';

export class TasksView {
    constructor(container) {
        this.container = container;
        this.onAddCategory = null;
        this.onManageCategories = null;
        this.onAddTask = null;
        this.onEditTask = null;
        this.onDeleteTask = null;
        this.onMonthToggle = null;
        this.onFilterChange = null;
        this.onShowTemplates = null;
        this.onApplyTemplate = null;
    }

    render(tasks, categories, progress, filter = { category: 'all', month: 'all', status: 'all' }, weddingDate = '') {
        const html = `
            <div class="add-task-card" style="padding-bottom: 8px;">
                <div class="category-manager">
                    <div class="input-group" style="min-width:200px;">
                        <label>Новая категория</label>
                        <input type="text" id="newCategoryName" placeholder="Название">
                    </div>
                    <button class="btn-tg btn-outline-tg" id="addCategoryBtn"><i class="fas fa-plus"></i> Добавить</button>
                    <button class="btn-tg btn-outline-tg" id="manageCategoriesBtn"><i class="fas fa-palette"></i> Управление</button>
                    <button class="btn-tg btn-outline-tg" id="showTemplatesBtn"><i class="fas fa-copy"></i> Шаблоны</button>
                </div>
                <div id="categoriesList" class="category-list">${this.renderCategoriesList(categories)}</div>
            </div>

            <div class="add-task-card">
                <div class="form-row">
                    ${this.renderAddTaskForm(categories)}
                </div>
            </div>

            <div class="progress-section">
                ${this.renderProgressBar(progress)}
            </div>

            <div class="filter-bar">
                ${this.renderFilters(categories, filter)}
            </div>

            <div class="table-wrapper">
                <table class="tasks-table">
                    <thead>
                        <tr>
                            <th style="width:40px;">№</th>
                            <th>Задача</th>
                            <th>Категория</th>
                            <th>Ответственный</th>
                            <th>Начало</th>
                            <th>Дедлайн</th>
                            <th>Промежуточные этапы</th>
                            <th>Комментарий</th>
                            <th>Статус</th>
                            <th style="width:80px;"></th>
                        </tr>
                    </thead>
                    <tbody id="tasksTbody">${this.renderTableBody(tasks, categories)}</tbody>
                </table>
            </div>

            <!-- Модальное окно шаблонов -->
            <div id="templatesModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>📋 Шаблоны задач</h3>
                        <button class="icon-btn" id="closeTemplatesModalBtn"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="weddingDateSelector" style="margin-bottom: 20px; padding: 12px; background: #fafcff; border-radius: 16px;">
                        <label style="font-weight:600; margin-right: 12px;">Дата свадьбы:</label>
                        <input type="date" id="weddingDateInput" value="${weddingDate}" style="padding: 8px 12px; border-radius: 14px; border: 1px solid #e2e6ea;">
                    </div>
                    <div id="templatesList" class="templates-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;"></div>
                    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                        <button class="btn-tg btn-outline-tg" id="closeTemplatesBtn">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.attachEvents();
    }

    renderCategoriesList(categories) {
        return categories.map(c => `<span class="category-badge" style="background:${c.color};">${escapeHtml(c.name)}</span>`).join('');
    }

    renderAddTaskForm(categories) {
        const catOptions = categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
        const monthOptions = MONTHS.map(m => `<option value="${m}">${capitalize(m)}</option>`).join('');
        return `
            <div class="input-group" style="min-width:200px;"><label>Задача</label><input type="text" id="taskTitle" placeholder="Название задачи"></div>
            <div class="input-group"><label>Категория</label><select id="taskCategory">${catOptions}</select></div>
            <div class="input-group"><label>Ответственный</label><select id="taskResponsible"><option>Невеста</option><option>Жених</option><option>Семья</option><option>Агентство</option><option>Другое</option></select></div>
            <div class="input-group"><label>Начало</label><select id="taskStartMonth">${monthOptions}</select></div>
            <div class="input-group"><label>Дедлайн</label><select id="taskDeadlineMonth">${monthOptions}</select></div>
            <div class="input-group"><label>Статус</label><select id="taskStatus"><option value="planned">Запланировано</option><option value="progress">В работе</option><option value="done">Выполнено</option></select></div>
            <div class="input-group" style="min-width:180px;"><label>Комментарий</label><input type="text" id="taskComment" placeholder="Заметка"></div>
            <button class="btn-tg" id="addTaskBtn"><i class="fas fa-plus"></i> Добавить</button>
        `;
    }

    renderProgressBar(progress) {
        const { totalWeight, doneWeight, partialWeight, plannedWeight, percent } = progress;
        return `
            <div class="progress-container">
                <span style="font-weight:600; font-size:0.8rem;">Прогресс</span>
                <div class="progress-bar-wrapper">
                    <div class="progress-bar-stack">
                        <div class="progress-done" style="width:${totalWeight ? (doneWeight/totalWeight)*100 : 0}%;"></div>
                        <div class="progress-partial" style="width:${totalWeight ? (partialWeight/totalWeight)*100 : 0}%;"></div>
                        <div class="progress-planned" style="width:${totalWeight ? (plannedWeight/totalWeight)*100 : 0}%;"></div>
                    </div>
                    <div class="progress-legend">
                        <div class="legend-item"><span class="legend-color" style="background:#2ecc71;"></span> Выполнено</div>
                        <div class="legend-item"><span class="legend-color" style="background:#f39c12;"></span> Частично</div>
                        <div class="legend-item"><span class="legend-color" style="background:#bdc3c7;"></span> Запланировано</div>
                    </div>
                </div>
                <span id="progressPercent" style="font-size:0.9rem; min-width:50px; font-weight:600;">${percent}%</span>
            </div>
        `;
    }

    renderFilters(categories, filter) {
        const catOptions = '<option value="all">Все</option>' + categories.map(c => `<option value="${escapeHtml(c.name)}" ${filter.category === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
        const monthOptions = '<option value="all">Все</option>' + MONTHS.map(m => `<option value="${m}" ${filter.month === m ? 'selected' : ''}>${capitalize(m)}</option>`).join('');
        return `
            <div class="input-group" style="min-width:150px;"><label>Категория</label><select id="filterCategory">${catOptions}</select></div>
            <div class="input-group" style="min-width:150px;"><label>Месяц</label><select id="filterMonth">${monthOptions}</select></div>
            <div class="input-group" style="min-width:150px;"><label>Статус</label><select id="filterStatus">
                <option value="all" ${filter.status === 'all' ? 'selected' : ''}>Все</option>
                <option value="planned" ${filter.status === 'planned' ? 'selected' : ''}>Запланировано</option>
                <option value="progress" ${filter.status === 'progress' ? 'selected' : ''}>В работе</option>
                <option value="done" ${filter.status === 'done' ? 'selected' : ''}>Выполнено</option>
            </select></div>
            <button class="btn-tg btn-outline-tg" id="clearFiltersBtn"><i class="fas fa-times"></i> Сбросить</button>
        `;
    }

    renderTableBody(tasks, categories) {
        return tasks.map((task, idx) => {
            const cat = categories.find(c => c.name === task.category) || { color: '#e9ecef' };
            const statusClass = { planned: 'status-planned', progress: 'status-progress', done: 'status-done' }[task.status];
            const statusText = { planned: 'Запланировано', progress: 'В работе', done: 'Выполнено' }[task.status];
            const respClass = this.getResponsibleClass(task.responsible);
            const startIdx = MONTHS.indexOf(task.startMonth);
            const endIdx = MONTHS.indexOf(task.deadlineMonth);
            const months = MONTHS.slice(startIdx, endIdx + 1);
            const checksHtml = months.map(m => `
                <div class="month-checkbox-item">
                    <input type="checkbox" value="${m}" ${task.completedMonths.includes(m) ? 'checked' : ''} data-task-id="${task.id}" class="month-progress-check"> ${capitalize(m)}
                </div>
            `).join('');
            const titleClass = task.status === 'done' ? 'task-title-done' : '';
            const commentDisplay = task.comment
                ? `<span class="comment-cell" title="${escapeHtml(task.comment)}"><i class="far fa-comment-dots comment-icon"></i> ${escapeHtml(task.comment.substring(0, 20))}${task.comment.length > 20 ? '…' : ''}</span>`
                : '<span style="color:#ccc;">—</span>';
            return `<tr>
                <td>${idx + 1}</td>
                <td><strong class="${titleClass}">${escapeHtml(task.title)}</strong></td>
                <td><span class="category-badge" style="background:${cat.color};">${escapeHtml(task.category)}</span></td>
                <td><span class="resp-badge ${respClass}">${escapeHtml(task.responsible)}</span></td>
                <td>${capitalize(task.startMonth)}</td>
                <td>${capitalize(task.deadlineMonth)}</td>
                <td><div class="month-checkboxes">${checksHtml}</div></td>
                <td>${commentDisplay}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="icon-btn edit-task" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete-task" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        }).join('');
    }

    getResponsibleClass(resp) {
        const map = { "Невеста": "resp-bride", "Жених": "resp-groom", "Семья": "resp-family", "Агентство": "resp-agency", "Другое": "resp-other" };
        return map[resp.split(',')[0].trim()] || '';
    }

    attachEvents() {
        // Базовые обработчики будут привязаны в контроллере
        const showTemplatesBtn = document.getElementById('showTemplatesBtn');
        if (showTemplatesBtn) {
            showTemplatesBtn.addEventListener('click', () => {
                if (this.onShowTemplates) this.onShowTemplates();
            });
        }
    }

    renderManageCategoriesModal(categories) {
        const list = document.getElementById('manageCategoriesList');
        if (!list) return;
        list.innerHTML = categories.map(cat => {
            const paletteHtml = COLOR_PALETTE.map(col =>
                `<div class="color-option ${cat.color === col ? 'selected' : ''}" style="background:${col};" data-color="${col}"></div>`
            ).join('');
            return `
                <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <span class="category-badge" style="background:${cat.color};">${escapeHtml(cat.name)}</span>
                        <button class="icon-btn delete-category-btn" data-category="${escapeHtml(cat.name)}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="color-palette">${paletteHtml}</div>
                </div>
            `;
        }).join('');
    }

    renderEditTaskModal(task, categories) {
        const catOptions = categories.map(c => `<option value="${escapeHtml(c.name)}" ${task.category === c.name ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
        const monthOptions = MONTHS.map(m => `<option value="${m}" ${task.startMonth === m ? 'selected' : ''}>${capitalize(m)}</option>`).join('');
        const deadlineOptions = MONTHS.map(m => `<option value="${m}" ${task.deadlineMonth === m ? 'selected' : ''}>${capitalize(m)}</option>`).join('');
        const startIdx = MONTHS.indexOf(task.startMonth);
        const endIdx = MONTHS.indexOf(task.deadlineMonth);
        const months = MONTHS.slice(startIdx, endIdx + 1);
        const checksHtml = months.map(m => `
            <div class="month-checkbox-item">
                <input type="checkbox" value="${m}" ${task.completedMonths.includes(m) ? 'checked' : ''}> ${capitalize(m)}
            </div>
        `).join('');

        document.getElementById('editTaskTitle').value = task.title || '';
        document.getElementById('editTaskCategory').innerHTML = catOptions;
        document.getElementById('editTaskResponsible').value = task.responsible;
        document.getElementById('editTaskStartMonth').innerHTML = monthOptions;
        document.getElementById('editTaskDeadlineMonth').innerHTML = deadlineOptions;
        document.getElementById('editTaskStatus').value = task.status;
        document.getElementById('editTaskComment').value = task.comment || '';
        document.getElementById('editMonthCheckboxes').innerHTML = checksHtml;
    }

    getAddTaskFormData() {
        return {
            title: document.getElementById('taskTitle')?.value || '',
            category: document.getElementById('taskCategory')?.value || '',
            responsible: document.getElementById('taskResponsible')?.value || 'Невеста',
            startMonth: document.getElementById('taskStartMonth')?.value || MONTHS[0],
            deadlineMonth: document.getElementById('taskDeadlineMonth')?.value || MONTHS[0],
            status: document.getElementById('taskStatus')?.value || 'planned',
            comment: document.getElementById('taskComment')?.value || ''
        };
    }

    getEditTaskFormData() {
        return {
            title: document.getElementById('editTaskTitle')?.value || '',
            category: document.getElementById('editTaskCategory')?.value || '',
            responsible: document.getElementById('editTaskResponsible')?.value || 'Невеста',
            startMonth: document.getElementById('editTaskStartMonth')?.value || MONTHS[0],
            deadlineMonth: document.getElementById('editTaskDeadlineMonth')?.value || MONTHS[0],
            status: document.getElementById('editTaskStatus')?.value || 'planned',
            comment: document.getElementById('editTaskComment')?.value || '',
            completedMonths: Array.from(document.querySelectorAll('#editMonthCheckboxes input:checked')).map(cb => cb.value)
        };
    }

    updateSummary(tasksCount, progressPercent) {
        const summary = document.getElementById('tasksSummary');
        if (summary) summary.textContent = `Всего задач: ${tasksCount} · Прогресс: ${progressPercent}%`;
        const badge = document.getElementById('tasksProgressBadge');
        if (badge) badge.textContent = `Выполнено: ${progressPercent}%`;
    }

    // Методы для работы с шаблонами
    showTemplatesModal(templates, weddingDate) {
        const modal = document.getElementById('templatesModal');
        const dateInput = document.getElementById('weddingDateInput');
        if (dateInput) dateInput.value = weddingDate || '';

        const list = document.getElementById('templatesList');
        list.innerHTML = templates.map(tpl => `
            <div class="template-card" style="border:1px solid #e2e6ea; border-radius:20px; padding:16px; background:white;">
                <div style="font-size:2rem; margin-bottom:8px;">${tpl.icon}</div>
                <h4 style="margin-bottom:8px;">${escapeHtml(tpl.name)}</h4>
                <p style="font-size:0.8rem; color:#5e6f8d; margin-bottom:16px;">${escapeHtml(tpl.description)}</p>
                <button class="btn-tg btn-outline-tg apply-template-btn" data-template-id="${tpl.id}" style="width:100%;">Применить</button>
            </div>
        `).join('');

        modal.style.display = 'flex';

        // Привязка кнопок применения шаблона
        list.querySelectorAll('.apply-template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const templateId = btn.dataset.templateId;
                const selectedDate = document.getElementById('weddingDateInput').value;
                if (!selectedDate) {
                    alert('Пожалуйста, выберите дату свадьбы');
                    return;
                }
                if (this.onApplyTemplate) {
                    this.onApplyTemplate(templateId, selectedDate);
                }
                this.hideTemplatesModal();
            });
        });

        // Кнопки закрытия
        document.getElementById('closeTemplatesModalBtn').addEventListener('click', () => this.hideTemplatesModal());
        document.getElementById('closeTemplatesBtn').addEventListener('click', () => this.hideTemplatesModal());
    }

    hideTemplatesModal() {
        const modal = document.getElementById('templatesModal');
        if (modal) modal.style.display = 'none';
    }
}