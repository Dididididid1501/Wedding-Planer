import { escapeHtml, formatMoney, capitalize } from '../../core/utils.js';

export class BudgetView {
    constructor(container) {
        this.container = container;
        this.onAddExpense = null;
        this.onEditExpense = null;
        this.onDeleteExpense = null;
        this.onPaymentCheck = null;
        this.onPaymentDateChange = null;
        this.onPaymentAmountChange = null;
        this.onAddPayment = null;
        this.onRemovePayment = null;
    }

    // Основной рендер секции
    render(expenses) {
        const html = `
            <div class="add-card-tg">
                <div class="form-grid-tg">
                    <div class="input-group">
                        <label>Статья</label>
                        <input type="text" id="newCategory" placeholder="Фотограф...">
                    </div>
                    <div class="input-group">
                        <label>Бюджет (₽)</label>
                        <input type="number" id="newPlanned" value="50000">
                    </div>
                    <div class="input-group">
                        <label>Ответственный</label>
                        <select id="newResponsible">
                            <option>Невеста</option>
                            <option>Жених</option>
                            <option>Организатор</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Заметка</label>
                        <input type="text" id="newNotes" placeholder="Детали">
                    </div>
                    <div>
                        <button id="addExpenseBtn" class="btn-tg">+ Добавить</button>
                    </div>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="budget-table-tg">
                    <thead>
                        <tr>
                            <th>Статья</th>
                            <th>Бюджет</th>
                            <th>Отв.</th>
                            <th>Заметка</th>
                            <th>Платежи</th>
                            <th>Оплачено</th>
                            <th>Остаток</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="expenseTbody"></tbody>
                    <tfoot id="expenseFooter"></tfoot>
                </table>
            </div>
        `;
        this.container.innerHTML = html;
        this.renderTableBody(expenses);
        this.renderFooter(expenses);
        this.attachEvents();
    }

