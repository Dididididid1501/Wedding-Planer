import { escapeHtml } from '../../core/utils.js';

export class SeatingView {
    constructor(container) {
        this.container = container;
        this.onAddTable = null;
        this.onAutoSeat = null;
        this.onTableCapacityChange = null;
        this.onClearTable = null;
        this.onTableSettings = null;
        this.onChangeTable = null;
    }

    render(tables, guestsByTable, unseatedCount, stats) {
        const html = `
            <div class="add-card-tg">
                <div class="global-stats" id="seatingGlobalStats">${this.renderStats(stats)}</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
                    <button id="addNewTableBtn" class="btn-tg btn-outline-tg">+ Добавить стол</button>
                    <button id="autoFillTablesBtn" class="btn-tg btn-outline-tg"><i class="fas fa-magic"></i> Автозаполнение</button>
                </div>
                <div id="tablesGrid" class="tables-grid"></div>
            </div>
        `;
        this.container.innerHTML = html;
        this.renderTablesGrid(tables, guestsByTable);
        this.attachEvents();
        this.updateUnseatedBadge(unseatedCount);
    }

    renderStats(stats) {
        return `Всего мест: ${stats.totalCapacity} | Гостей за столами: ${stats.seated} | Свободно: ${stats.totalCapacity - stats.seated}`;
    }

