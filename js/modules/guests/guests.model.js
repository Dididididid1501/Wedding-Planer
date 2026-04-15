import { generateId, parseNumber, deepClone } from '../../core/utils.js';

export class GuestsModel {
    constructor(state) {
        this.state = state;
    }

    // Получить всех гостей
    getAll() {
        return this.state.guests;
    }

    // Найти гостя по ID
    getById(id) {
        return this.state.guests.find(g => g.id === id);
    }

    // Добавить гостя (может быть несколько, если с собой приводит)
    addGuest(guestData, broughtPersons = []) {
        const mainGuest = {
            id: generateId(),
            name: guestData.name || 'Без имени',
            invited: guestData.invited !== undefined ? guestData.invited : true,
            zags: guestData.zags || false,
            relation: guestData.relation || 'Другое',
            table: guestData.table || '',
            email: guestData.email || '',
            address: guestData.address || '',
            accommodation: guestData.accommodation || false,
            transport: guestData.transport || 'Не нужен',
            meal: guestData.meal || 'Стандартное',
            dish: guestData.dish || 'Мясо',
            champagne: guestData.champagne || false,
            redWine: guestData.redWine || false,
            whiteWine: guestData.whiteWine || false,
            spirit: guestData.spirit || 'Нет',
            noAlcohol: guestData.noAlcohol || false,
            notes: guestData.notes || '',
            conflictGroup: guestData.conflictGroup || '',
            broughtBy: null
        };
        this.state.guests.push(mainGuest);

        // Добавляем приведённых гостей
        broughtPersons.forEach(p => {
            const broughtGuest = {
                ...deepClone(mainGuest),
                id: generateId(),
                name: p.name || (p.type === 'male' ? 'Мужчина' : p.type === 'female' ? 'Женщина' : 'Ребёнок'),
                invited: true,
                table: (p.type === 'child' && p.childSeparate) ? 'Детский' : mainGuest.table,
                broughtBy: mainGuest.name
            };
            this.state.guests.push(broughtGuest);
        });

        return mainGuest;
    }

    // Обновить гостя
    updateGuest(id, updates) {
        const guest = this.getById(id);
        if (!guest) return null;
        Object.assign(guest, updates);
        return guest;
    }

    // Удалить гостя
    deleteGuest(id) {
        const index = this.state.guests.findIndex(g => g.id === id);
        if (index !== -1) {
            this.state.guests.splice(index, 1);
            return true;
        }
        return false;
    }

    // Получить отфильтрованных гостей
    filterGuests(filterName = '', filterRelation = 'all') {
        return this.state.guests.filter(g => {
            const nameMatch = !filterName || g.name.toLowerCase().includes(filterName.toLowerCase());
            const relationMatch = filterRelation === 'all' || g.relation === filterRelation;
            return nameMatch && relationMatch;
        });
    }

    // Статистика по гостям
    getStats() {
        const total = this.state.guests.length;
        const invited = this.state.guests.filter(g => g.invited).length;
        const relations = {
            'Семья жениха': 0,
            'Семья невесты': 0,
            'Другое': 0
        };
        let champagne = 0, redWine = 0, whiteWine = 0, spirit = 0, noAlcohol = 0;
        this.state.guests.forEach(g => {
            if (relations.hasOwnProperty(g.relation)) relations[g.relation]++;
            if (g.champagne) champagne++;
            if (g.redWine) redWine++;
            if (g.whiteWine) whiteWine++;
            if (g.spirit !== 'Нет') spirit++;
            if (g.noAlcohol) noAlcohol++;
        });
        return {
            total,
            invited,
            relations,
            alcohol: { champagne, redWine, whiteWine, spirit, noAlcohol }
        };
    }
}