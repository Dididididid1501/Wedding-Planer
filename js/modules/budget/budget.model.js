import { generateId, parseNumber } from '../../core/utils.js';

export class BudgetModel {
    constructor(state) {
        this.state = state; // ссылка на общее состояние (stateManager.state)
    }

    // Получить все расходы
    getAll() {
        return this.state.expenses;
    }

    // Найти расход по ID
    getById(id) {
        return this.state.expenses.find(e => e.id === id);
    }

    // Добавить новый расход
    add(data) {
        const newExpense = {
            id: generateId(),
            category: data.category || 'Новая статья',
            planned: parseNumber(data.planned, 0),
            responsible: data.responsible || 'Невеста',
            notes: data.notes || '',
            payments: data.payments || [{ date: '', amount: 0, isPaid: false }]
        };
        this.state.expenses.push(newExpense);
        return newExpense;
    }

    // Обновить расход
    update(id, updates) {
        const expense = this.getById(id);
        if (!expense) return null;
        Object.assign(expense, updates);
        return expense;
    }

    // Удалить расход
    delete(id) {
        const index = this.state.expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            this.state.expenses.splice(index, 1);
            return true;
        }
        return false;
    }

    // Добавить платёж
    addPayment(expenseId, paymentData = {}) {
        const expense = this.getById(expenseId);
        if (!expense) return null;
        const newPayment = {
            date: paymentData.date || '',
            amount: parseNumber(paymentData.amount, 0),
            isPaid: paymentData.isPaid || false
        };
        expense.payments.push(newPayment);
        return newPayment;
    }

    // Обновить платёж
    updatePayment(expenseId, paymentIndex, updates) {
        const expense = this.getById(expenseId);
        if (!expense || !expense.payments[paymentIndex]) return false;
        Object.assign(expense.payments[paymentIndex], updates);
        return true;
    }

    // Удалить платёж
    deletePayment(expenseId, paymentIndex) {
        const expense = this.getById(expenseId);
        if (!expense || !expense.payments[paymentIndex]) return false;
        expense.payments.splice(paymentIndex, 1);
        return true;
    }

    // Посчитать общую запланированную сумму
    getTotalPlanned() {
        return this.state.expenses.reduce((sum, e) => sum + e.planned, 0);
    }

    // Посчитать общую оплаченную сумму
    getTotalPaid() {
        return this.state.expenses.reduce((sum, e) => {
            return sum + e.payments.reduce((s, p) => s + (p.isPaid ? p.amount : 0), 0);
        }, 0);
    }

    // Получить статистику (итого, оплачено, остаток)
    getStats() {
        const totalPlanned = this.getTotalPlanned();
        const totalPaid = this.getTotalPaid();
        return {
            totalPlanned,
            totalPaid,
            remaining: totalPlanned - totalPaid
        };
    }
}