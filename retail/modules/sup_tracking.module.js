// modules/sup_tracking.module.js
// TAB 6 (NHÓM KPI THÁNG): THEO DÕI CÔNG VIỆC GIÁM SÁT (SUPERVISOR WORK TRACKING)
// Độc lập 100% với Tab 5 (efficiency.module.js), tái sử dụng dữ liệu gốc và chống trùng lặp tuyệt đối.

window.SupTrackingModule = {
  // Bộ lọc đồng bộ toàn trang
  periodMode: 'MONTH', // 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'
  selectedYear: 2026,
  selectedMonth: 9,
  customStartDate: '',
  customEndDate: '',
  regionFilter: 'ALL',     // 'ALL' | 'NORTH' | 'SOUTH'
  subRegionFilter: 'ALL',  // Khu vực chi tiết
  supervisorFilter: 'ALL', // Tên giám sát
  categoryFilter: 'ALL',   // 'ALL' | 'MARKET_TRIP' | 'SURVEY' | 'ISSUE_FIX' | 'TRAINING' | 'REPORT' | 'ADHOC'
  statusFilter: 'ALL',     // 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'OVERDUE'
  searchQuery: '',

  // Trạng thái giao diện
  selectedSupervisorDetail: null, // Tên Giám sát đang mở trang/modal chi tiết
  detailActiveTab: 'ALL_WORK',    // 'ALL_WORK' | 'OVERDUE' | 'VISITED_SHOPS' | 'ISSUES' | 'CARRY_OVER'
  isFullscreenMeeting: false,     // Chế độ toàn màn hình phục vụ họp

  // Danh mục 6 nhóm công việc chuẩn
  WORK_CATEGORIES: {
    MARKET_TRIP: { id: 'MARKET_TRIP', label: 'Đi thị trường', zh: '市场巡访', color: '#2563eb', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    SURVEY:      { id: 'SURVEY',      label: 'Khảo sát',      zh: '门店调研', color: '#0ea5e9', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
    ISSUE_FIX:   { id: 'ISSUE_FIX',   label: 'Xử lý vấn đề',  zh: '问题整改', color: '#e11d48', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    TRAINING:    { id: 'TRAINING',    label: 'Đào tạo',       zh: '赋能培训', color: '#8b5cf6', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    REPORT:      { id: 'REPORT',      label: 'Báo cáo',       zh: '工作汇报', color: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ADHOC:       { id: 'ADHOC',       label: 'CV phát sinh',  zh: '临时专项', color: '#F26522', badge: 'bg-orange-50 text-[#F26522] border-orange-200' }
  },

  // =========================================================================
  // 0. TỰ ĐỘNG ĐĂNG KÝ MENU TAB 6, MỞ NHÓM KPI THÁNG & KẾT NỐI ROUTE
  // =========================================================================
  initModule() {
    this.injectScopedCSS();

    // 1. Bổ sung từ điển Việt / Trung cho Tab 6
    if (window.I18N) {
      if (window.I18N.vi) {
        window.I18N.vi.menu_sup_tracking = 'Theo dõi CV Giám sát';
      }
      if (window.I18N.zh) {
        window.I18N.zh.menu_sup_tracking = '督导工作追踪';
      }
    }

    // 2. Đăng ký vào nhóm KPI THÁNG ngay sau Tab 5 (evidence - Hiệu quả Giám sát)
    if (Array.isArray(window.NavigationConfig)) {
      const exists = window.NavigationConfig.some(item => item.id === 'sup_tracking');
      if (!exists) {
        const navItem = {
          id: 'sup_tracking',
          i18nKey: 'menu_sup_tracking',
          icon: 'clipboard-check',
          group: 'KPI',
          roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE']
        };
        const evidenceIdx = window.NavigationConfig.findIndex(item => item.id === 'evidence');
        if (evidenceIdx >= 0) {
          window.NavigationConfig.splice(evidenceIdx + 1, 0, navItem);
        } else {
          window.NavigationConfig.push(navItem);
        }
      }
    }

    // 3. Tự động mở nhóm KPI THÁNG trên Sidebar để hiển thị ngay Tab 6
    if (window.AppState && window.AppState.expandedGroups) {
      window.AppState.expandedGroups['KPI'] = true;
    }

    // 4. Kết nối vào OperationsModule (cơ chế render mặc định của app.js)
    if (window.OperationsModule && !window.OperationsModule._hookedSupTracking) {
      const origRender = window.OperationsModule.render.bind(window.OperationsModule);
      window.OperationsModule.render = (moduleId) => {
        if (moduleId === 'sup_tracking') {
          return window.SupTrackingModule.render();
        }
        return origRender(moduleId);
      };
      window.OperationsModule._hookedSupTracking = true;
    }

    // 5. Cập nhật lại Sidebar nếu App đã khởi tạo
    if (window.App && typeof window.App.renderSidebar === 'function') {
      window.App.renderSidebar();
    }

    this.ensureHeaderSyncHook();
  },

  injectScopedCSS() {
    if (document.getElementById('sup-tracking-scoped-css')) return;
    const style = document.createElement('style');
    style.id = 'sup-tracking-scoped-css';
    style.textContent = `
      .st6-badge-pulse {
        animation: st6Pulse 2s infinite;
      }
      @keyframes st6Pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
      }
      .st6-bar-hover {
        transition: transform 0.2s ease, filter 0.2s ease;
        cursor: pointer;
      }
      .st6-bar-hover:hover {
        transform: translateY(-4px);
        filter: drop-shadow(0 8px 12px rgba(242, 101, 34, 0.28));
      }
    `;
    document.head.appendChild(style);
  },

  ensureHeaderSyncHook() {
    if (!window.App || window.App._hookedSupTrackingHeader) return;
    const origNavigate = window.App.navigate.bind(window.App);
    window.App.navigate = (moduleId) => {
      const res = origNavigate(moduleId);
      window.SupTrackingModule.syncTopHeaderVisibility(moduleId);
      return res;
    };
    window.App._hookedSupTrackingHeader = true;
  },

  // Ẩn thanh lọc Header chung khi ở Tab 6 vì Tab 6 đã có bộ lọc 6 chiều độc lập
  syncTopHeaderVisibility(activeMod) {
    const mod = activeMod || window.AppState?.activeModule;
    const shouldHide = (mod === 'sup_tracking' || mod === 'grading' || mod === 'so_chart');
    const monthSelect = document.getElementById('filter-month-num');
    const filterBarContainer = monthSelect
      ? (document.getElementById('top-header-filter-bar') || monthSelect.closest('.px-6.py-2\\.5') || monthSelect.parentElement?.parentElement?.parentElement)
      : null;
    const advPanel = document.getElementById('advanced-filters');

    if (filterBarContainer) {
      filterBarContainer.classList.toggle('hidden', shouldHide);
      filterBarContainer.style.display = shouldHide ? 'none' : '';
    }
    if (shouldHide && advPanel) {
      advPanel.classList.add('hidden');
    }
  },

  // =========================================================================
  // 1. CHUẨN HÓA THỜI GIAN (MÚI GIỜ VIỆT NAM UTC+7) & KHOẢNG THỜI GIAN LỌC
  // =========================================================================
  getVietnamTodayISO() {
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
    const y = vnTime.getFullYear();
    const m = String(vnTime.getMonth() + 1).padStart(2, '0');
    const d = String(vnTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getVietnamCurrentWeekRange() {
    const todayStr = this.getVietnamTodayISO();
    const [y, m, d] = todayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const day = dt.getDay();
    const diffToMon = dt.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(y, m - 1, diffToMon);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    const fmt = (dateObj) =>
      `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    return { start: fmt(mon), end: fmt(sun) };
  },

  syncDefaultPeriodFromAppState() {
    if (this._periodSynced) return;
    const raw = window.AppState?.month || '2026-09';
    const [yStr, mStr] = raw.split('-');
    this.selectedYear = parseInt(yStr, 10) || 2026;
    this.selectedMonth = parseInt(mStr, 10) || 9;
    this._periodSynced = true;
  },

  getDateWindow() {
    this.syncDefaultPeriodFromAppState();

    if (this.periodMode === 'WEEK') {
      const wk = this.getVietnamCurrentWeekRange();
      const s = this.customStartDate || wk.start;
      const e = this.customEndDate || wk.end;
      return {
        start: s,
        end: e,
        label: `Tuần (${s} → ${e})`
      };
    }

    if (this.periodMode === 'YEAR') {
      const y = Number(this.selectedYear) || 2026;
      return {
        start: `${y}-01-01`,
        end: `${y}-12-31`,
        label: `Cả Năm ${y}`
      };
    }

    if (this.periodMode === 'CUSTOM' && this.customStartDate && this.customEndDate) {
      const s = this.customStartDate <= this.customEndDate ? this.customStartDate : this.customEndDate;
      const e = this.customEndDate >= this.customStartDate ? this.customEndDate : this.customStartDate;
      return {
        start: s,
        end: e,
        label: `Từ ${s} đến ${e}`
      };
    }

    const y = Number(this.selectedYear) || 2026;
    const m = Number(this.selectedMonth) || 9;
    const lastDay = new Date(y, m, 0).getDate();
    const mPad = String(m).padStart(2, '0');
    return {
      start: `${y}-${mPad}-01`,
      end: `${y}-${mPad}-${String(lastDay).padStart(2, '0')}`,
      label: `Tháng ${mPad}/${y}`
    };
  },

  // =========================================================================
  // 2. HÀM PHÂN LOẠI NHÓM CÔNG VIỆC, CHUẨN HÓA DỮ LIỆU & CHỐNG TRÙNG LẶP
  // =========================================================================
  normalizeName(str) {
    if (window.AppUtils && typeof window.AppUtils.normalizePersonName === 'function') {
      return window.AppUtils.normalizePersonName(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/[\u4e00-\u9fa5]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  },

  extractUniqueDvns(dvnRaw) {
    if (!dvnRaw) return [];
    const matches = String(dvnRaw).toUpperCase().match(/DVN[A-Z0-9]+/g);
    if (matches && matches.length > 0) {
      return [...new Set(matches.map(m => String(m).trim()))];
    }
    const clean = String(dvnRaw).trim().toUpperCase();
    return clean.startsWith('DVN') ? [clean] : [];
  },

  classifyWorkCategory(task) {
    if (!task) return 'ADHOC';
    if (task.workCategory && this.WORK_CATEGORIES[task.workCategory]) {
      return task.workCategory;
    }

    const text = `${task.title || ''} ${task.note || ''} ${task.issues || ''} ${task.solution || ''}`.toLowerCase();
    const chk = task.checklist || {};
    const hasFailedChecklist =
      chk.signboard === false || chk.display === false || chk.staff === false || chk.inventory === false;

    if (text.includes('đào tạo') || text.includes('training') || text.includes('huấn luyện') || text.includes('hướng dẫn') || text.includes('onboarding')) {
      return 'TRAINING';
    }
    if (text.includes('khảo sát') || text.includes('điều tra') || text.includes('survey') || text.includes('đánh giá')) {
      return 'SURVEY';
    }
    if (text.includes('báo cáo') || text.includes('report') || text.includes('tổng kết') || text.includes('nghiệm thu')) {
      return 'REPORT';
    }
    if (hasFailedChecklist || text.includes('xử lý') || text.includes('khắc phục') || text.includes('cải thiện') || text.includes('hỗ trợ thúc đẩy') || text.includes('yếu') || text.includes('suy giảm')) {
      return 'ISSUE_FIX';
    }
    if (task.taskType === 'STORE_VISIT' || task.taskType === 'MARKET_PLAN' || String(task.id).startsWith('VISIT-') || String(task.id).startsWith('PLAN-') || text.includes('thị trường') || text.includes('check-in') || text.includes('tuần')) {
      return 'MARKET_TRIP';
    }
    return 'ADHOC';
  },

  getTaskReferenceDate(task) {
    const raw = String(task.startDate || task.deadline || task.createdAt || '').trim();
    const matchISO = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchISO) return matchISO[1];
    return '';
  },

  getTaskCompletedDate(task) {
    if (task.status !== 'COMPLETED') return null;
    if (Array.isArray(task.history) && task.history.length > 0) {
      const compItem = task.history.find(h =>
        String(h.action || '').toLowerCase().includes('hoàn thành') ||
        String(h.action || '').toLowerCase().includes('completed')
      ) || task.history[0];

      if (compItem.isoDate && /^\d{4}-\d{2}-\d{2}/.test(compItem.isoDate)) {
        return compItem.isoDate.slice(0, 10);
      }
      const mDMY = String(compItem.time || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mDMY) {
        return `${mDMY[3]}-${String(mDMY[2]).padStart(2, '0')}-${String(mDMY[1]).padStart(2, '0')}`;
      }
    }
    return String(task.deadline || task.startDate || this.getVietnamTodayISO()).slice(0, 10);
  },

  isTaskOverdue(task, todayVN) {
    if (!task || !task.deadline) return false;
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    const dl = String(task.deadline).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dl)) return false;
    return dl < todayVN;
  },

  isActualStoreVisit(task) {
    if (!task) return false;
    if (task.taskType === 'MARKET_PLAN' || String(task.id).startsWith('PLAN-')) {
      return Array.isArray(task.evidenceUrls) && task.evidenceUrls.length > 0;
    }
    return (
      task.taskType === 'STORE_VISIT' ||
      String(task.id).startsWith('VISIT-') ||
      (Array.isArray(task.evidenceUrls) && task.evidenceUrls.length > 0)
    );
  },

  extractIssueDetails(task) {
    if (!task) return null;
    if (task.taskType === 'MARKET_PLAN' || String(task.id).startsWith('PLAN-')) {
      return null;
    }

    const chk = task.checklist || {};
    const failedChecklistReasons = [];
    if (chk.signboard === false) failedChecklistReasons.push('Biển hiệu & Mặt tiền chưa đạt chuẩn 3824');
    if (chk.display === false) failedChecklistReasons.push('Trưng bày xe & Bảng giá POP thiếu/chưa chuẩn');
    if (chk.staff === false) failedChecklistReasons.push('Tác phong / Kỹ năng tư vấn nhân viên yếu');
    if (chk.inventory === false) failedChecklistReasons.push('Chênh lệch tồn kho thực tế và hệ thống Cloud Sale');

    const rawIssueText = String(task.issues || task.note || '').trim();
    const lowerIssue = rawIssueText.toLowerCase();
    const isNormalText =
      !rawIssueText ||
      lowerIssue === 'đạt chuẩn vận hành' ||
      lowerIssue === 'bình thường' ||
      lowerIssue === 'tốt' ||
      lowerIssue === 'ổn định';

    if (failedChecklistReasons.length === 0 && isNormalText) {
      return null;
    }

    const problemTitle = failedChecklistReasons.length > 0
      ? failedChecklistReasons.join('; ')
      : rawIssueText;

    let rootCause = 'Vận hành thực địa tại đại lý';
    if (chk.signboard === false || chk.display === false || lowerIssue.includes('trưng bày') || lowerIssue.includes('3824')) {
      rootCause = 'Chưa tuân thủ chuẩn hình ảnh & trưng bày 3824';
    } else if (chk.staff === false || lowerIssue.includes('nhân viên') || lowerIssue.includes('tư vấn') || lowerIssue.includes('sale')) {
      rootCause = 'Thiếu hụt nhân sự hoặc kỹ năng tư vấn bán hàng yếu';
    } else if (chk.inventory === false || lowerIssue.includes('tồn kho')) {
      rootCause = 'Quản lý tồn kho & nhập hàng chưa đồng bộ';
    } else if (lowerIssue.includes('s.o') || lowerIssue.includes('doanh số') || lowerIssue.includes('yếu') || lowerIssue.includes('suy giảm')) {
      rootCause = 'Sản lượng Sell-out suy giảm / Thấp hơn ngưỡng tiêu chuẩn (< 15 xe)';
    }

    const hasSolution = Boolean(task.solution && String(task.solution).trim().length > 0);
    const isVerifiedResolved = task.status === 'COMPLETED' && hasSolution;

    return {
      problem: problemTitle,
      rootCause: rootCause,
      solution: hasSolution ? String(task.solution).trim() : 'Chưa cập nhật giải pháp xử lý',
      isVerifiedResolved: isVerifiedResolved,
      isPendingVerification: task.status === 'PENDING_APPROVAL' || (hasSolution && task.status !== 'COMPLETED')
    };
  },

  // =========================================================================
  // 3. ENGINE TỔNG HỢP DỮ LIỆU CHÍNH XÁC & ĐỒNG BỘ 100% GIỮA KPI VÀ BẢNG
  // =========================================================================
  computeTrackingData() {
    if (window.TasksModule && typeof window.TasksModule.fetchTasksFromSupabaseIfNeeded === 'function') {
      window.TasksModule.fetchTasksFromSupabaseIfNeeded();
    }

    const todayVN = this.getVietnamTodayISO();
    const win = this.getDateWindow();

    const { allRegionsShops } = window.DashboardModule
      ? window.DashboardModule.getEvaluatedRealShops()
      : { allRegionsShops: window.AppStore?.shops || [] };

    const allMasterShops = allRegionsShops && allRegionsShops.length > 0
      ? allRegionsShops
      : (window.AdminShopsModule ? window.AdminShopsModule.getList() : []);

    const userRole = window.AppState?.role || 'SALE';
    const assignedRegion = window.AppState?.assignedRegion || 'ALL';
    const headerRegion = window.AppState?.region || 'ALL';
    const effectiveRoleRegion = userRole === 'ADMIN'
      ? (this.regionFilter !== 'ALL' ? this.regionFilter : headerRegion)
      : assignedRegion;

    const shopByDvn = new Map();
    allMasterShops.forEach(s => {
      const dvnStr = String(s.dvn || '').trim().toUpperCase();
      if (dvnStr) shopByDvn.set(dvnStr, s);
    });

    const rawTasks = window.AppStore?.tasks || [];
    const dedupTaskMap = new Map();
    rawTasks.forEach(t => {
      if (!t || !t.id) return;
      if (t.taskType === 'KPI_BOARDS_STORAGE' || String(t.id).startsWith('KPI-BOARDS-')) return;
      if (t.status === 'CANCELLED') return;
      const idStr = String(t.id).trim();
      if (!dedupTaskMap.has(idStr)) {
        dedupTaskMap.set(idStr, t);
      }
    });
    const allUniqueTasks = Array.from(dedupTaskMap.values());

    const supervisorDisplayMap = new Map();

    allMasterShops.forEach(s => {
      const rawSup = String(s.supervisor || s.gdMien || '').trim();
      if (!rawSup || rawSup === 'Chưa phân công') return;
      const norm = this.normalizeName(rawSup);
      if (!norm) return;

      const enumMien = window.AppUtils?.resolveMienCode
        ? window.AppUtils.resolveMienCode(s.mien, s.region || s.subRegion)
        : (s.region === 'SOUTH' ? 'SOUTH' : 'NORTH');

      if (!supervisorDisplayMap.has(norm)) {
        supervisorDisplayMap.set(norm, {
          normKey: norm,
          displayName: rawSup,
          mien: enumMien,
          subRegions: new Set(),
          shopsMap: new Map()
        });
      }
      const entry = supervisorDisplayMap.get(norm);
      const subReg = String(s.subRegion || s.region || '').trim();
      if (subReg && subReg !== 'NORTH' && subReg !== 'SOUTH') {
        entry.subRegions.add(subReg);
      }
      const dvnStr = String(s.dvn || '').trim().toUpperCase();
      if (dvnStr) entry.shopsMap.set(dvnStr, s);
    });

    allUniqueTasks.forEach(t => {
      const rawAssignee = String(t.assignee || '').trim();
      if (!rawAssignee) return;
      const norm = this.normalizeName(rawAssignee);
      if (!norm) return;
      if (!supervisorDisplayMap.has(norm)) {
        supervisorDisplayMap.set(norm, {
          normKey: norm,
          displayName: rawAssignee,
          mien: t.region === 'SOUTH' ? 'SOUTH' : 'NORTH',
          subRegions: new Set(),
          shopsMap: new Map()
        });
      }
    });

    const allSubRegionsSet = new Set();
    supervisorDisplayMap.forEach(sup => {
      if (effectiveRoleRegion === 'ALL' || sup.mien === effectiveRoleRegion) {
        sup.subRegions.forEach(sr => allSubRegionsSet.add(sr));
      }
    });
    const allSubRegions = Array.from(allSubRegionsSet).sort();

    const allSupervisors = Array.from(supervisorDisplayMap.values())
      .filter(sup => {
        if (effectiveRoleRegion !== 'ALL' && sup.mien !== effectiveRoleRegion) return false;
        if (this.subRegionFilter !== 'ALL' && !sup.subRegions.has(this.subRegionFilter)) return false;
        return true;
      })
      .map(sup => sup.displayName)
      .sort();

    const supervisorRows = [];
    const globalAssignedTasks = [];
    const globalVisitedDvnSet = new Set();
    const globalSupportedDvnSet = new Set();
    const globalSupportedWeakDvnSet = new Set();
    let globalVisitSessionsCount = 0;
    let globalIssuesFound = 0;
    let globalIssuesResolved = 0;
    let globalIssuesBacklog = 0;

    const categoryCounts = {
      MARKET_TRIP: 0,
      SURVEY: 0,
      ISSUE_FIX: 0,
      TRAINING: 0,
      REPORT: 0,
      ADHOC: 0
    };

    const q = this.searchQuery.trim().toLowerCase();

    Array.from(supervisorDisplayMap.values())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .forEach(supMeta => {
        if (effectiveRoleRegion !== 'ALL' && supMeta.mien !== effectiveRoleRegion) return;
        if (this.subRegionFilter !== 'ALL' && !supMeta.subRegions.has(this.subRegionFilter)) return;
        if (this.supervisorFilter !== 'ALL' && supMeta.displayName !== this.supervisorFilter) return;

        const supAllTasks = allUniqueTasks.filter(t => this.normalizeName(t.assignee) === supMeta.normKey);

        const matchTaskFilters = (t) => {
          const cat = this.classifyWorkCategory(t);
          if (this.categoryFilter !== 'ALL' && cat !== this.categoryFilter) return false;

          const overdue = this.isTaskOverdue(t, todayVN);
          if (this.statusFilter !== 'ALL') {
            if (this.statusFilter === 'OVERDUE' && !overdue) return false;
            if (this.statusFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
            if (this.statusFilter === 'NOT_STARTED' && t.status !== 'NOT_STARTED') return false;
            if (this.statusFilter === 'IN_PROGRESS' &&
                !['IN_PROGRESS', 'PENDING_APPROVAL', 'REVISION_REQUIRED'].includes(t.status)) {
              return false;
            }
          }

          if (q) {
            const hay = `${t.id} ${t.title} ${t.dvn} ${t.shopName} ${t.note || ''} ${t.issues || ''} ${supMeta.displayName}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        };

        const filteredSupTasks = supAllTasks.filter(matchTaskFilters);

        const tasksInPeriod = filteredSupTasks.filter(t => {
          const refDate = this.getTaskReferenceDate(t);
          return refDate >= win.start && refDate <= win.end;
        });

        const dueTasksInPeriod = tasksInPeriod.filter(t => {
          const dl = String(t.deadline || '').slice(0, 10);
          return dl >= win.start && dl <= win.end;
        });

        const completedTasks = tasksInPeriod.filter(t => t.status === 'COMPLETED');
        const inProgressTasks = tasksInPeriod.filter(t =>
          ['IN_PROGRESS', 'PENDING_APPROVAL', 'REVISION_REQUIRED'].includes(t.status)
        );
        const notStartedTasks = tasksInPeriod.filter(t => t.status === 'NOT_STARTED');
        const overdueTasks = tasksInPeriod.filter(t => this.isTaskOverdue(t, todayVN));

        tasksInPeriod.forEach(t => {
          const cat = this.classifyWorkCategory(t);
          if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
          globalAssignedTasks.push({ ...t, _category: cat, _overdue: this.isTaskOverdue(t, todayVN) });
        });

        const completionRate = tasksInPeriod.length > 0
          ? Math.round((completedTasks.length / tasksInPeriod.length) * 100)
          : null;

        const onTimeCompletedCount = dueTasksInPeriod.filter(t => {
          if (t.status !== 'COMPLETED') return false;
          const compDate = this.getTaskCompletedDate(t);
          const dl = String(t.deadline || '').slice(0, 10);
          return !dl || compDate <= dl;
        }).length;

        const onTimeRate = dueTasksInPeriod.length > 0
          ? Math.round((onTimeCompletedCount / dueTasksInPeriod.length) * 100)
          : null;

        const visitSessionSet = new Set();
        const uniqueVisitedDvnSet = new Set();
        const visitedShopsDetailMap = new Map();

        const supportedDvnSet = new Set();
        const supportedWeakDvnSet = new Set();

        tasksInPeriod.forEach(t => {
          const dvns = this.extractUniqueDvns(t.dvn);
          const refDate = this.getTaskReferenceDate(t) || win.start;
          const isVisit = this.isActualStoreVisit(t);

          if (isVisit || t.status === 'COMPLETED' || t.status === 'IN_PROGRESS' || t.status === 'PENDING_APPROVAL') {
            dvns.forEach(code => {
              supportedDvnSet.add(code);
              globalSupportedDvnSet.add(code);
              const sRef = shopByDvn.get(code);
              if (sRef && sRef.eval && sRef.eval.grade === 'WEAK') {
                supportedWeakDvnSet.add(code);
                globalSupportedWeakDvnSet.add(code);
              }
            });
          }

          if (isVisit) {
            if (dvns.length === 0) {
              const sessionKey = `TASK_${t.id}_${refDate}`;
              if (!visitSessionSet.has(sessionKey)) {
                visitSessionSet.add(sessionKey);
                globalVisitSessionsCount++;
              }
            } else {
              dvns.forEach(code => {
                uniqueVisitedDvnSet.add(code);
                globalVisitedDvnSet.add(code);

                const sessionKey = `${code}_${refDate}`;
                if (!visitSessionSet.has(sessionKey)) {
                  visitSessionSet.add(sessionKey);
                  globalVisitSessionsCount++;
                }

                if (!visitedShopsDetailMap.has(code)) {
                  const sInfo = shopByDvn.get(code);
                  visitedShopsDetailMap.set(code, {
                    dvn: code,
                    shopName: t.shopName || sInfo?.name || 'Cửa hàng đại lý',
                    province: sInfo?.province || '—',
                    subRegion: sInfo?.subRegion || sInfo?.region || '—',
                    sale: sInfo?.sale || '—',
                    gradeLabel: sInfo?.eval?.label || '—',
                    gradeColor: sInfo?.eval?.color || 'bg-slate-100 text-slate-600',
                    visitSessions: new Set(),
                    lastVisitDate: refDate,
                    evidenceCount: 0,
                    notes: []
                  });
                }
                const detail = visitedShopsDetailMap.get(code);
                detail.visitSessions.add(sessionKey);
                if (refDate > detail.lastVisitDate) detail.lastVisitDate = refDate;
                detail.evidenceCount += Array.isArray(t.evidenceUrls) ? t.evidenceUrls.length : 0;
                if (t.title) detail.notes.push(t.title);
              });
            }
          }
        });

        const seenIssueDedup = new Set();
        const issuesFoundList = [];
        const issuesResolvedList = [];
        const issuesBacklogList = [];
        const carryOverTasksList = [];

        filteredSupTasks.forEach(t => {
          const refDate = this.getTaskReferenceDate(t);
          if (!refDate || refDate > win.end) return;

          const isCarriedFromPrev = refDate < win.start;
          const isUnfinished = t.status !== 'COMPLETED';

          if (isUnfinished) {
            carryOverTasksList.push({
              ...t,
              _category: this.classifyWorkCategory(t),
              _overdue: this.isTaskOverdue(t, todayVN),
              _isFromPrevPeriod: isCarriedFromPrev
            });
          }

          const issInfo = this.extractIssueDetails(t);
          if (!issInfo) return;

          const dvnKey = this.extractUniqueDvns(t.dvn).join(',') || `TASK-${t.id}`;
          const dedupKey = `${dvnKey}::${issInfo.problem.toLowerCase().slice(0, 80)}`;
          if (seenIssueDedup.has(dedupKey)) return;
          seenIssueDedup.add(dedupKey);

          const issueRecord = {
            taskId: t.id,
            dvn: this.extractUniqueDvns(t.dvn).join(', ') || 'Toàn vùng',
            shopName: t.shopName || (shopByDvn.get(this.extractUniqueDvns(t.dvn)[0])?.name) || t.title,
            problem: issInfo.problem,
            rootCause: issInfo.rootCause,
            solution: issInfo.solution,
            status: t.status,
            deadline: t.deadline || refDate,
            isOverdue: this.isTaskOverdue(t, todayVN),
            isVerifiedResolved: issInfo.isVerifiedResolved,
            isPendingVerification: issInfo.isPendingVerification,
            isCarriedFromPrev: isCarriedFromPrev
          };

          if (refDate >= win.start && refDate <= win.end) {
            issuesFoundList.push(issueRecord);
            if (issInfo.isVerifiedResolved) {
              issuesResolvedList.push(issueRecord);
            }
          } else if (isCarriedFromPrev && issInfo.isVerifiedResolved) {
            const compDate = this.getTaskCompletedDate(t);
            if (compDate >= win.start && compDate <= win.end) {
              issuesResolvedList.push(issueRecord);
            }
          }

          if (!issInfo.isVerifiedResolved) {
            issuesBacklogList.push(issueRecord);
          }
        });

        globalIssuesFound += issuesFoundList.length;
        globalIssuesResolved += issuesResolvedList.length;
        globalIssuesBacklog += issuesBacklogList.length;

        const managedShopsList = Array.from(supMeta.shopsMap.values());
        const weakManagedCount = managedShopsList.filter(s => s.eval && s.eval.grade === 'WEAK').length;
        const regionLabel = supMeta.subRegions.size > 0
          ? Array.from(supMeta.subRegions).join(', ')
          : (supMeta.mien === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部');

        supervisorRows.push({
          supervisor: supMeta.displayName,
          mien: supMeta.mien,
          regionDisplay: regionLabel,
          managedShopCount: managedShopsList.length,
          weakManagedCount: weakManagedCount,
          totalTasks: tasksInPeriod.length,
          dueTasksCount: dueTasksInPeriod.length,
          completedCount: completedTasks.length,
          inProgressCount: inProgressTasks.length,
          notStartedCount: notStartedTasks.length,
          overdueCount: overdueTasks.length,
          onTimeCount: onTimeCompletedCount,
          completionRate: completionRate,
          onTimeRate: onTimeRate,
          visitSessionsCount: visitSessionSet.size,
          uniqueVisitedCount: uniqueVisitedDvnSet.size,
          supportedShopsCount: supportedDvnSet.size,
          supportedWeakShopsCount: supportedWeakDvnSet.size,
          issuesFoundCount: issuesFoundList.length,
          issuesResolvedCount: issuesResolvedList.length,
          issuesBacklogCount: issuesBacklogList.length,
          completedTasksList: completedTasks,
          inProgressTasksList: inProgressTasks,
          notStartedTasksList: notStartedTasks,
          overdueTasksList: overdueTasks,
          visitedShopsList: Array.from(visitedShopsDetailMap.values()).map(v => ({
            ...v,
            visitCount: v.visitSessions.size
          })).sort((a, b) => b.visitCount - a.visitCount),
          issuesFoundList,
          issuesResolvedList,
          issuesBacklogList,
          carryOverTasksList
        });
      });

    const sumTotalTasks = supervisorRows.reduce((a, r) => a + r.totalTasks, 0);
    const sumDueTasks = supervisorRows.reduce((a, r) => a + r.dueTasksCount, 0);
    const sumCompleted = supervisorRows.reduce((a, r) => a + r.completedCount, 0);
    const sumInProgress = supervisorRows.reduce((a, r) => a + r.inProgressCount, 0);
    const sumNotStarted = supervisorRows.reduce((a, r) => a + r.notStartedCount, 0);
    const sumOverdue = supervisorRows.reduce((a, r) => a + r.overdueCount, 0);
    const sumOnTime = supervisorRows.reduce((a, r) => a + r.onTimeCount, 0);

    const overallCompletionRate = sumTotalTasks > 0
      ? Math.round((sumCompleted / sumTotalTasks) * 100)
      : null;
    const overallOnTimeRate = sumDueTasks > 0
      ? Math.round((sumOnTime / sumDueTasks) * 100)
      : null;

    const trendBuckets = this.computeCompletionTrendSeries(globalAssignedTasks, win);

    return {
      todayVN,
      windowInfo: win,
      allSubRegions,
      allSupervisors,
      supervisorRows,
      categoryCounts,
      trendBuckets,
      summary: {
        totalTasks: sumTotalTasks,
        dueTasks: sumDueTasks,
        completed: sumCompleted,
        inProgress: sumInProgress,
        notStarted: sumNotStarted,
        overdue: sumOverdue,
        completionRate: overallCompletionRate,
        onTimeRate: overallOnTimeRate,
        visitSessions: globalVisitSessionsCount,
        uniqueVisitedShops: globalVisitedDvnSet.size,
        issuesFound: globalIssuesFound,
        issuesResolved: globalIssuesResolved,
        issuesBacklog: globalIssuesBacklog,
        supportedShops: globalSupportedDvnSet.size,
        supportedWeakShops: globalSupportedWeakDvnSet.size
      }
    };
  },

  computeCompletionTrendSeries(tasksInPeriod, win) {
    if (this.periodMode === 'YEAR') {
      const y = Number(this.selectedYear) || 2026;
      const buckets = [];
      for (let m = 1; m <= 12; m++) {
        const mPad = String(m).padStart(2, '0');
        const prefix = `${y}-${mPad}`;
        const mTasks = tasksInPeriod.filter(t => this.getTaskReferenceDate(t).startsWith(prefix));
        const comp = mTasks.filter(t => t.status === 'COMPLETED').length;
        buckets.push({
          label: `T${mPad}`,
          total: mTasks.length,
          completed: comp,
          rate: mTasks.length > 0 ? Math.round((comp / mTasks.length) * 100) : null
        });
      }
      return buckets;
    }

    const startMs = new Date(win.start).getTime();
    const endMs = new Date(win.end).getTime();
    const totalDays = Math.max(4, Math.round((endMs - startMs) / 86400000) + 1);
    const stepDays = Math.max(1, Math.ceil(totalDays / 4));

    const buckets = [];
    for (let i = 0; i < 4; i++) {
      const bStart = new Date(startMs + i * stepDays * 86400000);
      const bEnd = i === 3
        ? new Date(endMs)
        : new Date(Math.min(endMs, startMs + ((i + 1) * stepDays - 1) * 86400000));

      const sISO = bStart.toISOString().slice(0, 10);
      const eISO = bEnd.toISOString().slice(0, 10);

      const wTasks = tasksInPeriod.filter(t => {
        const d = this.getTaskReferenceDate(t);
        return d >= sISO && d <= eISO;
      });
      const comp = wTasks.filter(t => t.status === 'COMPLETED').length;

      buckets.push({
        label: `Tuần ${i + 1} (${sISO.slice(8, 10)}/${sISO.slice(5, 7)})`,
        total: wTasks.length,
        completed: comp,
        rate: wTasks.length > 0 ? Math.round((comp / wTasks.length) * 100) : null
      });
    }
    return buckets;
  },

  // =========================================================================
  // 4. CÁC HÀM TƯƠNG TÁC BỘ LỌC, FULLSCREEN HỌP & XUẤT EXCEL
  // =========================================================================
  setPeriodMode(mode) {
    this.periodMode = mode;
    if (mode === 'WEEK') {
      const wk = this.getVietnamCurrentWeekRange();
      this.customStartDate = wk.start;
      this.customEndDate = wk.end;
    } else if (mode === 'CUSTOM' && (!this.customStartDate || !this.customEndDate)) {
      const win = this.getDateWindow();
      this.customStartDate = win.start;
      this.customEndDate = win.end;
    }
    window.App.renderCurrentModule();
  },

  setMonthYear(year, month) {
    if (year !== null) this.selectedYear = Number(year);
    if (month !== null) this.selectedMonth = Number(month);
    if (this.periodMode !== 'YEAR') {
      this.periodMode = 'MONTH';
    }
    window.App.renderCurrentModule();
  },

  setCustomDate(key, val) {
    this.periodMode = 'CUSTOM';
    this[key] = val;
    window.App.renderCurrentModule();
  },

  setFilter(key, val) {
    this[key] = val;
    if (key === 'regionFilter') {
      this.subRegionFilter = 'ALL';
      this.supervisorFilter = 'ALL';
    } else if (key === 'subRegionFilter') {
      this.supervisorFilter = 'ALL';
    }
    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('st6-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  resetAllFilters() {
    this.periodMode = 'MONTH';
    this.regionFilter = 'ALL';
    this.subRegionFilter = 'ALL';
    this.supervisorFilter = 'ALL';
    this.categoryFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.searchQuery = '';
    window.App.renderCurrentModule();
  },

  openSupervisorDetail(supName, defaultTab = 'ALL_WORK') {
    this.selectedSupervisorDetail = supName;
    this.detailActiveTab = defaultTab;
    window.App.renderCurrentModule();
  },

  closeSupervisorDetail() {
    this.selectedSupervisorDetail = null;
    window.App.renderCurrentModule();
  },

  setDetailTab(tabId) {
    this.detailActiveTab = tabId;
    window.App.renderCurrentModule();
  },

  toggleMeetingFullscreen(forceState) {
    this.isFullscreenMeeting = typeof forceState === 'boolean' ? forceState : !this.isFullscreenMeeting;
    window.App.renderCurrentModule();
  },

  async exportTrackingExcel() {
    if (window.AppUtils && typeof window.AppUtils.ensureXLSXLoaded === 'function') {
      await window.AppUtils.ensureXLSXLoaded();
    }
    if (!window.XLSX) {
      alert('Không thể tải thư viện xuất Excel (SheetJS)!');
      return;
    }

    const data = this.computeTrackingData();
    const { windowInfo, supervisorRows } = data;

    const summaryRows = supervisorRows.map((r, idx) => ({
      'STT': idx + 1,
      'GIÁM SÁT': r.supervisor,
      'KHU VỰC': r.regionDisplay,
      'SỐ SHOP QUẢN LÝ': r.managedShopCount,
      'TỔNG CÔNG VIỆC': r.totalTasks > 0 ? r.totalTasks : 'Chưa đủ dữ liệu',
      'HOÀN THÀNH': r.totalTasks > 0 ? r.completedCount : 'Chưa đủ dữ liệu',
      'ĐANG LÀM': r.totalTasks > 0 ? r.inProgressCount : 'Chưa đủ dữ liệu',
      'CHƯA BẮT ĐẦU': r.totalTasks > 0 ? r.notStartedCount : 'Chưa đủ dữ liệu',
      'QUÁ HẠN': r.totalTasks > 0 ? r.overdueCount : 'Chưa đủ dữ liệu',
      'TỶ LỆ HOÀN THÀNH (%)': r.completionRate !== null ? `${r.completionRate}%` : 'Chưa đủ dữ liệu',
      'TỶ LỆ ĐÚNG HẠN (%)': r.onTimeRate !== null ? `${r.onTimeRate}%` : 'Chưa đủ dữ liệu',
      'LƯỢT THĂM CỬA HÀNG': r.visitSessionsCount,
      'SỐ MÃ DVN ĐÃ THĂM (DUY NHẤT)': r.uniqueVisitedCount,
      'SỐ CỬA HÀNG ĐƯỢC HỖ TRỢ': r.supportedShopsCount,
      'VẤN ĐỀ PHÁT HIỆN': r.issuesFoundCount,
      'VẤN ĐỀ ĐÃ XỬ LÝ (XÁC MINH)': r.issuesResolvedCount,
      'VẤN ĐỀ TỒN ĐỌNG': r.issuesBacklogCount
    }));

    const detailRows = [];
    supervisorRows.forEach(r => {
      const allSupTasks = [
        ...r.completedTasksList,
        ...r.inProgressTasksList,
        ...r.notStartedTasksList
      ];
      allSupTasks.forEach(t => {
        const catObj = this.WORK_CATEGORIES[this.classifyWorkCategory(t)] || this.WORK_CATEGORIES.ADHOC;
        const iss = this.extractIssueDetails(t);
        detailRows.push({
          'MÃ CÔNG VIỆC': String(t.id),
          'GIÁM SÁT': r.supervisor,
          'KHU VỰC': r.regionDisplay,
          'NHÓM CÔNG VIỆC': catObj.label,
          'MÃ DVN (CHUỖI)': String(t.dvn || ''),
          'TÊN CỬA HÀNG': t.shopName || '',
          'NỘI DUNG CÔNG VIỆC': t.title || '',
          'NGÀY BẮT ĐẦU': t.startDate || '',
          'HẠN XỬ LÝ (DEADLINE)': t.deadline || '',
          'TIẾN ĐỘ (%)': `${t.progress || 0}%`,
          'TRẠNG THÁI': t.status,
          'QUÁ HẠN': this.isTaskOverdue(t, data.todayVN) ? 'QUÁ HẠN' : 'Bình thường',
          'VẤN ĐỀ PHÁT HIỆN': iss ? iss.problem : 'Đạt chuẩn / Không có',
          'NGUYÊN NHÂN GỐC RỄ': iss ? iss.rootCause : '',
          'KẾT QUẢ / GIẢI PHÁP': t.solution || ''
        });
      });
    });

    const wb = window.XLSX.utils.book_new();
    const ws1 = window.XLSX.utils.json_to_sheet(summaryRows);
    window.XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Hop_Giam_Sat');

    if (detailRows.length > 0) {
      const ws2 = window.XLSX.utils.json_to_sheet(detailRows);
      window.XLSX.utils.book_append_sheet(wb, ws2, 'Chi_Tiet_Cong_Viec');
    }

    const safePeriod = windowInfo.label.replace(/[^a-zA-Z0-9_-]/g, '_');
    window.XLSX.writeFile(wb, `YADEA_Theo_Doi_Cong_Viec_Giam_Sat_${safePeriod}.xlsx`);
  },

  // =========================================================================
  // 5. RENDER 4 BIỂU ĐỒ PHÂN TÍCH TRỰC QUAN
  // =========================================================================
  renderAnalyticsCharts(data) {
    const { supervisorRows, summary, categoryCounts, trendBuckets } = data;

    const supChartHtml = supervisorRows.map(r => {
      const hasData = r.totalTasks > 0;
      const pct = r.completionRate !== null ? r.completionRate : 0;
      const onTimePct = r.onTimeRate !== null ? r.onTimeRate : null;
      const safeSup = String(r.supervisor).replace(/'/g, "\\'");

      return `
        <div onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'ALL_WORK')" class="p-2.5 rounded-xl border border-slate-100 hover:border-[#F26522] bg-slate-50/70 dark:bg-slate-800/50 cursor-pointer transition space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <i class="fa-solid fa-user-tie text-[#F26522]"></i>
              ${r.supervisor}
              <span class="text-[10px] font-normal text-slate-400">(${r.regionDisplay})</span>
            </span>
            <div class="font-mono text-xs flex items-center gap-2">
              ${hasData ? `
                <span class="font-black text-[#F26522]">${pct}% hoàn thành</span>
                <span class="text-[10px] text-slate-500">(${r.completedCount}/${r.totalTasks} việc)</span>
                ${onTimePct !== null ? `<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Đúng hạn: ${onTimePct}%</span>` : ''}
              ` : `<span class="text-slate-400 text-[11px] font-semibold">Chưa đủ dữ liệu</span>`}
            </div>
          </div>
          <div class="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            ${hasData ? `
              <div style="width:${pct}%" class="h-full bg-gradient-to-r from-[#F26522] to-amber-500 transition-all duration-500" title="Đã hoàn thành: ${r.completedCount}"></div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    const totalForStatus = Math.max(1, summary.totalTasks);
    const statusItems = [
      { id: 'COMPLETED', label: 'Đã hoàn thành', count: summary.completed, pct: summary.totalTasks > 0 ? Math.round((summary.completed / totalForStatus) * 100) : 0, color: 'bg-emerald-500', text: 'text-emerald-600' },
      { id: 'IN_PROGRESS', label: 'Đang thực hiện / Chờ duyệt', count: summary.inProgress, pct: summary.totalTasks > 0 ? Math.round((summary.inProgress / totalForStatus) * 100) : 0, color: 'bg-blue-500', text: 'text-blue-600' },
      { id: 'NOT_STARTED', label: 'Chưa bắt đầu', count: summary.notStarted, pct: summary.totalTasks > 0 ? Math.round((summary.notStarted / totalForStatus) * 100) : 0, color: 'bg-slate-400', text: 'text-slate-600' },
      { id: 'OVERDUE', label: 'Quá hạn xử lý', count: summary.overdue, pct: summary.totalTasks > 0 ? Math.round((summary.overdue / totalForStatus) * 100) : 0, color: 'bg-rose-600', text: 'text-rose-600' }
    ];

    const maxCatCount = Math.max(1, ...Object.values(categoryCounts));

    const maxTrendTotal = Math.max(5, ...trendBuckets.map(b => b.total));
    const trendSvgW = 460;
    const trendSvgH = 190;
    const baseY = 148;
    const chartH = 105;

    let trendBarsSvg = '';
    const linePts = [];
    const colGap = Math.floor((trendSvgW - 70) / Math.max(1, trendBuckets.length));

    trendBuckets.forEach((b, idx) => {
      const cx = 48 + idx * colGap + Math.floor(colGap / 2);
      const bw = Math.min(28, Math.max(14, Math.floor(colGap * 0.42)));

      if (b.total > 0) {
        const hTotal = Math.max(8, Math.round((b.total / maxTrendTotal) * chartH));
        const hComp = Math.max(0, Math.round((b.completed / maxTrendTotal) * chartH));
        const yTotal = baseY - hTotal;
        const yComp = baseY - hComp;
        linePts.push(`${cx},${yComp - 6}`);

        trendBarsSvg += `
          <g class="st6-bar-hover">
            <title>${b.label}: Hoàn thành ${b.completed}/${b.total} việc (${b.rate}%)</title>
            <rect x="${cx - bw / 2}" y="${yTotal}" width="${bw}" height="${hTotal}" rx="3" fill="#cbd5e1" />
            <rect x="${cx - bw / 2}" y="${yComp}" width="${bw}" height="${hComp}" rx="3" fill="#10b981" />
            <text x="${cx}" y="${yTotal - 6}" text-anchor="middle" class="text-[8.5px] font-mono font-black fill-slate-700">${b.completed}/${b.total}</text>
          </g>
        `;
      } else {
        trendBarsSvg += `
          <text x="${cx}" y="${baseY - 6}" text-anchor="middle" class="text-[8px] font-bold fill-slate-300">Chưa có</text>
        `;
      }

      trendBarsSvg += `
        <text x="${cx}" y="${baseY + 16}" text-anchor="middle" class="text-[9px] font-extrabold fill-slate-600">${b.label}</text>
        <text x="${cx}" y="${baseY + 28}" text-anchor="middle" class="text-[8.5px] font-mono font-bold fill-emerald-600">${b.rate !== null ? b.rate + '%' : '—'}</text>
      `;
    });

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- BIỂU ĐỒ 1: SO SÁNH TIẾN ĐỘ HOÀN THÀNH GIỮA CÁC GIÁM SÁT -->
        <div class="card-3d p-5 lg:col-span-6 bg-white dark:bg-slate-900 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 class="font-extrabold text-xs sm:text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-bar text-[#F26522]"></i>
                1. So Sánh Tiến Độ Hoàn Thành Giữa Các Giám Sát
              </h3>
              <p class="text-[11px] text-slate-400">Bấm vào từng Giám sát để mở hồ sơ công việc chi tiết</p>
            </div>
            <span class="text-[11px] font-mono font-bold text-slate-500">${supervisorRows.length} Giám sát</span>
          </div>
          <div class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            ${supChartHtml || '<div class="py-8 text-center text-xs text-slate-400">Không có Giám sát trong bộ lọc</div>'}
          </div>
        </div>

        <!-- BIỂU ĐỒ 2: PHÂN BỐ CÔNG VIỆC THEO TRẠNG THÁI -->
        <div class="card-3d p-5 lg:col-span-6 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 class="font-extrabold text-xs sm:text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-blue-600"></i>
                2. Phân Bố Công Việc Theo Trạng Thái
              </h3>
              <p class="text-[11px] text-slate-400">Bấm vào trạng thái để lọc nhanh toàn bộ bảng</p>
            </div>
            <span class="text-xs font-mono font-extrabold text-[#F26522]">
              Tổng: ${summary.totalTasks > 0 ? `${summary.totalTasks} CV` : 'Chưa đủ dữ liệu'}
            </span>
          </div>

          ${summary.totalTasks > 0 ? `
            <div class="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
              ${statusItems.filter(s => s.id !== 'OVERDUE' && s.pct > 0).map(s => `
                <div style="width:${s.pct}%" class="${s.color} h-full flex items-center justify-center text-[10px] font-mono font-black text-white" title="${s.label}: ${s.count}">${s.pct}%</div>
              `).join('')}
            </div>

            <div class="grid grid-cols-2 gap-2.5 text-xs">
              ${statusItems.map(st => `
                <button
                  type="button"
                  onclick="SupTrackingModule.setFilter('statusFilter', '${this.statusFilter === st.id ? 'ALL' : st.id}')"
                  class="p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    this.statusFilter === st.id ? 'border-[#F26522] bg-orange-50/50 ring-1 ring-[#F26522]' : 'border-slate-200 hover:border-orange-300 bg-slate-50/60'
                  }"
                >
                  <div>
                    <div class="font-extrabold text-slate-800">${st.label}</div>
                    <div class="text-[10px] text-slate-500">Tỷ trọng: ${st.pct}%</div>
                  </div>
                  <span class="text-lg font-black font-mono ${st.text}">${st.count}</span>
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="py-12 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed my-auto">
              Chưa đủ dữ liệu công việc trong kỳ đang chọn (Không tự tính bằng 0).
            </div>
          `}
        </div>

        <!-- BIỂU ĐỒ 3: SỐ LƯỢNG CÔNG VIỆC THEO 6 NHÓM NGHIỆP VỤ -->
        <div class="card-3d p-5 lg:col-span-6 bg-white dark:bg-slate-900 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 class="font-extrabold text-xs sm:text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-purple-600"></i>
                3. Công Việc Theo Nhóm Nghiệp Vụ (6 Nhóm)
              </h3>
              <p class="text-[11px] text-slate-400">Đi thị trường, Khảo sát, Xử lý vấn đề, Đào tạo, Báo cáo, CV phát sinh</p>
            </div>
          </div>

          <div class="space-y-2.5 text-xs">
            ${Object.values(this.WORK_CATEGORIES).map(cat => {
              const cnt = categoryCounts[cat.id] || 0;
              const barW = summary.totalTasks > 0 ? Math.max(4, Math.round((cnt / maxCatCount) * 100)) : 0;
              const isSelected = this.categoryFilter === cat.id;

              return `
                <div
                  onclick="SupTrackingModule.setFilter('categoryFilter', '${isSelected ? 'ALL' : cat.id}')"
                  class="p-2 rounded-xl border ${isSelected ? 'border-[#F26522] bg-orange-50/40' : 'border-transparent hover:bg-slate-50'} cursor-pointer transition"
                >
                  <div class="flex items-center justify-between font-bold mb-1">
                    <span class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded border text-[10px] font-extrabold ${cat.badge}">${cat.label}</span>
                      <span class="text-[10px] text-slate-400">${cat.zh}</span>
                    </span>
                    <span class="font-mono font-black text-slate-800">${cnt} việc</span>
                  </div>
                  <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style="width:${cnt > 0 ? barW : 0}%; background:${cat.color}" class="h-full rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- BIỂU ĐỒ 4: XU HƯỚNG HOÀN THÀNH CÔNG VIỆC THEO TUẦN / THÁNG -->
        <div class="card-3d p-5 lg:col-span-6 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 class="font-extrabold text-xs sm:text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-line text-emerald-600"></i>
                4. Xu Hướng Giao Việc & Hoàn Thành Theo Kỳ
              </h3>
              <p class="text-[11px] text-slate-400">Cột xám: Tổng việc được giao • Cột xanh lá: Đã hoàn thành</p>
            </div>
          </div>

          <div class="w-full overflow-x-auto my-auto">
            <svg viewBox="0 0 ${trendSvgW} ${trendSvgH}" class="w-full h-auto min-w-[380px] select-none">
              <line x1="36" y1="${baseY}" x2="${trendSvgW - 20}" y2="${baseY}" stroke="#cbd5e1" stroke-width="2" />
              ${trendBarsSvg}
              ${linePts.length > 1 ? `
                <polyline points="${linePts.join(' ')}" fill="none" stroke="#F26522" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              ` : ''}
            </svg>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 6. TRANG / DRAWER CHI TIẾT KHI BẤM VÀO TÊN GIÁM SÁT (PHỤC VỤ HỌP ĐIỀU HÀNH)
  // =========================================================================
  renderSupervisorDetailView(supRow, windowInfo, todayVN) {
    if (!supRow) return '';

    const tabs = [
      { id: 'ALL_WORK',      label: `1. Đã làm & Đang làm (${supRow.completedCount + supRow.inProgressCount})`, icon: 'fa-list-check' },
      { id: 'OVERDUE',       label: `2. Việc quá hạn (${supRow.overdueCount})`,                                icon: 'fa-triangle-exclamation' },
      { id: 'VISITED_SHOPS', label: `3. DS Cửa hàng đã thăm (${supRow.uniqueVisitedCount} DVN)`,               icon: 'fa-store' },
      { id: 'ISSUES',        label: `4. Vấn đề & Nguyên nhân gốc rễ (${supRow.issuesFoundCount})`,             icon: 'fa-screwdriver-wrench' },
      { id: 'CARRY_OVER',    label: `5. Chuyển tiếp sang kỳ sau (${supRow.carryOverTasksList.length})`,        icon: 'fa-forward-step' }
    ];

    return `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
        <div class="card-3d w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl max-h-[92vh] flex flex-col overflow-hidden border-2 border-[#F26522]/40 shadow-2xl">
          <!-- Header Chi tiết Giám sát -->
          <div class="p-5 bg-gradient-to-r from-[#111625] via-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="px-2.5 py-1 rounded-lg bg-[#F26522] text-white text-xs font-black uppercase">
                  HỒ SƠ CÔNG VIỆC GIÁM SÁT
                </span>
                <h3 class="text-lg sm:text-xl font-black tracking-tight">${supRow.supervisor}</h3>
                <span class="px-3 py-0.5 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
                  ${supRow.regionDisplay} (${supRow.managedShopCount} Shop)
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-1">
                Kỳ đánh giá: <strong>${windowInfo.label}</strong> •
                Hoàn thành: <strong class="text-emerald-400">${supRow.completedCount}/${supRow.totalTasks} việc</strong> •
                Đúng hạn: <strong class="text-amber-300">${supRow.onTimeRate !== null ? supRow.onTimeRate + '%' : 'Chưa đủ dữ liệu'}</strong> •
                Shop đã thăm: <strong class="text-sky-300">${supRow.uniqueVisitedCount} mã DVN (${supRow.visitSessionsCount} lượt)</strong>
              </p>
            </div>

            <button
              type="button"
              onclick="SupTrackingModule.closeSupervisorDetail()"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid fa-xmark"></i>
              <span>Đóng Hồ Sơ</span>
            </button>
          </div>

          <!-- Thanh 5 Tab Chi tiết -->
          <div class="px-5 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 flex flex-wrap items-center gap-1.5 shrink-0">
            ${tabs.map(t => `
              <button
                type="button"
                onclick="SupTrackingModule.setDetailTab('${t.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  this.detailActiveTab === t.id
                    ? 'bg-[#111625] text-white shadow'
                    : 'bg-white dark:bg-slate-900 text-slate-600 hover:text-[#F26522]'
                }"
              >
                <i class="fa-solid ${t.icon} ${this.detailActiveTab === t.id ? 'text-[#F26522]' : ''}"></i>
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Nội dung chi tiết -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-slate-50/60 dark:bg-slate-950">
            ${this.detailActiveTab === 'ALL_WORK' ? `
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Cột 1: Công việc ĐÃ LÀM & KẾT QUẢ -->
                <div class="card-3d p-4 bg-white space-y-3 border-t-4 border-t-emerald-500">
                  <h4 class="font-extrabold text-xs uppercase text-emerald-800 flex items-center justify-between">
                    <span><i class="fa-solid fa-circle-check mr-1.5"></i> Công Việc Đã Hoàn Thành & Kết Quả (${supRow.completedTasksList.length})</span>
                  </h4>
                  <div class="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                    ${supRow.completedTasksList.map(t => {
                      const cat = this.WORK_CATEGORIES[this.classifyWorkCategory(t)] || this.WORK_CATEGORIES.ADHOC;
                      return `
                        <div onclick="window.TasksModule && TasksModule.openTaskDetailModal('${t.id}')" class="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-[#F26522] cursor-pointer space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${cat.badge}">${cat.label}</span>
                            <span class="font-mono text-[10px] font-bold text-emerald-700">Hoàn thành: ${this.getTaskCompletedDate(t)}</span>
                          </div>
                          <div class="font-extrabold text-slate-900">${t.title}</div>
                          ${t.dvn ? `<div class="font-mono font-bold text-blue-600 text-[11px]">Shop: ${t.dvn} ${t.shopName ? '- ' + t.shopName : ''}</div>` : ''}
                          <div class="text-[11px] text-slate-600"><strong>Kết quả xử lý:</strong> ${t.solution || t.note || 'Đã nghiệm thu hoàn thành'}</div>
                        </div>
                      `;
                    }).join('')}
                    ${supRow.completedTasksList.length === 0 ? `<div class="py-8 text-center text-slate-400 italic">Chưa có công việc hoàn thành trong kỳ này.</div>` : ''}
                  </div>
                </div>

                <!-- Cột 2: Công việc ĐANG THỰC HIỆN / CHƯA BẮT ĐẦU -->
                <div class="card-3d p-4 bg-white space-y-3 border-t-4 border-t-blue-500">
                  <h4 class="font-extrabold text-xs uppercase text-blue-800 flex items-center justify-between">
                    <span><i class="fa-solid fa-spinner mr-1.5"></i> Công Việc Đang Thực Hiện & Chưa Bắt Đầu (${supRow.inProgressTasksList.length + supRow.notStartedTasksList.length})</span>
                  </h4>
                  <div class="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                    ${[...supRow.inProgressTasksList, ...supRow.notStartedTasksList].map(t => {
                      const cat = this.WORK_CATEGORIES[this.classifyWorkCategory(t)] || this.WORK_CATEGORIES.ADHOC;
                      return `
                        <div onclick="window.TasksModule && TasksModule.openTaskDetailModal('${t.id}')" class="p-3 rounded-xl border border-blue-200 bg-blue-50/20 hover:border-[#F26522] cursor-pointer space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${cat.badge}">${cat.label}</span>
                            <span class="font-mono text-[10px] font-bold text-blue-700">Tiến độ: ${t.progress || 0}% • Hạn: ${t.deadline || '—'}</span>
                          </div>
                          <div class="font-extrabold text-slate-900">${t.title}</div>
                          ${t.dvn ? `<div class="font-mono font-bold text-blue-600 text-[11px]">Shop: ${t.dvn} ${t.shopName ? '- ' + t.shopName : ''}</div>` : ''}
                          <div class="text-[11px] text-slate-600"><strong>Nội dung:</strong> ${t.issues || t.note || 'Đang triển khai'}</div>
                        </div>
                      `;
                    }).join('')}
                    ${(supRow.inProgressTasksList.length + supRow.notStartedTasksList.length) === 0 ? `<div class="py-8 text-center text-slate-400 italic">Không có công việc đang thực hiện.</div>` : ''}
                  </div>
                </div>
              </div>
            ` : ''}

            ${this.detailActiveTab === 'OVERDUE' ? `
              <div class="card-3d p-4 bg-white space-y-3 border-t-4 border-t-rose-600">
                <h4 class="font-extrabold text-xs uppercase text-rose-700">
                  Danh Sách Công Việc Quá Hạn, Nguyên Nhân & Thời Hạn Xử Lý (${supRow.overdueTasksList.length} việc)
                </h4>
                ${supRow.overdueTasksList.length > 0 ? `
                  <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead class="bg-rose-50 text-rose-900 uppercase font-extrabold">
                        <tr>
                          <th class="py-2.5 px-3">Mã CV / Nhóm</th>
                          <th class="py-2.5 px-3">Cửa Hàng (DVN)</th>
                          <th class="py-2.5 px-3">Công Việc Quá Hạn</th>
                          <th class="py-2.5 px-3">Nguyên Nhân / Vướng Mắc</th>
                          <th class="py-2.5 px-3 text-center">Hạn Xử Lý (Deadline)</th>
                          <th class="py-2.5 px-3 text-center">Tiến Độ</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        ${supRow.overdueTasksList.map(t => {
                          const cat = this.WORK_CATEGORIES[this.classifyWorkCategory(t)] || this.WORK_CATEGORIES.ADHOC;
                          return `
                            <tr onclick="window.TasksModule && TasksModule.openTaskDetailModal('${t.id}')" class="hover:bg-rose-50/40 cursor-pointer">
                              <td class="py-2.5 px-3">
                                <div class="font-mono font-black text-slate-800">${t.id}</div>
                                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${cat.badge}">${cat.label}</span>
                              </td>
                              <td class="py-2.5 px-3 font-mono font-bold text-blue-600">${t.dvn || 'Toàn vùng'}<div class="font-sans text-[10px] text-slate-500">${t.shopName || ''}</div></td>
                              <td class="py-2.5 px-3 font-bold text-slate-900">${t.title}</td>
                              <td class="py-2.5 px-3 text-slate-600">${t.issues || t.note || 'Chưa cập nhật báo cáo hoàn tất đúng hạn'}</td>
                              <td class="py-2.5 px-3 text-center font-mono font-black text-rose-600">${t.deadline}</td>
                              <td class="py-2.5 px-3 text-center font-mono font-bold">${t.progress || 0}%</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `<div class="py-10 text-center text-emerald-600 font-bold">Tuyệt vời! Giám sát này không có công việc nào bị quá hạn.</div>`}
              </div>
            ` : ''}

            ${this.detailActiveTab === 'VISITED_SHOPS' ? `
              <div class="card-3d p-4 bg-white space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="font-extrabold text-xs uppercase text-slate-800">
                    Danh Sách Cửa Hàng Đã Thăm Thực Tế (${supRow.uniqueVisitedCount} mã DVN duy nhất • ${supRow.visitSessionsCount} lượt ghé thăm)
                  </h4>
                  <span class="text-[11px] font-semibold text-slate-500">Quy tắc: 1 Shop ghé nhiều lần chỉ tính 1 mã DVN duy nhất</span>
                </div>
                ${supRow.visitedShopsList.length > 0 ? `
                  <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead class="bg-slate-100 text-slate-700 uppercase font-extrabold">
                        <tr>
                          <th class="py-2.5 px-3">Mã DVN (Chuỗi)</th>
                          <th class="py-2.5 px-3">Tên Cửa Hàng</th>
                          <th class="py-2.5 px-3">Khu Vực / Tỉnh</th>
                          <th class="py-2.5 px-3">Sale Phụ Trách</th>
                          <th class="py-2.5 px-3 text-center">Xếp Loại S.O</th>
                          <th class="py-2.5 px-3 text-center">Số Lượt Ghé Thăm</th>
                          <th class="py-2.5 px-3 text-center">Ảnh Check-in</th>
                          <th class="py-2.5 px-3 text-right">Ngày Ghé Gần Nhất</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        ${supRow.visitedShopsList.map(vs => `
                          <tr class="hover:bg-slate-50">
                            <td class="py-2.5 px-3 font-mono font-black text-blue-600">${vs.dvn}</td>
                            <td class="py-2.5 px-3 font-bold text-slate-900">${vs.shopName}</td>
                            <td class="py-2.5 px-3 text-[11px]">${vs.subRegion} • ${vs.province}</td>
                            <td class="py-2.5 px-3 font-semibold text-slate-700">${vs.sale}</td>
                            <td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${vs.gradeColor}">${vs.gradeLabel}</span></td>
                            <td class="py-2.5 px-3 text-center font-mono font-black text-[#F26522]">${vs.visitCount} lượt</td>
                            <td class="py-2.5 px-3 text-center font-mono">${vs.evidenceCount} ảnh</td>
                            <td class="py-2.5 px-3 text-right font-mono text-slate-600">${vs.lastVisitDate}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `<div class="py-10 text-center text-slate-400 font-semibold">Chưa có lượt thăm cửa hàng thực tế nào trong kỳ (Không tính lịch trình dự kiến).</div>`}
              </div>
            ` : ''}

            ${this.detailActiveTab === 'ISSUES' ? `
              <div class="card-3d p-4 bg-white space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h4 class="font-extrabold text-xs uppercase text-slate-800">
                    Vấn Đề Phát Hiện, Nguyên Nhân Gốc Rễ & Kết Quả Xử Lý
                  </h4>
                  <div class="flex items-center gap-2 text-[11px] font-bold">
                    <span class="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Đã xử lý (Có xác minh): ${supRow.issuesResolvedCount}</span>
                    <span class="px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Tồn đọng chưa xong: ${supRow.issuesBacklogCount}</span>
                  </div>
                </div>
                ${(supRow.issuesBacklogList.length + supRow.issuesResolvedList.length) > 0 ? `
                  <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead class="bg-slate-100 text-slate-700 uppercase font-extrabold">
                        <tr>
                          <th class="py-2.5 px-3">Mã DVN / Cửa Hàng</th>
                          <th class="py-2.5 px-3">Vấn Đề Phát Hiện</th>
                          <th class="py-2.5 px-3">Nguyên Nhân Gốc Rễ</th>
                          <th class="py-2.5 px-3">Giải Pháp & Kết Quả Xử Lý</th>
                          <th class="py-2.5 px-3 text-center">Trạng Thái Xác Minh</th>
                          <th class="py-2.5 px-3 text-right">Thời Hạn</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        ${[...supRow.issuesBacklogList, ...supRow.issuesResolvedList].map(iss => `
                          <tr onclick="window.TasksModule && TasksModule.openTaskDetailModal('${iss.taskId}')" class="hover:bg-orange-50/30 cursor-pointer">
                            <td class="py-2.5 px-3">
                              <div class="font-mono font-black text-blue-600">${iss.dvn}</div>
                              <div class="text-[10px] text-slate-500">${iss.shopName}</div>
                              ${iss.isCarriedFromPrev ? `<span class="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-extrabold">Tồn đọng kỳ trước</span>` : ''}
                            </td>
                            <td class="py-2.5 px-3 font-bold text-slate-800 max-w-xs">${iss.problem}</td>
                            <td class="py-2.5 px-3 text-rose-700 font-semibold max-w-[200px]">${iss.rootCause}</td>
                            <td class="py-2.5 px-3 text-emerald-800 font-medium max-w-xs">${iss.solution}</td>
                            <td class="py-2.5 px-3 text-center">
                              ${iss.isVerifiedResolved
                                ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">✓ Đã xác minh</span>`
                                : iss.isPendingVerification
                                ? `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">⏳ Chờ xác minh</span>`
                                : `<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">Chưa xử lý</span>`}
                            </td>
                            <td class="py-2.5 px-3 text-right font-mono ${iss.isOverdue ? 'text-rose-600 font-black' : 'text-slate-600'}">${iss.deadline}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `<div class="py-10 text-center text-slate-400 font-semibold">Không có vấn đề phát sinh hoặc tồn đọng nào.</div>`}
              </div>
            ` : ''}

            ${this.detailActiveTab === 'CARRY_OVER' ? `
              <div class="card-3d p-4 bg-white space-y-3 border-t-4 border-t-purple-600">
                <h4 class="font-extrabold text-xs uppercase text-purple-900">
                  Danh Sách Công Việc Chuyển Tiếp Sang Kỳ Sau (${supRow.carryOverTasksList.length} đầu việc chưa đóng)
                </h4>
                ${supRow.carryOverTasksList.length > 0 ? `
                  <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead class="bg-purple-50 text-purple-900 uppercase font-extrabold">
                        <tr>
                          <th class="py-2.5 px-3">Mã CV</th>
                          <th class="py-2.5 px-3">Cửa Hàng (DVN)</th>
                          <th class="py-2.5 px-3">Nội Dung Công Việc Chuyển Tiếp</th>
                          <th class="py-2.5 px-3 text-center">Nguồn Gốc</th>
                          <th class="py-2.5 px-3 text-center">Tiến Độ Hiện Tại</th>
                          <th class="py-2.5 px-3 text-right">Hạn Xử Lý</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        ${supRow.carryOverTasksList.map(t => `
                          <tr onclick="window.TasksModule && TasksModule.openTaskDetailModal('${t.id}')" class="hover:bg-purple-50/40 cursor-pointer">
                            <td class="py-2.5 px-3 font-mono font-black text-slate-800">${t.id}</td>
                            <td class="py-2.5 px-3 font-mono font-bold text-blue-600">${t.dvn || 'Toàn vùng'}</td>
                            <td class="py-2.5 px-3 font-bold text-slate-900">${t.title}</td>
                            <td class="py-2.5 px-3 text-center">
                              ${t._isFromPrevPeriod
                                ? '<span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Từ kỳ trước</span>'
                                : '<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Phát sinh trong kỳ</span>'}
                            </td>
                            <td class="py-2.5 px-3 text-center font-mono font-bold text-[#F26522]">${t.progress || 0}%</td>
                            <td class="py-2.5 px-3 text-right font-mono ${t._overdue ? 'text-rose-600 font-black' : 'text-slate-600'}">${t.deadline || '—'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `<div class="py-10 text-center text-emerald-600 font-bold">Tất cả công việc đã được giải quyết dứt điểm, không có việc tồn chuyển tiếp!</div>`}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 7. RENDER GIAO DIỆN CHÍNH TAB 6 (DASHBOARD + BỘ LỌC + BIỂU ĐỒ + BẢNG 10 CỘT)
  // =========================================================================
  render() {
    this.syncTopHeaderVisibility('sup_tracking');
    setTimeout(() => this.syncTopHeaderVisibility('sup_tracking'), 0);

    const data = this.computeTrackingData();
    const {
      todayVN,
      windowInfo,
      allSubRegions,
      allSupervisors,
      supervisorRows,
      summary
    } = data;

    const userRole = window.AppState?.role || 'SALE';
    const isAdmin = userRole === 'ADMIN';

    const activeSupDetailRow = this.selectedSupervisorDetail
      ? supervisorRows.find(r => r.supervisor === this.selectedSupervisorDetail)
      : null;

    const hasActiveFilter =
      this.regionFilter !== 'ALL' ||
      this.subRegionFilter !== 'ALL' ||
      this.supervisorFilter !== 'ALL' ||
      this.categoryFilter !== 'ALL' ||
      this.statusFilter !== 'ALL' ||
      this.searchQuery.trim() !== '';

    const mainContentHtml = `
      <div class="space-y-5">
        <!-- 1. HEADER & BỘ LỌC ĐA CHIỀU -->
        <div class="card-3d p-5 bg-white dark:bg-slate-900 border-t-4 border-t-[#F26522] space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-[#111625] text-amber-400 text-xs font-black uppercase">
                  TAB 6 • SUPERVISOR WORK TRACKER
                </span>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase">
                  Hệ Thống Theo Dõi & Điều Hành Công Việc Giám Sát
                </h2>
                <span class="px-2.5 py-0.5 rounded-lg bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-mono font-extrabold">
                  ${windowInfo.label}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Thống kê chính xác theo ID duy nhất (Chống trùng lặp) • Múi giờ chuẩn Việt Nam (Hôm nay: ${todayVN}) • Phục vụ họp giao ban & rà soát tiến độ thực địa
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onclick="SupTrackingModule.exportTrackingExcel()"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <i class="fa-solid fa-file-excel"></i>
                <span>Xuất Excel Họp Giao Ban</span>
              </button>

              <button
                type="button"
                onclick="SupTrackingModule.toggleMeetingFullscreen()"
                class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid ${this.isFullscreenMeeting ? 'fa-compress' : 'fa-expand'}"></i>
                <span>${this.isFullscreenMeeting ? 'Thoát Toàn Màn Hình' : 'Chế Độ Họp Toàn Màn Hình'}</span>
              </button>
            </div>
          </div>

          <!-- DÒNG BỘ LỌC 1: CHỌN TUẦN / THÁNG / NĂM / KHOẢNG THỜI GIAN -->
          <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/80 text-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-extrabold text-slate-500 uppercase text-[10px] mr-1">Kỳ thống kê:</span>
              <div class="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 font-extrabold">
                ${[
                  { id: 'WEEK', label: 'Theo Tuần' },
                  { id: 'MONTH', label: 'Theo Tháng' },
                  { id: 'YEAR', label: 'Theo Năm' },
                  { id: 'CUSTOM', label: 'Khoảng thời gian' }
                ].map(m => `
                  <button
                    type="button"
                    onclick="SupTrackingModule.setPeriodMode('${m.id}')"
                    class="px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      this.periodMode === m.id ? 'bg-[#111625] text-white shadow' : 'text-slate-600 hover:text-[#F26522]'
                    }"
                  >
                    ${m.label}
                  </button>
                `).join('')}
              </div>

              ${(this.periodMode === 'MONTH' || this.periodMode === 'YEAR') ? `
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-orange-200 font-bold">
                  <i class="fa-regular fa-calendar text-[#F26522]"></i>
                  ${this.periodMode === 'MONTH' ? `
                    <select
                      onchange="SupTrackingModule.setMonthYear(null, this.value)"
                      class="bg-transparent font-black text-[#F26522] focus:outline-none cursor-pointer"
                    >
                      ${[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => `
                        <option value="${mo}" ${this.selectedMonth === mo ? 'selected' : ''} class="text-black">Tháng ${String(mo).padStart(2, '0')}</option>
                      `).join('')}
                    </select>
                    <span class="text-slate-300">/</span>
                  ` : ''}
                  <select
                    onchange="SupTrackingModule.setMonthYear(this.value, null)"
                    class="bg-transparent font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    ${[2025, 2026, 2027, 2028].map(yr => `
                      <option value="${yr}" ${this.selectedYear === yr ? 'selected' : ''} class="text-black">Năm ${yr}</option>
                    `).join('')}
                  </select>
                </div>
              ` : `
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-orange-200 font-mono font-bold">
                  <input
                    type="date"
                    value="${windowInfo.start}"
                    onchange="SupTrackingModule.setCustomDate('customStartDate', this.value)"
                    class="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  />
                  <span class="text-slate-400">→</span>
                  <input
                    type="date"
                    value="${windowInfo.end}"
                    onchange="SupTrackingModule.setCustomDate('customEndDate', this.value)"
                    class="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  />
                </div>
              `}
            </div>

            ${hasActiveFilter ? `
              <button
                type="button"
                onclick="SupTrackingModule.resetAllFilters()"
                class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold flex items-center gap-1 transition cursor-pointer"
              >
                <i class="fa-solid fa-rotate-left"></i>
                <span>Đặt lại toàn bộ lọc</span>
              </button>
            ` : ''}
          </div>

          <!-- DÒNG BỘ LỌC 2 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Miền (Phân quyền)</label>
              <select
                ${!isAdmin ? 'disabled' : ''}
                onchange="SupTrackingModule.setFilter('regionFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL" ${this.regionFilter === 'ALL' ? 'selected' : ''}>-- Toàn quốc --</option>
                <option value="NORTH" ${this.regionFilter === 'NORTH' ? 'selected' : ''}>Miền Bắc 北部</option>
                <option value="SOUTH" ${this.regionFilter === 'SOUTH' ? 'selected' : ''}>Miền Nam 南部</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Khu Vực (${allSubRegions.length})</label>
              <select
                onchange="SupTrackingModule.setFilter('subRegionFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Khu vực --</option>
                ${allSubRegions.map(sr => `<option value="${sr}" ${this.subRegionFilter === sr ? 'selected' : ''}>${sr}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Giám Sát (${allSupervisors.length})</label>
              <select
                onchange="SupTrackingModule.setFilter('supervisorFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-indigo-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Giám sát --</option>
                ${allSupervisors.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">4. Nhóm Công Việc</label>
              <select
                onchange="SupTrackingModule.setFilter('categoryFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-purple-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL" ${this.categoryFilter === 'ALL' ? 'selected' : ''}>-- Mọi nhóm công việc --</option>
                ${Object.values(this.WORK_CATEGORIES).map(cat => `
                  <option value="${cat.id}" ${this.categoryFilter === cat.id ? 'selected' : ''}>${cat.label} (${cat.zh})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">5. Trạng Thái Công Việc</label>
              <select
                onchange="SupTrackingModule.setFilter('statusFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-emerald-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>-- Mọi trạng thái --</option>
                <option value="COMPLETED" ${this.statusFilter === 'COMPLETED' ? 'selected' : ''}>Đã hoàn thành</option>
                <option value="IN_PROGRESS" ${this.statusFilter === 'IN_PROGRESS' ? 'selected' : ''}>Đang thực hiện / Chờ duyệt</option>
                <option value="NOT_STARTED" ${this.statusFilter === 'NOT_STARTED' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="OVERDUE" ${this.statusFilter === 'OVERDUE' ? 'selected' : ''}>Quá hạn xử lý</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">6. Tìm Nhanh CV / DVN</label>
              <input
                id="st6-search-input"
                type="text"
                value="${this.searchQuery}"
                oninput="SupTrackingModule.setFilter('searchQuery', this.value)"
                placeholder="Tìm mã CV, DVN, nội dung..."
                class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>
        </div>

        <!-- 2. 6 THẺ KPI DASHBOARD TỔNG QUAN -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="card-3d tilt-card p-4 border-t-4 border-t-slate-800">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">1. TỔNG CV ĐƯỢC GIAO</div>
            <div class="my-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
              ${summary.totalTasks > 0 ? summary.totalTasks : '<span class="text-sm text-slate-400">Chưa đủ dữ liệu</span>'}
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">
              HT: <strong class="text-emerald-600">${summary.completed}</strong> •
              Đang làm: <strong class="text-blue-600">${summary.inProgress}</strong> •
              Chưa làm: <strong>${summary.notStarted}</strong>
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-rose-600">
            <div class="text-[10px] font-extrabold uppercase text-rose-600">2. CÔNG VIỆC QUÁ HẠN</div>
            <div class="my-1 text-2xl font-black font-mono ${summary.overdue > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              ${summary.totalTasks > 0 ? summary.overdue : '<span class="text-sm text-slate-400">Chưa đủ dữ liệu</span>'}
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">
              Đến hạn trong kỳ: <strong>${summary.dueTasks} việc</strong>
            </div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-emerald-500">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">3. TỶ LỆ HT & ĐÚNG HẠN</div>
            <div class="my-1 text-xl font-black font-mono text-emerald-600">
              ${summary.completionRate !== null ? `${summary.completionRate}%` : '<span class="text-sm text-slate-400">Chưa đủ DL</span>'}
              <span class="text-slate-300 mx-0.5">/</span>
              <span class="text-indigo-600">${summary.onTimeRate !== null ? `${summary.onTimeRate}%` : '—'}</span>
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">Hoàn thành / Đúng hạn</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-600">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">4. LƯỢT THĂM / MÃ DVN</div>
            <div class="my-1 text-2xl font-black font-mono text-blue-600">
              ${summary.visitSessions} <span class="text-sm text-indigo-600">/ ${summary.uniqueVisitedShops} DVN</span>
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">Chỉ tính Check-in thực tế</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-amber-500">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">5. VẤN ĐỀ: PHÁT HIỆN / XỬ LÝ</div>
            <div class="my-1 text-xl font-black font-mono text-slate-900 dark:text-white">
              ${summary.issuesFound} / <span class="text-emerald-600">${summary.issuesResolved}</span>
              <span class="text-xs text-rose-600 ml-1">(Tồn: ${summary.issuesBacklog})</span>
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">Đã xác minh kết quả</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">6. CỬA HÀNG ĐÃ HỖ TRỢ</div>
            <div class="my-1 text-2xl font-black font-mono text-[#F26522]">
              ${summary.supportedShops} <span class="text-xs text-slate-500">Shop</span>
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">
              Trong đó Shop yếu (&lt;15 xe): <strong class="text-rose-600">${summary.supportedWeakShops}</strong>
            </div>
          </div>
        </div>

        <!-- 3. KHỐI 4 BIỂU ĐỒ PHÂN TÍCH -->
        ${this.renderAnalyticsCharts(data)}

        <!-- 4. BẢNG THEO DÕI TỪNG GIÁM SÁT (CHUẨN 10 CỘT YÊU CẦU) -->
        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-users-viewfinder text-[#F26522]"></i>
                Bảng Theo Dõi Chi Tiết Từng Giám Sát (${supervisorRows.length} Giám Sát)
              </h3>
              <p class="text-[11px] text-slate-500">
                Bấm trực tiếp vào tên Giám sát để mở trang chi tiết: Đã làm gì, đang làm gì, việc quá hạn, danh sách Shop đã thăm, nguyên nhân gốc rễ và việc chuyển tiếp.
              </p>
            </div>
            <span class="px-3 py-1 rounded-xl bg-orange-50 text-[#F26522] text-xs font-extrabold st6-badge-pulse">
              <i class="fa-solid fa-hand-pointer mr-1"></i> Nhấn vào tên Giám sát để mở trang chi tiết họp giao ban
            </span>
          </div>

          <div class="overflow-x-auto max-h-[62vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-3.5 px-3">1. Giám Sát</th>
                  <th class="py-3.5 px-3">2. Khu Vực</th>
                  <th class="py-3.5 px-3 text-center">3. Tổng Công Việc</th>
                  <th class="py-3.5 px-3 text-center">4. Hoàn Thành</th>
                  <th class="py-3.5 px-3 text-center">5. Đang Làm</th>
                  <th class="py-3.5 px-3 text-center">6. Quá Hạn</th>
                  <th class="py-3.5 px-3 text-center">7. Tỷ Lệ Đúng Hạn</th>
                  <th class="py-3.5 px-3 text-center">8. Shop Đã Thăm (DVN)</th>
                  <th class="py-3.5 px-3 text-center">9. Vấn Đề Đã Xử Lý</th>
                  <th class="py-3.5 px-3 text-center">10. Tồn Đọng</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                ${supervisorRows.map(r => {
                  const safeSup = String(r.supervisor).replace(/'/g, "\\'");
                  const hasTasks = r.totalTasks > 0;

                  return `
                    <tr class="hover:bg-orange-50/40 transition">
                      <td class="py-3 px-3">
                        <button
                          type="button"
                          onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'ALL_WORK')"
                          class="font-extrabold text-[#F26522] hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                        >
                          <i class="fa-solid fa-folder-open text-xs"></i>
                          <span>${r.supervisor}</span>
                        </button>
                      </td>

                      <td class="py-3 px-3">
                        <div class="font-bold text-slate-800 dark:text-slate-200">${r.regionDisplay}</div>
                        <div class="text-[10px] text-slate-400">${r.managedShopCount} Shop quản lý • Đã hỗ trợ: ${r.supportedShopsCount}</div>
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${hasTasks
                          ? `<span class="font-black text-sm text-slate-900 dark:text-white">${r.totalTasks}</span>`
                          : `<span class="text-slate-400 text-[11px]">Chưa đủ dữ liệu</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${hasTasks
                          ? `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold">${r.completedCount}</span>`
                          : `<span class="text-slate-400">—</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${hasTasks
                          ? `<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold">${r.inProgressCount}</span>`
                          : `<span class="text-slate-400">—</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${hasTasks ? `
                          <button
                            type="button"
                            onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'OVERDUE')"
                            class="px-2 py-0.5 rounded font-black cursor-pointer ${r.overdueCount > 0 ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'text-slate-400'}"
                          >
                            ${r.overdueCount}
                          </button>
                        ` : `<span class="text-slate-400">—</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${r.onTimeRate !== null ? `
                          <span class="px-2.5 py-1 rounded-full text-[11px] font-black ${
                            r.onTimeRate >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.onTimeRate >= 65 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }">
                            ${r.onTimeRate}%
                          </span>
                        ` : `<span class="text-slate-400 text-[11px]">Chưa đủ dữ liệu</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        <button
                          type="button"
                          onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'VISITED_SHOPS')"
                          class="font-black text-indigo-600 hover:underline cursor-pointer"
                        >
                          ${r.uniqueVisitedCount} DVN
                        </button>
                        <div class="text-[10px] text-slate-400">(${r.visitSessionsCount} lượt thăm)</div>
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        <button
                          type="button"
                          onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'ISSUES')"
                          class="font-extrabold text-emerald-600 hover:underline cursor-pointer"
                        >
                          ${r.issuesResolvedCount} / ${r.issuesFoundCount}
                        </button>
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        <button
                          type="button"
                          onclick="SupTrackingModule.openSupervisorDetail('${safeSup}', 'CARRY_OVER')"
                          class="px-2.5 py-0.5 rounded-lg font-black cursor-pointer ${
                            r.issuesBacklogCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-400'
                          }"
                        >
                          ${r.issuesBacklogCount}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}

                ${supervisorRows.length > 0 ? `
                  <tr class="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 text-slate-900 dark:text-white">
                    <td colspan="2" class="py-3 px-3 uppercase">TỔNG CỘNG TOÀN ĐỘI NGŨ (${supervisorRows.length} Giám sát)</td>
                    <td class="py-3 px-3 text-center font-mono text-sm">${summary.totalTasks > 0 ? summary.totalTasks : 'Chưa đủ dữ liệu'}</td>
                    <td class="py-3 px-3 text-center font-mono text-emerald-700">${summary.totalTasks > 0 ? summary.completed : '—'}</td>
                    <td class="py-3 px-3 text-center font-mono text-blue-700">${summary.totalTasks > 0 ? summary.inProgress : '—'}</td>
                    <td class="py-3 px-3 text-center font-mono text-rose-600">${summary.totalTasks > 0 ? summary.overdue : '—'}</td>
                    <td class="py-3 px-3 text-center font-mono text-indigo-700">${summary.onTimeRate !== null ? summary.onTimeRate + '%' : 'Chưa đủ dữ liệu'}</td>
                    <td class="py-3 px-3 text-center font-mono text-indigo-700">${summary.uniqueVisitedShops} DVN (${summary.visitSessions} lượt)</td>
                    <td class="py-3 px-3 text-center font-mono text-emerald-700">${summary.issuesResolved} / ${summary.issuesFound}</td>
                    <td class="py-3 px-3 text-center font-mono text-rose-600">${summary.issuesBacklog}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      ${activeSupDetailRow ? this.renderSupervisorDetailView(activeSupDetailRow, windowInfo, todayVN) : ''}
    `;

    if (this.isFullscreenMeeting) {
      return `
        <div class="fixed inset-0 z-40 bg-[#f1f5f9] dark:bg-[#090d16] overflow-y-auto p-4 sm:p-6">
          ${mainContentHtml}
        </div>
      `;
    }

    return mainContentHtml;
  }
};

window.SupTrackingModule.initModule();
window.addEventListener('DOMContentLoaded', () => window.SupTrackingModule.initModule());