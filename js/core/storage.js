// Хранилище состояния приложения (StateManager)
class StateManager {
    constructor() {
        // Начальное состояние
        this.state = {
            tasks: [],
            categories: [],
            expenses: [],
            guests: [],
            tables: [],
            sectionsCollapsed: {
                tasks: false,
                expenses: true,
                guests: true,
                seating: true
            }
        };
        this.listeners = [];
        this.loadFromStorage();
    }

    // Загрузка данных из localStorage
    loadFromStorage() {
        // Загружаем задачи и категории
        const savedTasks = localStorage.getItem('wedding_tasks_ext_v2');
        if (savedTasks) {
            try {
                const d = JSON.parse(savedTasks);
                this.state.tasks = d.tasks || [];
                this.state.categories = d.categories || [];
                if (d.sectionsCollapsed) {
                    Object.assign(this.state.sectionsCollapsed, d.sectionsCollapsed);
                }
            } catch (e) {
                console.error('Ошибка загрузки задач из localStorage', e);
            }
        }

        // Загружаем бюджет, гостей, столы
        const savedOther = localStorage.getItem('wedding_planner');
        if (savedOther) {
            try {
                const d = JSON.parse(savedOther);
                this.state.expenses = d.expenses || [];
                this.state.guests = d.guests || [];
                this.state.tables = d.tables || [];
                if (d.sectionsCollapsed) {
                    Object.assign(this.state.sectionsCollapsed, d.sectionsCollapsed);
                }
            } catch (e) {
                console.error('Ошибка загрузки остальных данных из localStorage', e);
            }
        }

        // Инициализация демо-данными при первом запуске
        this.ensureDemoData();
    }

    ensureDemoData() {
        // Демо-категории задач (если нет)
        if (!this.state.categories.length) {
            this.state.categories = [
                { name: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА", color: "#ffe0b2" },
                { name: "ДЕКОР и ФЛОРИСТИКА", color: "#d4e6b5" },
                { name: "СЦЕНАРИЙ", color: "#b3d9ff" },
                { name: "ОБРАЗ", color: "#f0c4e0" },
                { name: "ПОДРЯДЧИКИ", color: "#c4e0f0" },
                { name: "ПЛОЩАДКА", color: "#e0c4f0" },
                { name: "ТОРТ", color: "#f0d4c4" }
            ];
        }

        // Демо-задачи
        if (!this.state.tasks.length) {
            this.state.tasks = [
                { id: this.generateId(), category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА", title: "Составление бюджета свадьбы", responsible: "Агентство", startMonth: "октябрь", deadlineMonth: "ноябрь", status: "progress", completedMonths: ["октябрь"], comment: "Уточнить у заказчиков предельную сумму" },
                { id: this.generateId(), category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА", title: "Инспекция площадки", responsible: "Агентство", startMonth: "октябрь", deadlineMonth: "октябрь", status: "done", completedMonths: ["октябрь"], comment: "Встреча с управляющим 15.10" },
                { id: this.generateId(), category: "ДЕКОР и ФЛОРИСТИКА", title: "Составление ТЗ для декораторов", responsible: "Агентство", startMonth: "ноябрь", deadlineMonth: "декабрь", status: "progress", completedMonths: ["ноябрь"], comment: "Собрать референсы" }
            ];
        }

        // Демо-расходы
        if (!this.state.expenses.length) {
            this.state.expenses = [
                { id: this.generateId(), category: "Фотограф", planned: 50000, responsible: "Невеста", notes: "", payments: [{ date: "2025-04-15", amount: 20000, isPaid: true }, { date: "2025-05-01", amount: 20000, isPaid: false }] },
                { id: this.generateId(), category: "Видеограф", planned: 70000, responsible: "Жених", notes: "", payments: [{ date: "2025-04-10", amount: 30000, isPaid: true }] }
            ];
        }

        // Демо-гости
        if (!this.state.guests.length) {
            this.state.guests = [
                { id: this.generateId(), name: "Анна Смирнова", invited: true, zags: true, relation: "Семья невесты", table: "1", email: "", address: "", accommodation: false, transport: "Не нужен", meal: "Стандартное", dish: "Мясо", champagne: true, redWine: false, whiteWine: true, spirit: "Нет", noAlcohol: false, notes: "", conflictGroup: "", broughtBy: null },
                { id: this.generateId(), name: "Иван Петров", invited: true, zags: true, relation: "Семья жениха", table: "1", email: "", address: "", accommodation: false, transport: "Не нужен", meal: "Стандартное", dish: "Курица", champagne: false, redWine: true, whiteWine: false, spirit: "Виски", noAlcohol: false, notes: "", conflictGroup: "", broughtBy: null },
                { id: this.generateId(), name: "Елена Козлова", invited: true, zags: false, relation: "Другое", table: "2", email: "elena@mail.ru", address: "ул. Ленина, 5", accommodation: true, transport: "Нужен туда", meal: "Веганское", dish: "Овощи", champagne: false, redWine: false, whiteWine: false, spirit: "Нет", noAlcohol: true, notes: "Аллергия на орехи", conflictGroup: "", broughtBy: null }
            ];
        }

        // Демо-столы (генерируются из гостей автоматически, но если гостей нет — создадим)
        this.ensureTablesFromGuests();
    }

    ensureTablesFromGuests() {
        const tableNumbers = new Set();
        this.state.guests.forEach(g => { if (g.table && g.table.trim()) tableNumbers.add(g.table.trim()); });
        // Сохраняем существующие настройки столов
        const existingMap = new Map(this.state.tables.map(t => [t.number, t]));
        this.state.tables = Array.from(tableNumbers).map(num => {
            const existing = existingMap.get(num);
            return existing || { id: this.generateId(), number: num, capacity: 10, defaultCapacity: 10 };
        });
        if (this.state.tables.length === 0) {
            this.state.tables.push({ id: this.generateId(), number: "1", capacity: 10, defaultCapacity: 10 });
        }
    }

    generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }

    // Сохранение всего состояния в localStorage
    saveToStorage() {
        // Задачи и категории
        localStorage.setItem('wedding_tasks_ext_v2', JSON.stringify({
            tasks: this.state.tasks,
            categories: this.state.categories,
            sectionsCollapsed: this.state.sectionsCollapsed
        }));
        // Остальное
        localStorage.setItem('wedding_planner', JSON.stringify({
            expenses: this.state.expenses,
            guests: this.state.guests,
            tables: this.state.tables,
            sectionsCollapsed: this.state.sectionsCollapsed
        }));
    }

    // Получить текущее состояние (копию для безопасности)
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // Обновить состояние частично и сохранить
    setState(updates) {
        Object.assign(this.state, updates);
        // Если обновились гости, нужно перегенерировать столы
        if (updates.guests) {
            this.ensureTablesFromGuests();
        }
        this.saveToStorage();
        this.notify();
    }

    // Подписка на изменения
    subscribe(listener) {
        this.listeners.push(listener);
    }

    // Отписка
    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    // Уведомление подписчиков
    notify() {
        const stateCopy = this.getState();
        this.listeners.forEach(fn => fn(stateCopy));
    }
}

// Экспортируем синглтон
export const stateManager = new StateManager();