import { escapeHtml, capitalize } from '../../core/utils.js';

export class GuestsView {
    constructor(container) {
        this.container = container;
        this.onAddGuest = null;
        this.onEditGuest = null;
        this.onDeleteGuest = null;
        this.onFilterChange = null;
        this.onBringToggle = null;
    }

    // Основной рендер секции
    render(guests, filterName = '', filterRelation = 'all') {
        const html = `
            <div class="filter-bar">
                <div class="input-group search-input">
                    <label>🔍 Поиск</label>
                    <input type="text" id="searchGuestInput" placeholder="Имя..." value="${escapeHtml(filterName)}">
                </div>
                <div class="input-group" style="min-width:150px;">
                    <label>Отношение</label>
                    <select id="filterRelationSelect">
                        <option value="all" ${filterRelation === 'all' ? 'selected' : ''}>Все</option>
                        <option value="Семья жениха" ${filterRelation === 'Семья жениха' ? 'selected' : ''}>Семья жениха</option>
                        <option value="Семья невесты" ${filterRelation === 'Семья невесты' ? 'selected' : ''}>Семья невесты</option>
                        <option value="Другое" ${filterRelation === 'Другое' ? 'selected' : ''}>Другое</option>
                    </select>
                </div>
                <button class="btn-tg btn-outline-tg" id="clearFiltersBtnGuests">Сбросить</button>
            </div>
            <div class="add-card-tg">
                <div style="display:flex; flex-wrap:wrap; gap:16px;">
                    ${this.renderGuestForm()}
                </div>
                <div style="margin-top:16px; text-align:center;">
                    <button id="addGuestBtn" class="btn-tg">+ Добавить гостя</button>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="guests-table-tg">
                    <thead>
                        <tr>
                            <th>Имя</th><th>Пригл.</th><th>ЗАГС</th><th>Отнош.</th><th>Стол</th>
                            <th>Контакты</th><th>Логистика</th><th>Меню</th><th>Алкоголь</th>
                            <th>Заметка</th><th>Конфликт</th><th></th>
                        </tr>
                    </thead>
                    <tbody id="guestsTbody"></tbody>
                </table>
            </div>
            <div id="statsPanel"></div>
        `;
        this.container.innerHTML = html;
        this.renderTableBody(guests);
        this.renderStats(guests);
        this.attachEvents();
    }

    renderGuestForm() {
        return `
            <div style="flex:1; min-width:200px; background:#fafcff; border-radius:20px; padding:12px;">
                <h4>Основное</h4>
                <div class="input-group"><label>Имя *</label><input type="text" id="guestName" placeholder="Иван Иванов"></div>
                <div class="input-group"><label>Отношение</label><select id="guestRelation"><option>Семья жениха</option><option>Семья невесты</option><option>Другое</option></select></div>
                <div style="display:flex; gap:16px; margin:8px 0;">
                    <label><input type="checkbox" id="guestInvited" checked> Приглашён</label>
                    <label><input type="checkbox" id="guestZags"> ЗАГС</label>
                </div>
                <div class="input-group"><label>Приведёт</label><select id="guestBringYesNo"><option value="no">Нет</option><option value="yes">Да</option></select></div>
                <div id="guestBringFields" style="display:none; margin-top:10px;">
                    <label>Сопровождающие:</label>
                    <div id="bringPersonsList"></div>
                    <button type="button" class="btn-tg btn-outline-tg" id="addBringPersonBtn">+ Добавить</button>
                </div>
                <div class="input-group"><label>Стол (№)</label><input type="text" id="guestTable" placeholder="1"></div>
                <div class="input-group"><label>Группа конфликта</label><input type="text" id="guestConflictGroup" placeholder="например: бывшие"></div>
            </div>
            <div style="flex:1; min-width:200px; background:#fafcff; border-radius:20px; padding:12px;">
                <h4>Контакты</h4>
                <div class="input-group"><label>Email</label><input type="email" id="guestEmail"></div>
                <div class="input-group"><label>Адрес</label><input type="text" id="guestAddress"></div>
                <div><label><input type="checkbox" id="guestAccommodation"> Размещение</label></div>
                <div class="input-group"><label>Транспорт</label><select id="guestTransport"><option>Не нужен</option><option>Нужен туда</option><option>Нужен обратно</option><option>Туда-обратно</option></select></div>
            </div>
            <div style="flex:1; min-width:200px; background:#fafcff; border-radius:20px; padding:12px;">
                <h4>Предпочтения</h4>
                <div class="input-group"><label>Питание</label><select id="guestMeal"><option>Стандартное</option><option>Веганское</option><option>Детское</option><option>Безглютеновое</option></select></div>
                <div class="input-group"><label>Блюдо</label><select id="guestDish"><option>Мясо</option><option>Курица</option><option>Рыба</option><option>Овощи</option><option>Фрукты</option></select></div>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0;">
                    <label><input type="checkbox" id="guestChampagne"> Шампанское</label>
                    <label><input type="checkbox" id="guestRedWine"> Красное</label>
                    <label><input type="checkbox" id="guestWhiteWine"> Белое</label>
                </div>
                <div class="input-group"><label>Крепкое</label><select id="guestSpirit"><option>Нет</option><option>Водка</option><option>Коньяк</option><option>Виски</option></select></div>
                <label><input type="checkbox" id="guestNoAlcohol"> Не пьёт</label>
                <div class="input-group"><label>Заметка</label><textarea id="guestNotes" rows="2" placeholder="Аллергия..."></textarea></div>
            </div>
        `;
    }

