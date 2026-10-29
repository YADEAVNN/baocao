// modules/tasks/tasks.main.js
window.TasksModule = {
  activeSubTab: 'LIST', // 'LIST' | 'KANBAN' | 'MARKET_PLAN' | 'STORE_VISIT' | 'SO_PROPOSAL'
  statusFilter: 'ALL',
  priorityFilter: 'ALL',
  supervisorFilter: 'ALL',
  searchQuery: '',
  draggedTaskId: null,
  hasLoadedFromSupabase: false,

  // Giữ hàm rỗng tương thích ngược với shops.module.js (Vì từ điển đã gom về core/i18n.js)
  ensureI18n() {},

  syncHeaderFilterUI() {
    setTimeout(() => {
      const isTasksView = window.AppState?.activeModule === 'tasks';
      const advPanel = document.getElementById('advanced-filters');
      if (advPanel && isTasksView) {
        advPanel.classList.add('hidden');
      }

      const toggleBtn = document.querySelector('button[onclick*="toggleAdvancedFilters"]');
      if (toggleBtn) {
        const divider = toggleBtn.previousElementSibling;
        if (isTasksView) {
          toggleBtn.classList.add('hidden');
          if (divider && divider.classList.contains('w-px')) divider.classList.add('hidden');
        } else {
          toggleBtn.classList.remove('hidden');
          if (divider && divider.classList.contains('w-px')) divider.classList.remove('hidden');
        }
      }

      const selectedYM = this.getSelectedYearMonth();
      const [yStr, mStr] = selectedYM.split('-');
      const mEl = document.getElementById('filter-month-num');
      const yEl = document.getElementById('filter-year-num');
      if (mEl && mEl.value !== mStr) mEl.value = mStr;
      if (yEl && yEl.value !== yStr) yEl.value = yStr;
    }, 0);
  },

  getSelectedYearMonth() {
    const mEl = document.getElementById('filter-month-num');
    const yEl = document.getElementById('filter-year-num');
    if (mEl && yEl && mEl.value && yEl.value) {
      const ym = `${yEl.value}-${mEl.value}`;
      if (window.AppState) window.AppState.month = ym;
      return ym;
    }
    return window.AppState?.month || new Date().toISOString().slice(0, 7);
  },

  matchesSelectedMonth(task, selectedYM) {
    if (!selectedYM) return true;
    const assignedDate = String(task.startDate || task.deadline || task.createdAt || '').trim();
    if (!assignedDate) return true;
    const taskYM = assignedDate.slice(0, 7);
    return taskYM === selectedYM;
  },

  isManagerRole() {
    const role = window.AppState?.role || 'SALE';
    return role === 'ADMIN' || role === 'REGIONAL_DIRECTOR';
  },

  isTaskOverdue(task) {
    if (!task || !task.deadline) return false;
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    const today = new Date().toISOString().slice(0, 10);
    return String(task.deadline).slice(0, 10) < today;
  },

  getCurrentWeekRange() {
    if (window.AppUtils && window.AppUtils.getCurrentWeekRange) {
      return window.AppUtils.getCurrentWeekRange();
    }
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10)
    };
  },

  async fetchTasksFromSupabaseIfNeeded() {
    if (this.hasLoadedFromSupabase) return;
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;

    this.hasLoadedFromSupabase = true;
    try {
      const { data, error } = await window.SupabaseService.client
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const validTasks = data.filter(row => row.task_type !== 'KPI_BOARDS_STORAGE');
        window.AppStore.tasks = validTasks.map(row => ({
          id: String(row.id),
          taskType: row.task_type || 'TASK',
          title: row.title || '',
          note: row.note || '',
          dvn: String(row.dvn_code || '').trim(),
          shopName: row.shop_name || '',
          region: row.region || 'SOUTH',
          assignee: row.assignee || '',
          assigner: row.assigner || '',
          priority: row.priority || 'MEDIUM',
          startDate: row.start_date || '',
          deadline: row.deadline || '',
          progress: Number(row.progress || 0),
          status: row.status || 'NOT_STARTED',
          isSpecialTrip: Boolean(row.is_special_trip),
          checklist: row.checklist || {},
          issues: row.issues || '',
          solution: row.solution || '',
          evidenceUrls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [],
          history: Array.isArray(row.history) ? row.history : [],
          createdAt: row.created_at || new Date().toISOString()
        }));
        window.AppStore.saveToStorage();

        if (window.AppStore.tasks.length > 0 && !this._hasAutoSyncedMonth) {
          this._hasAutoSyncedMonth = true;
          const currentYM = window.AppState?.month || '2026-09';
          const hasInCurrent = window.AppStore.tasks.some(t => this.matchesSelectedMonth(t, currentYM));
          if (!hasInCurrent) {
            const firstTask = window.AppStore.tasks[0];
            const latestYM = String(firstTask.startDate || firstTask.deadline || firstTask.createdAt || '').slice(0, 7);
            if (/^\d{4}-\d{2}$/.test(latestYM) && window.AppState) {
              window.AppState.month = latestYM;
            }
          }
        }

        if (window.AppState?.activeModule === 'tasks') {
          window.App.renderCurrentModule();
        }
      }
    } catch (e) {
      console.warn('[TasksModule] Đồng bộ dữ liệu:', e);
    }
  },

  async persistTask(taskObj) {
    const list = window.AppStore.tasks || [];
    const idx = list.findIndex(t => String(t.id) === String(taskObj.id));
    if (idx >= 0) list[idx] = taskObj;
    else list.unshift(taskObj);
    window.AppStore.tasks = list;

    try {
      window.AppStore.saveToStorage();
    } catch (e) {
      console.warn('Bộ nhớ LocalStorage đầy, ưu tiên lưu Cloud:', e);
    }

    const taskYM = String(taskObj.startDate || taskObj.deadline || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(taskYM) && window.AppState) {
      window.AppState.month = taskYM;
    }

    if (window.SupabaseService && window.SupabaseService.isConnected) {
      try {
        const payload = {
          id: String(taskObj.id),
          task_type: taskObj.taskType || 'TASK',
          title: taskObj.title,
          note: taskObj.note || '',
          dvn_code: String(taskObj.dvn || '').trim(),
          shop_name: taskObj.shopName || '',
          region: taskObj.region || 'SOUTH',
          assignee: taskObj.assignee || '',
          assigner: taskObj.assigner || '',
          priority: taskObj.priority || 'MEDIUM',
          start_date: taskObj.startDate || null,
          deadline: taskObj.deadline || null,
          progress: Number(taskObj.progress || 0),
          status: taskObj.status || 'NOT_STARTED',
          is_special_trip: Boolean(taskObj.isSpecialTrip),
          checklist: taskObj.checklist || {},
          issues: taskObj.issues || '',
          solution: taskObj.solution || '',
          evidence_urls: taskObj.evidenceUrls || [],
          history: taskObj.history || [],
          updated_at: new Date().toISOString()
        };
        await window.SupabaseService.client.from('tasks').upsert([payload], { onConflict: 'id' });
      } catch (e) {
        console.warn('[TasksModule] Lưu Supabase:', e);
      }
    }
  },

  getRealShopsAndSupervisors() {
    const rawShops = window.AdminShopsModule ? window.AdminShopsModule.getList() : (window.AppStore.shops || []);
    const regionFilter = window.AppState?.region || 'ALL';

    const shops = rawShops.filter(s => {
      if (regionFilter === 'ALL') return true;
      const enumR = window.AppUtils
        ? window.AppUtils.resolveMienCode(s.mien, s.region)
        : (s.region || 'SOUTH');
      return enumR === regionFilter;
    });

    const supervisors = [...new Set(shops.map(s => s.supervisor || s.gdMien).filter(Boolean))].sort();
    const directors = [...new Set(shops.map(s => s.gdKhuVuc || s.director).filter(Boolean))].sort();
    const sales = [...new Set(shops.map(s => s.sale).filter(Boolean))].sort();
    return { shops, supervisors, directors, sales };
  },

  filterShopAutocomplete(inputId, dropdownId, hiddenDvnId) {
    const inputEl = document.getElementById(inputId);
    const dropdownEl = document.getElementById(dropdownId);
    const hiddenEl = document.getElementById(hiddenDvnId);
    if (!inputEl || !dropdownEl) return;

    const q = inputEl.value.trim().toLowerCase();
    if (!q && hiddenEl) hiddenEl.value = '';

    const { shops } = this.getRealShopsAndSupervisors();
    const matched = shops.filter(s => {
      if (inputId === 'plan-shop-search-input') {
        const matchSup = !this.planSupervisor || (s.supervisor || s.gdMien) === this.planSupervisor;
        const matchSale = this.planSaleFilter === 'ALL' || s.sale === this.planSaleFilter;
        if (!matchSup || !matchSale) return false;
      }
      const dvn = String(s.dvn || '').toLowerCase();
      const name = String(s.name || '').toLowerCase();
      const prov = String(s.province || '').toLowerCase();
      const sale = String(s.sale || '').toLowerCase();
      return !q || dvn.includes(q) || name.includes(q) || prov.includes(q) || sale.includes(q);
    }).slice(0, 30);

    if (matched.length === 0) {
      dropdownEl.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">Không tìm thấy cửa hàng phù hợp</div>`;
    } else {
      dropdownEl.innerHTML = (inputId !== 'plan-shop-search-input' ? `
        <div
          onclick="TasksModule.selectShopOption('', '', '', '${inputId}', '${dropdownId}', '${hiddenDvnId}')"
          class="px-3 py-2 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-500 border-b border-slate-100"
        >
          -- Không gắn cửa hàng cố định / Áp dụng toàn vùng --
        </div>
      ` : '') + matched.map(s => {
        const dvnStr = String(s.dvn).trim();
        const safeName = String(s.name || '').replace(/'/g, "\\'");
        const safeSup = String(s.supervisor || s.gdMien || '').replace(/'/g, "\\'");
        return `
          <div
            onclick="TasksModule.selectShopOption('${dvnStr}', '${safeName}', '${safeSup}', '${inputId}', '${dropdownId}', '${hiddenDvnId}')"
            class="px-3 py-2 hover:bg-orange-50 cursor-pointer text-xs border-b border-slate-50 flex items-center justify-between gap-2 transition"
          >
            <div class="truncate">
              <span class="font-mono font-black text-blue-600">${dvnStr}</span>
              <span class="font-bold text-slate-900 ml-1.5">${s.name}</span>
              <span class="text-[11px] text-slate-400 ml-1">(${s.province || ''})</span>
            </div>
            <span class="text-[10px] font-bold text-slate-500 shrink-0">Sale: ${s.sale || '—'}</span>
          </div>
        `;
      }).join('');
    }
    dropdownEl.classList.remove('hidden');
  },

  selectShopOption(dvn, shopName, supervisor, inputId, dropdownId, hiddenDvnId) {
    const inputEl = document.getElementById(inputId);
    const dropdownEl = document.getElementById(dropdownId);
    const hiddenEl = document.getElementById(hiddenDvnId);

    if (inputId === 'plan-shop-search-input') {
      if (dvn && !this.selectedPlanShops.some(item => item.dvn === dvn)) {
        this.selectedPlanShops.push({ dvn, name: shopName });
        this.renderSelectedPlanShopTags();
        this.updateSaleShopCheckboxes();
      }
      if (inputEl) inputEl.value = '';
      if (dropdownEl) dropdownEl.classList.add('hidden');
      return;
    }

    if (hiddenEl) hiddenEl.value = dvn;
    if (inputEl) inputEl.value = dvn ? `${dvn} - ${shopName}` : '';
    if (dropdownEl) dropdownEl.classList.add('hidden');

    if (supervisor) {
      const supSelect = document.getElementById('new-task-assignee');
      if (supSelect) supSelect.value = supervisor;
    }
  },

  async readFilesAsDataUrls(fileList) {
    if (window.AppUtils && window.AppUtils.readFilesAsDataUrls) {
      return window.AppUtils.readFilesAsDataUrls(fileList, 960, 960, 0.65);
    }
    return [];
  },

  async previewCompressedFiles(inputEl, previewBoxId) {
    const box = document.getElementById(previewBoxId);
    if (!box || !inputEl?.files || inputEl.files.length === 0) return;
    const compressedList = await this.readFilesAsDataUrls(inputEl.files);
    box.innerHTML = `
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
        ${compressedList.map(url => `<img src="${url}" class="h-16 w-full object-cover rounded-lg border border-slate-200 shadow-sm" />`).join('')}
      </div>
    `;
  },

  getFilteredTasks() {
    const region = window.AppState?.region || 'ALL';
    const selectedYM = this.getSelectedYearMonth();
    const allTasks = (window.AppStore.tasks || []).filter(t =>
      t.taskType !== 'KPI_BOARDS_STORAGE' && !String(t.id).startsWith('KPI-BOARDS-')
    );
    const q = this.searchQuery.trim().toLowerCase();

    return allTasks.filter(t => {
      const matchRegion = region === 'ALL' || !t.region || t.region === region;
      const matchMonth = this.matchesSelectedMonth(t, selectedYM);

      const isOverdue = this.isTaskOverdue(t);
      const effectiveStatus = isOverdue && this.statusFilter === 'OVERDUE' ? 'OVERDUE' : t.status;

      const matchStatus =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'OVERDUE' ? isOverdue : effectiveStatus === this.statusFilter);

      const matchPriority = this.priorityFilter === 'ALL' || (t.priority || 'MEDIUM') === this.priorityFilter;
      const matchSup = this.supervisorFilter === 'ALL' || (t.assignee || '') === this.supervisorFilter;

      const matchQuery = !q ||
        String(t.id || '').toLowerCase().includes(q) ||
        String(t.title || '').toLowerCase().includes(q) ||
        String(t.dvn || '').toLowerCase().includes(q) ||
        String(t.shopName || '').toLowerCase().includes(q) ||
        String(t.assignee || '').toLowerCase().includes(q);

      return matchRegion && matchMonth && matchStatus && matchPriority && matchSup && matchQuery;
    });
  },

  setSubTab(tabId) {
    this.activeSubTab = tabId;
    window.App.renderCurrentModule();
  },

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
    if (key === 'searchQuery' || key === 'proposalSearchQuery') {
      const inputId = key === 'searchQuery' ? 'task-search-input' : 'proposal-search-input';
      const input = document.getElementById(inputId);
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  },

  filterByCard(statusKey) {
    if (statusKey === 'VISIT') {
      this.activeSubTab = 'STORE_VISIT';
      this.statusFilter = 'ALL';
    } else {
      this.activeSubTab = 'LIST';
      this.statusFilter = statusKey;
    }
    window.App.renderCurrentModule();
  },

  renderStatusBadge(task) {
    const overdue = this.isTaskOverdue(task);
    const map = {
      'NOT_STARTED': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">${window.t('tm_st_not_started')}</span>`,
      'IN_PROGRESS': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${window.t('tm_st_in_progress')}</span>`,
      'PENDING_APPROVAL': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">${window.t('tm_st_pending')}</span>`,
      'REVISION_REQUIRED': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-300">${window.t('tm_st_revision')}</span>`,
      'COMPLETED': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">${window.t('tm_st_completed')}</span>`,
      'CANCELLED': `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-300 line-through">${window.t('tm_st_cancelled')}</span>`
    };
    const base = map[task.status] || map['NOT_STARTED'];
    const overdueTag = overdue
      ? `<span class="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm">${window.t('tm_overdue_tag')}</span>`
      : '';
    return `<div class="inline-flex items-center flex-wrap gap-1">${base}${overdueTag}</div>`;
  },

  renderPriorityBadge(priority) {
    const p = priority || 'MEDIUM';
    if (p === 'HIGH') {
      return `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">🔥 ${window.t('tm_pri_high')}</span>`;
    }
    if (p === 'LOW') {
      return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">${window.t('tm_pri_low')}</span>`;
    }
    return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#F26522] border border-orange-200">${window.t('tm_pri_medium')}</span>`;
  },

  render() {
    this.syncHeaderFilterUI();
    this.fetchTasksFromSupabaseIfNeeded();

    const region = window.AppState?.region || 'ALL';
    const selectedYM = this.getSelectedYearMonth();
    const [yStr, mStr] = selectedYM.split('-');

    const allMonthTasks = (window.AppStore.tasks || []).filter(t =>
      t.taskType !== 'KPI_BOARDS_STORAGE' &&
      !String(t.id).startsWith('KPI-BOARDS-') &&
      (region === 'ALL' || !t.region || t.region === region) &&
      this.matchesSelectedMonth(t, selectedYM)
    );

    const filteredTasks = this.getFilteredTasks();
    const { supervisors } = this.getRealShopsAndSupervisors();
    const isManager = this.isManagerRole();

    const totalCount = allMonthTasks.length;
    const inProgressCount = allMonthTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedCount = allMonthTasks.filter(t => t.status === 'COMPLETED').length;
    const overdueCount = allMonthTasks.filter(t => this.isTaskOverdue(t)).length;
    const pendingCount = allMonthTasks.filter(t => t.status === 'PENDING_APPROVAL').length;
    const visitCount = allMonthTasks.filter(t => t.taskType === 'STORE_VISIT' || (t.evidenceUrls && t.evidenceUrls.length > 0)).length;

    const kpiCards = [
      { id: 'ALL', label: window.t('tm_kpi_total'), value: totalCount, icon: 'layers', border: 'border-t-slate-800', text: 'text-slate-800' },
      { id: 'IN_PROGRESS', label: window.t('tm_kpi_in_progress'), value: inProgressCount, icon: 'loader', border: 'border-t-blue-500', text: 'text-blue-600' },
      { id: 'COMPLETED', label: window.t('tm_kpi_completed'), value: completedCount, icon: 'check-circle-2', border: 'border-t-emerald-500', text: 'text-emerald-600' },
      { id: 'OVERDUE', label: window.t('tm_kpi_overdue'), value: overdueCount, icon: 'alert-octagon', border: 'border-t-rose-500', text: 'text-rose-600' },
      { id: 'PENDING_APPROVAL', label: window.t('tm_kpi_pending'), value: pendingCount, icon: 'clock', border: 'border-t-amber-500', text: 'text-amber-600' },
      { id: 'VISIT', label: window.t('tm_kpi_visits'), value: visitCount, icon: 'map-pin', border: 'border-t-orange-500', text: 'text-[#F26522]' }
    ];

    return `
      <!-- HEADER & CỤM NÚT HÀNH ĐỘNG NHANH -->
      <div class="card-3d p-5 bg-gradient-to-r from-[#111625] via-slate-900 to-[#1e293b] text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg sm:text-xl font-black tracking-tight uppercase flex items-center gap-2.5">
            <span class="w-2.5 h-6 rounded-full bg-[#F26522]"></span>
            <span>${window.t('tm_title')}</span>
            <span class="px-2.5 py-0.5 rounded-lg bg-[#F26522]/20 border border-[#F26522]/40 text-orange-300 text-xs font-mono">
              Tháng ${mStr}/${yStr}
            </span>
          </h2>
          <p class="text-xs text-slate-300 mt-0.5">${window.t('tm_subtitle')}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onclick="TasksModule.openCreateTaskModal({ taskType: 'TASK' })"
            class="btn-3d-orange px-4 py-2.5 rounded-xl font-extrabold flex items-center gap-2 cursor-pointer"
          >
            <i class="fa-solid fa-plus"></i>
            <span>${isManager ? window.t('tm_btn_assign') : window.t('tm_btn_self_task')}</span>
          </button>

          <button
            onclick="TasksModule.setSubTab('MARKET_PLAN')"
            class="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <i class="fa-solid fa-calendar-check text-amber-400"></i>
            <span>${window.t('tm_btn_new_plan')}</span>
          </button>

          <button
            onclick="TasksModule.openCreateTaskModal({ taskType: 'STORE_VISIT' })"
            class="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <i class="fa-solid fa-camera text-emerald-400"></i>
            <span>${window.t('tm_btn_new_visit')}</span>
          </button>
        </div>
      </div>

      <!-- 6 KPI CARDS -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        ${kpiCards.map(c => `
          <div
            onclick="TasksModule.filterByCard('${c.id}')"
            class="card-3d tilt-card p-4 border-t-4 ${c.border} cursor-pointer hover:ring-2 hover:ring-[#F26522]/50 flex flex-col justify-between"
          >
            <div class="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>${c.label}</span>
              <i data-lucide="${c.icon}" class="w-4 h-4 ${c.text}"></i>
            </div>
            <div class="my-1.5 text-2xl font-black font-mono text-slate-900 dark:text-white">${c.value}</div>
            <div class="text-[10px] text-slate-400 font-semibold">Tháng ${mStr}/${yStr} • Bấm để lọc</div>
          </div>
        `).join('')}
      </div>

      <!-- THANH CHUYỂN 5 TAB CON -->
      <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          ${[
            { id: 'LIST', label: window.t('tm_tab_list'), icon: 'fa-list-check' },
            { id: 'KANBAN', label: window.t('tm_tab_kanban'), icon: 'fa-table-columns' },
            { id: 'MARKET_PLAN', label: window.t('tm_tab_plan'), icon: 'fa-route' },
            { id: 'STORE_VISIT', label: window.t('tm_tab_visit'), icon: 'fa-camera-retro' },
            { id: 'SO_PROPOSAL', label: window.t('tm_tab_proposal'), icon: 'fa-bolt' }
          ].map(tab => `
            <button
              onclick="TasksModule.setSubTab('${tab.id}')"
              class="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                this.activeSubTab === tab.id
                  ? 'bg-[#111625] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#F26522]'
              }"
            >
              <i class="fa-solid ${tab.icon} ${this.activeSubTab === tab.id ? 'text-[#F26522]' : ''}"></i>
              <span>${tab.label}</span>
            </button>
          `).join('')}
        </div>

        ${this.activeSubTab !== 'SO_PROPOSAL' ? `
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <input
              id="task-search-input"
              type="text"
              value="${this.searchQuery}"
              oninput="TasksModule.setFilter('searchQuery', this.value)"
              placeholder="Tìm mã CV, DVN, tên shop..."
              class="px-3 py-2 rounded-xl border border-slate-200 font-semibold w-48 focus:outline-none focus:border-[#F26522]"
            />

            <select
              onchange="TasksModule.setFilter('supervisorFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">-- Tất cả Giám sát --</option>
              ${supervisors.map(s => `<option value="${s}" ${this.supervisorFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>

            <select
              onchange="TasksModule.setFilter('statusFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>-- Mọi trạng thái --</option>
              <option value="NOT_STARTED" ${this.statusFilter === 'NOT_STARTED' ? 'selected' : ''}>${window.t('tm_st_not_started')}</option>
              <option value="IN_PROGRESS" ${this.statusFilter === 'IN_PROGRESS' ? 'selected' : ''}>${window.t('tm_st_in_progress')}</option>
              <option value="PENDING_APPROVAL" ${this.statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>${window.t('tm_st_pending')}</option>
              <option value="REVISION_REQUIRED" ${this.statusFilter === 'REVISION_REQUIRED' ? 'selected' : ''}>${window.t('tm_st_revision')}</option>
              <option value="OVERDUE" ${this.statusFilter === 'OVERDUE' ? 'selected' : ''}>${window.t('tm_kpi_overdue')}</option>
              <option value="COMPLETED" ${this.statusFilter === 'COMPLETED' ? 'selected' : ''}>${window.t('tm_st_completed')}</option>
              <option value="CANCELLED" ${this.statusFilter === 'CANCELLED' ? 'selected' : ''}>${window.t('tm_st_cancelled')}</option>
            </select>
          </div>
        ` : ''}
      </div>

      <!-- HIỂN THỊ NỘI DUNG 5 TAB CON -->
      ${this.activeSubTab === 'LIST' ? this.renderListTab(filteredTasks) : ''}
      ${this.activeSubTab === 'KANBAN' ? this.renderKanbanTab(filteredTasks) : ''}
      ${this.activeSubTab === 'MARKET_PLAN' ? this.renderMarketPlanTab(filteredTasks) : ''}
      ${this.activeSubTab === 'STORE_VISIT' ? this.renderStoreVisitTab(filteredTasks) : ''}
      ${this.activeSubTab === 'SO_PROPOSAL' ? this.renderSOProposalTab() : ''}
    `;
  }
};