// js/modules/projects/projects.view.js
import { escapeHtml, formatMoney } from '../../core/utils.js';

export class ProjectsView {
    constructor(container) {
        this.container = container;
        this.onCreateProject = null;
        this.onSelectProject = null;
        this.onDeleteProject = null;
        this.onEditProject = null;
        this.onUpdateProject = null;
    }

    render(projects) {
        const html = `
            <div class="projects-container">
                <div class="projects-header">
                    <h1>Мои свадьбы</h1>
                    <button class="btn-tg" id="createProjectBtn"><i class="fas fa-plus"></i> Новая свадьба</button>
                </div>
                <div class="projects-grid" id="projectsGrid">
                    ${this.renderProjectCards(projects)}
                </div>
            </div>
            <!-- Модальное окно создания/редактирования проекта -->
            <div id="projectModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="projectModalTitle">Новая свадьба</h3>
                        <button class="icon-btn" id="closeProjectModalBtn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="input-group">
                        <label>Название проекта</label>
                        <input type="text" id="projectNameInput" placeholder="Свадьба Марии и Дениса">
                    </div>
                    <div class="input-group">
                        <label>Дата свадьбы</label>
                        <input type="date" id="projectDateInput">
                    </div>
                    <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">
                        <button class="btn-tg btn-outline-tg" id="cancelProjectBtn">Отмена</button>
                        <button class="btn-tg" id="saveProjectBtn">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.attachEvents();
    }

    renderProjectCards(projects) {
        if (projects.length === 0) {
            return `<div class="empty-state">У вас пока нет свадеб. Создайте первую!</div>`;
        }
        return projects.map(project => {
            const data = project.data;
            const guestCount = data.guests?.length || 0;
            const tasks = data.tasks || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const progressPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Бюджет
            const expenses = data.expenses || [];
            const totalPlanned = expenses.reduce((s, e) => s + (e.planned || 0), 0);
            const totalPaid = expenses.reduce((s, e) => {
                return s + (e.payments || []).reduce((ps, p) => ps + (p.isPaid ? p.amount : 0), 0);
            }, 0);

            const weddingDate = data.weddingDate
                ? new Date(data.weddingDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Дата не указана';

            return `
                <div class="project-card" data-project-id="${project.id}">
                    <div class="project-card-actions">
                        <button class="icon-btn edit-project-btn" data-project-id="${project.id}" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete-project-btn" data-project-id="${project.id}" title="Удалить">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <h3 class="project-name">${escapeHtml(project.name)}</h3>
                    <div class="project-date">
                        <i class="far fa-calendar-alt"></i>
                        <span class="date-value" data-project-id="${project.id}">${escapeHtml(weddingDate)}</span>
                    </div>
                    <div class="project-stats">
                        <div class="stat-item">
                            <span class="stat-label">Гостей</span>
                            <span class="stat-value">${guestCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Бюджет</span>
                            <span class="stat-value">${formatMoney(totalPaid)} / ${formatMoney(totalPlanned)}</span>
                        </div>
                    </div>
                    <div class="project-progress">
                        <div class="progress-label">
                            <span>Задачи</span>
                            <span>${completedTasks}/${totalTasks}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    attachEvents() {
        // Открытие модалки создания
        document.getElementById('createProjectBtn')?.addEventListener('click', () => {
            this.showProjectModal();
        });

        // Закрытие модалки
        document.getElementById('closeProjectModalBtn')?.addEventListener('click', () => this.hideProjectModal());
        document.getElementById('cancelProjectBtn')?.addEventListener('click', () => this.hideProjectModal());

        // Сохранение проекта
        document.getElementById('saveProjectBtn')?.addEventListener('click', () => {
            const nameInput = document.getElementById('projectNameInput');
            const dateInput = document.getElementById('projectDateInput');
            const name = nameInput.value.trim() || 'Новая свадьба';
            const weddingDate = dateInput.value || null;

            const editId = this.container.dataset.editingProjectId;
            if (editId) {
                if (this.onUpdateProject) {
                    this.onUpdateProject(editId, { name, weddingDate });
                }
            } else {
                if (this.onCreateProject) {
                    this.onCreateProject(name, weddingDate);
                }
            }
            this.hideProjectModal();
        });

        // Клик по карточке (открыть проект) – игнорируем клики по кнопкам и дате
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (!card) return;

            // Если кликнули по кнопке или дате – не переходим в проект
            if (e.target.closest('.icon-btn') || e.target.closest('.date-value')) {
                return;
            }

            const id = card.dataset.projectId;
            if (this.onSelectProject) this.onSelectProject(id);
        });

        // Кнопка удаления
        this.container.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.delete-project-btn');
            if (!delBtn) return;
            e.stopPropagation();
            const id = delBtn.dataset.projectId;
            if (confirm('Удалить проект? Все данные будут потеряны.')) {
                if (this.onDeleteProject) this.onDeleteProject(id);
            }
        });

        // Кнопка редактирования
        this.container.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-project-btn');
            if (!editBtn) return;
            e.stopPropagation();
            const id = editBtn.dataset.projectId;
            if (this.onEditProject) this.onEditProject(id);
        });

        // Клик по дате – тоже открывает редактирование
        this.container.addEventListener('click', (e) => {
            const dateEl = e.target.closest('.date-value');
            if (!dateEl) return;
            e.stopPropagation();
            const id = dateEl.dataset.projectId;
            if (this.onEditProject) this.onEditProject(id);
        });
    }

    showProjectModal(project = null) {
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('projectModalTitle');
        const nameInput = document.getElementById('projectNameInput');
        const dateInput = document.getElementById('projectDateInput');

        if (project) {
            title.textContent = 'Редактировать проект';
            nameInput.value = project.name || '';
            dateInput.value = project.data.weddingDate || '';
            this.container.dataset.editingProjectId = project.id;
        } else {
            title.textContent = 'Новая свадьба';
            nameInput.value = '';
            dateInput.value = '';
            delete this.container.dataset.editingProjectId;
        }
        modal.style.display = 'flex';
        nameInput.focus();
    }

    hideProjectModal() {
        document.getElementById('projectModal').style.display = 'none';
        delete this.container.dataset.editingProjectId;
    }
}