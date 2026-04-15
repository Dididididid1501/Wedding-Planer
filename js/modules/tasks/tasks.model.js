import { generateId } from '../../core/utils.js';

// Константы
export const MONTHS = ["октябрь", "ноябрь", "декабрь", "январь", "февраль", "март", "апрель", "май", "июнь"];
export const COLOR_PALETTE = [
    "#ffe0b2", "#d4e6b5", "#b3d9ff", "#f0c4e0", "#c4e0f0", "#e0c4f0", "#f0d4c4",
    "#ffccbc", "#c8e6c9", "#bbdefb", "#e1bee7", "#ffecb3", "#d7ccc8", "#cfd8dc",
    "#b2dfdb", "#f8bbd0", "#d1c4e9", "#ffcdd2", "#c5cae9", "#dcedc8"
];

export class TasksModel {
    constructor(state) {
        this.state = state;
    }

    // Задачи
    getAllTasks() {
        return this.state.tasks;
    }

    getTaskById(id) {
        return this.state.tasks.find(t => t.id === id);
    }

    addTask(taskData) {
        const newTask = {
            id: generateId(),
            title: taskData.title || 'Без названия',
            category: taskData.category || (this.state.categories[0]?.name || ''),
            responsible: taskData.responsible || 'Невеста',
            startMonth: taskData.startMonth || MONTHS[0],
            deadlineMonth: taskData.deadlineMonth || MONTHS[0],
            status: taskData.status || 'planned',
            comment: taskData.comment || '',
            completedMonths: []
        };
        this.state.tasks.push(newTask);
        return newTask;
    }

    updateTask(id, updates) {
        const task = this.getTaskById(id);
        if (!task) return null;
        Object.assign(task, updates);
        // Автокоррекция статуса по completedMonths
        this.autoCorrectStatus(task);
        return task;
    }

    deleteTask(id) {
        const index = this.state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.state.tasks.splice(index, 1);
            return true;
        }
        return false;
    }

    // Автоматическая установка статуса на основе отмеченных месяцев
    autoCorrectStatus(task) {
        const totalMonths = this.getTotalMonthsCount(task);
        const completed = task.completedMonths.length;
        if (completed === 0) {
            task.status = 'planned';
        } else if (completed === totalMonths) {
            task.status = 'done';
        } else {
            task.status = 'progress';
        }
    }

    getTotalMonthsCount(task) {
        const startIdx = MONTHS.indexOf(task.startMonth);
        const endIdx = MONTHS.indexOf(task.deadlineMonth);
        return Math.max(1, endIdx - startIdx + 1);
    }

    // Переключить отметку месяца
    toggleMonth(taskId, month) {
        const task = this.getTaskById(taskId);
        if (!task) return;
        if (task.completedMonths.includes(month)) {
            task.completedMonths = task.completedMonths.filter(m => m !== month);
        } else {
            task.completedMonths.push(month);
        }
        this.autoCorrectStatus(task);
    }

    // Фильтрация задач
    filterTasks(filterCategory = 'all', filterMonth = 'all', filterStatus = 'all') {
        return this.state.tasks.filter(t => {
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (filterMonth !== 'all' && t.startMonth !== filterMonth && t.deadlineMonth !== filterMonth && !t.completedMonths.includes(filterMonth)) return false;
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            return true;
        });
    }

    // Прогресс
    calculateProgress() {
        let totalWeight = 0, completedWeight = 0;
        this.state.tasks.forEach(t => {
            const monthsCount = this.getTotalMonthsCount(t);
            totalWeight += monthsCount;
            if (t.status === 'done') {
                completedWeight += monthsCount;
            } else {
                completedWeight += t.completedMonths.length;
            }
        });
        const percent = totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);
        const doneWeight = this.state.tasks.filter(t => t.status === 'done')
            .reduce((s, t) => s + this.getTotalMonthsCount(t), 0);
        const partialWeight = this.state.tasks.filter(t => t.status !== 'done')
            .reduce((s, t) => s + t.completedMonths.length, 0);
        const plannedWeight = totalWeight - doneWeight - partialWeight;
        return { totalWeight, completedWeight, doneWeight, partialWeight, plannedWeight, percent };
    }

    // Категории
    getAllCategories() {
        return this.state.categories;
    }

    addCategory(name, color = null) {
        name = name.trim();
        if (!name) throw new Error('Название категории не может быть пустым');
        if (this.state.categories.some(c => c.name === name)) throw new Error('Категория уже существует');
        const newCat = {
            name,
            color: color || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
        };
        this.state.categories.push(newCat);
        return newCat;
    }

    updateCategory(name, updates) {
        const cat = this.state.categories.find(c => c.name === name);
        if (!cat) return null;
        Object.assign(cat, updates);
        return cat;
    }

    deleteCategory(name) {
        if (this.state.tasks.some(t => t.category === name)) {
            throw new Error('Категория используется в задачах');
        }
        const index = this.state.categories.findIndex(c => c.name === name);
        if (index !== -1) {
            this.state.categories.splice(index, 1);
            return true;
        }
        return false;
    }
}