    renderTableBody(guests) {
        const tbody = this.container.querySelector('#guestsTbody');
        tbody.innerHTML = '';
        guests.forEach(g => {
            const alcohol = [];
            if (g.champagne) alcohol.push('🥂');
            if (g.redWine) alcohol.push('🍷');
            if (g.whiteWine) alcohol.push('🥂');
            if (g.spirit !== 'Нет') alcohol.push(g.spirit);
            if (g.noAlcohol) alcohol.push('🚫');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${escapeHtml(g.name)}</strong>${g.broughtBy ? '<br><small>приведён</small>' : ''}</td>
                <td>${g.invited ? '✅' : '❌'}</td>
                <td>${g.zags ? '✅' : '—'}</td>
                <td><span class="compact-badge">${g.relation === 'Семья жениха' ? 'Жених' : (g.relation === 'Семья невесты' ? 'Невеста' : 'Другое')}</span></td>
                <td>${g.table || '—'}</td>
                <td>${g.email || ''}<br>${g.address?.substring(0,15) || ''}</td>
                <td>${g.accommodation ? '🏨' : ''} ${g.transport}</td>
                <td>${g.meal}<br>${g.dish}</td>
                <td>${alcohol.join(' ') || '—'}</td>
                <td>${escapeHtml(g.notes || '')}</td>
                <td>${escapeHtml(g.conflictGroup || '')}</td>
                <td>
                    <button class="icon-btn edit-guest" data-id="${g.id}"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete-guest" data-id="${g.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        const badge = document.getElementById('totalGuestsBadge');
        if (badge) badge.innerText = `Всего: ${this.getTotalGuestsCount()} (показано: ${guests.length})`;
    }

    renderStats(guests) {
        const stats = this.container.querySelector('#statsPanel');
        const total = this.getTotalGuestsCount();
        const invited = guests.filter(g => g.invited).length;
        const relations = { 'Семья жениха': 0, 'Семья невесты': 0, 'Другое': 0 };
        let ch = 0, r = 0, w = 0, sp = 0, no = 0;
        let zags = 0, accommodation = 0;
        const transportCounts = { 'Не нужен': 0, 'Нужен туда': 0, 'Нужен обратно': 0, 'Туда-обратно': 0 };
        const mealCounts = { 'Стандартное': 0, 'Веганское': 0, 'Детское': 0, 'Безглютеновое': 0 };

        guests.forEach(g => {
            if (relations.hasOwnProperty(g.relation)) relations[g.relation]++;
            if (g.champagne) ch++;
            if (g.redWine) r++;
            if (g.whiteWine) w++;
            if (g.spirit !== 'Нет') sp++;
            if (g.noAlcohol) no++;
            if (g.zags) zags++;
            if (g.accommodation) accommodation++;
            if (transportCounts.hasOwnProperty(g.transport)) transportCounts[g.transport]++;
            if (mealCounts.hasOwnProperty(g.meal)) mealCounts[g.meal]++;
        });

        stats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><h4>Всего</h4><div class="stat-number">${total}</div><p>Приглашено: ${invited}</p></div>
                <div class="stat-card"><h4>Отношение</h4><p>👑 Жених: ${relations['Семья жениха']}</p><p>👰 Невеста: ${relations['Семья невесты']}</p><p>✨ Другое: ${relations['Другое']}</p></div>
                <div class="stat-card"><h4>Алкоголь</h4><p>🥂 Шамп: ${ch}</p><p>🍷 Крас: ${r}</p><p>🥂 Бел: ${w}</p><p>🥃 Креп: ${sp}</p><p>🚫 Не пьют: ${no}</p></div>
                <div class="stat-card"><h4>Логистика</h4><p>🏛️ ЗАГС: ${zags}</p><p>🏨 Размещение: ${accommodation}</p><p>🚌 Туда: ${transportCounts['Нужен туда'] + transportCounts['Туда-обратно']}</p><p>🚌 Обратно: ${transportCounts['Нужен обратно'] + transportCounts['Туда-обратно']}</p></div>
                <div class="stat-card"><h4>Питание</h4><p>🍽️ Стандарт: ${mealCounts['Стандартное']}</p><p>🥗 Веган: ${mealCounts['Веганское']}</p><p>🧒 Детское: ${mealCounts['Детское']}</p><p>🌾 Безглют: ${mealCounts['Безглютеновое']}</p></div>
            </div>
        `;
    }

    getTotalGuestsCount() {
        return this.totalCount || 0;
    }

    setTotalGuestsCount(count) {
        this.totalCount = count;
    }

    attachEvents() {
        // Обработчики будут привязаны в контроллере
    }

    // Управление блоком "Приведёт"
    renderBringList(persons) {
        const list = document.getElementById('bringPersonsList');
        if (!list) return;
        list.innerHTML = '';
        persons.forEach((p, i) => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; gap:6px; margin-bottom:8px;';
            div.innerHTML = `
                <select class="bring-type" data-idx="${i}">
                    <option value="male" ${p.type === 'male' ? 'selected' : ''}>Муж</option>
                    <option value="female" ${p.type === 'female' ? 'selected' : ''}>Жен</option>
                    <option value="child" ${p.type === 'child' ? 'selected' : ''}>Реб</option>
                </select>
                <input type="text" class="bring-name" data-idx="${i}" value="${escapeHtml(p.name || '')}" style="flex:2;">
                ${p.type === 'child' ? `<label><input type="checkbox" class="bring-child-separate" data-idx="${i}" ${p.childSeparate ? 'checked' : ''}> дет.стол</label>` : ''}
                <button class="icon-btn remove-bring" data-idx="${i}"><i class="fas fa-times"></i></button>
            `;
            list.appendChild(div);
        });
    }

    // Получить данные из формы добавления гостя
    getAddFormData() {
        return {
            name: document.getElementById('guestName')?.value || '',
            invited: document.getElementById('guestInvited')?.checked || false,
            zags: document.getElementById('guestZags')?.checked || false,
            relation: document.getElementById('guestRelation')?.value || 'Другое',
            table: document.getElementById('guestTable')?.value || '',
            email: document.getElementById('guestEmail')?.value || '',
            address: document.getElementById('guestAddress')?.value || '',
            accommodation: document.getElementById('guestAccommodation')?.checked || false,
            transport: document.getElementById('guestTransport')?.value || 'Не нужен',
            meal: document.getElementById('guestMeal')?.value || 'Стандартное',
            dish: document.getElementById('guestDish')?.value || 'Мясо',
            champagne: document.getElementById('guestChampagne')?.checked || false,
            redWine: document.getElementById('guestRedWine')?.checked || false,
            whiteWine: document.getElementById('guestWhiteWine')?.checked || false,
            spirit: document.getElementById('guestSpirit')?.value || 'Нет',
            noAlcohol: document.getElementById('guestNoAlcohol')?.checked || false,
            notes: document.getElementById('guestNotes')?.value || '',
            conflictGroup: document.getElementById('guestConflictGroup')?.value || ''
        };
    }

    // Получить список приведённых из формы
    getBringPersonsFromForm() {
        const persons = [];
        document.querySelectorAll('#bringPersonsList > div').forEach(div => {
            const type = div.querySelector('.bring-type')?.value || 'male';
            const name = div.querySelector('.bring-name')?.value || '';
            const childSeparate = div.querySelector('.bring-child-separate')?.checked || false;
            persons.push({ type, name, childSeparate });
        });
        return persons;
    }

    // Очистить форму добавления
    clearAddForm() {
        const fields = ['guestName', 'guestEmail', 'guestAddress', 'guestTable', 'guestConflictGroup', 'guestNotes'];
        fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('guestInvited').checked = true;
        document.getElementById('guestZags').checked = false;
        document.getElementById('guestBringYesNo').value = 'no';
        document.getElementById('guestBringFields').style.display = 'none';
        this.renderBringList([]);
    }

    // Заполнить форму редактирования
    populateEditForm(guest, formContainer) {
        formContainer.innerHTML = `
            <div class="input-group"><label>Имя</label><input type="text" id="editName" value="${escapeHtml(guest.name)}"></div>
            <div class="input-group"><label>Отношение</label><select id="editRelation">${['Семья жениха','Семья невесты','Другое'].map(v => `<option ${guest.relation === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div style="display:flex; gap:16px;"><label><input type="checkbox" id="editInvited" ${guest.invited ? 'checked' : ''}> Приглашён</label><label><input type="checkbox" id="editZags" ${guest.zags ? 'checked' : ''}> ЗАГС</label></div>
            <div class="input-group"><label>Стол</label><input type="text" id="editTable" value="${guest.table || ''}"></div>
            <div class="input-group"><label>Email</label><input type="email" id="editEmail" value="${guest.email || ''}"></div>
            <div class="input-group"><label>Адрес</label><input type="text" id="editAddress" value="${guest.address || ''}"></div>
            <div><label><input type="checkbox" id="editAccommodation" ${guest.accommodation ? 'checked' : ''}> Размещение</label></div>
            <div class="input-group"><label>Транспорт</label><select id="editTransport">${['Не нужен','Нужен туда','Нужен обратно','Туда-обратно'].map(v => `<option ${guest.transport === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="input-group"><label>Питание</label><select id="editMeal">${['Стандартное','Веганское','Детское','Безглютеновое'].map(v => `<option ${guest.meal === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="input-group"><label>Блюдо</label><select id="editDish">${['Мясо','Курица','Рыба','Овощи','Фрукты'].map(v => `<option ${guest.dish === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div><label><input type="checkbox" id="editChampagne" ${guest.champagne ? 'checked' : ''}> Шамп</label> <label><input type="checkbox" id="editRedWine" ${guest.redWine ? 'checked' : ''}> Крас</label> <label><input type="checkbox" id="editWhiteWine" ${guest.whiteWine ? 'checked' : ''}> Бел</label></div>
            <div class="input-group"><label>Крепкое</label><select id="editSpirit">${['Нет','Водка','Коньяк','Виски'].map(v => `<option ${guest.spirit === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div><label><input type="checkbox" id="editNoAlcohol" ${guest.noAlcohol ? 'checked' : ''}> Не пьёт</label></div>
            <div class="input-group"><label>Заметка</label><textarea id="editNotes">${escapeHtml(guest.notes || '')}</textarea></div>
            <div class="input-group"><label>Конфликт группа</label><input type="text" id="editConflictGroup" value="${escapeHtml(guest.conflictGroup || '')}"></div>
        `;
    }

    getEditFormData() {
        return {
            name: document.getElementById('editName')?.value || '',
            invited: document.getElementById('editInvited')?.checked || false,
            zags: document.getElementById('editZags')?.checked || false,
            relation: document.getElementById('editRelation')?.value || 'Другое',
            table: document.getElementById('editTable')?.value || '',
            email: document.getElementById('editEmail')?.value || '',
            address: document.getElementById('editAddress')?.value || '',
            accommodation: document.getElementById('editAccommodation')?.checked || false,
            transport: document.getElementById('editTransport')?.value || 'Не нужен',
            meal: document.getElementById('editMeal')?.value || 'Стандартное',
            dish: document.getElementById('editDish')?.value || 'Мясо',
            champagne: document.getElementById('editChampagne')?.checked || false,
            redWine: document.getElementById('editRedWine')?.checked || false,
            whiteWine: document.getElementById('editWhiteWine')?.checked || false,
            spirit: document.getElementById('editSpirit')?.value || 'Нет',
            noAlcohol: document.getElementById('editNoAlcohol')?.checked || false,
            notes: document.getElementById('editNotes')?.value || '',
            conflictGroup: document.getElementById('editConflictGroup')?.value || ''
        };
    }
}