    renderTablesGrid(tables, guestsByTable) {
        const grid = this.container.querySelector('#tablesGrid');
        grid.innerHTML = '';
        tables.forEach(table => {
            const guests = guestsByTable[table.number] || [];
            const count = guests.length;
            const free = table.capacity - count;
            const conflictGroups = guests.map(g => g.conflictGroup).filter(cg => cg && cg.trim() !== '');
            const hasConflict = conflictGroups.some((cg, i, arr) => arr.indexOf(cg) !== i);

            let guestsHtml = '';
            guests.forEach(g => {
                const relClass = g.relation === 'Семья жениха' ? 'relation-groom' : (g.relation === 'Семья невесты' ? 'relation-bride' : 'relation-other');
                guestsHtml += `
                    <div class="guest-item ${relClass}" draggable="true" data-guest-id="${g.id}">
                        <div class="guest-name">
                            <span>${g.relation === 'Семья жениха' ? '💙' : g.relation === 'Семья невесты' ? '❤️' : '✨'} ${escapeHtml(g.name)}${g.broughtBy ? ' (пр)' : ''}</span>
                            <button class="icon-btn change-table-btn" data-guest-id="${g.id}"><i class="fas fa-arrows-alt"></i></button>
                        </div>
                        <div class="guest-details">
                            <span class="detail-badge">${g.meal}</span>
                            <span class="detail-badge">${g.dish}</span>
                        </div>
                    </div>
                `;
            });
            if (count === 0) guestsHtml = '<div style="text-align:center; padding:12px;">— пусто —</div>';

            const card = document.createElement('div');
            card.className = `table-card ${free < 0 ? 'overflow' : ''} ${hasConflict ? 'conflict' : ''}`;
            card.setAttribute('data-table-number', table.number);
            card.innerHTML = `
                <div class="table-header">
                    <span>Стол ${escapeHtml(table.number)} <button class="icon-btn table-settings-btn" data-table-id="${table.id}"><i class="fas fa-cog"></i></button></span>
                    <div class="table-capacity"><i class="fas fa-users"></i><input type="number" class="capacity-input" data-id="${table.id}" value="${table.capacity}" min="1"> мест</div>
                </div>
                <div class="guest-list">${guestsHtml}</div>
                <div class="table-footer">
                    <span>👥 ${count}</span>
                    <span class="free-seats ${free < 0 ? 'warning' : ''}">🪑 ${free < 0 ? 0 : free}</span>
                    ${hasConflict ? '<span class="conflict-warning"><i class="fas fa-exclamation-triangle"></i> Конфликт</span>' : ''}
                    <button class="icon-btn clear-table-btn" data-table-num="${table.number}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

            // Drag & drop
            card.addEventListener('dragover', e => e.preventDefault());
            card.addEventListener('drop', e => {
                e.preventDefault();
                const guestId = e.dataTransfer.getData('text/plain');
                if (guestId) {
                    this.handleDropOnTable(guestId, table.number);
                }
            });

            grid.appendChild(card);
        });

        // Общая зона для сброса (убрать со стола)
        grid.addEventListener('dragover', e => e.preventDefault());
        grid.addEventListener('drop', e => {
            e.preventDefault();
            const guestId = e.dataTransfer.getData('text/plain');
            if (guestId && this.onChangeTable) {
                this.onChangeTable(guestId, '');
            }
        });
    }

    handleDropOnTable(guestId, tableNumber) {
        if (this.onChangeTable) {
            this.onChangeTable(guestId, tableNumber);
        }
    }

    attachEvents() {
        const addBtn = this.container.querySelector('#addNewTableBtn');
        if (addBtn) addBtn.addEventListener('click', () => { if (this.onAddTable) this.onAddTable(); });

        const autoBtn = this.container.querySelector('#autoFillTablesBtn');
        if (autoBtn) autoBtn.addEventListener('click', () => { if (this.onAutoSeat) this.onAutoSeat(); });

        // Делегирование событий внутри сетки столов
        const grid = this.container.querySelector('#tablesGrid');
        if (grid) {
            grid.addEventListener('change', (e) => {
                if (e.target.classList.contains('capacity-input')) {
                    const id = e.target.dataset.id;
                    const value = parseInt(e.target.value) || 10;
                    if (this.onTableCapacityChange) this.onTableCapacityChange(id, value);
                }
            });

            grid.addEventListener('click', (e) => {
                const clearBtn = e.target.closest('.clear-table-btn');
                if (clearBtn) {
                    const tableNum = clearBtn.dataset.tableNum;
                    if (this.onClearTable) this.onClearTable(tableNum);
                }
                const settingsBtn = e.target.closest('.table-settings-btn');
                if (settingsBtn) {
                    const tableId = settingsBtn.dataset.tableId;
                    if (this.onTableSettings) this.onTableSettings(tableId);
                }
                const changeBtn = e.target.closest('.change-table-btn');
                if (changeBtn) {
                    const guestId = changeBtn.dataset.guestId;
                    if (this.onChangeTableClick) this.onChangeTableClick(guestId);
                }
            });
        }

        // Drag start для гостей (глобально, т.к. элементы создаются динамически)
        document.addEventListener('dragstart', (e) => {
            const guestItem = e.target.closest('.guest-item');
            if (guestItem) {
                const guestId = guestItem.dataset.guestId;
                e.dataTransfer.setData('text/plain', guestId);
                e.dataTransfer.effectAllowed = 'move';
                guestItem.classList.add('dragging');
            }
        });
        document.addEventListener('dragend', (e) => {
            const guestItem = e.target.closest('.guest-item');
            if (guestItem) guestItem.classList.remove('dragging');
        });
    }

    // Привязать внешний обработчик для клика "Пересадить"
    setChangeTableClickHandler(handler) {
        this.onChangeTableClick = handler;
    }

    // Модальное окно настроек стола
    showTableSettingsModal(table) {
        const modal = document.getElementById('tableSettingsModal');
        document.getElementById('tableSettingsNumber').value = table.number;
        document.getElementById('tableSettingsDefaultCapacity').value = table.defaultCapacity || 10;
        modal.style.display = 'flex';
        return modal;
    }

    // Модальное окно выбора стола для пересадки
    showChangeTableModal(tables, currentTable) {
        const modal = document.getElementById('changeTableModal');
        const select = document.getElementById('newTableSelect');
        select.innerHTML = '<option value="">-- Выберите --</option>' +
            tables.map(t => `<option value="${t.number}" ${t.number === currentTable ? 'selected' : ''}>Стол ${t.number}</option>`).join('') +
            '<option value="__none__">Убрать со стола</option>';
        modal.style.display = 'flex';
        return modal;
    }

    // Обновление бейджа с нерассаженными
    updateUnseatedBadge(unseatedCount) {
        const badge = document.getElementById('unseatedBadge');
        if (badge) badge.innerHTML = `🚫 Не рассажены: ${unseatedCount}`;
        const summary = document.getElementById('seatingSummary');
        if (summary) {
            const tablesCount = this.container.querySelectorAll('.table-card').length;
            summary.innerText = `Столов: ${tablesCount} · Нерассажены: ${unseatedCount}`;
        }
    }
}