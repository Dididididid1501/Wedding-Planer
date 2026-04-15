// js/modules/budget/budget.controller.js
import { BudgetModel } from './budget.model.js';
import { BudgetView } from './budget.view.js';
import { eventBus, EVENTS } from '../../core/events.js';
import { stateManager } from '../../core/storage.js';

export class BudgetController {
    constructor(container) {
        this.container = container;
        this.view = new BudgetView(container);
        this.model = null;
        this.currentEditId = null;

        eventBus.on(EVENTS.PROJECT_SWITCHED, () => this.refresh());
        eventBus.on(EVENTS.STATE_CHANGED, () => this.refresh());

        this.view.onAddExpense = (data) => this.addExpense(data);
        this.view.onEditExpense = (id) => this.openEditModal(id);
        this.view.onDeleteExpense = (id) => this.deleteExpense(id);
        this.view.onPaymentCheck = (expId, idx, checked) => this.updatePayment(expId, idx, { isPaid: checked });
        this.view.onPaymentDateChange = (expId, idx, date) => this.updatePayment(expId, idx, { date });
        this.view.onPaymentAmountChange = (expId, idx, amount) => this.updatePayment(expId, idx, { amount });
        this.view.onAddPayment = (expId) => this.addPayment(expId);
        this.view.onRemovePayment = (expId, idx) => this.removePayment(expId, idx);

        this.refresh();
    }

    getProjectData() {
        const project = stateManager.getActiveProject();
        return project ? project.data : { expenses: [] };
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
        const stateForModel = { expenses: projectData.expenses || [] };
        this.model = new BudgetModel(stateForModel);

        const expenses = this.model.getAll();
        this.view.render(expenses);
        const stats = this.model.getStats();
        this.view.updateSummary(stats);
        eventBus.emit(EVENTS.BUDGET_UPDATED, stats);
    }

    addExpense(data) {
        if (!data.category) return alert('Введите название статьи');
        this.model.add(data);
        this.saveProjectData({ expenses: this.model.getAll() });
        this.refresh();
    }

    deleteExpense(id) {
        if (confirm('Удалить статью расхода?')) {
            this.model.delete(id);
            this.saveProjectData({ expenses: this.model.getAll() });
            this.refresh();
        }
    }

    updatePayment(expId, idx, updates) {
        this.model.updatePayment(expId, idx, updates);
        this.saveProjectData({ expenses: this.model.getAll() });
        this.refresh();
    }

    addPayment(expId) {
        this.model.addPayment(expId);
        this.saveProjectData({ expenses: this.model.getAll() });
        this.refresh();
    }

    removePayment(expId, idx) {
        this.model.deletePayment(expId, idx);
        this.saveProjectData({ expenses: this.model.getAll() });
        this.refresh();
    }

    openEditModal(id) {
        const expense = this.model.getById(id);
        if (!expense) return;
        this.currentEditId = id;
        const modal = document.getElementById('editExpenseModal');
        const formContainer = document.getElementById('editExpenseForm');
        this.view.populateEditForm(expense, formContainer);

        this.view.bindEditPaymentAdd(() => {
            const exp = this.model.getById(this.currentEditId);
            if (exp) {
                exp.payments.push({ date: '', amount: 0, isPaid: false });
                this.view.renderEditPaymentsList(exp.payments);
            }
        });

        this.view.bindEditPaymentRemove((idx) => {
            const exp = this.model.getById(this.currentEditId);
            if (exp) {
                exp.payments.splice(idx, 1);
                this.view.renderEditPaymentsList(exp.payments);
            }
        });

        modal.style.display = 'flex';

        const saveHandler = () => {
            const formData = this.view.getEditFormData();
            this.model.update(this.currentEditId, formData);
            this.saveProjectData({ expenses: this.model.getAll() });
            this.refresh();
            this.closeEditModal();
        };

        const closeHandler = () => this.closeEditModal();

        const saveBtn = document.getElementById('saveExpenseEditBtn');
        const cancelBtn = document.getElementById('cancelExpenseEditBtn');
        const closeBtn = document.getElementById('closeExpenseModalBtn');
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        document.getElementById('saveExpenseEditBtn').addEventListener('click', saveHandler);
        document.getElementById('cancelExpenseEditBtn').addEventListener('click', closeHandler);
        document.getElementById('closeExpenseModalBtn').addEventListener('click', closeHandler);
        window.addEventListener('click', this.modalOutsideClickHandler);
    }

    closeEditModal() {
        document.getElementById('editExpenseModal').style.display = 'none';
        this.currentEditId = null;
        window.removeEventListener('click', this.modalOutsideClickHandler);
    }

    modalOutsideClickHandler = (e) => {
        const modal = document.getElementById('editExpenseModal');
        if (e.target === modal) this.closeEditModal();
    };
}