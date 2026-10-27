// modules/tasks.module.js
window.TasksModule = {
  activeSubTab: 'LIST', // 'LIST' | 'KANBAN' | 'MARKET_PLAN' | 'STORE_VISIT' | 'SO_PROPOSAL'
  statusFilter: 'ALL',
  priorityFilter: 'ALL',
  supervisorFilter: 'ALL',
  searchQuery: '',
  draggedTaskId: null,
  hasInjectedI18n: false,
  hasLoadedFromSupabase: false,

  planSupervisor: '',
  planSaleFilter: 'ALL',
  selectedPlanShops: [],

  proposalDirectorFilter: 'ALL',
  proposalSupervisorFilter: 'ALL',
  proposalSaleFilter: 'ALL',
  proposalSearchQuery: '',

  ensureI18n() {
    if (this.hasInjectedI18n || !window.I18N) return;
    const viDict = {
      tm_title: 'Quản Trị Công Việc & Lịch Thị Trường',
      tm_subtitle: 'Theo dõi giao việc, kế hoạch tuần của Giám sát, nhật ký thăm cửa hàng và đề xuất hỗ trợ từ S.O',
      tm_kpi_total: 'Tổng nhiệm vụ',
      tm_kpi_in_progress: 'Đang thực hiện',
      tm_kpi_completed: 'Hoàn thành',
      tm_kpi_overdue: 'Quá hạn',
      tm_kpi_pending: 'Chờ phê duyệt',
      tm_kpi_visits: 'Chuyến thăm cửa hàng',
      tm_tab_list: '1. Danh sách nhiệm vụ',
      tm_tab_kanban: '2. Kanban',
      tm_tab_plan: '3. Kế hoạch thị trường',
      tm_tab_visit: '4. Chuyến thăm cửa hàng',
      tm_tab_proposal: '5. Đề xuất từ S.O',
      tm_btn_assign: 'Giao nhiệm vụ mới',
      tm_btn_self_task: 'Tạo việc cá nhân',
      tm_btn_new_plan: 'Lập kế hoạch tuần',
      tm_btn_new_visit: 'Check-in thăm Shop',
      tm_st_not_started: 'Chưa bắt đầu',
      tm_st_in_progress: 'Đang thực hiện',
      tm_st_pending: 'Chờ phê duyệt',
      tm_st_revision: 'Yêu cầu bổ sung',
      tm_st_completed: 'Hoàn thành',
      tm_st_cancelled: 'Đã hủy',
      tm_pri_high: 'Khẩn cấp / Cao',
      tm_pri_medium: 'Trung bình',
      tm_pri_low: 'Thông thường',
      tm_overdue_tag: 'QUÁ HẠN'
    };
    const zhDict = {
      tm_title: '督导任务与市场周计划管理',
      tm_subtitle: '任务派发、督导周工作计划、门店巡访记录及 S.O 帮扶建议',
      tm_kpi_total: '总任务数',
      tm_kpi_in_progress: '进行中',
      tm_kpi_completed: '已完成',
      tm_kpi_overdue: '已逾期',
      tm_kpi_pending: '待审批',
      tm_kpi_visits: '门店巡访数',
      tm_tab_list: '1. 任务列表',
      tm_tab_kanban: '2. 看板视图 (Kanban)',
      tm_tab_plan: '3. 市场周计划',
      tm_tab_visit: '4. 门店巡访打卡',
      tm_tab_proposal: '5. S.O 异常门店建议',
      tm_btn_assign: '派发新任务',
      tm_btn_self_task: '创建个人任务',
      tm_btn_new_plan: '填写周计划',
      tm_btn_new_visit: '提交巡店打卡',
      tm_st_not_started: '未开始',
      tm_st_in_progress: '进行中',
      tm_st_pending: '待审批',
      tm_st_revision: '需补充修改',
      tm_st_completed: '已完成',
      tm_st_cancelled: '已取消',
      tm_pri_high: '高优先级 / 紧急',
      tm_pri_medium: '中优先级',
      tm_pri_low: '常规',
      tm_overdue_tag: '已逾期'
    };
    Object.assign(window.I18N.vi, viDict);
    Object.assign(window.I18N.zh, zhDict);
    this.hasInjectedI18n = true;
  },

  // 1. Ẩn nút "Bộ lọc" nâng cao trên Header khi ở mục Việc cần làm
  syncHeaderFilterUI() {
    setTimeout(() => {
      const isTasksView = window.AppState?.activeModule === 'tasks';

      document.querySelectorAll('div, span').forEach(el => {
        if (el.children.length <= 1 && el.textContent && el.textContent.trim().includes('Đồng bộ Cloud Supabase')) {
          el.classList.add('hidden');
        }
      });

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

  // 2. Lấy Tháng/Năm đang chọn trên Header (VD: '2026-10')
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

  // 3. QUY TẮC LỌC THÁNG NGHIÊM NGẶT: Nhiệm vụ giao ở tháng nào thì CHỈ hiển thị ở đúng tháng đó
  // Ưu tiên lấy theo ngày giao / ngày bắt đầu (startDate), nếu không có mới lấy deadline hoặc ngày tạo (createdAt)
  matchesSelectedMonth(task, selectedYM) {
    if (!selectedYM) return true;
    const assignedDate = String(task.startDate || task.deadline || task.createdAt || '').trim();
    if (!assignedDate) return true;
    const taskYM = assignedDate.slice(0, 7);
    return taskYM === selectedYM;
  },

  // 4. LẤY SỐ LIỆU S.O CHO TAB 5 (ĐỀ XUẤT TỪ S.O):
  // Nếu tháng đang chọn (VD: Tháng 10 hoặc 11) chưa có dữ liệu S.O, tự động lùi về lấy tháng gần nhất trước đó đã có số liệu S.O!
  getEvaluatedShopsWithFallback() {
    const selectedYM = this.getSelectedYearMonth();
    const parts = selectedYM.split('-');
    const selYear = parseInt(parts[0], 10) || 2026;
    const selMonth = parseInt(parts[1], 10) || 10;
    const regionFilter = window.AppState?.region || 'ALL';
    const rawList = window.AdminShopsModule ? window.AdminShopsModule.getList() : [];

    const getSO = (rawShop, y, m) => {
      if (window.DashboardModule && typeof window.DashboardModule.getRawSO === 'function') {
        return window.DashboardModule.getRawSO(rawShop, y, m);
      }
      const yKey = `so${y}`;
      const mKey = `T${Number(m)}`;
      if (rawShop && rawShop[yKey] && rawShop[yKey][mKey] !== undefined && rawShop[yKey][mKey] !== null) {
        return Number(rawShop[yKey][mKey]);
      }
      return null;
    };

    // Tìm kỳ (Năm, Tháng) <= kỳ đang chọn mà có dữ liệu S.O thực tế
    let effY = selYear;
    let effM = selMonth;
    let foundData = rawList.some(item => getSO(item, effY, effM) !== null);

    if (!foundData) {
      let curY = selYear;
      let curM = selMonth - 1;
      for (let step = 0; step < 24; step++) {
        if (curM <= 0) {
          curM = 12;
          curY -= 1;
        }
        if (rawList.some(item => getSO(item, curY, curM) !== null)) {
          effY = curY;
          effM = curM;
          foundData = true;
          break;
        }
        curM--;
      }
    }

    const prevM = effM > 1 ? effM - 1 : 12;
    const prevY = effM > 1 ? effY : effY - 1;

    const mapped = rawList.map(item => {
      const enumRegion = window.DashboardModule
        ? window.DashboardModule.resolveMienCode(item.mien)
        : (String(item.mien || '').toUpperCase().includes('NAM') ? 'SOUTH' : 'NORTH');

      const curSO = getSO(item, effY, effM);
      const prevSO = getSO(item, prevY, prevM);
      const lastYearSO = getSO(item, effY - 1, effM);

      const mom = (curSO !== null && prevSO !== null && prevSO > 0)
        ? Math.round(((curSO - prevSO) / prevSO) * 100)
        : null;

      const yoy = (curSO !== null && lastYearSO !== null && lastYearSO > 0)
        ? Math.round(((curSO - lastYearSO) / lastYearSO) * 100)
        : null;

      const shopObj = {
        dvn: String(item.dvn || '').trim(),
        svn: String(item.svn || '').trim(),
        name: item.name || '',
        region: enumRegion,
        subRegion: item.region || '',
        province: item.province || '',
        supervisor: item.supervisor || item.gdMien || 'Chưa phân công',
        director: item.gdKhuVuc || 'Chưa phân công',
        sale: item.sale || 'Chưa phân công',
        currentSO: curSO,
        prevSO: prevSO,
        lastYearSO: lastYearSO,
        mom: mom,
        yoy: yoy,
        hasFullData: curSO !== null
      };

      return {
        ...shopObj,
        eval: window.AppStore.evaluateShop(shopObj)
      };
    });

    const filteredByRegion = mapped.filter(s => regionFilter === 'ALL' || s.region === regionFilter);

    return {
      shops: filteredByRegion,
      selectedYear: selYear,
      selectedMonth: selMonth,
      effectiveYear: effY,
      effectiveMonth: effM,
      isFallbackFromPrevMonth: (effY !== selYear || effM !== selMonth)
    };
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
    window.AppStore.saveToStorage();

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
      const enumR = window.DashboardModule
        ? window.DashboardModule.resolveMienCode(s.mien || s.region)
        : (s.region || 'SOUTH');
      return enumR === regionFilter;
    });

    const supervisors = [...new Set(shops.map(s => s.supervisor || s.gdMien).filter(Boolean))].sort();
    const directors = [...new Set(shops.map(s => s.gdKhuVuc || s.director).filter(Boolean))].sort();
    const sales = [...new Set(shops.map(s => s.sale).filter(Boolean))].sort();
    return { shops, supervisors, directors, sales };
  },

  handlePlanSupervisorChange(supName) {
    this.planSupervisor = supName;
    this.planSaleFilter = 'ALL';
    window.App.renderCurrentModule();
  },

  handlePlanSaleChange(saleName) {
    this.planSaleFilter = saleName;
    window.App.renderCurrentModule();
  },

  togglePlanShopSelection(dvn, shopName) {
    const cleanDvn = String(dvn).trim();
    const exists = this.selectedPlanShops.some(s => s.dvn === cleanDvn);
    if (exists) {
      this.selectedPlanShops = this.selectedPlanShops.filter(s => s.dvn !== cleanDvn);
    } else {
      this.selectedPlanShops.push({ dvn: cleanDvn, name: shopName });
    }
    this.renderSelectedPlanShopTags();
    this.updateSaleShopCheckboxes();
  },

  selectAllShopsOfCurrentSale() {
    const { shops } = this.getRealShopsAndSupervisors();
    const sup = this.planSupervisor;
    const sale = this.planSaleFilter;

    const targetShops = shops.filter(s => {
      const matchSup = !sup || (s.supervisor || s.gdMien) === sup;
      const matchSale = sale === 'ALL' || s.sale === sale;
      return matchSup && matchSale;
    });

    targetShops.forEach(s => {
      const dvnStr = String(s.dvn).trim();
      if (!this.selectedPlanShops.some(item => item.dvn === dvnStr)) {
        this.selectedPlanShops.push({ dvn: dvnStr, name: s.name });
      }
    });

    this.renderSelectedPlanShopTags();
    this.updateSaleShopCheckboxes();
  },

  clearAllSelectedPlanShops() {
    this.selectedPlanShops = [];
    this.renderSelectedPlanShopTags();
    this.updateSaleShopCheckboxes();
  },

  updateSaleShopCheckboxes() {
    document.querySelectorAll('[data-plan-shop-dvn]').forEach(btn => {
      const dvn = btn.getAttribute('data-plan-shop-dvn');
      const isSelected = this.selectedPlanShops.some(s => s.dvn === dvn);
      btn.className = isSelected
        ? 'p-2 rounded-xl border border-[#F26522] bg-orange-50/80 text-left flex items-center justify-between gap-2 cursor-pointer transition shadow-sm'
        : 'p-2 rounded-xl border border-slate-200 bg-white hover:border-orange-300 text-left flex items-center justify-between gap-2 cursor-pointer transition';
      const icon = btn.querySelector('.shop-check-icon');
      if (icon) {
        icon.className = isSelected
          ? 'shop-check-icon fa-solid fa-circle-check text-[#F26522] text-sm shrink-0'
          : 'shop-check-icon fa-regular fa-circle text-slate-300 text-sm shrink-0';
      }
    });
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

  removePlanShopTag(dvn) {
    this.selectedPlanShops = this.selectedPlanShops.filter(item => item.dvn !== dvn);
    this.renderSelectedPlanShopTags();
    this.updateSaleShopCheckboxes();
  },

  renderSelectedPlanShopTags() {
    const box = document.getElementById('plan-selected-shops-box');
    if (!box) return;
    if (this.selectedPlanShops.length === 0) {
      box.innerHTML = `<span class="text-[11px] text-slate-400 italic">Chưa chọn cửa hàng cụ thể</span>`;
      return;
    }
    box.innerHTML = this.selectedPlanShops.map(s => `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
        <strong class="font-mono">${s.dvn}</strong> - ${s.name}
        <button type="button" onclick="TasksModule.removePlanShopTag('${s.dvn}')" class="text-rose-500 hover:text-rose-700 font-black ml-1 cursor-pointer">×</button>
      </span>
    `).join('');
  },

  async compressSingleImage(file, maxWidth = 960, maxHeight = 960, quality = 0.65) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(null);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  async readFilesAsDataUrls(fileList) {
    if (!fileList || fileList.length === 0) return [];
    const results = [];
    for (let i = 0; i < Math.min(6, fileList.length); i++) {
      const compressed = await this.compressSingleImage(fileList[i], 960, 960, 0.65);
      if (compressed) results.push(compressed);
    }
    return results;
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

  // Lọc danh sách công việc theo đúng Tháng/Năm & Miền đang chọn trên Header
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

  resetProposalFilters() {
    this.proposalDirectorFilter = 'ALL';
    this.proposalSupervisorFilter = 'ALL';
    this.proposalSaleFilter = 'ALL';
    this.proposalSearchQuery = '';
    window.App.renderCurrentModule();
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

  openCreateTaskModal(preset = {}) {
    const { shops, supervisors } = this.getRealShopsAndSupervisors();
    const isManager = this.isManagerRole();
    const currentUserName = window.AppState?.userName || 'Giám sát';
    const taskType = preset.taskType || 'TASK';
    const today = new Date().toISOString().slice(0, 10);

    const preselectedShop = preset.dvn
      ? shops.find(s => String(s.dvn).trim() === String(preset.dvn).trim())
      : null;
    const preselectedDisplay = preselectedShop
      ? `${preselectedShop.dvn} - ${preselectedShop.name}`
      : (preset.dvn || '');

    const modalTitles = {
      'TASK': isManager ? 'Giao Nhiệm Vụ Mới Cho Giám Sát (派发新任务)' : 'Tạo Nhiệm Vụ Cá Nhân (创建个人任务)',
      'MARKET_PLAN': 'Đăng Ký Kế Hoạch Tuần / Lịch Thị Trường (市场周计划)',
      'STORE_VISIT': 'Check-in & Báo Cáo Chuyến Thăm Cửa Hàng (门店巡访打卡)'
    };

    document.getElementById('modal-title').innerText = modalTitles[taskType] || modalTitles['TASK'];
    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="TasksModule.handleSaveNewTask(event, '${taskType}')" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div class="md:col-span-2">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              ${taskType === 'STORE_VISIT' ? 'Nội dung kiểm tra / Check-in cửa hàng *' : 'Tiêu đề nhiệm vụ / Công việc *'}
            </label>
            <input
              id="new-task-title"
              type="text"
              required
              value="${preset.title || ''}"
              placeholder="VD: Kiểm tra trưng bày 3824 & hỗ trợ đẩy S.O tại cửa hàng..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div class="relative">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Cửa hàng liên quan (Gõ mã DVN hoặc Tên Shop)
            </label>
            <input type="hidden" id="new-task-dvn" value="${preset.dvn || ''}" />
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="modal-shop-search-input"
                type="text"
                autocomplete="off"
                value="${preselectedDisplay}"
                onfocus="TasksModule.filterShopAutocomplete('modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                oninput="TasksModule.filterShopAutocomplete('modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                placeholder="Gõ DVN hoặc tên cửa hàng..."
                class="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 font-bold text-blue-700 focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="button"
                onclick="TasksModule.selectShopOption('', '', '', 'modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
              >×</button>
            </div>
            <div
              id="modal-shop-dropdown"
              class="hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-50"
            ></div>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Giám sát thực hiện *</label>
            <select
              id="new-task-assignee"
              required
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-orange-600 focus:outline-none focus:border-[#F26522]"
            >
              ${supervisors.length > 0 ? supervisors.map(sup => `
                <option value="${sup}" ${(preset.assignee === sup || currentUserName.includes(sup)) ? 'selected' : ''}>${sup}</option>
              `).join('') : `<option value="${currentUserName}">${currentUserName}</option>`}
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Ngày bắt đầu / Ngày Check-in *</label>
            <input
              id="new-task-start"
              type="date"
              required
              value="${preset.startDate || today}"
              class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Hạn hoàn thành (Deadline) *</label>
            <input
              id="new-task-deadline"
              type="date"
              required
              value="${preset.deadline || today}"
              class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Mức độ ưu tiên</label>
            <select id="new-task-priority" class="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-[#F26522]">
              <option value="HIGH" ${preset.priority === 'HIGH' ? 'selected' : ''}>🔥 Khẩn cấp / Cao (HIGH)</option>
              <option value="MEDIUM" ${(!preset.priority || preset.priority === 'MEDIUM') ? 'selected' : ''}>⚡ Trung bình (MEDIUM)</option>
              <option value="LOW" ${preset.priority === 'LOW' ? 'selected' : ''}>📌 Thông thường (LOW)</option>
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Tiến độ (%)</label>
            <input id="new-task-progress" type="number" min="0" max="100" value="${taskType === 'STORE_VISIT' ? 100 : 0}" class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold" />
          </div>
        </div>

        ${taskType === 'STORE_VISIT' ? `
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="font-extrabold text-slate-800 uppercase text-[11px]">Checklist Kiểm Tra Tiêu Chuẩn Cửa Hàng (3824 & Vận hành)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-signboard" checked class="accent-[#F26522]" /> 1. Biển hiệu & Mặt tiền sạch chuẩn</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-display" checked class="accent-[#F26522]" /> 2. Trưng bày xe & Đủ bảng giá POP</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-staff" checked class="accent-[#F26522]" /> 3. Tác phong & Kỹ năng tư vấn Sale</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-inventory" checked class="accent-[#F26522]" /> 4. Kiểm đếm tồn kho thực tế & Cloud Sale</label>
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Nội dung công việc / Vấn đề ghi nhận tại Shop</label>
            <textarea
              id="new-task-note"
              rows="3"
              placeholder="Ghi rõ các đầu việc, hiện trạng trưng bày, tồn kho hoặc nguyên nhân S.O thấp..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#F26522]"
            >${preset.note || ''}</textarea>
          </div>
          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Giải pháp thực thi / Đề xuất hỗ trợ</label>
            <textarea
              id="new-task-solution"
              rows="3"
              placeholder="Phương án xử lý, đào tạo nhân sự hoặc kế hoạch thúc đẩy S.O..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#F26522]"
            >${preset.solution || ''}</textarea>
          </div>
        </div>

        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Hình ảnh Check-in / Minh chứng thực địa
          </label>
          <input
            id="new-task-files"
            type="file"
            accept="image/*"
            multiple
            onchange="TasksModule.previewCompressedFiles(this, 'new-task-image-preview')"
            class="w-full p-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs cursor-pointer"
          />
          <div id="new-task-image-preview" class="mt-2"></div>
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-paper-plane mr-1"></i> Lưu & Triển Khai
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async handleSaveNewTask(e, taskType) {
    e.preventDefault();
    const { shops } = this.getRealShopsAndSupervisors();
    const dvnVal = String(document.getElementById('new-task-dvn')?.value || '').trim();
    const matchedShop = shops.find(s => String(s.dvn).trim() === dvnVal);

    const title = document.getElementById('new-task-title').value.trim();
    const assignee = document.getElementById('new-task-assignee').value.trim();
    const startDate = document.getElementById('new-task-start').value;
    const deadline = document.getElementById('new-task-deadline').value;
    const priority = document.getElementById('new-task-priority').value;
    const note = document.getElementById('new-task-note').value.trim();
    const solution = document.getElementById('new-task-solution')?.value.trim() || '';
    const initProgress = Number(document.getElementById('new-task-progress')?.value || 0);
    const fileInput = document.getElementById('new-task-files');
    const uploadedImages = await this.readFilesAsDataUrls(fileInput?.files);

    let initialStatus = 'NOT_STARTED';
    if (taskType === 'MARKET_PLAN') initialStatus = 'IN_PROGRESS';
    else if (taskType === 'STORE_VISIT') initialStatus = 'PENDING_APPROVAL';
    else if (initProgress > 0 && initProgress < 100) initialStatus = 'IN_PROGRESS';
    else if (initProgress === 100) initialStatus = 'PENDING_APPROVAL';

    const checklist = taskType === 'STORE_VISIT' ? {
      signboard: Boolean(document.getElementById('chk-signboard')?.checked),
      display: Boolean(document.getElementById('chk-display')?.checked),
      staff: Boolean(document.getElementById('chk-staff')?.checked),
      inventory: Boolean(document.getElementById('chk-inventory')?.checked)
    } : {};

    const prefix = taskType === 'MARKET_PLAN' ? 'PLAN' : taskType === 'STORE_VISIT' ? 'VISIT' : 'TASK';
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const actor = window.AppState?.userName || 'Hệ thống';

    const newTask = {
      id: newId,
      taskType: taskType,
      title: title,
      note: note,
      issues: note,
      solution: solution,
      dvn: dvnVal,
      shopName: matchedShop ? matchedShop.name : '',
      region: matchedShop
        ? (window.DashboardModule ? window.DashboardModule.resolveMienCode(matchedShop.mien || matchedShop.region) : 'SOUTH')
        : (window.AppState?.region === 'ALL' ? 'SOUTH' : window.AppState?.region),
      assignee: assignee,
      assigner: actor,
      priority: priority,
      startDate: startDate,
      deadline: deadline,
      progress: taskType === 'STORE_VISIT' ? 100 : initProgress,
      status: initialStatus,
      isSpecialTrip: false,
      checklist: checklist,
      evidenceUrls: uploadedImages,
      history: [
        {
          time: new Date().toLocaleString('vi-VN'),
          isoDate: new Date().toISOString().slice(0, 10),
          actor: actor,
          action: taskType === 'STORE_VISIT'
            ? `Check-in cửa hàng (${uploadedImages.length} ảnh minh chứng)`
            : 'Khởi tạo nhiệm vụ mới'
        }
      ],
      createdAt: new Date().toISOString()
    };

    await this.persistTask(newTask);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  async handleQuickSaveWeeklyPlan(e) {
    e.preventDefault();
    const assignee = document.getElementById('plan-week-assignee')?.value.trim() || window.AppState?.userName || 'Giám sát';
    const weekStart = document.getElementById('plan-week-start')?.value || '';
    const weekEnd = document.getElementById('plan-week-end')?.value || '';
    const rawTasksText = document.getElementById('plan-week-tasks-input')?.value.trim() || '';

    if (!rawTasksText) {
      alert('Vui lòng liệt kê các đầu việc dự kiến thực hiện trong tuần!');
      return;
    }

    const dvnListStr = this.selectedPlanShops.map(s => s.dvn).join(', ');
    const shopNamesStr = this.selectedPlanShops.map(s => `${s.dvn} (${s.name})`).join(' • ');

    const lines = rawTasksText.split('\n').map(l => l.trim()).filter(Boolean);
    const summaryTitle = `Kế hoạch tuần (${weekStart} → ${weekEnd}): ${lines[0].replace(/^[-*•\d.]+\s*/, '')}`;

    const newPlan = {
      id: `PLAN-${Date.now().toString().slice(-6)}`,
      taskType: 'MARKET_PLAN',
      title: summaryTitle,
      note: rawTasksText,
      issues: rawTasksText,
      solution: shopNamesStr ? `Danh sách Shop ghé thăm: ${shopNamesStr}` : 'Triển khai theo lịch tuần của Giám sát',
      dvn: dvnListStr,
      shopName: shopNamesStr,
      region: window.AppState?.region === 'ALL' ? 'SOUTH' : window.AppState?.region,
      assignee: assignee,
      assigner: assignee,
      priority: 'MEDIUM',
      startDate: weekStart,
      deadline: weekEnd,
      progress: 20,
      status: 'IN_PROGRESS',
      isSpecialTrip: false,
      checklist: {},
      evidenceUrls: [],
      history: [
        {
          time: new Date().toLocaleString('vi-VN'),
          isoDate: new Date().toISOString().slice(0, 10),
          actor: assignee,
          action: `Đăng ký kế hoạch làm việc tuần (${lines.length} đầu việc)`
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.selectedPlanShops = [];
    await this.persistTask(newPlan);
    window.App.renderCurrentModule();
  },

  openTaskDetailModal(taskId) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const isManager = this.isManagerRole();
    const historyList = Array.isArray(task.history) ? task.history : [];
    const images = Array.isArray(task.evidenceUrls) ? task.evidenceUrls : [];

    document.getElementById('modal-title').innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-400">${task.id}</span>
        <span>${task.title}</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Mã DVN / Cửa hàng</div>
            <div class="font-mono font-black text-blue-600 mt-0.5">${task.dvn || 'Toàn vùng'}</div>
            <div class="font-bold text-slate-800 truncate">${task.shopName || '—'}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Giám sát thực hiện</div>
            <div class="font-extrabold text-orange-600 mt-0.5">${task.assignee || '—'}</div>
            <div class="text-[10px] text-slate-500">Người tạo: ${task.assigner || 'Admin'}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Thời gian</div>
            <div class="font-mono font-bold text-slate-800 mt-0.5">${task.startDate || '—'} → ${task.deadline || '—'}</div>
            <div class="mt-0.5">${this.renderPriorityBadge(task.priority)}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</div>
            <div class="mt-1">${this.renderStatusBadge(task)}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white">
          <div class="font-extrabold text-slate-900 uppercase text-xs flex items-center justify-between">
            <span>Cập Nhật Tiến Độ, Danh Sách Việc Tuần & Hình Ảnh Check-in</span>
            <span class="font-mono text-[#F26522] font-black">${task.progress || 0}%</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-600 mb-1">Tiến độ hoàn thành (%)</label>
              <input id="detail-task-progress" type="range" min="0" max="100" step="10" value="${task.progress || 0}" oninput="document.getElementById('detail-prog-label').innerText = this.value + '%'" class="w-full accent-[#F26522] cursor-pointer" />
              <div class="flex justify-between text-[11px] font-mono text-slate-500"><span>0%</span><strong id="detail-prog-label" class="text-[#F26522]">${task.progress || 0}%</strong><span>100%</span></div>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Trạng thái xử lý</label>
              <select id="detail-task-status" class="w-full p-2 rounded-xl border border-slate-300 font-bold">
                <option value="NOT_STARTED" ${task.status === 'NOT_STARTED' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="PENDING_APPROVAL" ${task.status === 'PENDING_APPROVAL' ? 'selected' : ''}>Gửi chờ phê duyệt</option>
                ${isManager ? `
                  <option value="REVISION_REQUIRED" ${task.status === 'REVISION_REQUIRED' ? 'selected' : ''}>Yêu cầu bổ sung</option>
                  <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Phê duyệt Hoàn thành</option>
                  <option value="CANCELLED" ${task.status === 'CANCELLED' ? 'selected' : ''}>Hủy nhiệm vụ</option>
                ` : ''}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Danh sách đầu việc / Vấn đề ghi nhận</label>
              <textarea id="detail-task-issues" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-medium">${task.issues || task.note || ''}</textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Kết quả đạt được / Giải pháp</label>
              <textarea id="detail-task-solution" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-medium">${task.solution || ''}</textarea>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Tải thêm ảnh Check-in thực địa</label>
            <input
              id="detail-task-files"
              type="file"
              accept="image/*"
              multiple
              onchange="TasksModule.previewCompressedFiles(this, 'detail-image-preview')"
              class="w-full p-1.5 rounded-xl border border-dashed border-slate-300 text-xs cursor-pointer"
            />
            <div id="detail-image-preview" class="mt-2"></div>
          </div>

          ${images.length > 0 ? `
            <div>
              <div class="font-bold text-slate-600 mb-1.5">Hình ảnh Check-in đã lưu (${images.length} ảnh):</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${images.map(url => `<img src="${url}" onclick="window.open('${url}')" class="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90" />`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <div class="flex flex-wrap items-center gap-2">
              ${isManager ? `
                <button
                  type="button"
                  onclick="TasksModule.managerQuickReview('${task.id}', 'COMPLETED')"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                >
                  <i class="fa-solid fa-check mr-1"></i> Phê Duyệt Hoàn Thành
                </button>
                <button
                  type="button"
                  onclick="TasksModule.managerQuickReview('${task.id}', 'REVISION_REQUIRED')"
                  class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold cursor-pointer"
                >
                  <i class="fa-solid fa-rotate-left mr-1"></i> Yêu Cầu Bổ Sung
                </button>
              ` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="TasksModule.saveTaskDetailUpdate('${task.id}', true)"
                class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold cursor-pointer"
              >
                Báo Cáo Hoàn Tất
              </button>
              <button
                type="button"
                onclick="TasksModule.saveTaskDetailUpdate('${task.id}', false)"
                class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold cursor-pointer"
              >
                Lưu Cập Nhật
              </button>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="font-extrabold text-slate-700 uppercase text-[11px]">Lịch Sử Theo Dõi & Cập Nhật (${historyList.length})</div>
          <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            ${historyList.map(h => `
              <div class="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                <div><strong class="text-slate-800">${h.actor}:</strong> <span class="text-slate-600">${h.action}</span></div>
                <span class="font-mono text-[10px] text-slate-400 shrink-0 ml-2">${h.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async saveTaskDetailUpdate(taskId, submitForApproval = false) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const progress = Number(document.getElementById('detail-task-progress')?.value || task.progress || 0);
    let status = document.getElementById('detail-task-status')?.value || task.status;
    if (submitForApproval) status = 'PENDING_APPROVAL';

    const issues = document.getElementById('detail-task-issues')?.value.trim() || '';
    const solution = document.getElementById('detail-task-solution')?.value.trim() || '';
    const fileInput = document.getElementById('detail-task-files');
    const newImages = await this.readFilesAsDataUrls(fileInput?.files);

    task.progress = submitForApproval ? 100 : progress;
    task.status = status;
    task.issues = issues;
    task.note = issues;
    task.solution = solution;
    if (newImages.length > 0) {
      task.evidenceUrls = [...(task.evidenceUrls || []), ...newImages];
    }

    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Giám sát',
      action: submitForApproval
        ? `Báo cáo hoàn tất (${newImages.length > 0 ? '+' + newImages.length + ' ảnh' : 'Chờ duyệt'})`
        : `Cập nhật tiến độ (${task.progress}%)`
    });

    await this.persistTask(task);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  async managerQuickReview(taskId, targetStatus) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const feedback = targetStatus === 'REVISION_REQUIRED'
      ? prompt('Nhập ghi chú yêu cầu bổ sung gửi cho Giám sát:', 'Vui lòng bổ sung thêm hình ảnh check-in tại cửa hàng.')
      : 'Đã xác nhận hoàn thành';

    if (targetStatus === 'REVISION_REQUIRED' && feedback === null) return;

    task.status = targetStatus;
    if (targetStatus === 'COMPLETED') task.progress = 100;
    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Trưởng phòng',
      action: targetStatus === 'COMPLETED' ? 'Xác nhận Hoàn thành' : `Yêu cầu bổ sung: ${feedback}`
    });

    await this.persistTask(task);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  handleDragStart(event, taskId) {
    this.draggedTaskId = String(taskId);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(taskId));
    }
  },

  async handleDropOnColumn(event, newStatus) {
    event.preventDefault();
    const taskId = this.draggedTaskId || event.dataTransfer?.getData('text/plain');
    if (!taskId) return;

    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task || task.status === newStatus) return;

    if (newStatus === 'COMPLETED' && !this.isManagerRole()) {
      newStatus = 'PENDING_APPROVAL';
    }

    task.status = newStatus;
    if (newStatus === 'COMPLETED') task.progress = 100;
    if (newStatus === 'IN_PROGRESS' && task.progress === 0) task.progress = 25;

    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Người dùng',
      action: `Kéo thả Kanban sang: ${newStatus}`
    });

    this.draggedTaskId = null;
    await this.persistTask(task);
    window.App.renderCurrentModule();
  },

  renderListTab(tasks) {
    const isManager = this.isManagerRole();
    const selectedYM = this.getSelectedYearMonth();
    const [yStr, mStr] = selectedYM.split('-');

    return `
      <div class="card-3d overflow-hidden">
        <div class="overflow-x-auto max-h-[60vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-600 uppercase font-extrabold border-b">
              <tr>
                <th class="p-3.5">Mã CV</th>
                <th class="p-3.5">Nội dung công việc</th>
                <th class="p-3.5">Mã DVN / Shop</th>
                <th class="p-3.5">Giám sát</th>
                <th class="p-3.5">Ưu tiên</th>
                <th class="p-3.5">Thời gian</th>
                <th class="p-3.5">Tiến độ</th>
                <th class="p-3.5">Trạng thái</th>
                <th class="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${tasks.map(task => `
                <tr class="hover:bg-orange-50/30 transition">
                  <td class="p-3.5 font-mono font-black text-slate-800 dark:text-slate-200">
                    <button onclick="TasksModule.openTaskDetailModal('${task.id}')" class="hover:text-[#F26522] hover:underline cursor-pointer">${task.id}</button>
                  </td>
                  <td class="p-3.5 max-w-xs">
                    <div class="font-bold text-slate-900 dark:text-white">${task.title}</div>
                    ${task.note ? `<div class="text-[11px] text-slate-500 line-clamp-2 mt-0.5 whitespace-pre-line">${task.note}</div>` : ''}
                  </td>
                  <td class="p-3.5">
                    ${task.dvn ? `
                      <div class="font-mono font-extrabold text-blue-600">${task.dvn}</div>
                      <div class="text-[11px] text-slate-600 truncate max-w-[160px]">${task.shopName || ''}</div>
                    ` : `<span class="text-slate-400">Lịch vùng / Chung</span>`}
                  </td>
                  <td class="p-3.5 font-extrabold text-orange-600">${task.assignee || '—'}</td>
                  <td class="p-3.5">${this.renderPriorityBadge(task.priority)}</td>
                  <td class="p-3.5 font-mono text-[11px]">
                    <div>${task.startDate || '—'}</div>
                    <div class="${this.isTaskOverdue(task) ? 'text-rose-600 font-black' : 'text-slate-500'}">→ ${task.deadline || '—'}</div>
                  </td>
                  <td class="p-3.5 w-32">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-[#F26522]" style="width:${task.progress || 0}%"></div>
                      </div>
                      <span class="font-mono font-bold">${task.progress || 0}%</span>
                    </div>
                  </td>
                  <td class="p-3.5">${this.renderStatusBadge(task)}</td>
                  <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button
                      onclick="TasksModule.openTaskDetailModal('${task.id}')"
                      class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    ${isManager && task.status === 'PENDING_APPROVAL' ? `
                      <button
                        onclick="TasksModule.managerQuickReview('${task.id}', 'COMPLETED')"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                      >
                        Duyệt
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
              ${tasks.length === 0 ? `
                <tr>
                  <td colspan="9" class="py-12 text-center text-slate-400 font-semibold">
                    Không có nhiệm vụ nào được giao trong Tháng ${mStr}/${yStr}.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderKanbanTab(tasks) {
    const columns = [
      { id: 'NOT_STARTED', title: window.t('tm_st_not_started'), border: 'border-t-slate-400' },
      { id: 'IN_PROGRESS', title: window.t('tm_st_in_progress'), border: 'border-t-blue-500' },
      { id: 'PENDING_APPROVAL', title: window.t('tm_st_pending'), border: 'border-t-amber-500' },
      { id: 'REVISION_REQUIRED', title: window.t('tm_st_revision'), border: 'border-t-purple-500' },
      { id: 'COMPLETED', title: window.t('tm_st_completed'), border: 'border-t-emerald-500' }
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => (t.status || 'NOT_STARTED') === col.id);
          return `
            <div
              ondragover="event.preventDefault()"
              ondrop="TasksModule.handleDropOnColumn(event, '${col.id}')"
              class="card-3d p-3.5 border-t-4 ${col.border} flex flex-col justify-between min-h-[420px] bg-slate-50/70 dark:bg-slate-900/60"
            >
              <div>
                <div class="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <span class="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">${col.title}</span>
                  <span class="px-2 py-0.5 rounded-full bg-white border text-xs font-mono font-black text-[#F26522]">${colTasks.length}</span>
                </div>

                <div class="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                  ${colTasks.map(t => `
                    <div
                      draggable="true"
                      ondragstart="TasksModule.handleDragStart(event, '${t.id}')"
                      onclick="TasksModule.openTaskDetailModal('${t.id}')"
                      class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#F26522] transition cursor-grab active:cursor-grabbing space-y-2 text-xs"
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-[10px] font-black text-blue-600 truncate max-w-[110px]">${t.dvn || t.id}</span>
                        ${this.renderPriorityBadge(t.priority)}
                      </div>
                      <div class="font-bold text-slate-900 dark:text-white leading-snug">${t.title}</div>
                      <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span class="font-bold text-orange-600 truncate">${t.assignee}</span>
                        <span class="font-mono ${this.isTaskOverdue(t) ? 'text-rose-600 font-black' : 'text-slate-400'}">${t.deadline || ''}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="pt-2 text-center text-[10px] text-slate-400 font-medium">Kéo thả thẻ để đổi trạng thái</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderMarketPlanTab(tasks) {
    const { shops, supervisors } = this.getRealShopsAndSupervisors();
    const currentUserName = window.AppState?.userName || '';
    const week = this.getCurrentWeekRange();

    if (!this.planSupervisor) {
      const matchedSup = supervisors.find(s => currentUserName.includes(s));
      this.planSupervisor = matchedSup || supervisors[0] || currentUserName || 'Giám sát';
    }

    const supShops = shops.filter(s => !this.planSupervisor || (s.supervisor || s.gdMien) === this.planSupervisor);
    const salesOfSup = [...new Set(supShops.map(s => s.sale).filter(Boolean))].sort();

    const shopsOfSelectedSale = this.planSaleFilter === 'ALL'
      ? []
      : supShops.filter(s => s.sale === this.planSaleFilter);

    const plans = tasks.filter(t => t.taskType === 'MARKET_PLAN' || String(t.id).startsWith('PLAN-'));

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="card-3d p-5 lg:col-span-5 space-y-4 border-t-4 border-t-[#F26522]">
          <div>
            <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-[#F26522]"></i>
              Lập Nhanh Kế Hoạch Tuần (Giám Sát Tự Xây)
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Chọn Giám sát và lọc theo Nhân viên Sale để sổ ra danh sách cửa hàng chọn nhanh, sau đó liệt kê công việc trong tuần.
            </p>
          </div>

          <form onsubmit="TasksModule.handleQuickSaveWeeklyPlan(event)" class="space-y-3.5 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block font-extrabold text-slate-700 mb-1">1. Giám sát phụ trách *</label>
                <select
                  id="plan-week-assignee"
                  required
                  onchange="TasksModule.handlePlanSupervisorChange(this.value)"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-orange-600 focus:outline-none focus:border-[#F26522]"
                >
                  ${supervisors.length > 0 ? supervisors.map(sup => `
                    <option value="${sup}" ${this.planSupervisor === sup ? 'selected' : ''}>${sup}</option>
                  `).join('') : `<option value="${this.planSupervisor}">${this.planSupervisor}</option>`}
                </select>
              </div>

              <div>
                <label class="block font-extrabold text-slate-700 mb-1">2. Lọc theo Sale (Sổ ra Shop)</label>
                <select
                  id="plan-week-sale-filter"
                  onchange="TasksModule.handlePlanSaleChange(this.value)"
                  class="w-full p-2.5 rounded-xl border border-blue-300 bg-blue-50/40 font-bold text-blue-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
                >
                  <option value="ALL">-- Chọn Sale để sổ ra Shop (${salesOfSup.length} Sale) --</option>
                  ${salesOfSup.map(sl => {
                    const count = supShops.filter(x => x.sale === sl).length;
                    return `<option value="${sl}" ${this.planSaleFilter === sl ? 'selected' : ''}>${sl} (${count} shop)</option>`;
                  }).join('')}
                </select>
              </div>
            </div>

            ${this.planSaleFilter !== 'ALL' ? `
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-[11px] text-slate-700">
                    Danh sách Shop của Sale <span class="text-blue-600">${this.planSaleFilter}</span> (${shopsOfSelectedSale.length} shop):
                  </span>
                  <button
                    type="button"
                    onclick="TasksModule.selectAllShopsOfCurrentSale()"
                    class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold cursor-pointer"
                  >
                    + Chọn tất cả (${shopsOfSelectedSale.length})
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  ${shopsOfSelectedSale.map(s => {
                    const dvnStr = String(s.dvn).trim();
                    const safeName = String(s.name || '').replace(/'/g, "\\'");
                    const isSelected = this.selectedPlanShops.some(item => item.dvn === dvnStr);
                    return `
                      <button
                        type="button"
                        data-plan-shop-dvn="${dvnStr}"
                        onclick="TasksModule.togglePlanShopSelection('${dvnStr}', '${safeName}')"
                        class="${isSelected
                          ? 'p-2 rounded-xl border border-[#F26522] bg-orange-50/80 text-left flex items-center justify-between gap-2 cursor-pointer transition shadow-sm'
                          : 'p-2 rounded-xl border border-slate-200 bg-white hover:border-orange-300 text-left flex items-center justify-between gap-2 cursor-pointer transition'
                        }"
                      >
                        <div class="truncate">
                          <div class="font-mono font-black text-blue-600 text-[11px]">${dvnStr}</div>
                          <div class="font-bold text-slate-800 truncate text-[11px]">${s.name}</div>
                        </div>
                        <i class="shop-check-icon ${isSelected ? 'fa-solid fa-circle-check text-[#F26522]' : 'fa-regular fa-circle text-slate-300'} text-sm shrink-0"></i>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-extrabold text-slate-700 mb-1">Từ ngày (Đầu tuần)</label>
                <input id="plan-week-start" type="date" required value="${week.start}" class="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold" />
              </div>
              <div>
                <label class="block font-extrabold text-slate-700 mb-1">Đến ngày (Cuối tuần)</label>
                <input id="plan-week-end" type="date" required value="${week.end}" class="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold" />
              </div>
            </div>

            <div class="relative">
              <div class="flex items-center justify-between mb-1">
                <label class="font-extrabold text-slate-700">
                  3. Cửa hàng dự kiến ghé (${this.selectedPlanShops.length} shop đã chọn)
                </label>
                ${this.selectedPlanShops.length > 0 ? `
                  <button type="button" onclick="TasksModule.clearAllSelectedPlanShops()" class="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer">
                    Xóa hết
                  </button>
                ` : ''}
              </div>
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  id="plan-shop-search-input"
                  type="text"
                  autocomplete="off"
                  onfocus="TasksModule.filterShopAutocomplete('plan-shop-search-input', 'plan-shop-dropdown', '')"
                  oninput="TasksModule.filterShopAutocomplete('plan-shop-search-input', 'plan-shop-dropdown', '')"
                  placeholder="Hoặc gõ mã DVN / tên cửa hàng để thêm nhanh..."
                  class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div
                id="plan-shop-dropdown"
                class="hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl shadow-2xl max-h-52 overflow-y-auto z-40"
              ></div>

              <div id="plan-selected-shops-box" class="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-y-auto">
                ${this.selectedPlanShops.length === 0
                  ? `<span class="text-[11px] text-slate-400 italic">Chưa chọn cửa hàng cụ thể</span>`
                  : this.selectedPlanShops.map(s => `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                      <strong class="font-mono">${s.dvn}</strong> - ${s.name}
                      <button type="button" onclick="TasksModule.removePlanShopTag('${s.dvn}')" class="text-rose-500 hover:text-rose-700 font-black ml-1 cursor-pointer">×</button>
                    </span>
                  `).join('')
                }
              </div>
            </div>

            <div>
              <label class="block font-extrabold text-slate-700 mb-1">
                4. Liệt kê các công việc thực hiện trong tuần *
              </label>
              <textarea
                id="plan-week-tasks-input"
                rows="4"
                required
                placeholder="- Thứ 2-3: Kiểm tra trưng bày 3824 & tồn kho đại lý&#10;- Thứ 4-5: Đào tạo kỹ năng tư vấn bán hàng cho NVBH mới&#10;- Thứ 6-7: Hỗ trợ chương trình thúc đẩy S.O cuối tuần..."
                class="w-full p-3 rounded-xl border border-slate-300 font-medium leading-relaxed focus:outline-none focus:border-[#F26522]"
              ></textarea>
            </div>

            <button type="submit" class="btn-3d-orange w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider cursor-pointer">
              <i class="fa-solid fa-paper-plane mr-1.5"></i> Lưu Kế Hoạch Tuần
            </button>
          </form>
        </div>

        <div class="card-3d p-5 lg:col-span-7 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-clipboard-list text-blue-600"></i>
                Bảng Theo Dõi Kế Hoạch Tuần Của Đội Ngũ Giám Sát
              </h3>
              <p class="text-xs text-slate-500">Trưởng phòng theo dõi toàn bộ danh sách công việc tuần do từng Giám sát đăng ký</p>
            </div>
            <span class="px-3 py-1 rounded-lg bg-orange-50 text-[#F26522] font-extrabold text-xs">
              ${plans.length} Kế hoạch tuần
            </span>
          </div>

          <div class="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
            ${plans.map(p => {
              const bulletLines = String(p.note || '').split('\n').map(l => l.trim()).filter(Boolean);
              return `
                <div class="p-4 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 space-y-2.5 shadow-sm hover:border-[#F26522] transition text-xs">
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded-lg bg-[#111625] text-amber-400 font-extrabold">${p.assignee}</span>
                      <span class="font-mono font-bold text-slate-500">Tuần: ${p.startDate} → ${p.deadline}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      ${this.renderStatusBadge(p)}
                      <button
                        onclick="TasksModule.openTaskDetailModal('${p.id}')"
                        class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                      >
                        Cập nhật / Duyệt
                      </button>
                    </div>
                  </div>

                  ${p.dvn ? `
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-[11px] font-bold text-slate-500"><i class="fa-solid fa-store text-[#F26522] mr-1"></i>Cửa hàng ghé thăm:</span>
                      <span class="font-mono font-bold text-blue-600">${p.shopName || p.dvn}</span>
                    </div>
                  ` : ''}

                  <div class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div class="text-[10px] font-extrabold uppercase text-slate-400">Danh sách công việc đăng ký trong tuần:</div>
                    <ul class="space-y-1 text-slate-800 dark:text-slate-200 font-semibold">
                      ${bulletLines.map(line => `<li class="flex items-start gap-1.5"><span class="text-[#F26522] font-black">•</span><span>${line.replace(/^[-*•]+\s*/, '')}</span></li>`).join('')}
                    </ul>
                  </div>
                </div>
              `;
            }).join('')}

            ${plans.length === 0 ? `
              <div class="py-16 text-center text-slate-400 font-semibold">
                Chưa có Giám sát nào đăng ký kế hoạch tuần trong tháng đang chọn.
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderStoreVisitTab(tasks) {
    const visits = tasks.filter(t => t.taskType === 'STORE_VISIT' || (t.evidenceUrls && t.evidenceUrls.length > 0));
    return `
      <div class="card-3d p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-camera-retro text-[#F26522]"></i>
              Nhật Ký Check-in Cửa Hàng & Hình Ảnh Minh Chứng
            </h3>
            <p class="text-xs text-slate-500">Theo dõi kết quả kiểm tra tiêu chuẩn cửa hàng, hình ảnh thực địa và phương án xử lý tại đại lý</p>
          </div>
          <button
            onclick="TasksModule.openCreateTaskModal({ taskType: 'STORE_VISIT' })"
            class="btn-3d-orange px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            <i class="fa-solid fa-camera mr-1"></i> + Check-in & Up Hình Cửa Hàng
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${visits.map(v => {
            const chk = v.checklist || {};
            const imgs = Array.isArray(v.evidenceUrls) ? v.evidenceUrls : [];
            return `
              <div class="p-4 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 space-y-3 text-xs shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="font-mono font-black text-blue-600 text-sm">${v.dvn || v.id}</span>
                    <span class="font-extrabold text-slate-900 dark:text-white ml-1.5">${v.shopName || v.title}</span>
                    <div class="text-[11px] text-slate-500 mt-0.5">Giám sát: <strong class="text-orange-600">${v.assignee}</strong> • Ngày: ${v.startDate || v.deadline}</div>
                  </div>
                  ${this.renderStatusBadge(v)}
                </div>

                <div class="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-50 border text-[11px] font-semibold">
                  <div>${chk.signboard !== false ? '✅' : '❌'} Biển hiệu & Mặt tiền</div>
                  <div>${chk.display !== false ? '✅' : '❌'} Trưng bày & Bảng giá</div>
                  <div>${chk.staff !== false ? '✅' : '❌'} Tác phong nhân viên</div>
                  <div>${chk.inventory !== false ? '✅' : '❌'} Tồn kho Cloud Sale</div>
                </div>

                <div class="space-y-1">
                  <div><strong class="text-slate-700">Kết quả / Vấn đề:</strong> <span class="text-slate-600">${v.issues || v.note || 'Đạt chuẩn vận hành'}</span></div>
                  <div><strong class="text-emerald-700">Giải pháp:</strong> <span class="text-slate-600">${v.solution || 'Duy trì kiểm tra định kỳ'}</span></div>
                </div>

                ${imgs.length > 0 ? `
                  <div class="grid grid-cols-3 gap-2 pt-1">
                    ${imgs.map(u => `<img src="${u}" onclick="window.open('${u}')" class="h-24 w-full object-cover rounded-lg border cursor-pointer hover:opacity-90" />`).join('')}
                  </div>
                ` : ''}

                <div class="pt-2 border-t flex justify-end">
                  <button onclick="TasksModule.openTaskDetailModal('${v.id}')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer">
                    Chi tiết / Up thêm ảnh
                  </button>
                </div>
              </div>
            `;
          }).join('')}
          ${visits.length === 0 ? `
            <div class="col-span-full py-12 text-center text-slate-400 font-semibold">
              Chưa có biên bản Check-in cửa hàng nào trong tháng đang chọn. Bấm "+ Check-in & Up Hình Cửa Hàng" để ghi nhận kết quả kiểm tra thực địa!
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Tab 5: Đề xuất từ S.O (Tự động lùi về lấy số liệu S.O của tháng trước nếu tháng đang chọn chưa có số liệu)
  renderSOProposalTab() {
    const {
      shops,
      selectedYear,
      selectedMonth,
      effectiveYear,
      effectiveMonth,
      isFallbackFromPrevMonth
    } = this.getEvaluatedShopsWithFallback();

    const allWeakOrDeclining = shops
      .filter(s => s.eval.grade === 'WEAK' || (s.yoy !== null && s.yoy <= -20))
      .sort((a, b) => (a.currentSO ?? 999) - (b.currentSO ?? 999));

    const directors = [...new Set(allWeakOrDeclining.map(s => s.director).filter(Boolean))].sort();
    const supervisors = [...new Set(
      allWeakOrDeclining
        .filter(s => this.proposalDirectorFilter === 'ALL' || s.director === this.proposalDirectorFilter)
        .map(s => s.supervisor)
        .filter(Boolean)
    )].sort();
    const sales = [...new Set(
      allWeakOrDeclining
        .filter(s =>
          (this.proposalDirectorFilter === 'ALL' || s.director === this.proposalDirectorFilter) &&
          (this.proposalSupervisorFilter === 'ALL' || s.supervisor === this.proposalSupervisorFilter)
        )
        .map(s => s.sale)
        .filter(Boolean)
    )].sort();

    const q = this.proposalSearchQuery.trim().toLowerCase();
    const filteredProposals = allWeakOrDeclining.filter(s => {
      const matchDir = this.proposalDirectorFilter === 'ALL' || s.director === this.proposalDirectorFilter;
      const matchSup = this.proposalSupervisorFilter === 'ALL' || s.supervisor === this.proposalSupervisorFilter;
      const matchSale = this.proposalSaleFilter === 'ALL' || s.sale === this.proposalSaleFilter;
      const matchQ = !q ||
        s.dvn.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q) ||
        s.subRegion.toLowerCase().includes(q) ||
        s.sale.toLowerCase().includes(q) ||
        s.supervisor.toLowerCase().includes(q) ||
        s.director.toLowerCase().includes(q);
      return matchDir && matchSup && matchSale && matchQ;
    });

    const effMStr = String(effectiveMonth).padStart(2, '0');
    const selMStr = String(selectedMonth).padStart(2, '0');

    return `
      <div class="card-3d p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-bolt text-[#F26522]"></i>
                Đề Xuất Giao Việc Hỗ Trợ Từ Dữ Liệu S.O Thực Tế (Tháng ${effMStr}/${effectiveYear})
              </h3>
              ${isFallbackFromPrevMonth ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold">
                  <i class="fa-solid fa-clock-rotate-left mr-1"></i>
                  Tháng ${selMStr}/${selectedYear} chưa có S.O → Tự động lấy số liệu Tháng ${effMStr}/${effectiveYear}
                </span>
              ` : ''}
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Danh sách các cửa hàng có sản lượng <strong>Yếu (&lt; 15 xe)</strong> hoặc <strong>Suy giảm sâu</strong> để lọc theo Giám đốc, Giám sát, Sale và giao nhiệm vụ hỗ trợ.
            </p>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold">
            Hiển thị ${filteredProposals.length} / ${allWeakOrDeclining.length} Shop cần hỗ trợ
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Lọc theo Giám Đốc Khu Vực</label>
            <select
              onchange="TasksModule.setFilter('proposalDirectorFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám đốc (${directors.length}) --</option>
              ${directors.map(d => `<option value="${d}" ${this.proposalDirectorFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Lọc theo Giám Sát</label>
            <select
              onchange="TasksModule.setFilter('proposalSupervisorFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám sát (${supervisors.length}) --</option>
              ${supervisors.map(sup => `<option value="${sup}" ${this.proposalSupervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Lọc theo Nhân Viên Sale</label>
            <select
              onchange="TasksModule.setFilter('proposalSaleFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-blue-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Sale (${sales.length}) --</option>
              ${sales.map(sl => `<option value="${sl}" ${this.proposalSaleFilter === sl ? 'selected' : ''}>${sl}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">4. Tìm kiếm nhanh Shop / DVN</label>
            <div class="flex items-center gap-1.5">
              <input
                id="proposal-search-input"
                type="text"
                value="${this.proposalSearchQuery}"
                oninput="TasksModule.setFilter('proposalSearchQuery', this.value)"
                placeholder="Gõ mã DVN, tên shop, tỉnh..."
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-[#F26522]"
              />
              ${(this.proposalDirectorFilter !== 'ALL' || this.proposalSupervisorFilter !== 'ALL' || this.proposalSaleFilter !== 'ALL' || this.proposalSearchQuery) ? `
                <button
                  type="button"
                  onclick="TasksModule.resetProposalFilters()"
                  class="px-2.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold shrink-0 cursor-pointer"
                >
                  Đặt lại
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="overflow-x-auto max-h-[56vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 text-slate-600 uppercase font-extrabold border-b">
              <tr>
                <th class="py-3 px-3">Mã DVN</th>
                <th class="py-3 px-3">Tên Cửa Hàng</th>
                <th class="py-3 px-3">Khu Vực / Tỉnh</th>
                <th class="py-3 px-3">Giám Đốc KV</th>
                <th class="py-3 px-3">Giám Sát</th>
                <th class="py-3 px-3">Sale Phụ Trách</th>
                <th class="py-3 px-3 text-right">Cùng Kỳ / Tháng Trước</th>
                <th class="py-3 px-3 text-right text-rose-600">S.O T${effMStr}/${effectiveYear}</th>
                <th class="py-3 px-3 text-center">Biến Động YoY</th>
                <th class="py-3 px-3 text-center">Cảnh Báo</th>
                <th class="py-3 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filteredProposals.map(s => {
                const safeName = String(s.name || '').replace(/'/g, "\\'");
                const safeSup = String(s.supervisor || '').replace(/'/g, "\\'");
                const presetTitle = `Hỗ trợ thúc đẩy S.O & Kiểm tra thực địa tại ${safeName} (${s.dvn})`;
                const presetNote = `Sản lượng S.O T${effMStr}/${effectiveYear} đạt ${s.currentSO ?? 'NULL'} xe (Cùng kỳ: ${s.lastYearSO ?? 'N/A'} xe, YoY: ${s.yoy !== null ? s.yoy + '%' : 'N/A'}). Sale phụ trách: ${s.sale}. Cần khảo sát nguyên nhân và lập phương án cải thiện.`;

                return `
                  <tr class="hover:bg-rose-50/30 transition">
                    <td class="py-3 px-3 font-mono font-black text-blue-600">${s.dvn}</td>
                    <td class="py-3 px-3 font-bold text-slate-900">${s.name}</td>
                    <td class="py-3 px-3">
                      <div class="font-bold text-orange-600 text-[11px]">${s.subRegion}</div>
                      <div class="text-[11px] text-slate-500">${s.province}</div>
                    </td>
                    <td class="py-3 px-3 font-semibold text-blue-600">${s.director}</td>
                    <td class="py-3 px-3 font-extrabold text-orange-600">${s.supervisor}</td>
                    <td class="py-3 px-3 font-bold text-slate-800">${s.sale}</td>
                    <td class="py-3 px-3 text-right font-mono text-slate-500">CK: ${s.lastYearSO ?? '—'} | TT: ${s.prevSO ?? '—'}</td>
                    <td class="py-3 px-3 text-right font-mono font-black text-rose-600 text-sm">${s.currentSO ?? 'NULL'} xe</td>
                    <td class="py-3 px-3 text-center font-mono font-bold ${s.yoy !== null && s.yoy < 0 ? 'text-rose-600' : 'text-slate-500'}">
                      ${s.yoy !== null ? (s.yoy >= 0 ? '+' + s.yoy + '%' : s.yoy + '%') : '—'}
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.eval.color}">${s.eval.label}</span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <button
                        onclick="TasksModule.openCreateTaskModal({
                          taskType: 'TASK',
                          dvn: '${s.dvn}',
                          assignee: '${safeSup}',
                          priority: 'HIGH',
                          title: '${presetTitle}',
                          note: '${presetNote}'
                        })"
                        class="btn-3d-orange px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer whitespace-nowrap"
                      >
                        + Tạo Nhiệm Vụ Hỗ Trợ
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${filteredProposals.length === 0 ? `
                <tr>
                  <td colspan="11" class="py-10 text-center text-slate-400 font-semibold">
                    Không có cửa hàng nào thuộc diện cảnh báo khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  render() {
    this.ensureI18n();
    this.syncHeaderFilterUI();
    this.fetchTasksFromSupabaseIfNeeded();

    const region = window.AppState?.region || 'ALL';
    const selectedYM = this.getSelectedYearMonth();
    const [yStr, mStr] = selectedYM.split('-');

    // Lọc các công việc được giao đúng trong Tháng đang chọn trên Header
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

      <!-- 6 KPI CARDS THEO ĐÚNG THÁNG ĐƯỢC GIAO -->
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

      <!-- THANH CHUYỂN 5 TAB CON GỌN NHẸ -->
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

      <!-- VÙNG HIỂN THỊ NỘI DUNG 5 TAB CON -->
      ${this.activeSubTab === 'LIST' ? this.renderListTab(filteredTasks) : ''}
      ${this.activeSubTab === 'KANBAN' ? this.renderKanbanTab(filteredTasks) : ''}
      ${this.activeSubTab === 'MARKET_PLAN' ? this.renderMarketPlanTab(filteredTasks) : ''}
      ${this.activeSubTab === 'STORE_VISIT' ? this.renderStoreVisitTab(filteredTasks) : ''}
      ${this.activeSubTab === 'SO_PROPOSAL' ? this.renderSOProposalTab() : ''}
    `;
  }
};