    renderTableBody(expenses) {
        const tbody = this.container.querySelector('#expenseTbody');
        tbody.innerHTML = '';
        expenses.forEach(exp => {
            const paid = exp.payments.reduce((s, p) => s + (p.isPaid ? p.amount : 0), 0);
            let paymentsHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
            exp.payments.forEach((p, i) => {
                paymentsHtml += `
                    <div style="display:flex; align-items:center; gap:4px;">
                        <input type="checkbox" class="payment-check" data-exp-id="${exp.id}" data-idx="${i}" ${p.isPaid ? 'checked' : ''}>
                        <input type="date" class="payment-date" data-exp-id="${exp.id}" data-idx="${i}" value="${p.date || ''}" style="width:110px;">
                        <input type="number" class="payment-amount" data-exp-id="${exp.id}" data-idx="${i}" value="${p.amount}" style="width:80px;" step="1000">
                        <button class="icon-btn remove-payment" data-exp-id="${exp.id}" data-idx="${i}"><i class="fas fa-times"></i></button>
                    </div>
                `;
            });
            paymentsHtml += `<button class="btn-tg btn-outline-tg add-payment-btn" data-exp-id="${exp.id}" style="padding:2px 8px;">+ Платёж</button></div>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${escapeHtml(exp.category)}</strong></td>
                <td>${formatMoney(exp.planned)}</td>
                <td><span class="compact-badge">${escapeHtml(exp.responsible)}</span></td>
                <td>${escapeHtml(exp.notes || '—')}</td>
                <td>${paymentsHtml}</td>
                <td>${formatMoney(paid)}</td>
                <td>${formatMoney(exp.planned - paid)}</td>
                <td>
                    <button class="icon-btn edit-expense" data-id="${exp.id}"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete-expense" data-id="${exp.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderFooter(expenses) {
        const totalPlanned = expenses.reduce((s, e) => s + e.planned, 0);
        const totalPaid = expenses.reduce((s, e) => s + e.payments.reduce((p, pay) => p + (pay.isPaid ? pay.amount : 0), 0), 0);
        const footer = this.container.querySelector('#expenseFooter');
        footer.innerHTML = `
            <tr>
                <td colspan="2"><strong>Итого: ${formatMoney(totalPlanned)}</strong></td>
                <td colspan="3"></td>
                <td>${formatMoney(totalPaid)}</td>
                <td>${formatMoney(totalPlanned - totalPaid)}</td>
                <td></td>
            </tr>
        `;
    }

    attachEvents() {
        // Добавление расхода
        const addBtn = this.container.querySelector('#addExpenseBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (this.onAddExpense) {
                    const category = this.container.querySelector('#newCategory').value.trim();
                    const planned = parseFloat(this.container.querySelector('#newPlanned').value);
                    const responsible = this.container.querySelector('#newResponsible').value;
                    const notes = this.container.querySelector('#newNotes').value;
                    this.onAddExpense({ category, planned, responsible, notes });
                }
            });
        }

        // Делегирование событий внутри таблицы
        const tbody = this.container.querySelector('#expenseTbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const target = e.target;
                // Чекбокс оплаты
                if (target.classList.contains('payment-check')) {
                    const expId = target.dataset.expId;
                    const idx = target.dataset.idx;
                    if (this.onPaymentCheck) this.onPaymentCheck(expId, idx, target.checked);
                }
                // Удаление платежа
                if (target.closest('.remove-payment')) {
                    const btn = target.closest('.remove-payment');
                    const expId = btn.dataset.expId;
                    const idx = btn.dataset.idx;
                    if (this.onRemovePayment) this.onRemovePayment(expId, idx);
                }
                // Добавление платежа
                if (target.closest('.add-payment-btn')) {
                    const btn = target.closest('.add-payment-btn');
                    const expId = btn.dataset.expId;
                    if (this.onAddPayment) this.onAddPayment(expId);
                }
                // Редактирование
                if (target.closest('.edit-expense')) {
                    const btn = target.closest('.edit-expense');
                    const expId = btn.dataset.id;
                    if (this.onEditExpense) this.onEditExpense(expId);
                }
                // Удаление расхода
                if (target.closest('.delete-expense')) {
                    const btn = target.closest('.delete-expense');
                    const expId = btn.dataset.id;
                    if (this.onDeleteExpense) this.onDeleteExpense(expId);
                }
            });

            tbody.addEventListener('change', (e) => {
                const target = e.target;
                if (target.classList.contains('payment-date')) {
                    const expId = target.dataset.expId;
                    const idx = target.dataset.idx;
                    if (this.onPaymentDateChange) this.onPaymentDateChange(expId, idx, target.value);
                }
                if (target.classList.contains('payment-amount')) {
                    const expId = target.dataset.expId;
                    const idx = target.dataset.idx;
                    const value = parseFloat(target.value) || 0;
                    if (this.onPaymentAmountChange) this.onPaymentAmountChange(expId, idx, value);
                }
            });
        }
    }

    // Обновление сводки (вызывается из контроллера)
    updateSummary(stats) {
        const summary = document.getElementById('expensesSummary');
        if (summary) {
            summary.innerText = `Итого: ${formatMoney(stats.totalPlanned)} / Оплачено: ${formatMoney(stats.totalPaid)}`;
        }
    }

    // Метод для отображения модального окна редактирования (заполняет форму)
    populateEditForm(expense, formContainer) {
        formContainer.innerHTML = `
            <div class="input-group">
                <label>Статья</label>
                <input type="text" id="editExpCategory" value="${escapeHtml(expense.category)}">
            </div>
            <div class="input-group">
                <label>Бюджет</label>
                <input type="number" id="editExpPlanned" value="${expense.planned}">
            </div>
            <div class="input-group">
                <label>Ответственный</label>
                <select id="editExpResponsible">
                    <option ${expense.responsible === 'Невеста' ? 'selected' : ''}>Невеста</option>
                    <option ${expense.responsible === 'Жених' ? 'selected' : ''}>Жених</option>
                    <option ${expense.responsible === 'Организатор' ? 'selected' : ''}>Организатор</option>
                </select>
            </div>
            <div class="input-group">
                <label>Заметка</label>
                <textarea id="editExpNotes">${escapeHtml(expense.notes || '')}</textarea>
            </div>
            <div>
                <label>Платежи</label>
                <div id="editPaymentsList"></div>
                <button type="button" class="btn-tg btn-outline-tg" id="addEditPaymentBtn">+ Платёж</button>
            </div>
        `;
        this.renderEditPaymentsList(expense.payments);
    }

    renderEditPaymentsList(payments) {
        const list = document.getElementById('editPaymentsList');
        if (!list) return;
        list.innerHTML = '';
        payments.forEach((p, i) => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; gap:6px; margin-bottom:6px;';
            div.innerHTML = `
                <input type="checkbox" class="edit-payment-paid" data-idx="${i}" ${p.isPaid ? 'checked' : ''}>
                <input type="date" class="edit-payment-date" data-idx="${i}" value="${p.date || ''}" style="width:130px;">
                <input type="number" class="edit-payment-amount" data-idx="${i}" value="${p.amount}" style="width:100px;">
                <button class="icon-btn remove-edit-payment" data-idx="${i}"><i class="fas fa-times"></i></button>
            `;
            list.appendChild(div);
        });
    }

    // Получить данные из формы редактирования
    getEditFormData() {
        const category = document.getElementById('editExpCategory')?.value.trim() || 'Статья';
        const planned = parseFloat(document.getElementById('editExpPlanned')?.value) || 0;
        const responsible = document.getElementById('editExpResponsible')?.value || 'Невеста';
        const notes = document.getElementById('editExpNotes')?.value || '';
        const payments = [];
        document.querySelectorAll('#editPaymentsList > div').forEach(div => {
            const paidCheck = div.querySelector('.edit-payment-paid');
            const dateInput = div.querySelector('.edit-payment-date');
            const amountInput = div.querySelector('.edit-payment-amount');
            if (paidCheck && dateInput && amountInput) {
                payments.push({
                    date: dateInput.value,
                    amount: parseFloat(amountInput.value) || 0,
                    isPaid: paidCheck.checked
                });
            }
        });
        return { category, planned, responsible, notes, payments };
    }

    // Привязать обработчик добавления платежа в модалке
    bindEditPaymentAdd(handler) {
        const btn = document.getElementById('addEditPaymentBtn');
        if (btn) btn.addEventListener('click', handler);
    }

    // Привязать обработчик удаления платежа в модалке (через делегирование)
    bindEditPaymentRemove(handler) {
        const list = document.getElementById('editPaymentsList');
        if (list) {
            list.addEventListener('click', (e) => {
                if (e.target.closest('.remove-edit-payment')) {
                    const btn = e.target.closest('.remove-edit-payment');
                    const idx = btn.dataset.idx;
                    handler(idx);
                }
            });
        }
    }
}