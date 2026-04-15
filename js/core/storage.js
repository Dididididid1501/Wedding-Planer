// js/core/storage.js
import { generateId } from './utils.js';

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

    // Генерация демо-данных
    ensureDemoData() {
        // Категории (оставляем существующие)
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

        // Генерация 30 задач (если их нет)
        if (!this.state.tasks.length) {
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

            for (let i = 0; i < 30; i++) {
                const tpl = taskTemplates[i] || taskTemplates[i % taskTemplates.length];
                const startMonth = months[Math.floor(Math.random() * 5)]; // первые 5 месяцев
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

                this.state.tasks.push({
                    id: generateId(),
                    title: `${tpl.title} ${i+1}`,
                    category: tpl.category,
                    responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
                    startMonth,
                    deadlineMonth,
                    status,
                    completedMonths,
                    comment: ['Срочно', 'Уточнить детали', 'Важно', ''][Math.floor(Math.random() * 4)]
                });
            }
        }

        // Генерация 20 расходов
        if (!this.state.expenses.length) {
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

            for (let i = 0; i < 20; i++) {
                const tpl = expenseTemplates[i];
                const planned = Math.floor(Math.random() * (tpl.max - tpl.min) + tpl.min);
                const paid = Math.floor(planned * (Math.random() * 0.8));
                const payments = [];
                if (paid > 0) {
                    payments.push({ date: "2025-04-15", amount: paid, isPaid: true });
                }
                if (planned - paid > 0) {
                    payments.push({ date: "2025-05-20", amount: planned - paid, isPaid: false });
                }
                this.state.expenses.push({
                    id: generateId(),
                    category: tpl.category,
                    planned,
                    responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
                    notes: ['Оплата частями', 'Нужен договор', ''][Math.floor(Math.random() * 3)],
                    payments
                });
            }
        }

        // Генерация 30 гостей
        if (!this.state.guests.length) {
            const firstNames = ["Александр", "Мария", "Дмитрий", "Елена", "Сергей", "Анна", "Андрей", "Ольга", "Максим", "Наталья", "Иван", "Татьяна", "Роман", "Юлия", "Владимир", "Екатерина", "Павел", "Ирина", "Артем", "Дарья", "Никита", "Анастасия", "Игорь", "Светлана", "Антон", "Виктория", "Константин", "Марина", "Алексей", "Людмила"];
            const lastNames = ["Иванов", "Петрова", "Смирнов", "Кузнецова", "Васильев", "Новикова", "Федоров", "Морозова", "Егоров", "Степанова", "Орлов", "Зайцева", "Соловьев", "Волкова", "Зайцев", "Лебедева", "Козлов", "Белова", "Титов", "Соколова"];
            const relations = ["Семья жениха", "Семья невесты", "Другое"];
            const meals = ["Стандартное", "Веганское", "Детское", "Безглютеновое"];
            const dishes = ["Мясо", "Курица", "Рыба", "Овощи", "Фрукты"];
            const transport = ["Не нужен", "Нужен туда", "Нужен обратно", "Туда-обратно"];
            const spirits = ["Нет", "Водка", "Коньяк", "Виски"];

            for (let i = 0; i < 30; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const relation = relations[Math.floor(Math.random() * relations.length)];
                const table = String(Math.floor(Math.random() * 8) + 1); // столы 1-8
                const invited = Math.random() > 0.1;
                const zags = Math.random() > 0.3;
                const accommodation = Math.random() > 0.7;
                const champagne = Math.random() > 0.4;
                const redWine = Math.random() > 0.5;
                const whiteWine = Math.random() > 0.5;
                const spirit = spirits[Math.floor(Math.random() * spirits.length)];
                const noAlcohol = Math.random() > 0.8;
                const broughtBy = i % 5 === 0 ? "Анна Смирнова" : null; // каждый 5-й "приведён"

                this.state.guests.push({
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
        }

        // Синхронизация столов с номерами из гостей
        this.ensureTablesFromGuests();
    }

    // Генерация столов на основе таблиц, указанных у гостей
    ensureTablesFromGuests() {
        const tableNumbers = new Set();
        this.state.guests.forEach(g => {
            if (g.table && g.table.trim()) tableNumbers.add(g.table.trim());
        });
        const existingMap = new Map(this.state.tables.map(t => [t.number, t]));
        this.state.tables = Array.from(tableNumbers).map(num => {
            const existing = existingMap.get(num);
            return existing || { id: generateId(), number: num, capacity: 10, defaultCapacity: 10 };
        });
        if (this.state.tables.length === 0) {
            this.state.tables.push({ id: generateId(), number: "1", capacity: 10, defaultCapacity: 10 });
        }
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