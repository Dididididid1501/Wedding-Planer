// js/modules/tasks/tasks.controller.js
import { TasksModel, MONTHS, COLOR_PALETTE } from './tasks.model.js';
import { TasksView } from './tasks.view.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { DEMO_TEMPLATES } from './templates.js';
import { generateId } from '../../core/utils.js';
import { stateManager } from '../../core/storage.js';

export class TasksController {
    constructor(container) {
        // Больше не храним локальный state, всё через stateManager
        this.container = container;
        this.view = new TasksView(container);
        this.model = null; // будет создаваться при каждом refresh
        this.currentEditId = null;
        this.filter = { category: 'all', month: 'all', status: 'all' };

        // Подписка на события
        eventBus.on(EVENTS.PROJECT_SWITCHED, () => this.refresh());
        eventBus.on(EVENTS.STATE_CHANGED, () => this.refresh());

        this.view.onShowTemplates = () => this.showTemplates();
        this.view.onApplyTemplate = (templateId, weddingDate) => this.applyTemplate(templateId, weddingDate);

        this.refresh();
        this.attachGlobalEvents();
    }

    // Получить актуальные данные проекта
    getProjectData() {
        const project = stateManager.getActiveProject();
        return project ? project.data : { tasks: [], categories: [] };
    }

    refresh() {
        const projectData = this.getProjectData();
        // Создаём model на основе актуальных данных
        const stateForModel = {
            tasks: projectData.tasks || [],
            categories: projectData.categories || []
        };
        this.model = new TasksModel(stateForModel);

        const tasks = this.model.filterTasks(this.filter.category, this.filter.month, this.filter.status);
        const categories = this.model.getAllCategories();
        const progress = this.model.calculateProgress();
        const weddingDate = projectData.weddingDate || '';
        this.view.render(tasks, categories, progress, this.filter, weddingDate);
        this.view.updateSummary(tasks.length, progress.percent);
        this.attachUIEvents();
    }

    // Сохранить изменения в проекте
    saveProjectData(updates) {
        const project = stateManager.getActiveProject();
        if (project) {
            Object.assign(project.data, updates);
            stateManager.updateActiveProject(updates);
            eventBus.emit(EVENTS.STATE_CHANGED);
        }
    }

