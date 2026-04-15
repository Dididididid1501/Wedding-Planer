// Предустановленные шаблоны задач
export const DEMO_TEMPLATES = [
    {
        id: 'standard',
        name: 'Стандартный план',
        icon: '🥂',
        description: 'Классический план на 6-8 месяцев. Для пар, которые хотят всё успеть без спешки.',
        tasks: [
            { title: 'Составить бюджет', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -8 },
            { title: 'Выбрать дату', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -7 },
            { title: 'Составить список гостей', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -7 },
            { title: 'Забронировать площадку', category: 'ПЛОЩАДКА', responsible: 'Агентство', deadlineOffset: -6 },
            { title: 'Выбрать фотографа', category: 'ПОДРЯДЧИКИ', responsible: 'Невеста', deadlineOffset: -5 },
            { title: 'Купить платье невесты', category: 'ОБРАЗ', responsible: 'Невеста', deadlineOffset: -4 },
            { title: 'Заказать торт', category: 'ТОРТ', responsible: 'Невеста', deadlineOffset: -3 },
            { title: 'Составить сценарий вечера', category: 'СЦЕНАРИЙ', responsible: 'Агентство', deadlineOffset: -2 },
            { title: 'Отправить приглашения', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -2 },
            { title: 'Оплатить все счета', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Жених', deadlineOffset: -0.5 }
        ]
    },
    {
        id: 'express',
        name: 'Экспресс-свадьба',
        icon: '⚡',
        description: 'Всё самое важное за 2-3 месяца. Для тех, кто решил пожениться здесь и сейчас.',
        tasks: [
            { title: 'Составить бюджет', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -3 },
            { title: 'Выбрать дату и площадку', category: 'ПЛОЩАДКА', responsible: 'Невеста', deadlineOffset: -2.5 },
            { title: 'Составить список гостей', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -2 },
            { title: 'Выбрать фотографа', category: 'ПОДРЯДЧИКИ', responsible: 'Невеста', deadlineOffset: -2 },
            { title: 'Купить платье и костюм', category: 'ОБРАЗ', responsible: 'Невеста', deadlineOffset: -1.5 },
            { title: 'Заказать торт', category: 'ТОРТ', responsible: 'Невеста', deadlineOffset: -1 },
            { title: 'Отправить приглашения', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Невеста', deadlineOffset: -1 },
            { title: 'Оплатить все счета', category: 'ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА', responsible: 'Жених', deadlineOffset: -0.5 }
        ]
    }
];

// Список месяцев (должен совпадать с tasks.model.js)
export const MONTHS = ["октябрь", "ноябрь", "декабрь", "январь", "февраль", "март", "апрель", "май", "июнь"];