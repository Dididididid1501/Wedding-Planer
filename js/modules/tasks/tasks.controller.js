import { TasksModel, MONTHS } from './tasks.model.js';
import { TasksView } from './tasks.view.js';
import { eventBus } from '../../core/events.js';

export class TasksController {
    constructor(state, container) {
        this.state = state;
        this.model = new TasksModel(state);
        this.view = new TasksView(container);
        this.currentEditId = null;
        this.filter = { category: 'all', month: 'all', status: 'all' };

        eventBus.on('stateChanged', () => this.refresh());

        this.refresh();
        this.attachGlobalEvents();
    }

    refresh() {
        const tasks = this.model.filterTasks(this.filter.category, this.filter.month, this.filter.status);
        const categories = this.model.getAllCategories();
        const progress = this.model.calculateProgress();
        this.view.render(tasks, categories, progress, this.filter);
        this.view.updateSummary(tasks.length, progress.percent);
        this.attachUIEvents();
    }

    attachUIEvents() {
        // Добавление категории
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            const name = document.getElementById('newCategoryName')?.value.trim();
            if (name) {
                try {
                    this.model.addCategory(name);
                    eventBus.emit('state:update', { categories: this.state.categories });
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

            // Обработчики внутри модалки
            modal.querySelectorAll('.color-option').forEach(opt => opt.addEventListener('click', e => {
                const parent = e.target.closest('[style*="margin-bottom"]');
                const badge = parent.querySelector('.category-badge');
                const catName = badge.textContent;
                const newColor = e.target.dataset.color;
                this.model.updateCategory(catName, { color: newColor });
                eventBus.emit('state:update', { categories: this.state.categories });
                this.view.renderManageCategoriesModal(this.model.getAllCategories());
                this.refresh();
            }));
            modal.querySelectorAll('.delete-category-btn').forEach(btn => btn.addEventListener('click', () => {
                const catName = btn.dataset.category;
                try {
                    this.model.deleteCategory(catName);
                    eventBus.emit('state:update', { categories: this.state.categories });
                    this.view.renderManageCategoriesModal(this.model.getAllCategories());
                    this.refresh();
                } catch (e) { alert(e.message); }
            }));
        });

        // Закрытие модалки категорий
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
            eventBus.emit('state:update', { tasks: this.state.tasks });
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
                    eventBus.emit('state:update', { tasks: this.state.tasks });
                    this.refresh();
                }
                const editBtn = e.target.closest('.edit-task');
                if (editBtn) {
                    this.openEditModal(editBtn.dataset.id);
                }
                const delBtn = e.target.closest('.delete-task');
                if (delBtn) {
                    if (confirm('Удалить задачу?')) {
                        this.model.deleteTask(delBtn.dataset.id);
                        eventBus.emit('state:update', { tasks: this.state.tasks });
                        this.refresh();
                    }
                }
            });
        }
    }

    attachGlobalEvents() {
        // Модалка редактирования задачи
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
        eventBus.emit('state:update', { tasks: this.state.tasks });
        this.closeEditModal();
        this.refresh();
    }

    closeEditModal() {
        document.getElementById('editTaskModal').style.display = 'none';
        this.currentEditId = null;
    }
}