    attachUIEvents() {
        // Добавление категории
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            const name = document.getElementById('newCategoryName')?.value.trim();
            if (name) {
                try {
                    this.model.addCategory(name);
                    this.saveProjectData({ categories: this.model.getAllCategories() });
                    this.refresh();
                    document.getElementById('newCategoryName').value = '';
                } catch (e) { alert(e.message); }
            }
        });

        // Управление категориями
        document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => {
            this.view.renderManageCategoriesModal(this.model.getAllCategories());
            const modal = document.getElementById('manageCategoriesModal');
            modal.style.display = 'flex';

            modal.querySelectorAll('.color-option').forEach(opt => opt.addEventListener('click', e => {
                const parent = e.target.closest('[style*="margin-bottom"]');
                const badge = parent.querySelector('.category-badge');
                const catName = badge.textContent;
                const newColor = e.target.dataset.color;
                this.model.updateCategory(catName, { color: newColor });
                this.saveProjectData({ categories: this.model.getAllCategories() });
                this.view.renderManageCategoriesModal(this.model.getAllCategories());
                this.refresh();
            }));
            modal.querySelectorAll('.delete-category-btn').forEach(btn => btn.addEventListener('click', () => {
                const catName = btn.dataset.category;
                try {
                    this.model.deleteCategory(catName);
                    this.saveProjectData({ categories: this.model.getAllCategories() });
                    this.view.renderManageCategoriesModal(this.model.getAllCategories());
                    this.refresh();
                } catch (e) { alert(e.message); }
            }));
        });

        document.getElementById('closeCategoriesModalBtn')?.addEventListener('click', () => {
            document.getElementById('manageCategoriesModal').style.display = 'none';
        });
        document.getElementById('closeCategoriesBtn')?.addEventListener('click', () => {
            document.getElementById('manageCategoriesModal').style.display = 'none';
        });

        // Добавление задачи
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            const data = this.view.getAddTaskFormData();
            if (!data.title) { alert('Введите название задачи'); return; }
            this.model.addTask(data);
            this.saveProjectData({ tasks: this.model.getAllTasks() });
            this.refresh();
        });

        // Фильтры
        document.getElementById('filterCategory')?.addEventListener('change', e => { this.filter.category = e.target.value; this.refresh(); });
        document.getElementById('filterMonth')?.addEventListener('change', e => { this.filter.month = e.target.value; this.refresh(); });
        document.getElementById('filterStatus')?.addEventListener('change', e => { this.filter.status = e.target.value; this.refresh(); });
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.filter = { category: 'all', month: 'all', status: 'all' };
            this.refresh();
        });

        // Делегирование событий таблицы
        const tbody = document.getElementById('tasksTbody');
        if (tbody) {
            tbody.addEventListener('click', e => {
                const target = e.target;
                if (target.classList.contains('month-progress-check')) {
                    const taskId = target.dataset.taskId;
                    const month = target.value;
                    this.model.toggleMonth(taskId, month);
                    this.saveProjectData({ tasks: this.model.getAllTasks() });
                    this.refresh();
                }
                const editBtn = e.target.closest('.edit-task');
                if (editBtn) this.openEditModal(editBtn.dataset.id);
                const delBtn = e.target.closest('.delete-task');
                if (delBtn) {
                    if (confirm('Удалить задачу?')) {
                        this.model.deleteTask(delBtn.dataset.id);
                        this.saveProjectData({ tasks: this.model.getAllTasks() });
                        this.refresh();
                    }
                }
            });
        }
    }

    attachGlobalEvents() {
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEditTask());
    }

    openEditModal(id) {
        const task = this.model.getTaskById(id);
        if (!task) return;
        this.currentEditId = id;
        this.view.renderEditTaskModal(task, this.model.getAllCategories());
        document.getElementById('editTaskModal').style.display = 'flex';
    }

    saveEditTask() {
        if (!this.currentEditId) return;
        const updates = this.view.getEditTaskFormData();
        this.model.updateTask(this.currentEditId, updates);
        this.saveProjectData({ tasks: this.model.getAllTasks() });
        this.closeEditModal();
        this.refresh();
    }

    closeEditModal() {
        document.getElementById('editTaskModal').style.display = 'none';
        this.currentEditId = null;
    }

    // Шаблоны
    showTemplates() {
        const weddingDate = this.getProjectData().weddingDate || '';
        this.view.showTemplatesModal(DEMO_TEMPLATES, weddingDate);
    }

    applyTemplate(templateId, weddingDate) {
        const template = DEMO_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        const projectData = this.getProjectData();
        projectData.weddingDate = weddingDate;

        const wedding = new Date(weddingDate);
        if (isNaN(wedding.getTime())) {
            alert('Некорректная дата свадьбы');
            return;
        }

        const existingTitles = new Set(this.model.getAllTasks().map(t => t.title.toLowerCase()));
        let addedCount = 0;

        template.tasks.forEach(tplTask => {
            if (existingTitles.has(tplTask.title.toLowerCase())) return;

            const deadlineDate = new Date(wedding);
            deadlineDate.setMonth(wedding.getMonth() + tplTask.deadlineOffset);
            const monthIndex = (deadlineDate.getMonth() + 9) % 12;
            const actualMonth = MONTHS[monthIndex];

            const startDate = new Date(deadlineDate);
            startDate.setMonth(deadlineDate.getMonth() - 1);
            const startMonth = MONTHS[(startDate.getMonth() + 9) % 12];

            let category = this.model.getAllCategories().find(c => c.name === tplTask.category);
            if (!category) {
                category = { name: tplTask.category, color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] };
                this.model.getAllCategories().push(category);
            }

            this.model.addTask({
                title: tplTask.title,
                category: tplTask.category,
                responsible: tplTask.responsible,
                startMonth,
                deadlineMonth: actualMonth,
                status: 'planned',
                completedMonths: [],
                comment: ''
            });
            addedCount++;
        });

        if (addedCount > 0) {
            this.saveProjectData({
                tasks: this.model.getAllTasks(),
                categories: this.model.getAllCategories(),
                weddingDate
            });
            alert(`Добавлено ${addedCount} задач из шаблона "${template.name}"`);
        } else {
            alert('Все задачи из этого шаблона уже есть в вашем плане.');
        }
        this.refresh();
    }
}