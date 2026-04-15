// js/modules/seating/seating.controller.js
import { SeatingModel } from './seating.model.js';
import { SeatingView } from './seating.view.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { stateManager } from '../../core/storage.js';

export class SeatingController {
    constructor(container) {
        this.container = container;
        this.view = new SeatingView(container);
        this.model = null;
        this.currentTableSettingsId = null;
        this.currentChangeGuestId = null;

        eventBus.on(EVENTS.PROJECT_SWITCHED, () => this.refresh());
        eventBus.on(EVENTS.STATE_CHANGED, () => this.refresh());
        eventBus.on(EVENTS.GUESTS_UPDATED, () => this.refresh());

        this.view.onAddTable = () => this.addTable();
        this.view.onAutoSeat = () => this.autoSeat();
        this.view.onTableCapacityChange = (id, value) => this.updateTableCapacity(id, value);
        this.view.onClearTable = (tableNum) => this.clearTable(tableNum);
        this.view.onTableSettings = (tableId) => this.openTableSettings(tableId);
        this.view.setChangeTableClickHandler((guestId) => this.openChangeTableModal(guestId));
        this.view.onChangeTable = (guestId, tableNumber) => this.changeGuestTable(guestId, tableNumber);

        this.refresh();
    }

    getProjectData() {
        const project = stateManager.getActiveProject();
        return project ? project.data : { tables: [], guests: [] };
    }

    saveProjectData(updates) {
        const project = stateManager.getActiveProject();
        if (project) {
            Object.assign(project.data, updates);
            stateManager.updateActiveProject(updates);
            eventBus.emit(EVENTS.STATE_CHANGED);
        }
    }

    refresh() {
        const projectData = this.getProjectData();
        const stateForModel = {
            tables: projectData.tables || [],
            guests: projectData.guests || []
        };
        this.model = new SeatingModel(stateForModel);
        this.model.syncTablesFromGuests(); // при необходимости

        const tables = this.model.getAllTables();
        const guestsByTable = this.model.getGuestsByTable();
        const unseated = this.model.getUnseatedGuests().length;
        const stats = this.model.getStats();
        this.view.render(tables, guestsByTable, unseated, stats);
        this.attachModalEvents();
    }

    attachModalEvents() {
        const saveSettingsBtn = document.getElementById('saveTableSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.replaceWith(saveSettingsBtn.cloneNode(true));
            document.getElementById('saveTableSettingsBtn').addEventListener('click', () => this.saveTableSettings());
        }
        const cancelSettingsBtn = document.getElementById('cancelTableSettingsBtn');
        if (cancelSettingsBtn) {
            cancelSettingsBtn.replaceWith(cancelSettingsBtn.cloneNode(true));
            document.getElementById('cancelTableSettingsBtn').addEventListener('click', () => this.closeTableSettingsModal());
        }
        document.getElementById('closeTableSettingsModalBtn')?.addEventListener('click', () => this.closeTableSettingsModal());

        const saveTableBtn = document.getElementById('saveTableBtn');
        if (saveTableBtn) {
            saveTableBtn.replaceWith(saveTableBtn.cloneNode(true));
            document.getElementById('saveTableBtn').addEventListener('click', () => this.saveTableChange());
        }
        document.getElementById('cancelTableBtn')?.addEventListener('click', () => this.closeChangeTableModal());
        document.getElementById('closeTableModalBtn')?.addEventListener('click', () => this.closeChangeTableModal());
    }

    addTable() {
        this.model.addTable();
        this.saveProjectData({ tables: this.model.getAllTables() });
        this.refresh();
    }

    autoSeat() {
        if (this.model.getUnseatedGuests().length === 0) return alert('Все гости уже рассажены');
        this.model.autoSeat();
        this.saveProjectData({ guests: this.model.getAllGuests() });
        this.refresh();
    }

    updateTableCapacity(id, capacity) {
        this.model.updateTable(id, { capacity });
        this.saveProjectData({ tables: this.model.getAllTables() });
        this.refresh();
    }

    clearTable(tableNumber) {
        if (confirm(`Убрать всех гостей со стола ${tableNumber}?`)) {
            this.model.clearTable(tableNumber);
            this.saveProjectData({ guests: this.model.getAllGuests() });
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
        this.saveProjectData({ tables: this.model.getAllTables() });
        this.closeTableSettingsModal();
        this.refresh();
    }

    closeTableSettingsModal() {
        document.getElementById('tableSettingsModal').style.display = 'none';
        this.currentTableSettingsId = null;
    }

    openChangeTableModal(guestId) {
        const guest = this.model.getAllGuests().find(g => g.id === guestId);
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
        this.saveProjectData({ guests: this.model.getAllGuests() });
        this.refresh();
    }

    closeChangeTableModal() {
        document.getElementById('changeTableModal').style.display = 'none';
        this.currentChangeGuestId = null;
    }
}