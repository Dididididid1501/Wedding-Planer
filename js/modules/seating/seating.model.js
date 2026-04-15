import { generateId } from '../../core/utils.js';

export class SeatingModel {
    constructor(state) {
        this.state = state;
    }

    // Получить все столы
    getAllTables() {
        return this.state.tables;
    }

    // Получить стол по ID
    getTableById(id) {
        return this.state.tables.find(t => t.id === id);
    }

    // Получить стол по номеру
    getTableByNumber(number) {
        return this.state.tables.find(t => t.number === number);
    }

    // Добавить новый стол
    addTable(number = null) {
        let tableNumber = number;
        if (!tableNumber) {
            const max = this.state.tables.reduce((max, t) => {
                const n = parseInt(t.number);
                return !isNaN(n) && n > max ? n : max;
            }, 0);
            tableNumber = String(max + 1);
        }
        const newTable = {
            id: generateId(),
            number: tableNumber,
            capacity: 10,
            defaultCapacity: 10
        };
        this.state.tables.push(newTable);
        return newTable;
    }

    // Обновить стол
    updateTable(id, updates) {
        const table = this.getTableById(id);
        if (!table) return null;
        Object.assign(table, updates);
        return table;
    }

    // Удалить стол
    deleteTable(id) {
        const table = this.getTableById(id);
        if (!table) return false;
        // Очистить гостей этого стола
        this.state.guests.forEach(g => {
            if (g.table === table.number) g.table = '';
        });
        const index = this.state.tables.findIndex(t => t.id === id);
        if (index !== -1) this.state.tables.splice(index, 1);
        return true;
    }

    // Получить гостей, распределённых по столам
    getGuestsByTable() {
        const byTable = {};
        this.state.tables.forEach(t => { byTable[t.number] = []; });
        this.state.guests.forEach(g => {
            const tableNum = g.table?.trim();
            if (tableNum) {
                if (!byTable[tableNum]) byTable[tableNum] = [];
                byTable[tableNum].push(g);
            }
        });
        return byTable;
    }

    // Получить нерассаженных гостей
    getUnseatedGuests() {
        return this.state.guests.filter(g => !g.table?.trim());
    }

    // Посадить гостя за стол
    seatGuest(guestId, tableNumber) {
        const guest = this.state.guests.find(g => g.id === guestId);
        if (!guest) return false;
        if (tableNumber === '__none__' || tableNumber === '') {
            guest.table = '';
        } else {
            // Убедимся, что стол существует
            let table = this.getTableByNumber(tableNumber);
            if (!table) {
                table = this.addTable(tableNumber);
            }
            guest.table = tableNumber;
        }
        return true;
    }

    // Очистить стол (убрать всех гостей)
    clearTable(tableNumber) {
        this.state.guests.forEach(g => {
            if (g.table === tableNumber) g.table = '';
        });
    }

    // Автоматическая рассадка (равномерно по столам)
    autoSeat() {
        const unseated = this.getUnseatedGuests();
        if (unseated.length === 0 || this.state.tables.length === 0) return false;
        let tableIdx = 0;
        unseated.forEach(guest => {
            const table = this.state.tables[tableIdx % this.state.tables.length];
            guest.table = table.number;
            tableIdx++;
        });
        return true;
    }

    // Проверить конфликты на столе
    hasConflict(tableNumber) {
        const guests = this.state.guests.filter(g => g.table === tableNumber);
        const groups = guests.map(g => g.conflictGroup).filter(cg => cg && cg.trim() !== '');
        return groups.some((cg, i, arr) => arr.indexOf(cg) !== i);
    }

    // Получить статистику рассадки
    getStats() {
        const totalTables = this.state.tables.length;
        const totalCapacity = this.state.tables.reduce((s, t) => s + t.capacity, 0);
        const seated = this.state.guests.filter(g => g.table?.trim()).length;
        const unseated = this.state.guests.length - seated;
        return { totalTables, totalCapacity, seated, unseated };
    }

    // Синхронизировать столы с номерами из гостей (вызывается при изменении гостей)
    syncTablesFromGuests() {
        const tableNumbers = new Set();
        this.state.guests.forEach(g => {
            if (g.table?.trim()) tableNumbers.add(g.table.trim());
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
}