// js/core/storage.js
import { generateId } from './utils.js';

class StateManager {
    constructor() {
        // Инициализируем состояние с проектами
        this.state = {
            projects: [],
            activeProjectId: null,
            // глобальные настройки сворачивания (будут дублироваться в каждом проекте)
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
    updateProject(id, updates) {
    const project = this.state.projects.find(p => p.id === id);
    if (!project) return;
    if (updates.name !== undefined) project.name = updates.name;
    if (updates.data) {
        Object.assign(project.data, updates.data);
        if (updates.data.guests) this.ensureTablesFromGuests(project);
    ы}
    this.saveToStorage();
    this.notify();
    }

    // Загрузка из localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('wedding_projects');
        if (saved) {
            try {
                const d = JSON.parse(saved);
                this.state.projects = d.projects || [];
                this.state.activeProjectId = d.activeProjectId || null;
                if (d.sectionsCollapsed) {
                    this.state.sectionsCollapsed = d.sectionsCollapsed;
                }
            } catch (e) {
                console.error('Ошибка загрузки проектов', e);
            }
        }

        // Миграция старых данных, если проектов нет, но есть старые ключи
        if (this.state.projects.length === 0) {
            this.migrateOldData();
        }

        // Если после миграции всё ещё нет проектов, создаём демо-проект
        if (this.state.projects.length === 0) {
            const newProject = this.createProject('Свадьба Марии и Дениса');
            this.state.activeProjectId = newProject.id;
            this.ensureDemoDataInProject(newProject.id);
        } else if (!this.state.activeProjectId && this.state.projects.length > 0) {
            // Если есть проекты, но активный не выбран – берём первый
            this.state.activeProjectId = this.state.projects[0].id;
        }

        this.saveToStorage();
    }

    migrateOldData() {
        const oldTasks = localStorage.getItem('wedding_tasks_ext_v2');
        const oldPlanner = localStorage.getItem('wedding_planner');

        if (!oldTasks && !oldPlanner) return;

        let tasks = [], categories = [], expenses = [], guests = [], tables = [];
        try {
            if (oldTasks) {
                const d = JSON.parse(oldTasks);
                tasks = d.tasks || [];
                categories = d.categories || [];
            }
            if (oldPlanner) {
                const d = JSON.parse(oldPlanner);
                expenses = d.expenses || [];
                guests = d.guests || [];
                tables = d.tables || [];
            }
        } catch (e) {
            console.error('Ошибка миграции старых данных', e);
        }

        // Создаём проект с этими данными
        const projectId = generateId();
        this.state.projects.push({
            id: projectId,
            name: 'Свадьба Марии и Дениса',
            data: {
                tasks,
                categories,
                expenses,
                guests,
                tables,
                weddingDate: null,
                sectionsCollapsed: { ...this.state.sectionsCollapsed }
            }
        });
        this.state.activeProjectId = projectId;

        // Удаляем старые ключи
        localStorage.removeItem('wedding_tasks_ext_v2');
        localStorage.removeItem('wedding_planner');
    }

    // Генерация демо-данных для указанного проекта
    ensureDemoDataInProject(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        if (!project) return;
        const data = project.data;

        // Категории
        if (!data.categories || data.categories.length === 0) {
            data.categories = [
                { name: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА", color: "#ffe0b2" },
                { name: "ДЕКОР и ФЛОРИСТИКА", color: "#d4e6b5" },
                { name: "СЦЕНАРИЙ", color: "#b3d9ff" },
                { name: "ОБРАЗ", color: "#f0c4e0" },
                { name: "ПОДРЯДЧИКИ", color: "#c4e0f0" },
                { name: "ПЛОЩАДКА", color: "#e0c4f0" },
                { name: "ТОРТ", color: "#f0d4c4" }
            ];
        }

        // Задачи
        if (!data.tasks || data.tasks.length === 0) {
            data.tasks = this.generateDemoTasks();
        }

        // Расходы
        if (!data.expenses || data.expenses.length === 0) {
            data.expenses = this.generateDemoExpenses();
        }

        // Гости
        if (!data.guests || data.guests.length === 0) {
            data.guests = this.generateDemoGuests();
        }

        // Столы
        if (!data.tables || data.tables.length === 0) {
            data.tables = [];
        }
        this.ensureTablesFromGuests(project);
    }

    generateDemoTasks() {
        const taskTemplates = [
            { title: "Составить бюджет", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Выбрать дату", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Составить список гостей", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Забронировать площадку", category: "ПЛОЩАДКА" },
            { title: "Выбрать фотографа", category: "ПОДРЯДЧИКИ" },
            { title: "Выбрать видеографа", category: "ПОДРЯДЧИКИ" },
            { title: "Заказать торт", category: "ТОРТ" },
            { title: "Купить платье невесты", category: "ОБРАЗ" },
            { title: "Купить костюм жениха", category: "ОБРАЗ" },
            { title: "Выбрать ведущего", category: "ПОДРЯДЧИКИ" },
            { title: "Составить сценарий вечера", category: "СЦЕНАРИЙ" },
            { title: "Заказать цветы", category: "ДЕКОР и ФЛОРИСТИКА" },
            { title: "Разработать дизайн приглашений", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Отправить приглашения", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Выбрать музыкальные треки", category: "СЦЕНАРИЙ" },
            { title: "Купить кольца", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Забронировать транспорт", category: "ПОДРЯДЧИКИ" },
            { title: "Выбрать декор зала", category: "ДЕКОР и ФЛОРИСТИКА" },
            { title: "Организовать рассадку гостей", category: "ПЛОЩАДКА" },
            { title: "Заказать макияж и прическу", category: "ОБРАЗ" },
            { title: "Составить меню", category: "ПЛОЩАДКА" },
            { title: "Выбрать свадебный торт", category: "ТОРТ" },
            { title: "Купить аксессуары для невесты", category: "ОБРАЗ" },
            { title: "Купить аксессуары для жениха", category: "ОБРАЗ" },
            { title: "Заказать фотосессию Love Story", category: "ПОДРЯДЧИКИ" },
            { title: "Спланировать медовый месяц", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Купить подарки гостям", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" },
            { title: "Согласовать тайминг с подрядчиками", category: "СЦЕНАРИЙ" },
            { title: "Провести репетицию церемонии", category: "СЦЕНАРИЙ" },
            { title: "Оплатить все счета", category: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА" }
        ];
        const months = ["октябрь", "ноябрь", "декабрь", "январь", "февраль", "март", "апрель", "май", "июнь"];
        const responsibles = ["Невеста", "Жених", "Семья", "Агентство", "Другое"];
        const tasks = [];

        for (let i = 0; i < 30; i++) {
            const tpl = taskTemplates[i % taskTemplates.length];
            const startMonth = months[Math.floor(Math.random() * 5)];
            const deadlineMonth = months[Math.min(months.indexOf(startMonth) + Math.floor(Math.random() * 3) + 1, months.length - 1)];
            const statusRand = Math.random();
            const status = statusRand < 0.3 ? 'done' : (statusRand < 0.6 ? 'progress' : 'planned');
            const completedMonths = [];
            if (status !== 'planned') {
                const startIdx = months.indexOf(startMonth);
                const endIdx = months.indexOf(deadlineMonth);
                const monthsRange = months.slice(startIdx, endIdx + 1);
                const count = status === 'done' ? monthsRange.length : Math.max(1, Math.floor(monthsRange.length * Math.random()));
                for (let j = 0; j < count; j++) completedMonths.push(monthsRange[j]);
            }

            tasks.push({
                id: generateId(),
                title: tpl.title,
                category: tpl.category,
                responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
                startMonth,
                deadlineMonth,
                status,
                completedMonths,
                comment: ['Срочно', 'Уточнить детали', 'Важно', ''][Math.floor(Math.random() * 4)]
            });
        }
        return tasks;
    }

    generateDemoExpenses() {
        const expenseTemplates = [
            { category: "Фотограф", min: 40000, max: 80000 },
            { category: "Видеограф", min: 50000, max: 100000 },
            { category: "Ведущий", min: 30000, max: 60000 },
            { category: "Декор зала", min: 40000, max: 120000 },
            { category: "Цветы", min: 20000, max: 50000 },
            { category: "Торт", min: 15000, max: 35000 },
            { category: "Кейтеринг (еда)", min: 80000, max: 200000 },
            { category: "Алкоголь", min: 30000, max: 80000 },
            { category: "Платье невесты", min: 50000, max: 150000 },
            { category: "Костюм жениха", min: 30000, max: 70000 },
            { category: "Обручальные кольца", min: 20000, max: 60000 },
            { category: "Аренда площадки", min: 50000, max: 150000 },
            { category: "Музыкальное сопровождение", min: 20000, max: 50000 },
            { category: "Приглашения", min: 5000, max: 15000 },
            { category: "Транспорт", min: 10000, max: 30000 },
            { category: "Макияж и прическа", min: 10000, max: 25000 },
            { category: "Аксессуары", min: 5000, max: 20000 },
            { category: "Подарки гостям", min: 10000, max: 30000 },
            { category: "Фотозона", min: 15000, max: 40000 },
            { category: "Свадебный распорядитель", min: 25000, max: 50000 }
        ];
        const responsibles = ["Невеста", "Жених", "Организатор"];
        const expenses = [];

        for (let i = 0; i < 20; i++) {
            const tpl = expenseTemplates[i];
            const planned = Math.floor(Math.random() * (tpl.max - tpl.min) + tpl.min);
            const paid = Math.floor(planned * (Math.random() * 0.8));
            const payments = [];
            if (paid > 0) payments.push({ date: "2025-04-15", amount: paid, isPaid: true });
            if (planned - paid > 0) payments.push({ date: "2025-05-20", amount: planned - paid, isPaid: false });
            expenses.push({
                id: generateId(),
                category: tpl.category,
                planned,
                responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
                notes: ['Оплата частями', 'Нужен договор', ''][Math.floor(Math.random() * 3)],
                payments
            });
        }
        return expenses;
    }

    generateDemoGuests() {
        const firstNames = ["Александр", "Мария", "Дмитрий", "Елена", "Сергей", "Анна", "Андрей", "Ольга", "Максим", "Наталья", "Иван", "Татьяна", "Роман", "Юлия", "Владимир", "Екатерина", "Павел", "Ирина", "Артем", "Дарья", "Никита", "Анастасия", "Игорь", "Светлана", "Антон", "Виктория", "Константин", "Марина", "Алексей", "Людмила"];
        const lastNames = ["Иванов", "Петрова", "Смирнов", "Кузнецова", "Васильев", "Новикова", "Федоров", "Морозова", "Егоров", "Степанова", "Орлов", "Зайцева", "Соловьев", "Волкова", "Зайцев", "Лебедева", "Козлов", "Белова", "Титов", "Соколова"];
        const relations = ["Семья жениха", "Семья невесты", "Другое"];
        const meals = ["Стандартное", "Веганское", "Детское", "Безглютеновое"];
        const dishes = ["Мясо", "Курица", "Рыба", "Овощи", "Фрукты"];
        const transport = ["Не нужен", "Нужен туда", "Нужен обратно", "Туда-обратно"];
        const spirits = ["Нет", "Водка", "Коньяк", "Виски"];
        const guests = [];

        for (let i = 0; i < 30; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const relation = relations[Math.floor(Math.random() * relations.length)];
            const table = String(Math.floor(Math.random() * 8) + 1);
            const invited = Math.random() > 0.1;
            const zags = Math.random() > 0.3;
            const accommodation = Math.random() > 0.7;
            const champagne = Math.random() > 0.4;
            const redWine = Math.random() > 0.5;
            const whiteWine = Math.random() > 0.5;
            const spirit = spirits[Math.floor(Math.random() * spirits.length)];
            const noAlcohol = Math.random() > 0.8;
            const broughtBy = i % 5 === 0 ? "Анна Смирнова" : null;

            guests.push({
                id: generateId(),
                name: `${firstName} ${lastName}`,
                invited,
                zags,
                relation,
                table,
                email: Math.random() > 0.5 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com` : '',
                address: Math.random() > 0.6 ? `ул. Ленина, ${Math.floor(Math.random()*100)+1}` : '',
                accommodation,
                transport: transport[Math.floor(Math.random() * transport.length)],
                meal: meals[Math.floor(Math.random() * meals.length)],
                dish: dishes[Math.floor(Math.random() * dishes.length)],
                champagne,
                redWine,
                whiteWine,
                spirit,
                noAlcohol,
                notes: ['', 'Аллергия на орехи', 'Вегетарианец', 'Не пьёт'][Math.floor(Math.random() * 4)],
                conflictGroup: Math.random() > 0.7 ? `группа ${Math.floor(Math.random()*3)+1}` : '',
                broughtBy
            });
        }
        return guests;
    }

    ensureTablesFromGuests(project) {
        const data = project.data;
        const tableNumbers = new Set();
        data.guests.forEach(g => { if (g.table && g.table.trim()) tableNumbers.add(g.table.trim()); });
        const existingMap = new Map(data.tables.map(t => [t.number, t]));
        data.tables = Array.from(tableNumbers).map(num => {
            const existing = existingMap.get(num);
            return existing || { id: generateId(), number: num, capacity: 10, defaultCapacity: 10 };
        });
        if (data.tables.length === 0) {
            data.tables.push({ id: generateId(), number: "1", capacity: 10, defaultCapacity: 10 });
        }
    }

    // ========== МЕТОДЫ УПРАВЛЕНИЯ ПРОЕКТАМИ ==========
    getActiveProject() {
        if (!this.state.activeProjectId) return null;
        return this.state.projects.find(p => p.id === this.state.activeProjectId) || null;
    }

    setActiveProject(id) {
        const project = this.state.projects.find(p => p.id === id);
        if (project) {
            this.state.activeProjectId = id;
            this.saveToStorage();
            this.notify();
        }
    }

    createProject(name) {
        const newProject = {
            id: generateId(),
            name: name || 'Новая свадьба',
            data: {
                tasks: [],
                categories: [
                    { name: "ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА", color: "#ffe0b2" },
                    { name: "ДЕКОР и ФЛОРИСТИКА", color: "#d4e6b5" },
                    { name: "СЦЕНАРИЙ", color: "#b3d9ff" },
                    { name: "ОБРАЗ", color: "#f0c4e0" },
                    { name: "ПОДРЯДЧИКИ", color: "#c4e0f0" },
                    { name: "ПЛОЩАДКА", color: "#e0c4f0" },
                    { name: "ТОРТ", color: "#f0d4c4" }
                ],
                expenses: [],
                guests: [],
                tables: [],
                weddingDate: null,
                sectionsCollapsed: { ...this.state.sectionsCollapsed }
            }
        };
        this.state.projects.push(newProject);
        this.saveToStorage();
        return newProject;
    }

    deleteProject(id) {
        const index = this.state.projects.findIndex(p => p.id === id);
        if (index === -1) return false;
        this.state.projects.splice(index, 1);
        if (this.state.activeProjectId === id) {
            this.state.activeProjectId = this.state.projects.length > 0 ? this.state.projects[0].id : null;
        }
        this.saveToStorage();
        this.notify();
        return true;
    }

    updateActiveProject(updates) {
        const project = this.getActiveProject();
        if (!project) return;
        Object.assign(project.data, updates);
        if (updates.guests) {
            this.ensureTablesFromGuests(project);
        }
        this.saveToStorage();
        this.notify();
    }

    // ========== ОБЩИЕ МЕТОДЫ ==========
    saveToStorage() {
        localStorage.setItem('wedding_projects', JSON.stringify({
            projects: this.state.projects,
            activeProjectId: this.state.activeProjectId,
            sectionsCollapsed: this.state.sectionsCollapsed
        }));
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    setState(updates) {
        Object.assign(this.state, updates);
        this.saveToStorage();
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    notify() {
        const stateCopy = this.getState();
        this.listeners.forEach(fn => fn(stateCopy));
    }
}

export const stateManager = new StateManager();