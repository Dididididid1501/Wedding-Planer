// js/modules/guests/guests.controller.js
import { GuestsModel } from './guests.model.js';
import { GuestsView } from './guests.view.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { stateManager } from '../../core/storage.js';

export class GuestsController {
    constructor(container) {
        this.container = container;
        this.view = new GuestsView(container);
        this.model = null;
        this.currentEditId = null;
        this.filterName = '';
        this.filterRelation = 'all';

        eventBus.on(EVENTS.PROJECT_SWITCHED, () => this.refresh());
        eventBus.on(EVENTS.STATE_CHANGED, () => this.refresh());

        this.view.onAddGuest = () => this.addGuest();
        this.view.onEditGuest = (id) => this.openEditModal(id);
        this.view.onDeleteGuest = (id) => this.deleteGuest(id);
        this.view.onFilterChange = (name, relation) => {
            this.filterName = name;
            this.filterRelation = relation;
            this.refresh();
        };

        this.refresh();
    }

    getProjectData() {
        const project = stateManager.getActiveProject();
        return project ? project.data : { guests: [] };
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
        const stateForModel = { guests: projectData.guests || [] };
        this.model = new GuestsModel(stateForModel);

        const filtered = this.model.filterGuests(this.filterName, this.filterRelation);
        this.view.setTotalGuestsCount(this.model.getAll().length);
        this.view.render(filtered, this.filterName, this.filterRelation);
        this.updateSummary();
        this.attachUIEvents();
    }

    attachUIEvents() {
        // Аналогично предыдущей версии, но все вызовы сохранения используют saveProjectData
        const addBtn = document.getElementById('addGuestBtn');
        if (addBtn) addBtn.onclick = () => this.addGuest();

        const toggleBtn = document.getElementById('toggleAddFormBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.view.toggleAddForm());
        }

        const cancelBtn = document.getElementById('cancelAddGuestBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.view.hideAddForm();
                this.view.clearAddForm();
            });
        }

        const searchInput = document.getElementById('searchGuestInput');
        const relationSelect = document.getElementById('filterRelationSelect');
        const clearBtn = document.getElementById('clearFiltersBtnGuests');
        if (searchInput) searchInput.addEventListener('input', (e) => {
            this.filterName = e.target.value;
            this.refresh();
        });
        if (relationSelect) relationSelect.addEventListener('change', (e) => {
            this.filterRelation = e.target.value;
            this.refresh();
        });
        if (clearBtn) clearBtn.addEventListener('click', () => {
            this.filterName = '';
            this.filterRelation = 'all';
            if (searchInput) searchInput.value = '';
            if (relationSelect) relationSelect.value = 'all';
            this.refresh();
        });

        const bringSelect = document.getElementById('guestBringYesNo');
        if (bringSelect) bringSelect.addEventListener('change', (e) => {
            const fields = document.getElementById('guestBringFields');
            fields.style.display = e.target.value === 'yes' ? 'block' : 'none';
            if (e.target.value !== 'yes') this.view.renderBringList([]);
        });

        const addBringBtn = document.getElementById('addBringPersonBtn');
        if (addBringBtn) addBringBtn.addEventListener('click', () => {
            const persons = this.view.getBringPersonsFromForm();
            persons.push({ type: 'male', name: '', childSeparate: false });
            this.view.renderBringList(persons);
        });

        const tbody = document.getElementById('guestsTbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-guest');
                const delBtn = e.target.closest('.delete-guest');
                if (editBtn) this.openEditModal(editBtn.dataset.id);
                if (delBtn) this.deleteGuest(delBtn.dataset.id);
            });
        }

        const bringList = document.getElementById('bringPersonsList');
        if (bringList) {
            bringList.addEventListener('click', (e) => {
                if (e.target.closest('.remove-bring')) {
                    const btn = e.target.closest('.remove-bring');
                    const persons = this.view.getBringPersonsFromForm();
                    persons.splice(btn.dataset.idx, 1);
                    this.view.renderBringList(persons);
                }
            });
            bringList.addEventListener('change', (e) => {
                if (e.target.classList.contains('bring-type')) {
                    const idx = e.target.dataset.idx;
                    const persons = this.view.getBringPersonsFromForm();
                    persons[idx].type = e.target.value;
                    if (e.target.value !== 'child') delete persons[idx].childSeparate;
                    this.view.renderBringList(persons);
                }
            });
        }
    }

    addGuest() {
        const formData = this.view.getAddFormData();
        if (!formData.name) {
            alert('Введите имя гостя');
            return;
        }
        const bringPersons = document.getElementById('guestBringYesNo').value === 'yes'
            ? this.view.getBringPersonsFromForm()
            : [];
        this.model.addGuest(formData, bringPersons);
        this.saveProjectData({ guests: this.model.getAll() });
        this.view.clearAddForm();
        this.view.hideAddForm();
        this.refresh();
    }

    deleteGuest(id) {
        if (confirm('Удалить гостя?')) {
            this.model.deleteGuest(id);
            this.saveProjectData({ guests: this.model.getAll() });
            this.refresh();
        }
    }

    openEditModal(id) {
        const guest = this.model.getById(id);
        if (!guest) return;
        this.currentEditId = id;

        const modal = document.getElementById('editGuestModal');
        const formContainer = document.getElementById('editGuestForm');
        this.view.populateEditForm(guest, formContainer);
        modal.style.display = 'flex';

        const saveHandler = () => {
            const updates = this.view.getEditFormData();
            this.model.updateGuest(this.currentEditId, updates);
            this.saveProjectData({ guests: this.model.getAll() });
            this.refresh();
            this.closeEditModal();
        };

        const closeHandler = () => this.closeEditModal();

        const saveBtn = document.getElementById('saveGuestEditBtn');
        const cancelBtn = document.getElementById('cancelGuestEditBtn');
        const closeBtn = document.getElementById('closeGuestModalBtn');
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        document.getElementById('saveGuestEditBtn').addEventListener('click', saveHandler);
        document.getElementById('cancelGuestEditBtn').addEventListener('click', closeHandler);
        document.getElementById('closeGuestModalBtn').addEventListener('click', closeHandler);
        window.addEventListener('click', this.modalOutsideClickHandler);
    }

    closeEditModal() {
        document.getElementById('editGuestModal').style.display = 'none';
        this.currentEditId = null;
        window.removeEventListener('click', this.modalOutsideClickHandler);
    }

    modalOutsideClickHandler = (e) => {
        const modal = document.getElementById('editGuestModal');
        if (e.target === modal) this.closeEditModal();
    };

    updateSummary() {
        const total = this.model.getAll().length;
        const invited = this.model.getAll().filter(g => g.invited).length;
        const summary = document.getElementById('guestsSummary');
        if (summary) summary.innerText = `Всего: ${total} · Приглашено: ${invited}`;
        const badge = document.getElementById('totalGuestsBadge');
        if (badge) badge.innerText = `Всего: ${total}`;
        eventBus.emit(EVENTS.GUESTS_UPDATED, { total, invited });
    }
}