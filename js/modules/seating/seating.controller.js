import { SeatingModel } from './seating.model.js';
import { SeatingView } from './seating.view.js';
import { eventBus } from '../../core/events.js';

export class SeatingController {
    constructor(state, container) {
        this.state = state;
        this.model = new SeatingModel(state);
        this.view = new SeatingView(container);
        this.currentTableSettingsId = null;
        this.currentChangeGuestId = null;

        eventBus.on('stateChanged', () => this.refresh());
        eventBus.on('guests:updated', () => {
            this.model.syncTablesFromGuests();
            this.refresh();
        });

        // Привязка обработчиков View
        this.view.onAddTable = () => this.addTable();
        this.view.onAutoSeat = () => this.autoSeat();
        this.view.onTableCapacityChange = (id, value) => this.updateTableCapacity(id, value);
        this.view.onClearTable = (tableNum) => this.clearTable(tableNum);
        this.view.onTableSettings = (tableId) => this.openTableSettings(tableId);
        this.view.setChangeTableClickHandler((guestId) => this.openChangeTableModal(guestId));
        this.view.onChangeTable = (guestId, tableNumber) => this.changeGuestTable(guestId, tableNumber);

        this.refresh();
    }

    refresh() {
        this.model.syncTablesFromGuests(); // Убедимся, что столы актуальны
        const tables = this.model.getAllTables();
        const guestsByTable = this.model.getGuestsByTable();
        const unseated = this.model.getUnseatedGuests().length;
        const stats = this.model.getStats();
        this.view.render(tables, guestsByTable, unseated, stats);
        this.attachModalEvents();
    }

    attachModalEvents() {
        // Сохранение настроек стола
        const saveSettingsBtn = document.getElementById('saveTableSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelTableSettingsBtn');
        const closeSettingsBtn = document.getElementById('closeTableSettingsModalBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.replaceWith(saveSettingsBtn.cloneNode(true));
            document.getElementById('saveTableSettingsBtn').addEventListener('click', () => this.saveTableSettings());
        }
        if (cancelSettingsBtn) {
            cancelSettingsBtn.replaceWith(cancelSettingsBtn.cloneNode(true));
            document.getElementById('cancelTableSettingsBtn').addEventListener('click', () => this.closeTableSettingsModal());
        }
        if (closeSettingsBtn) {
            closeSettingsBtn.replaceWith(closeSettingsBtn.cloneNode(true));
            document.getElementById('closeTableSettingsModalBtn').addEventListener('click', () => this.closeTableSettingsModal());
        }

        // Сохранение пересадки
        const saveTableBtn = document.getElementById('saveTableBtn');
        const cancelTableBtn = document.getElementById('cancelTableBtn');
        const closeTableBtn = document.getElementById('closeTableModalBtn');
        if (saveTableBtn) {
            saveTableBtn.replaceWith(saveTableBtn.cloneNode(true));
            document.getElementById('saveTableBtn').addEventListener('click', () => this.saveTableChange());
        }
        if (cancelTableBtn) {
            cancelTableBtn.replaceWith(cancelTableBtn.cloneNode(true));
            document.getElementById('cancelTableBtn').addEventListener('click', () => this.closeChangeTableModal());
        }
        if (closeTableBtn) {
            closeTableBtn.replaceWith(closeTableBtn.cloneNode(true));
            document.getElementById('closeTableModalBtn').addEventListener('click', () => this.closeChangeTableModal());
        }
    }

    addTable() {
        this.model.addTable();
        eventBus.emit('state:update', { tables: this.state.tables });
        this.refresh();
    }

    autoSeat() {
        if (this.model.getUnseatedGuests().length === 0) {
            alert('Все гости уже рассажены');
            return;
        }
        this.model.autoSeat();
        eventBus.emit('state:update', { guests: this.state.guests });
        this.refresh();
    }

    updateTableCapacity(id, capacity) {
        this.model.updateTable(id, { capacity });
        eventBus.emit('state:update', { tables: this.state.tables });
        this.refresh();
    }

    clearTable(tableNumber) {
        if (confirm(`Убрать всех гостей со стола ${tableNumber}?`)) {
            this.model.clearTable(tableNumber);
            eventBus.emit('state:update', { guests: this.state.guests });
            this.refresh();
        }
    }

    openTableSettings(tableId) {
        const table = this.model.getTableById(tableId);
        if (!table) return;
        this.currentTableSettingsId = tableId;
        this.view.showTableSettingsModal(table);
    }

    saveTableSettings() {
        if (!this.currentTableSettingsId) return;
        const defaultCapacity = parseInt(document.getElementById('tableSettingsDefaultCapacity').value) || 10;
        this.model.updateTable(this.currentTableSettingsId, { defaultCapacity, capacity: defaultCapacity });
        eventBus.emit('state:update', { tables: this.state.tables });
        this.closeTableSettingsModal();
        this.refresh();
    }

    closeTableSettingsModal() {
        document.getElementById('tableSettingsModal').style.display = 'none';
        this.currentTableSettingsId = null;
    }

    openChangeTableModal(guestId) {
        const guest = this.state.guests.find(g => g.id === guestId);
        if (!guest) return;
        this.currentChangeGuestId = guestId;
        this.view.showChangeTableModal(this.model.getAllTables(), guest.table);
    }

    saveTableChange() {
        if (!this.currentChangeGuestId) return;
        const select = document.getElementById('newTableSelect');
        const newTable = select.value;
        this.changeGuestTable(this.currentChangeGuestId, newTable);
        this.closeChangeTableModal();
    }

    changeGuestTable(guestId, tableNumber) {
        this.model.seatGuest(guestId, tableNumber);
        eventBus.emit('state:update', { guests: this.state.guests });
        this.refresh();
    }

    closeChangeTableModal() {
        document.getElementById('changeTableModal').style.display = 'none';
        this.currentChangeGuestId = null;
    }
}