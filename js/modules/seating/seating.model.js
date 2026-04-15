import { generateId } from '../../core/utils.js';

export class SeatingModel {
    constructor(state) {
        this.state = state;
    }

    getAllTables() {
        return this.state.tables;
    }

    getTableById(id) {
        return this.state.tables.find(t => t.id === id);
    }

    getTableByNumber(number) {
        return this.state.tables.find(t => t.number === number);
    }

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

    updateTable(id, updates) {
        const table = this.getTableById(id);
        if (!table) return null;
        Object.assign(table, updates);
        return table;
    }

    deleteTable(id) {
        const table = this.getTableById(id);
        if (!table) return false;
        this.state.guests.forEach(g => { if (g.table === table.number) g.table = ''; });
        const index = this.state.tables.findIndex(t => t.id === id);
        if (index !== -1) this.state.tables.splice(index, 1);
        return true;
    }

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

    getUnseatedGuests() {
        return this.state.guests.filter(g => !g.table?.trim());
    }

    seatGuest(guestId, tableNumber) {
        const guest = this.state.guests.find(g => g.id === guestId);
        if (!guest) return false;
        if (tableNumber === '__none__' || tableNumber === '') {
            guest.table = '';
        } else {
            let table = this.getTableByNumber(tableNumber);
            if (!table) table = this.addTable(tableNumber);
            guest.table = tableNumber;
        }
        return true;
    }

    clearTable(tableNumber) {
        this.state.guests.forEach(g => { if (g.table === tableNumber) g.table = ''; });
    }

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

    hasConflict(tableNumber) {
        const guests = this.state.guests.filter(g => g.table === tableNumber);
        const groups = guests.map(g => g.conflictGroup).filter(cg => cg && cg.trim() !== '');
        return groups.some((cg, i, arr) => arr.indexOf(cg) !== i);
    }

    getStats() {
        const totalTables = this.state.tables.length;
        const totalCapacity = this.state.tables.reduce((s, t) => s + t.capacity, 0);
        const seated = this.state.guests.filter(g => g.table?.trim()).length;
        const unseated = this.state.guests.length - seated;
        return { totalTables, totalCapacity, seated, unseated };
    }

    syncTablesFromGuests() {
        const tableNumbers = new Set();
        this.state.guests.forEach(g => { if (g.table?.trim()) tableNumbers.add(g.table.trim()); });
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