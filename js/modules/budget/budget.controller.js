import { BudgetModel } from './budget.model.js';
import { BudgetView } from './budget.view.js';
import { eventBus } from '../../core/events.js';

export class BudgetController {
    constructor(state, container) {
        this.state = state;
        this.model = new BudgetModel(state);
        this.view = new BudgetView(container);
        this.currentEditId = null;

        // Подписка на глобальное обновление состояния
        eventBus.on('stateChanged', () => {
            this.refresh();
        });

        // Привязка обработчиков View -> Controller
        this.view.onAddExpense = (data) => this.addExpense(data);
        this.view.onEditExpense = (id) => this.openEditModal(id);
        this.view.onDeleteExpense = (id) => this.deleteExpense(id);
        this.view.onPaymentCheck = (expId, idx, checked) => this.updatePayment(expId, idx, { isPaid: checked });
        this.view.onPaymentDateChange = (expId, idx, date) => this.updatePayment(expId, idx, { date });
        this.view.onPaymentAmountChange = (expId, idx, amount) => this.updatePayment(expId, idx, { amount });
        this.view.onAddPayment = (expId) => this.addPayment(expId);
        this.view.onRemovePayment = (expId, idx) => this.removePayment(expId, idx);

        // Инициализация отображения
        this.refresh();
    }

    refresh() {
        const expenses = this.model.getAll();
        this.view.render(expenses);
        const stats = this.model.getStats();
        this.view.updateSummary(stats);
        // Эмитим событие, что бюджет обновлён (для обновления сводок в других модулях, если нужно)
        eventBus.emit('budget:updated', stats);
    }

    addExpense(data) {
        if (!data.category) {
            alert('Введите название статьи');
            return;
        }
        this.model.add(data);
        // Сохраняем состояние через глобальный stateManager (вызовется из app)
        eventBus.emit('state:update', { expenses: this.state.expenses });
        this.refresh();
    }

    deleteExpense(id) {
        if (confirm('Удалить статью расхода?')) {
            this.model.delete(id);
            eventBus.emit('state:update', { expenses: this.state.expenses });
            this.refresh();
        }
    }

    updatePayment(expId, idx, updates) {
        this.model.updatePayment(expId, idx, updates);
        eventBus.emit('state:update', { expenses: this.state.expenses });
        this.refresh();
    }

    addPayment(expId) {
        this.model.addPayment(expId, { amount: 0, isPaid: false });
        eventBus.emit('state:update', { expenses: this.state.expenses });
        this.refresh();
    }

    removePayment(expId, idx) {
        this.model.deletePayment(expId, idx);
        eventBus.emit('state:update', { expenses: this.state.expenses });
        this.refresh();
    }

    openEditModal(id) {
        const expense = this.model.getById(id);
        if (!expense) return;
        this.currentEditId = id;

        const modal = document.getElementById('editExpenseModal');
        const formContainer = document.getElementById('editExpenseForm');
        this.view.populateEditForm(expense, formContainer);

        // Привязка событий модалки
        this.view.bindEditPaymentAdd(() => {
            // Добавить пустой платёж во временный массив и перерисовать
            const expenseCopy = this.model.getById(this.currentEditId);
            if (expenseCopy) {
                expenseCopy.payments.push({ date: '', amount: 0, isPaid: false });
                this.view.renderEditPaymentsList(expenseCopy.payments);
            }
        });

        this.view.bindEditPaymentRemove((idx) => {
            const expenseCopy = this.model.getById(this.currentEditId);
            if (expenseCopy) {
                expenseCopy.payments.splice(idx, 1);
                this.view.renderEditPaymentsList(expenseCopy.payments);
            }
        });

        modal.style.display = 'flex';

        // Обработчик сохранения (должен быть один раз)
        const saveBtn = document.getElementById('saveExpenseEditBtn');
        const cancelBtn = document.getElementById('cancelExpenseEditBtn');
        const closeBtn = document.getElementById('closeExpenseModalBtn');

        const saveHandler = () => {
            const formData = this.view.getEditFormData();
            this.model.update(this.currentEditId, formData);
            eventBus.emit('state:update', { expenses: this.state.expenses });
            this.refresh();
            this.closeEditModal();
        };

        const closeHandler = () => this.closeEditModal();

        // Удаляем старые обработчики, чтобы не дублировались
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        document.getElementById('saveExpenseEditBtn').addEventListener('click', saveHandler);
        document.getElementById('cancelExpenseEditBtn').addEventListener('click', closeHandler);
        document.getElementById('closeExpenseModalBtn').addEventListener('click', closeHandler);
        window.addEventListener('click', this.modalOutsideClickHandler);
    }

    closeEditModal() {
        const modal = document.getElementById('editExpenseModal');
        modal.style.display = 'none';
        this.currentEditId = null;
        window.removeEventListener('click', this.modalOutsideClickHandler);
    }

    modalOutsideClickHandler = (e) => {
        const modal = document.getElementById('editExpenseModal');
        if (e.target === modal) {
            this.closeEditModal();
        }
    };
}