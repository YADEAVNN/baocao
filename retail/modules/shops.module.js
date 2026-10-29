// modules/shops.module.js
window.ShopsModule = {
  // =========================================================================
  // TRẠNG THÁI (STATE) CHO TAB QUẢN LÝ NHÂN SỰ: CƠ CẤU NHÂN SỰ THEO THÁNG
  // =========================================================================
  staffSubTab: 'INPUT', // 'INPUT' | 'STATS' | 'CHARTS' | 'SO_COMPARE'
  statsGroupBy: 'SUB_REGION', // 'NATIONAL' | 'SUB_REGION' | 'DIRECTOR' | 'SUPERVISOR' | 'SALE' | 'SHOP'
  selectedYear: 2026,
  selectedMonth: 9,
  subRegionFilter: 'ALL',
  directorFilter: 'ALL',
  supervisorFilter: 'ALL',
  saleFilter: 'ALL',
  shopFilter: 'ALL', // Mã DVN (String)
  updateStatusFilter: 'ALL', // 'ALL' | 'UPDATED' | 'NOT_UPDATED'
  searchQuery: '',

  pendingEdits: {}, // { [dvn_year_month]: { age18_22, age23_27, age28_plus, newJoiners, resigned } }
  importPreviewItems: [],
  importErrors: [],
  hasLoadedStaffFromSupabase: false,
  isSyncingStaff: false,

  // -------------------------------------------------------------------------
  // 0. ĐỔI TÊN TAB THÀNH "QUẢN LÝ NHÂN SỰ" & ẨN TRIỆT ĐỂ BỘ LỌC TRÊN HEADER
  // -------------------------------------------------------------------------
  initModuleSetup() {
    // 1. Đổi tên từ điển "Phân loại cửa hàng" -> "Quản lý nhân sự" (Việt & Trung)
    if (window.I18N) {
      if (window.I18N.vi) window.I18N.vi.menu_grading = 'Quản lý nhân sự';
      if (window.I18N.zh) window.I18N.zh.menu_grading = '门店人员管理';
    }

    // Đổi icon của tab grading sang icon nhân sự (users)
    if (Array.isArray(window.NavigationConfig)) {
      const gradingNav = window.NavigationConfig.find(item => item.id === 'grading');
      if (gradingNav) {
        gradingNav.icon = 'users';
      }
    }

    // 2. Đồng bộ với SOChartModule để SOChartModule không bao giờ bật lại thanh lọc khi đang ở tab Quản lý nhân sự (grading)
    if (window.SOChartModule) {
      window.SOChartModule.syncHeaderFilterBar = () => {
        window.ShopsModule.syncHeaderFilterBar();
      };
    }

    this.ensureGradingHeaderHook();
  },

  shouldHideTopHeaderFilter(moduleId) {
    const mod = moduleId || window.AppState?.activeModule;
    return mod === 'grading' || mod === 'so_chart';
  },

  syncHeaderFilterBar(forceHide) {
    const shouldHide = typeof forceHide === 'boolean'
      ? forceHide
      : this.shouldHideTopHeaderFilter(window.AppState?.activeModule);

    const monthSelect = document.getElementById('filter-month-num');
    // Tìm chính xác thẻ div bao ngoài cả hàng lọc Tháng/Năm | Toàn quốc | Bộ lọc trên Header
    const filterBarContainer = monthSelect
      ? (monthSelect.closest('.px-6.py-2\\.5') || monthSelect.parentElement?.parentElement?.parentElement)
      : null;
    const advPanel = document.getElementById('advanced-filters');

    if (filterBarContainer) {
      if (shouldHide) {
        filterBarContainer.classList.add('hidden');
        filterBarContainer.style.display = 'none';
      } else {
        filterBarContainer.classList.remove('hidden');
        filterBarContainer.style.display = '';
      }
    }
    if (shouldHide && advPanel) {
      advPanel.classList.add('hidden');
    }
  },

  ensureGradingHeaderHook() {
    // Luôn ép cập nhật lại nhãn tên tab "Quản lý nhân sự"
    if (window.I18N) {
      if (window.I18N.vi) window.I18N.vi.menu_grading = 'Quản lý nhân sự';
      if (window.I18N.zh) window.I18N.zh.menu_grading = '门店人员管理';
    }

    if (window.SOChartModule) {
      window.SOChartModule.syncHeaderFilterBar = () => {
        window.ShopsModule.syncHeaderFilterBar();
      };
    }

    if (!window.App || window.App._hookedGradingHeaderSyncV2) return;

    const origRenderCurrent = window.App.renderCurrentModule.bind(window.App);
    window.App.renderCurrentModule = () => {
      window.ShopsModule.syncHeaderFilterBar();
      const res = origRenderCurrent();
      window.ShopsModule.syncHeaderFilterBar();
      return res;
    };

    const origNavigate = window.App.navigate.bind(window.App);
    window.App.navigate = (moduleId) => {
      window.ShopsModule.syncHeaderFilterBar(window.ShopsModule.shouldHideTopHeaderFilter(moduleId));
      const res = origNavigate(moduleId);
      window.ShopsModule.syncHeaderFilterBar(window.ShopsModule.shouldHideTopHeaderFilter(moduleId));
      return res;
    };

    window.App._hookedGradingHeaderSyncV2 = true;
    // Cập nhật lại Sidebar ngay lúc khởi động để hiện tên "Quản lý nhân sự"
    if (typeof window.App.renderSidebar === 'function' && window.AppState?.isAuthenticated) {
      window.App.renderSidebar();
    }
  },

  // -------------------------------------------------------------------------
  // GIỮ NGUYÊN CÁC HÀM GỐC CỦA MỤC 4 (SHOPS) & KẾ HOẠCH CẢI THIỆN (IMPROVEMENT)
  // -------------------------------------------------------------------------
  jumpToStoreVisitTab() {
    if (window.TasksModule) {
      window.TasksModule.activeSubTab = 'STORE_VISIT';
    }
    if (window.App) {
      window.App.navigate('tasks');
    }
  },

  openShopModal(dvnCode) {
    const shop = window.AppStore.shops.find(s => s.dvn === String(dvnCode));
    if (!shop) return;
    const evaluation = window.AppStore.evaluateShop(shop);

    document.getElementById('modal-title').innerText = `${shop.dvn} - ${shop.name}`;
    document.getElementById('modal-body').innerHTML = `
      <div class="grid grid-cols-2 gap-3 bg-[#F5F6F8] p-3.5 rounded-xl border">
        <div><span class="text-[#667085] text-xs">Mã DVN (Chuỗi):</span> <strong class="font-mono">${shop.dvn}</strong></div>
        <div><span class="text-[#667085] text-xs">Giám sát phụ trách:</span> <strong>${shop.supervisor}</strong></div>
        <div><span class="text-[#667085] text-xs">Chỉ tiêu S.O:</span> <strong>${shop.targetSO} xe</strong></div>
        <div><span class="text-[#667085] text-xs">Thực đạt S.O:</span> <strong>${shop.currentSO === null ? 'Chưa đủ dữ liệu' : shop.currentSO + ' xe'}</strong></div>
      </div>
      <div class="p-3.5 rounded-xl border space-y-1">
        <div class="font-bold text-[#172033]">Đánh giá cửa hàng: ${evaluation.label} (${evaluation.reason || ''})</div>
      </div>
      <div class="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
        <div class="font-bold text-amber-900">Kế hoạch cải thiện & Hỗ trợ thực địa:</div>
        <p class="text-xs text-amber-800">${shop.improvementPlan}</p>
      </div>
    `;
    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  // =========================================================================
  // 1. QUẢN LÝ DỮ LIỆU NHÂN SỰ THEO THÁNG (LOCALSTORAGE + SUPABASE SYNC)
  // =========================================================================
  STORAGE_KEY: 'yadea_shop_staff_monthly_v1',

  makeRecordKey(dvn, year, month) {
    return `${String(dvn).trim().toUpperCase()}_${Number(year)}_${Number(month)}`;
  },

  getStaffDB() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu nhân sự cửa hàng:', e);
      return {};
    }
  },

  saveStaffDB(dbObj) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dbObj));
    } catch (e) {
      console.warn('Bộ nhớ LocalStorage đầy, ưu tiên lưu Supabase:', e);
    }
  },

  sanitizeWholeNumber(val) {
    if (val === null || val === undefined || String(val).trim() === '') return null;
    const str = String(val).trim();
    if (!/^\d+$/.test(str)) return NaN;
    const num = Number(str);
    return Number.isInteger(num) && num >= 0 ? num : NaN;
  },

  getRecord(dvn, year, month, dbRef = null) {
    const db = dbRef || this.getStaffDB();
    const key = this.makeRecordKey(dvn, year, month);
    return db[key] || null;
  },

  getPrevYearMonth(year, month) {
    const y = Number(year);
    const m = Number(month);
    return m > 1 ? { year: y, month: m - 1 } : { year: y - 1, month: 12 };
  },

  async fetchStaffFromSupabaseIfNeeded(force = false) {
    if (this.hasLoadedStaffFromSupabase && !force) return;
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;

    this.hasLoadedStaffFromSupabase = true;
    try {
      const { data, error } = await window.SupabaseService.client
        .from('shop_staff_monthly')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        const db = this.getStaffDB();
        data.forEach(row => {
          const dvn = String(row.dvn_code || '').trim();
          const yr = Number(row.year);
          const mo = Number(row.month);
          if (!dvn || !yr || !mo) return;

          const a1 = Math.max(0, parseInt(row.age_18_22, 10) || 0);
          const a2 = Math.max(0, parseInt(row.age_23_27, 10) || 0);
          const a3 = Math.max(0, parseInt(row.age_28_plus, 10) || 0);
          const nj = Math.max(0, parseInt(row.new_joiners, 10) || 0);
          const rs = Math.max(0, parseInt(row.resigned, 10) || 0);

          const key = this.makeRecordKey(dvn, yr, mo);
          db[key] = {
            dvn: dvn,
            shopName: row.shop_name || '',
            year: yr,
            month: mo,
            age18_22: a1,
            age23_27: a2,
            age28_plus: a3,
            totalStaff: a1 + a2 + a3,
            newJoiners: nj,
            resigned: rs,
            updatedBy: row.updated_by || 'Hệ thống',
            updatedAt: row.updated_at ? new Date(row.updated_at).toLocaleString('vi-VN') : '',
            history: Array.isArray(row.edit_history) ? row.edit_history : []
          };
        });
        this.saveStaffDB(db);
        if (window.AppState?.activeModule === 'grading') {
          window.App.renderCurrentModule();
        }
      }
    } catch (e) {
      console.warn('[ShopsModule] Bảng shop_staff_monthly chưa tạo hoặc đang dùng LocalStorage:', e);
    }
  },

  async upsertRecordsToSupabase(recordsArray) {
    if (!window.SupabaseService || !window.SupabaseService.isConnected || !recordsArray.length) return null;
    this.isSyncingStaff = true;
    try {
      const shopMap = new Map(this.getAuthorizedShops(true).map(s => [s.dvn, s]));
      const payload = recordsArray.map(rec => {
        const sInfo = shopMap.get(rec.dvn) || {};
        return {
          dvn_code: String(rec.dvn).trim(),
          shop_name: rec.shopName || sInfo.name || '',
          year: Number(rec.year),
          month: Number(rec.month),
          age_18_22: Number(rec.age18_22),
          age_23_27: Number(rec.age23_27),
          age_28_plus: Number(rec.age28_plus),
          new_joiners: Number(rec.newJoiners),
          resigned: Number(rec.resigned),
          region: sInfo.mien || '',
          sub_region: sInfo.subRegion || '',
          director_name: sInfo.director || '',
          supervisor_name: sInfo.supervisor || '',
          sale_name: sInfo.sale || '',
          updated_by: rec.updatedBy || window.AppState?.userName || 'Admin',
          updated_at: new Date().toISOString(),
          edit_history: Array.isArray(rec.history) ? rec.history : []
        };
      });

      const { error } = await window.SupabaseService.client
        .from('shop_staff_monthly')
        .upsert(payload, { onConflict: 'dvn_code,year,month' });

      this.isSyncingStaff = false;
      return error;
    } catch (err) {
      this.isSyncingStaff = false;
      return err;
    }
  },

  // =========================================================================
  // 2. PHÂN QUYỀN & BỘ LỌC LIÊN ĐỘNG (KHU VỰC -> GIÁM ĐỐC -> SALE -> SHOP)
  // =========================================================================
  syncPeriodWithHeader() {
    const raw = window.AppState?.month || '2026-09';
    const [yStr, mStr] = raw.split('-');
    const hYear = parseInt(yStr, 10) || 2026;
    const hMonth = parseInt(mStr, 10) || 9;

    if (!this._periodInitialized) {
      this.selectedYear = hYear;
      this.selectedMonth = hMonth;
      this._periodInitialized = true;
    }
  },

  setStaffPeriod(year, month) {
    if (year !== null) this.selectedYear = Number(year);
    if (month !== null) this.selectedMonth = Number(month);

    const mPad = String(this.selectedMonth).padStart(2, '0');
    if (window.AppState) {
      window.AppState.month = `${this.selectedYear}-${mPad}`;
    }
    const mEl = document.getElementById('filter-month-num');
    const yEl = document.getElementById('filter-year-num');
    if (mEl) mEl.value = mPad;
    if (yEl) yEl.value = String(this.selectedYear);

    this.pendingEdits = {};
    window.App.renderCurrentModule();
  },

  setStaffSubTab(tabId) {
    this.staffSubTab = tabId;
    window.App.renderCurrentModule();
  },

  setStatsGroupBy(mode) {
    this.statsGroupBy = mode;
    window.App.renderCurrentModule();
  },

  setStaffFilter(key, val) {
    this[key] = val;

    if (key === 'subRegionFilter') {
      this.directorFilter = 'ALL';
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'directorFilter') {
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'supervisorFilter') {
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'saleFilter') {
      this.shopFilter = 'ALL';
    }

    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('staff-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  resetStaffFilters() {
    this.subRegionFilter = 'ALL';
    this.directorFilter = 'ALL';
    this.supervisorFilter = 'ALL';
    this.saleFilter = 'ALL';
    this.shopFilter = 'ALL';
    this.updateStatusFilter = 'ALL';
    this.searchQuery = '';
    window.App.renderCurrentModule();
  },

  getAuthorizedShops(ignoreHeaderRegion = false) {
    const rawList = window.AdminShopsModule
      ? window.AdminShopsModule.getList()
      : (window.AppStore?.shops || []);

    const role = window.AppState?.role || 'SALE';
    const headerRegion = window.AppState?.region || 'ALL';
    const assignedRegion = window.AppState?.assignedRegion || 'ALL';
    const effectiveRegion = ignoreHeaderRegion
      ? (role === 'ADMIN' ? 'ALL' : assignedRegion)
      : (role === 'ADMIN' ? headerRegion : assignedRegion);

    const userNameNorm = window.AppUtils?.normalizePersonName
      ? window.AppUtils.normalizePersonName(window.AppState?.userName || '')
      : '';

    const uniqueMap = new Map();
    rawList.forEach(item => {
      const dvnStr = String(item.dvn || '').trim();
      if (!dvnStr) return;
      const enumRegion = window.AppUtils?.resolveMienCode
        ? window.AppUtils.resolveMienCode(item.mien, item.region)
        : (String(item.mien || '').toUpperCase().includes('NAM') ? 'SOUTH' : 'NORTH');

      uniqueMap.set(dvnStr, {
        dvn: dvnStr,
        svn: String(item.svn || '').trim(),
        name: item.name || '',
        mien: enumRegion,
        mienLabel: enumRegion === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部',
        subRegion: item.region || item.subRegion || 'Khác',
        province: item.province || '',
        director: item.gdKhuVuc || item.director || 'Chưa phân công',
        supervisor: item.supervisor || item.gdMien || 'Chưa phân công',
        sale: item.sale || 'Chưa phân công',
        shopType: item.shopType || 'A形象店',
        rawRef: item
      });
    });

    const allUnique = Array.from(uniqueMap.values());

    const hasDirectDirectorMatch = role === 'REGIONAL_DIRECTOR' && userNameNorm &&
      allUnique.some(s => window.AppUtils?.normalizePersonName(s.director) === userNameNorm);
    const hasDirectSupMatch = role === 'SUPERVISOR' && userNameNorm &&
      allUnique.some(s => window.AppUtils?.normalizePersonName(s.supervisor) === userNameNorm);
    const hasDirectSaleMatch = role === 'SALE' && userNameNorm &&
      allUnique.some(s => window.AppUtils?.normalizePersonName(s.sale) === userNameNorm);

    return allUnique.filter(s => {
      if (effectiveRegion !== 'ALL' && s.mien !== effectiveRegion) return false;
      if (hasDirectDirectorMatch) {
        return window.AppUtils.normalizePersonName(s.director) === userNameNorm;
      }
      if (hasDirectSupMatch) {
        return window.AppUtils.normalizePersonName(s.supervisor) === userNameNorm;
      }
      if (hasDirectSaleMatch) {
        return window.AppUtils.normalizePersonName(s.sale) === userNameNorm;
      }
      return true;
    }).sort((a, b) => String(a.dvn).localeCompare(String(b.dvn)));
  },

  getShopRawSO(rawShop, year, month) {
    if (!rawShop) return null;
    if (window.DashboardModule && typeof window.DashboardModule.getRawSO === 'function') {
      return window.DashboardModule.getRawSO(rawShop, year, month);
    }
    const yKey = `so${year}`;
    const mKey = `T${Number(month)}`;
    if (rawShop[yKey] && rawShop[yKey][mKey] !== undefined && rawShop[yKey][mKey] !== null) {
      return Number(rawShop[yKey][mKey]);
    }
    if (year > 2026 && rawShop.so2026 && rawShop.so2026[`Y${year}_${mKey}`] !== undefined && rawShop.so2026[`Y${year}_${mKey}`] !== null) {
      return Number(rawShop.so2026[`Y${year}_${mKey}`]);
    }
    return null;
  },

  getFilteredStaffShops(authorizedShops, dbRef) {
    const db = dbRef || this.getStaffDB();
    const q = this.searchQuery.trim().toLowerCase();
    const y = this.selectedYear;
    const m = this.selectedMonth;

    return authorizedShops.filter(s => {
      const matchSubReg = this.subRegionFilter === 'ALL' || s.subRegion === this.subRegionFilter;
      const matchDir = this.directorFilter === 'ALL' || s.director === this.directorFilter;
      const matchSup = this.supervisorFilter === 'ALL' || s.supervisor === this.supervisorFilter;
      const matchSale = this.saleFilter === 'ALL' || s.sale === this.saleFilter;
      const matchShop = this.shopFilter === 'ALL' || String(s.dvn) === String(this.shopFilter);

      const rec = this.getRecord(s.dvn, y, m, db);
      const isUpdated = rec !== null;
      const matchStatus =
        this.updateStatusFilter === 'ALL' ||
        (this.updateStatusFilter === 'UPDATED' && isUpdated) ||
        (this.updateStatusFilter === 'NOT_UPDATED' && !isUpdated);

      const matchQ = !q ||
        String(s.dvn).toLowerCase().includes(q) ||
        String(s.name).toLowerCase().includes(q) ||
        String(s.province).toLowerCase().includes(q) ||
        String(s.sale).toLowerCase().includes(q) ||
        String(s.director).toLowerCase().includes(q) ||
        String(s.supervisor).toLowerCase().includes(q);

      return matchSubReg && matchDir && matchSup && matchSale && matchShop && matchStatus && matchQ;
    });
  },

  // =========================================================================
  // 3. XỬ LÝ NHẬP LIỆU TRỰC TIẾP, SAO CHÉP THÁNG TRƯỚC & LỊCH SỬ CHỈNH SỬA
  // =========================================================================
  getEffectiveDraftOrSaved(shop, year, month, dbRef) {
    const key = this.makeRecordKey(shop.dvn, year, month);
    const pending = this.pendingEdits[key];
    const saved = this.getRecord(shop.dvn, year, month, dbRef);

    if (pending) {
      const a1 = Number(pending.age18_22) || 0;
      const a2 = Number(pending.age23_27) || 0;
      const a3 = Number(pending.age28_plus) || 0;
      return {
        isUpdated: true,
        isDirty: true,
        age18_22: a1,
        age23_27: a2,
        age28_plus: a3,
        totalStaff: a1 + a2 + a3,
        newJoiners: Number(pending.newJoiners) || 0,
        resigned: Number(pending.resigned) || 0,
        updatedBy: saved?.updatedBy || '',
        updatedAt: saved?.updatedAt || '',
        history: saved?.history || []
      };
    }

    if (saved) {
      return {
        isUpdated: true,
        isDirty: false,
        age18_22: saved.age18_22,
        age23_27: saved.age23_27,
        age28_plus: saved.age28_plus,
        totalStaff: saved.totalStaff,
        newJoiners: saved.newJoiners,
        resigned: saved.resigned,
        updatedBy: saved.updatedBy,
        updatedAt: saved.updatedAt,
        history: saved.history || []
      };
    }

    return {
      isUpdated: false,
      isDirty: false,
      age18_22: null,
      age23_27: null,
      age28_plus: null,
      totalStaff: null,
      newJoiners: null,
      resigned: null,
      updatedBy: '',
      updatedAt: '',
      history: []
    };
  },

  handleInlineStaffInput(dvnCode, field, inputEl) {
    const cleanDvn = String(dvnCode).trim();
    const rawVal = inputEl.value;

    if (rawVal !== '' && (!/^\d+$/.test(rawVal) || Number(rawVal) < 0)) {
      inputEl.value = rawVal.replace(/[^\d]/g, '');
    }

    const key = this.makeRecordKey(cleanDvn, this.selectedYear, this.selectedMonth);
    const saved = this.getRecord(cleanDvn, this.selectedYear, this.selectedMonth);

    if (!this.pendingEdits[key]) {
      this.pendingEdits[key] = {
        dvn: cleanDvn,
        age18_22: saved ? saved.age18_22 : 0,
        age23_27: saved ? saved.age23_27 : 0,
        age28_plus: saved ? saved.age28_plus : 0,
        newJoiners: saved ? saved.newJoiners : 0,
        resigned: saved ? saved.resigned : 0
      };
    }

    const parsedNum = inputEl.value === '' ? 0 : Math.max(0, parseInt(inputEl.value, 10) || 0);
    this.pendingEdits[key][field] = parsedNum;

    const p = this.pendingEdits[key];
    const newTotal = (Number(p.age18_22) || 0) + (Number(p.age23_27) || 0) + (Number(p.age28_plus) || 0);

    const totalCell = document.getElementById(`staff-total-${cleanDvn}`);
    if (totalCell) {
      totalCell.innerHTML = `<span class="px-2.5 py-1 rounded-lg bg-orange-100 text-[#F26522] font-mono font-black text-sm">${newTotal} người</span>`;
    }

    const saveBadge = document.getElementById('pending-staff-count-badge');
    const count = Object.keys(this.pendingEdits).length;
    if (saveBadge) {
      saveBadge.innerText = count > 0 ? `(${count} Shop đang sửa)` : '';
    }
  },

  copyFromPreviousMonth() {
    const prev = this.getPrevYearMonth(this.selectedYear, this.selectedMonth);
    const db = this.getStaffDB();
    const authorized = this.getAuthorizedShops();
    const filtered = this.getFilteredStaffShops(authorized, db);

    let copiedCount = 0;
    filtered.forEach(shop => {
      const prevRec = this.getRecord(shop.dvn, prev.year, prev.month, db);
      if (prevRec) {
        const curKey = this.makeRecordKey(shop.dvn, this.selectedYear, this.selectedMonth);
        this.pendingEdits[curKey] = {
          dvn: shop.dvn,
          age18_22: prevRec.age18_22,
          age23_27: prevRec.age23_27,
          age28_plus: prevRec.age28_plus,
          newJoiners: 0,
          resigned: 0,
          _copiedFrom: `T${String(prev.month).padStart(2, '0')}/${prev.year}`
        };
        copiedCount++;
      }
    });

    if (copiedCount === 0) {
      alert(`Không tìm thấy dữ liệu nhân sự của Tháng ${String(prev.month).padStart(2, '0')}/${prev.year} cho các cửa hàng đang lọc để sao chép!`);
      return;
    }

    window.App.renderCurrentModule();
    alert(`Đã sao chép số lượng nhân sự 3 nhóm tuổi từ Tháng ${String(prev.month).padStart(2, '0')}/${prev.year} cho ${copiedCount} cửa hàng!\n\nGiám sát chỉ cần chỉnh sửa các cửa hàng có biến động rồi bấm "Lưu Dữ Liệu Tháng".`);
  },

  async saveSingleShopStaff(dvnCode) {
    const cleanDvn = String(dvnCode).trim();
    const key = this.makeRecordKey(cleanDvn, this.selectedYear, this.selectedMonth);
    const draft = this.pendingEdits[key];
    if (!draft) {
      alert(`Bạn chưa thay đổi số liệu nhân sự của cửa hàng ${cleanDvn} trong Tháng ${this.selectedMonth}/${this.selectedYear}!`);
      return;
    }
    await this.commitStaffChanges([key]);
  },

  async saveAllPendingStaff() {
    const keys = Object.keys(this.pendingEdits);
    if (keys.length === 0) {
      alert(`Chưa có thay đổi nào cần lưu cho Tháng ${this.selectedMonth}/${this.selectedYear}. Bạn có thể nhập số trực tiếp hoặc bấm "Sao chép tháng trước"!`);
      return;
    }
    await this.commitStaffChanges(keys);
  },

  async commitStaffChanges(keysToCommit) {
    const db = this.getStaffDB();
    const shopMap = new Map(this.getAuthorizedShops(true).map(s => [s.dvn, s]));
    const actor = window.AppState?.userName || 'Giám sát';
    const nowStr = new Date().toLocaleString('vi-VN');
    const savedRecordsForCloud = [];

    keysToCommit.forEach(key => {
      const draft = this.pendingEdits[key];
      if (!draft) return;

      const dvn = String(draft.dvn).trim();
      const shopObj = shopMap.get(dvn);
      const oldRec = db[key] || null;

      const a1 = Math.max(0, parseInt(draft.age18_22, 10) || 0);
      const a2 = Math.max(0, parseInt(draft.age23_27, 10) || 0);
      const a3 = Math.max(0, parseInt(draft.age28_plus, 10) || 0);
      const total = a1 + a2 + a3;
      const nj = Math.max(0, parseInt(draft.newJoiners, 10) || 0);
      const rs = Math.max(0, parseInt(draft.resigned, 10) || 0);

      const historyArr = Array.isArray(oldRec?.history) ? [...oldRec.history] : [];
      const oldSummary = oldRec
        ? `Tổng: ${oldRec.totalStaff} (18-22: ${oldRec.age18_22}, 23-27: ${oldRec.age23_27}, 28+: ${oldRec.age28_plus} | Mới: ${oldRec.newJoiners}, Nghỉ: ${oldRec.resigned})`
        : 'Chưa có dữ liệu';
      const newSummary = `Tổng: ${total} (18-22: ${a1}, 23-27: ${a2}, 28+: ${a3} | Mới: +${nj}, Nghỉ: -${rs})`;

      historyArr.unshift({
        time: nowStr,
        actor: actor,
        role: window.AppState?.role || 'SUPERVISOR',
        action: draft._copiedFrom ? `Sao chép từ ${draft._copiedFrom} & Cập nhật` : (oldRec ? 'Chỉnh sửa số liệu' : 'Nhập mới lần đầu'),
        oldValue: oldSummary,
        newValue: newSummary
      });

      const newRecord = {
        dvn: dvn,
        shopName: shopObj?.name || oldRec?.shopName || '',
        year: this.selectedYear,
        month: this.selectedMonth,
        age18_22: a1,
        age23_27: a2,
        age28_plus: a3,
        totalStaff: total,
        newJoiners: nj,
        resigned: rs,
        updatedBy: actor,
        updatedAt: nowStr,
        history: historyArr.slice(0, 30)
      };

      db[key] = newRecord;
      savedRecordsForCloud.push(newRecord);
      delete this.pendingEdits[key];
    });

    this.saveStaffDB(db);
    await this.upsertRecordsToSupabase(savedRecordsForCloud);
    window.App.renderCurrentModule();
    alert(`Đã lưu thành công cơ cấu nhân sự Tháng ${String(this.selectedMonth).padStart(2, '0')}/${this.selectedYear} cho ${savedRecordsForCloud.length} cửa hàng!`);
  },

  openStaffHistoryModal(dvnCode) {
    const cleanDvn = String(dvnCode).trim();
    const shop = this.getAuthorizedShops(true).find(s => s.dvn === cleanDvn);
    const rec = this.getRecord(cleanDvn, this.selectedYear, this.selectedMonth);
    const mStr = String(this.selectedMonth).padStart(2, '0');

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-clock-rotate-left text-[#F26522]"></i>
        <span>Lịch Sử Chỉnh Sửa Nhân Sự • ${cleanDvn} (${shop?.name || ''}) — T${mStr}/${this.selectedYear}</span>
      </div>
    `;

    const historyList = rec?.history || [];
    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4 text-xs">
        ${rec ? `
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Tổng nhân sự hiện tại</div>
              <div class="text-base font-black font-mono text-[#F26522] mt-0.5">${rec.totalStaff} người</div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Cơ cấu 3 nhóm tuổi</div>
              <div class="font-mono font-bold text-slate-800 mt-0.5">${rec.age18_22} / ${rec.age23_27} / ${rec.age28_plus}</div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Mới vào / Nghỉ việc</div>
              <div class="font-mono font-bold mt-0.5"><span class="text-emerald-600">+${rec.newJoiners}</span> / <span class="text-rose-600">-${rec.resigned}</span></div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Cập nhật gần nhất</div>
              <div class="font-bold text-slate-800 mt-0.5">${rec.updatedBy}</div>
              <div class="text-[10px] font-mono text-slate-500">${rec.updatedAt}</div>
            </div>
          </div>
        ` : ''}

        <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          ${historyList.length > 0 ? historyList.map((h, idx) => `
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono font-bold text-[10px]">#${historyList.length - idx}</span>
                  <strong class="text-slate-900">${h.actor}</strong>
                  <span class="px-2 py-0.5 rounded-full bg-orange-50 text-[#F26522] font-bold text-[10px]">${h.action}</span>
                </div>
                <span class="font-mono text-slate-500 font-bold"><i class="fa-regular fa-clock mr-1"></i>${h.time}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div class="p-2 rounded-xl bg-rose-50/50 border border-rose-100 text-slate-600">
                  <span class="font-extrabold text-rose-700 block mb-0.5">Trước khi sửa:</span>
                  <span class="font-mono">${h.oldValue}</span>
                </div>
                <div class="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-800">
                  <span class="font-extrabold text-emerald-700 block mb-0.5">Sau khi sửa:</span>
                  <span class="font-mono font-bold">${h.newValue}</span>
                </div>
              </div>
            </div>
          `).join('') : `
            <div class="py-10 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed">
              Chưa có lịch sử chỉnh sửa cho cửa hàng này trong Tháng ${mStr}/${this.selectedYear}.
            </div>
          `}
        </div>
      </div>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  // =========================================================================
  // 4. NHẬP & XUẤT EXCEL (MẪU EXCEL, VALIDATE CHẶT CHẼ, XEM TRƯỚC, BÁO CÁO)
  // =========================================================================
  async exportStaffExcelTemplate() {
    if (window.AppUtils) await window.AppUtils.ensureXLSXLoaded();
    if (!window.XLSX) {
      alert('Không thể tải thư viện Excel (SheetJS)!');
      return;
    }

    const db = this.getStaffDB();
    const authorized = this.getAuthorizedShops();
    const filtered = this.getFilteredStaffShops(authorized, db);
    const y = this.selectedYear;
    const m = this.selectedMonth;

    const rows = filtered.map(shop => {
      const rec = this.getRecord(shop.dvn, y, m, db);
      return {
        'Mã DVN': String(shop.dvn),
        'Tên Shop': shop.name,
        'Tháng': m,
        'Năm': y,
        'Nhân sự 18-22 tuổi': rec ? rec.age18_22 : '',
        'Nhân sự 23-27 tuổi': rec ? rec.age23_27 : '',
        'Từ 28 tuổi trở lên': rec ? rec.age28_plus : '',
        'Số người mới vào': rec ? rec.newJoiners : '',
        'Số người nghỉ': rec ? rec.resigned : '',
        'Khu vực (Tham khảo)': shop.subRegion,
        'Giám đốc KV (Tham khảo)': shop.director,
        'Giám sát (Tham khảo)': shop.supervisor,
        'Sale phụ trách (Tham khảo)': shop.sale
      };
    });

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, `Mau_Nhan_Su_T${m}_${y}`);
    window.XLSX.writeFile(wb, `YADEA_Mau_Nhap_Nhan_Su_T${String(m).padStart(2, '0')}_${y}.xlsx`);
  },

  async exportFilteredStaffReportExcel() {
    if (window.AppUtils) await window.AppUtils.ensureXLSXLoaded();
    if (!window.XLSX) return;

    const db = this.getStaffDB();
    const authorized = this.getAuthorizedShops();
    const filtered = this.getFilteredStaffShops(authorized, db);
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const prev = this.getPrevYearMonth(y, m);

    const rows = filtered.map(shop => {
      const cur = this.getRecord(shop.dvn, y, m, db);
      const prv = this.getRecord(shop.dvn, prev.year, prev.month, db);
      const curSO = this.getShopRawSO(shop.rawRef, y, m);
      const diffStaff = (cur && prv) ? (cur.totalStaff - prv.totalStaff) : '';
      const productivity = (cur && cur.totalStaff > 0 && curSO !== null)
        ? Number((curSO / cur.totalStaff).toFixed(2))
        : '';

      return {
        'Mã DVN': String(shop.dvn),
        'Tên Shop': shop.name,
        'Khu Vực': shop.subRegion,
        'Tỉnh/Thành': shop.province,
        'Giám Đốc KV': shop.director,
        'Giám Sát': shop.supervisor,
        'Sale Phụ Trách': shop.sale,
        'Tháng': m,
        'Năm': y,
        'Trạng Thái': cur ? 'Đã cập nhật' : 'Chưa cập nhật',
        '18-22 tuổi': cur ? cur.age18_22 : 'Chưa cập nhật',
        '23-27 tuổi': cur ? cur.age23_27 : 'Chưa cập nhật',
        'Từ 28 tuổi trở lên': cur ? cur.age28_plus : 'Chưa cập nhật',
        'Tổng Nhân Sự': cur ? cur.totalStaff : 'Chưa cập nhật',
        'Nhân Sự Tháng Trước': prv ? prv.totalStaff : 'Chưa cập nhật',
        'Tăng/Giảm Nhân Sự': diffStaff !== '' ? diffStaff : '—',
        'Số Người Mới Vào': cur ? cur.newJoiners : '—',
        'Số Người Nghỉ': cur ? cur.resigned : '—',
        [`S.O Tháng ${m}/${y}`]: curSO !== null ? curSO : 'NULL',
        'Năng Suất (S.O / Nhân Sự)': productivity !== '' ? productivity : '—',
        'Người Cập Nhật': cur?.updatedBy || '',
        'Thời Gian Cập Nhật': cur?.updatedAt || ''
      };
    });

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, `Bao_Cao_NS_T${m}_${y}`);
    window.XLSX.writeFile(wb, `YADEA_Bao_Cao_Co_Cau_Nhan_Su_T${String(m).padStart(2, '0')}_${y}.xlsx`);
  },

  triggerStaffExcelImport() {
    const inp = document.getElementById('staff-excel-import-input');
    if (inp) {
      inp.value = '';
      inp.click();
    }
  },

  async handleStaffExcelFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.AppUtils) await window.AppUtils.ensureXLSXLoaded();
    if (!window.XLSX) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = window.XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      if (!rawRows || rawRows.length < 2) {
        alert('File Excel không có dữ liệu!');
        return;
      }

      const headerRow = (rawRows[0] || []).map(c => String(c || '').trim().toUpperCase());
      const findCol = (keywords) => headerRow.findIndex(h => keywords.some(k => h.includes(k)));

      const colDvn = findCol(['DVN']);
      const colName = findCol(['TÊN SHOP', 'TÊN CỬA HÀNG', 'TÊN ĐẠI LÝ', 'SHOP']);
      const colMonth = findCol(['THÁNG', 'MONTH']);
      const colYear = findCol(['NĂM', 'YEAR']);
      const col18 = findCol(['18-22', '18–22', '18']);
      const col23 = findCol(['23-27', '23–27', '23']);
      const col28 = findCol(['28', 'TRỞ LÊN']);
      const colNew = findCol(['MỚI VÀO', 'MỚI']);
      const colResign = findCol(['NGHỈ']);

      if (colDvn === -1 || col18 === -1 || col23 === -1 || col28 === -1) {
        alert('File Excel thiếu các cột bắt buộc (Mã DVN, Nhân sự 18-22 tuổi, 23-27 tuổi, Từ 28 tuổi trở lên). Vui lòng tải "Xuất Excel Mẫu" để đúng định dạng!');
        return;
      }

      const authorizedMap = new Map(this.getAuthorizedShops().map(s => [s.dvn.toUpperCase(), s]));
      const db = this.getStaffDB();
      const seenInFile = new Set();
      const validPreviews = [];
      const errors = [];

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.every(cell => cell === null || String(cell).trim() === '')) continue;

        const rowNum = r + 1;
        const rawDvn = String(row[colDvn] || '').trim().toUpperCase();
        if (!rawDvn) continue;

        const shopObj = authorizedMap.get(rawDvn);
        if (!shopObj) {
          errors.push(`Dòng ${rowNum} [${rawDvn}]: Mã DVN không tồn tại hoặc nằm ngoài phạm vi phân quyền của bạn.`);
          continue;
        }

        const mVal = colMonth >= 0 && row[colMonth] !== null && String(row[colMonth]).trim() !== ''
          ? this.sanitizeWholeNumber(row[colMonth])
          : this.selectedMonth;
        const yVal = colYear >= 0 && row[colYear] !== null && String(row[colYear]).trim() !== ''
          ? this.sanitizeWholeNumber(row[colYear])
          : this.selectedYear;

        if (isNaN(mVal) || mVal < 1 || mVal > 12 || isNaN(yVal) || yVal < 2024 || yVal > 2035) {
          errors.push(`Dòng ${rowNum} [${rawDvn}]: Tháng/Năm không hợp lệ (${row[colMonth]}/${row[colYear]}).`);
          continue;
        }

        const uniqueKey = this.makeRecordKey(rawDvn, yVal, mVal);
        if (seenInFile.has(uniqueKey)) {
          errors.push(`Dòng ${rowNum} [${rawDvn}]: Bị trùng lặp Mã DVN + Kỳ Tháng ${mVal}/${yVal} ngay trong file Excel.`);
          continue;
        }
        seenInFile.add(uniqueKey);

        const raw18 = row[col18];
        const raw23 = row[col23];
        const raw28 = row[col28];
        if ((raw18 === null || String(raw18).trim() === '') &&
            (raw23 === null || String(raw23).trim() === '') &&
            (raw28 === null || String(raw28).trim() === '')) {
          continue;
        }

        const a1 = raw18 === null || String(raw18).trim() === '' ? 0 : this.sanitizeWholeNumber(raw18);
        const a2 = raw23 === null || String(raw23).trim() === '' ? 0 : this.sanitizeWholeNumber(raw23);
        const a3 = raw28 === null || String(raw28).trim() === '' ? 0 : this.sanitizeWholeNumber(raw28);
        const nj = (colNew >= 0 && row[colNew] !== null && String(row[colNew]).trim() !== '') ? this.sanitizeWholeNumber(row[colNew]) : 0;
        const rs = (colResign >= 0 && row[colResign] !== null && String(row[colResign]).trim() !== '') ? this.sanitizeWholeNumber(row[colResign]) : 0;

        if ([a1, a2, a3, nj, rs].some(v => Number.isNaN(v))) {
          errors.push(`Dòng ${rowNum} [${rawDvn}]: Số lượng người không hợp lệ (chứa số âm, số thập phân hoặc chữ).`);
          continue;
        }

        const oldRec = db[uniqueKey] || null;
        const newTotal = a1 + a2 + a3;

        validPreviews.push({
          key: uniqueKey,
          dvn: shopObj.dvn,
          shopName: shopObj.name || (colName >= 0 ? String(row[colName] || '') : ''),
          year: yVal,
          month: mVal,
          age18_22: a1,
          age23_27: a2,
          age28_plus: a3,
          totalStaff: newTotal,
          newJoiners: nj,
          resigned: rs,
          oldTotal: oldRec ? oldRec.totalStaff : null,
          isOverwrite: Boolean(oldRec)
        });
      }

      this.importPreviewItems = validPreviews;
      this.importErrors = errors;
      this.openImportPreviewModal(file.name);
    } catch (err) {
      alert('Lỗi đọc file Excel: ' + err.message);
    } finally {
      event.target.value = '';
    }
  },

  openImportPreviewModal(fileName) {
    const items = this.importPreviewItems || [];
    const errors = this.importErrors || [];

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-file-circle-check text-emerald-600"></i>
        <span>Xem Trước Dữ Liệu Import Nhân Sự: ${fileName}</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex flex-wrap items-center gap-3 font-bold">
            <span class="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              ✓ Hợp lệ: ${items.length} cửa hàng
            </span>
            <span class="px-3 py-1 rounded-lg bg-blue-100 text-blue-800">
              Nhập mới: ${items.filter(x => !x.isOverwrite).length} | Cập nhật lại: ${items.filter(x => x.isOverwrite).length}
            </span>
            ${errors.length > 0 ? `
              <span class="px-3 py-1 rounded-lg bg-rose-100 text-rose-700">
                ⚠️ Cảnh báo lỗi: ${errors.length} dòng
              </span>
            ` : ''}
          </div>
        </div>

        ${errors.length > 0 ? `
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 max-h-36 overflow-y-auto">
            <div class="font-extrabold text-rose-800 uppercase text-[11px]">Danh sách dòng lỗi bị từ chối (Trùng mã DVN hoặc số âm/thập phân):</div>
            <ul class="list-disc pl-5 text-rose-700 font-semibold space-y-0.5">
              ${errors.map(err => `<li>${err}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${items.length > 0 ? `
          <div class="overflow-x-auto max-h-[46vh] rounded-2xl border border-slate-200">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 bg-slate-100 text-slate-700 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-2.5 px-3">Mã DVN</th>
                  <th class="py-2.5 px-3">Tên Shop</th>
                  <th class="py-2.5 px-2 text-center">Kỳ</th>
                  <th class="py-2.5 px-2 text-center">18–22T</th>
                  <th class="py-2.5 px-2 text-center">23–27T</th>
                  <th class="py-2.5 px-2 text-center">28+ Tuổi</th>
                  <th class="py-2.5 px-3 text-center">Tổng Cũ → Mới</th>
                  <th class="py-2.5 px-2 text-center">Mới Vào / Nghỉ</th>
                  <th class="py-2.5 px-3 text-center">Loại</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${items.map(it => `
                  <tr class="hover:bg-orange-50/40">
                    <td class="py-2 px-3 font-black text-blue-600">${it.dvn}</td>
                    <td class="py-2 px-3 font-sans font-bold text-slate-900">${it.shopName}</td>
                    <td class="py-2 px-2 text-center font-bold">T${String(it.month).padStart(2, '0')}/${it.year}</td>
                    <td class="py-2 px-2 text-center">${it.age18_22}</td>
                    <td class="py-2 px-2 text-center">${it.age23_27}</td>
                    <td class="py-2 px-2 text-center">${it.age28_plus}</td>
                    <td class="py-2 px-3 text-center font-black">
                      <span class="text-slate-400">${it.oldTotal !== null ? it.oldTotal : 'Chưa có'}</span>
                      <span class="mx-1 text-slate-400">→</span>
                      <span class="text-[#F26522] text-sm">${it.totalStaff}</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <span class="text-emerald-600 font-bold">+${it.newJoiners}</span> / <span class="text-rose-600 font-bold">-${it.resigned}</span>
                    </td>
                    <td class="py-2 px-3 text-center font-sans">
                      ${it.isOverwrite
                        ? '<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Ghi đè có lưu LS</span>'
                        : '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Nhập mới</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="py-8 text-center text-slate-400 font-bold">
            Không có dòng dữ liệu hợp lệ nào để lưu.
          </div>
        `}

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50 cursor-pointer">Hủy Bỏ</button>
          ${items.length > 0 ? `
            <button type="button" onclick="ShopsModule.confirmSaveImportedStaff()" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
              <i class="fa-solid fa-check-double mr-1"></i> Xác Nhận Lưu (${items.length} Cửa Hàng)
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async confirmSaveImportedStaff() {
    const items = this.importPreviewItems || [];
    if (items.length === 0) return;

    const db = this.getStaffDB();
    const actor = window.AppState?.userName || 'Admin';
    const nowStr = new Date().toLocaleString('vi-VN');
    const cloudRecords = [];

    items.forEach(it => {
      const oldRec = db[it.key] || null;
      const historyArr = Array.isArray(oldRec?.history) ? [...oldRec.history] : [];

      const oldSummary = oldRec
        ? `Tổng: ${oldRec.totalStaff} (18-22: ${oldRec.age18_22}, 23-27: ${oldRec.age23_27}, 28+: ${oldRec.age28_plus} | Mới: ${oldRec.newJoiners}, Nghỉ: ${oldRec.resigned})`
        : 'Chưa có dữ liệu';
      const newSummary = `Tổng: ${it.totalStaff} (18-22: ${it.age18_22}, 23-27: ${it.age23_27}, 28+: ${it.age28_plus} | Mới: +${it.newJoiners}, Nghỉ: -${it.resigned})`;

      historyArr.unshift({
        time: nowStr,
        actor: actor,
        role: window.AppState?.role || 'ADMIN',
        action: 'Import từ File Excel',
        oldValue: oldSummary,
        newValue: newSummary
      });

      const rec = {
        dvn: it.dvn,
        shopName: it.shopName,
        year: it.year,
        month: it.month,
        age18_22: it.age18_22,
        age23_27: it.age23_27,
        age28_plus: it.age28_plus,
        totalStaff: it.totalStaff,
        newJoiners: it.newJoiners,
        resigned: it.resigned,
        updatedBy: actor,
        updatedAt: nowStr,
        history: historyArr.slice(0, 30)
      };

      db[it.key] = rec;
      cloudRecords.push(rec);
    });

    this.saveStaffDB(db);
    this.importPreviewItems = [];
    this.importErrors = [];
    window.App.closeModal();

    await this.upsertRecordsToSupabase(cloudRecords);
    window.App.renderCurrentModule();
    alert(`Đã Import và lưu thành công dữ liệu nhân sự cho ${cloudRecords.length} cửa hàng!`);
  },

  // =========================================================================
  // 5. TÍNH TOÁN THỐNG KÊ CƠ CẤU NHÂN SỰ & BIỂU ĐỒ 12 THÁNG
  // =========================================================================
  computeGroupStatistics(filteredShops, dbRef) {
    const db = dbRef || this.getStaffDB();
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const prev = this.getPrevYearMonth(y, m);

    const groupMap = new Map();

    filteredShops.forEach(s => {
      let key = 'Toàn bộ phạm vi lọc';
      let subLabel = `${s.mienLabel}`;
      if (this.statsGroupBy === 'NATIONAL') {
        key = s.mienLabel;
        subLabel = 'Cấp Miền';
      } else if (this.statsGroupBy === 'SUB_REGION') {
        key = s.subRegion || 'Khác';
        subLabel = s.mienLabel;
      } else if (this.statsGroupBy === 'DIRECTOR') {
        key = s.director || 'Chưa phân công';
        subLabel = s.subRegion;
      } else if (this.statsGroupBy === 'SUPERVISOR') {
        key = s.supervisor || 'Chưa phân công';
        subLabel = s.subRegion;
      } else if (this.statsGroupBy === 'SALE') {
        key = s.sale || 'Chưa phân công';
        subLabel = `GĐKV: ${s.director}`;
      } else if (this.statsGroupBy === 'SHOP') {
        key = `${s.dvn} - ${s.name}`;
        subLabel = `Sale: ${s.sale}`;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: key,
          subLabel: subLabel,
          totalShops: 0,
          updatedShops: 0,
          notUpdatedShops: 0,
          age18_22: 0,
          age23_27: 0,
          age28_plus: 0,
          totalStaff: 0,
          newJoiners: 0,
          resigned: 0,
          comparableCurStaff: 0,
          comparablePrevStaff: 0,
          comparableShopCount: 0,
          increasedShops: 0,
          decreasedShops: 0,
          unchangedShops: 0
        });
      }

      const g = groupMap.get(key);
      g.totalShops += 1;

      const curRec = this.getRecord(s.dvn, y, m, db);
      const prevRec = this.getRecord(s.dvn, prev.year, prev.month, db);

      if (curRec) {
        g.updatedShops += 1;
        g.age18_22 += curRec.age18_22;
        g.age23_27 += curRec.age23_27;
        g.age28_plus += curRec.age28_plus;
        g.totalStaff += curRec.totalStaff;
        g.newJoiners += curRec.newJoiners;
        g.resigned += curRec.resigned;

        if (prevRec) {
          g.comparableShopCount += 1;
          g.comparableCurStaff += curRec.totalStaff;
          g.comparablePrevStaff += prevRec.totalStaff;
          const diff = curRec.totalStaff - prevRec.totalStaff;
          if (diff > 0) g.increasedShops += 1;
          else if (diff < 0) g.decreasedShops += 1;
          else g.unchangedShops += 1;
        }
      } else {
        g.notUpdatedShops += 1;
      }
    });

    return Array.from(groupMap.values()).map(g => {
      const pct18 = g.totalStaff > 0 ? ((g.age18_22 / g.totalStaff) * 100).toFixed(1) : '0.0';
      const pct23 = g.totalStaff > 0 ? ((g.age23_27 / g.totalStaff) * 100).toFixed(1) : '0.0';
      const pct28 = g.totalStaff > 0 ? ((g.age28_plus / g.totalStaff) * 100).toFixed(1) : '0.0';
      const avgStaff = g.updatedShops > 0 ? (g.totalStaff / g.updatedShops).toFixed(1) : null;
      const momDiff = g.comparableShopCount > 0 ? (g.comparableCurStaff - g.comparablePrevStaff) : null;
      const momPct = (g.comparableShopCount > 0 && g.comparablePrevStaff > 0)
        ? (((g.comparableCurStaff - g.comparablePrevStaff) / g.comparablePrevStaff) * 100).toFixed(1)
        : null;

      return {
        ...g,
        pct18,
        pct23,
        pct28,
        avgStaff,
        momDiff,
        momPct
      };
    }).sort((a, b) => b.totalStaff - a.totalStaff);
  },

  compute12MonthsSeries(filteredShops, dbRef) {
    const db = dbRef || this.getStaffDB();
    const y = this.selectedYear;
    const series = [];

    for (let m = 1; m <= 12; m++) {
      const prev = this.getPrevYearMonth(y, m);
      let updatedShops = 0;
      let age18 = 0;
      let age23 = 0;
      let age28 = 0;
      let totalStaff = 0;
      let newJoiners = 0;
      let resigned = 0;

      let compCurStaff = 0;
      let compPrevStaff = 0;
      let compCount = 0;

      let totalSO = 0;
      let hasAnySO = false;

      let prevMonthTotalSO = 0;
      let hasPrevSO = false;

      filteredShops.forEach(s => {
        const rec = this.getRecord(s.dvn, y, m, db);
        const prevRec = this.getRecord(s.dvn, prev.year, prev.month, db);

        if (rec) {
          updatedShops++;
          age18 += rec.age18_22;
          age23 += rec.age23_27;
          age28 += rec.age28_plus;
          totalStaff += rec.totalStaff;
          newJoiners += rec.newJoiners;
          resigned += rec.resigned;

          if (prevRec) {
            compCount++;
            compCurStaff += rec.totalStaff;
            compPrevStaff += prevRec.totalStaff;
          }
        }

        const soVal = this.getShopRawSO(s.rawRef, y, m);
        if (soVal !== null && soVal !== undefined) {
          totalSO += soVal;
          hasAnySO = true;
        }

        const prevSOVal = this.getShopRawSO(s.rawRef, prev.year, prev.month);
        if (prevSOVal !== null && prevSOVal !== undefined) {
          prevMonthTotalSO += prevSOVal;
          hasPrevSO = true;
        }
      });

      const hasStaffData = updatedShops > 0;
      const staffDiff = (hasStaffData && compCount > 0) ? (compCurStaff - compPrevStaff) : null;
      const staffMoMPct = (hasStaffData && compCount > 0 && compPrevStaff > 0)
        ? Number((((compCurStaff - compPrevStaff) / compPrevStaff) * 100).toFixed(1))
        : null;

      const soDiff = (hasAnySO && hasPrevSO) ? (totalSO - prevMonthTotalSO) : null;
      const soMoMPct = (hasAnySO && hasPrevSO && prevMonthTotalSO > 0)
        ? Number((((totalSO - prevMonthTotalSO) / prevMonthTotalSO) * 100).toFixed(1))
        : null;

      const soPerStaff = (hasStaffData && totalStaff > 0 && hasAnySO)
        ? Number((totalSO / totalStaff).toFixed(2))
        : null;

      series.push({
        month: m,
        monthLabel: `T${String(m).padStart(2, '0')}`,
        hasStaffData,
        updatedShops,
        age18_22: hasStaffData ? age18 : null,
        age23_27: hasStaffData ? age23 : null,
        age28_plus: hasStaffData ? age28 : null,
        totalStaff: hasStaffData ? totalStaff : null,
        newJoiners: hasStaffData ? newJoiners : null,
        resigned: hasStaffData ? resigned : null,
        staffDiff,
        staffMoMPct,
        hasAnySO,
        totalSO: hasAnySO ? totalSO : null,
        soDiff,
        soMoMPct,
        soPerStaff
      });
    }

    return series;
  },

  // =========================================================================
  // 6. CÁC HÀM VẼ BIỂU ĐỒ SVG 3D CHUYÊN SÂU
  // =========================================================================
  render12MonthStaffChartSVG(series12, year) {
    let maxStaff = 20;
    series12.forEach(s => {
      if (s.totalStaff !== null && s.totalStaff > maxStaff) maxStaff = s.totalStaff;
    });
    const step = maxStaff > 1000 ? 200 : maxStaff > 200 ? 50 : 10;
    const maxScale = Math.ceil((maxStaff * 1.28) / step) * step;

    const svgW = 920;
    const svgH = 340;
    const baseY = 272;
    const chartH = 185;

    let barsSvg = '';
    let badgesSvg = '';
    const linePts = [];

    series12.forEach((item, idx) => {
      const cx = 86 + idx * 69;
      const bw = 30;

      if (item.hasStaffData && item.totalStaff !== null) {
        const totalH = Math.max(10, Math.round((item.totalStaff / maxScale) * chartH));
        const h18 = item.totalStaff > 0 ? Math.round((item.age18_22 / item.totalStaff) * totalH) : 0;
        const h23 = item.totalStaff > 0 ? Math.round((item.age23_27 / item.totalStaff) * totalH) : 0;
        const h28 = Math.max(0, totalH - h18 - h23);

        const y28 = baseY - h28;
        const y23 = y28 - h23;
        const y18 = y23 - h18;

        linePts.push(`${cx},${y18 - 6}`);

        barsSvg += `
          <g class="bar-3d-group">
            <title>Tháng ${item.monthLabel}/${year}: Tổng ${item.totalStaff} người (18-22T: ${item.age18_22} | 23-27T: ${item.age23_27} | 28+T: ${item.age28_plus})</title>
            <rect x="${cx - bw / 2}" y="${y28}" width="${bw}" height="${h28}" fill="#4f46e5" rx="1" />
            <rect x="${cx - bw / 2}" y="${y23}" width="${bw}" height="${h23}" fill="#F26522" />
            <rect x="${cx - bw / 2}" y="${y18}" width="${bw}" height="${h18}" fill="#0ea5e9" rx="1.5" />
          </g>
        `;

        const momTag = item.staffMoMPct !== null
          ? `<g transform="translate(${cx}, ${y18 - 29})">
               <rect x="-22" y="-8.5" width="44" height="13" rx="3.5" fill="${item.staffMoMPct >= 0 ? '#059669' : '#e11d48'}" stroke="#fff" stroke-width="1" />
               <text x="0" y="0.5" text-anchor="middle" class="text-[8px] font-mono font-black fill-white">${item.staffMoMPct >= 0 ? '+' : ''}${item.staffMoMPct}%</text>
             </g>`
          : '';

        badgesSvg += `
          ${momTag}
          <g transform="translate(${cx}, ${y18 - 13})">
            <rect x="-22" y="-9.5" width="44" height="14" rx="3.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.2" />
            <text x="0" y="0.5" text-anchor="middle" class="text-[8.5px] font-mono font-extrabold fill-white">${item.totalStaff.toLocaleString()}</text>
          </g>
        `;
      } else {
        barsSvg += `
          <g opacity="0.65">
            <rect x="${cx - bw / 2}" y="${baseY - 22}" width="${bw}" height="22" rx="4" fill="rgba(148,163,184,0.12)" stroke="#94a3b8" stroke-dasharray="3 2" />
            <text x="${cx}" y="${baseY - 9}" text-anchor="middle" class="text-[7.5px] font-bold fill-slate-400">Chưa CN</text>
          </g>
        `;
      }

      barsSvg += `
        <text x="${cx}" y="${baseY + 20}" text-anchor="middle" class="text-[11px] font-extrabold fill-slate-700 dark:fill-slate-200">${item.monthLabel}</text>
        <text x="${cx}" y="${baseY + 34}" text-anchor="middle" class="text-[9px] font-mono font-bold ${item.staffDiff === null ? 'fill-slate-400' : item.staffDiff >= 0 ? 'fill-emerald-600' : 'fill-rose-600'}">
          ${item.hasStaffData ? (item.staffDiff !== null ? (item.staffDiff >= 0 ? '+' + item.staffDiff : item.staffDiff) + ' ng' : 'Mới') : 'Chưa CN'}
        </text>
      `;
    });

    const gridLevels = [1, 0.75, 0.5, 0.25, 0];
    const gridSvg = gridLevels.map(lv => {
      const yPos = Math.round(baseY - lv * chartH);
      const val = Math.round(maxScale * lv).toLocaleString();
      return `
        <g transform="translate(0, ${yPos})">
          <text x="48" y="4" text-anchor="end" class="text-[10px] font-mono font-bold fill-slate-400">${val}</text>
          ${lv > 0 ? `<line x1="56" y1="0" x2="895" y2="0" stroke="currentColor" stroke-opacity="0.14" stroke-dasharray="4 4" />` : ''}
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-auto min-w-[740px] select-none">
        <g class="text-slate-400">${gridSvg}</g>
        <rect x="56" y="${baseY}" width="839" height="4" rx="2" fill="rgba(148,163,184,0.35)" />
        ${barsSvg}
        ${linePts.length > 1 ? `
          <polyline points="${linePts.join(' ')}" fill="none" stroke="#10b981" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        ` : ''}
        ${badgesSvg}
      </svg>
    `;
  },

  renderStaffVsSOChartSVG(series12, year) {
    let maxStaff = 10;
    let maxSO = 50;
    series12.forEach(s => {
      if (s.totalStaff !== null && s.totalStaff > maxStaff) maxStaff = s.totalStaff;
      if (s.totalSO !== null && s.totalSO > maxSO) maxSO = s.totalSO;
    });

    const maxStaffScale = Math.ceil(maxStaff * 1.3);
    const maxSOScale = Math.ceil((maxSO * 1.25) / 10) * 10;

    const svgW = 920;
    const svgH = 335;
    const baseY = 270;
    const chartH = 185;

    let barsSvg = '';
    let soBadgesSvg = '';
    const soLinePts = [];
    const soDots = [];

    series12.forEach((item, idx) => {
      const cx = 86 + idx * 69;
      const bw = 26;

      if (item.hasStaffData && item.totalStaff !== null) {
        const barH = Math.max(8, Math.round((item.totalStaff / maxStaffScale) * chartH));
        const topY = baseY - barH;
        barsSvg += `
          <g>
            <title>Tháng ${item.monthLabel}/${year} • Nhân sự: ${item.totalStaff} người</title>
            <rect x="${cx - bw / 2}" y="${topY}" width="${bw}" height="${barH}" rx="3" fill="#2563eb" opacity="0.88" />
            <text x="${cx}" y="${topY - 5}" text-anchor="middle" class="text-[8.5px] font-mono font-black fill-blue-700">${item.totalStaff} ng</text>
          </g>
        `;
      } else {
        barsSvg += `
          <text x="${cx}" y="${baseY - 6}" text-anchor="middle" class="text-[7.5px] font-bold fill-slate-400">NS: Chưa CN</text>
        `;
      }

      if (item.hasAnySO && item.totalSO !== null) {
        const soRatio = maxSOScale > 0 ? Math.min(1, item.totalSO / maxSOScale) : 0;
        const soY = Math.round(baseY - soRatio * chartH);
        soLinePts.push(`${cx},${soY}`);
        soDots.push({ x: cx, y: soY });

        const strVal = `${item.totalSO.toLocaleString()} xe`;
        const wBox = Math.max(46, strVal.length * 5.8 + 8);
        soBadgesSvg += `
          <g transform="translate(${cx}, ${soY - 14})">
            <rect x="${-wBox / 2}" y="-9.5" width="${wBox}" height="14" rx="3.5" fill="#F26522" stroke="#ffffff" stroke-width="1.2" />
            <text x="0" y="0.5" text-anchor="middle" class="text-[8px] font-mono font-extrabold fill-white">${strVal}</text>
          </g>
        `;
      }

      barsSvg += `
        <text x="${cx}" y="${baseY + 20}" text-anchor="middle" class="text-[11px] font-extrabold fill-slate-700 dark:fill-slate-200">${item.monthLabel}</text>
        <text x="${cx}" y="${baseY + 33}" text-anchor="middle" class="text-[8.5px] font-mono font-bold fill-indigo-600">
          ${item.soPerStaff !== null ? `${item.soPerStaff} xe/ng` : '—'}
        </text>
      `;
    });

    return `
      <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-auto min-w-[740px] select-none">
        <line x1="56" y1="${baseY}" x2="895" y2="${baseY}" stroke="#94a3b8" stroke-width="2" />
        ${barsSvg}
        ${soLinePts.length > 1 ? `
          <polyline points="${soLinePts.join(' ')}" fill="none" stroke="#F26522" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        ` : ''}
        ${soDots.map(d => `<circle cx="${d.x}" cy="${d.y}" r="4" fill="#F26522" stroke="#ffffff" stroke-width="1.5" />`).join('')}
        ${soBadgesSvg}
      </svg>
    `;
  },

  // =========================================================================
  // 7. GIAO DIỆN 4 TAB CON TRONG MỤC QUẢN LÝ NHÂN SỰ CỬA HÀNG
  // =========================================================================
  renderStaffInputSubTab(filteredShops, db) {
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const mStr = String(m).padStart(2, '0');
    const prev = this.getPrevYearMonth(y, m);
    const prevMStr = String(prev.month).padStart(2, '0');
    const pendingCount = Object.keys(this.pendingEdits).length;

    return `
      <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
        <div class="p-4 bg-orange-50/60 dark:bg-slate-800/60 border-b border-orange-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-user-pen text-[#F26522]"></i>
              Bảng Nhập Cơ Cấu Nhân Sự Cửa Hàng • Tháng ${mStr}/${y}
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Chỉ cho phép nhập số nguyên không âm. Dữ liệu mỗi tháng được lưu độc lập và ghi nhận đầy đủ lịch sử người chỉnh sửa.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onclick="ShopsModule.copyFromPreviousMonth()"
              class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Sao chép số lượng nhân sự từ Tháng ${prevMStr}/${prev.year} sang Tháng ${mStr}/${y} để chỉnh sửa nhanh"
            >
              <i class="fa-solid fa-copy"></i>
              <span>Sao Chép Dữ Liệu Tháng Trước (T${prevMStr}/${prev.year})</span>
            </button>

            <button
              type="button"
              onclick="ShopsModule.saveAllPendingStaff()"
              class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Lưu Dữ Liệu Tháng ${mStr}/${y}</span>
              <span id="pending-staff-count-badge" class="font-mono text-[11px]">${pendingCount > 0 ? `(${pendingCount} Shop đang sửa)` : ''}</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto max-h-[62vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
              <tr>
                <th class="py-3 px-3">Mã DVN</th>
                <th class="py-3 px-3 min-w-[180px]">Tên Cửa Hàng</th>
                <th class="py-3 px-3">Khu Vực / Nhân Sự Phụ Trách</th>
                <th class="py-3 px-2 text-center bg-slate-200/60 dark:bg-slate-700">Tháng Trước (T${prevMStr})</th>
                <th class="py-3 px-2 text-center bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300">18–22 Tuổi</th>
                <th class="py-3 px-2 text-center bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300">23–27 Tuổi</th>
                <th class="py-3 px-2 text-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300">≥ 28 Tuổi</th>
                <th class="py-3 px-3 text-center bg-orange-100/80 dark:bg-slate-700 text-[#F26522] font-black">TỔNG NS T${mStr}</th>
                <th class="py-3 px-2 text-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700">Mới Vào (+)</th>
                <th class="py-3 px-2 text-center bg-rose-50 dark:bg-rose-950/30 text-rose-700">Nghỉ Việc (-)</th>
                <th class="py-3 px-3 text-center">Cập Nhật / Lịch Sử</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${filteredShops.map(shop => {
                const eff = this.getEffectiveDraftOrSaved(shop, y, m, db);
                const prevRec = this.getRecord(shop.dvn, prev.year, prev.month, db);

                return `
                  <tr class="${eff.isDirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/80'} transition">
                    <td class="py-2.5 px-3 font-mono font-black text-blue-600">${shop.dvn}</td>
                    <td class="py-2.5 px-3">
                      <div class="font-bold text-slate-900 dark:text-white">${shop.name}</div>
                      <div class="text-[10px] text-slate-400">${shop.province} • ${shop.shopType}</div>
                    </td>
                    <td class="py-2.5 px-3 text-[11px]">
                      <div class="font-bold text-orange-600">${shop.subRegion}</div>
                      <div class="text-slate-500">GĐ: ${shop.director} • Sale: <strong class="text-blue-600">${shop.sale}</strong></div>
                    </td>
                    <td class="py-2.5 px-2 text-center font-mono">
                      ${prevRec
                        ? `<span class="font-bold text-slate-700">${prevRec.totalStaff} ng</span>`
                        : `<span class="text-[10px] text-slate-400 italic">Chưa CN</span>`}
                    </td>
                    <td class="py-2 px-2 text-center bg-sky-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="—"
                        value="${eff.age18_22 !== null ? eff.age18_22 : ''}"
                        oninput="ShopsModule.handleInlineStaffInput('${shop.dvn}', 'age18_22', this)"
                        class="w-16 px-2 py-1.5 rounded-lg border border-sky-300 bg-white text-center font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      />
                    </td>
                    <td class="py-2 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="—"
                        value="${eff.age23_27 !== null ? eff.age23_27 : ''}"
                        oninput="ShopsModule.handleInlineStaffInput('${shop.dvn}', 'age23_27', this)"
                        class="w-16 px-2 py-1.5 rounded-lg border border-orange-300 bg-white text-center font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      />
                    </td>
                    <td class="py-2 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="—"
                        value="${eff.age28_plus !== null ? eff.age28_plus : ''}"
                        oninput="ShopsModule.handleInlineStaffInput('${shop.dvn}', 'age28_plus', this)"
                        class="w-16 px-2 py-1.5 rounded-lg border border-indigo-300 bg-white text-center font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      />
                    </td>
                    <td id="staff-total-${shop.dvn}" class="py-2.5 px-3 text-center">
                      ${eff.isUpdated
                        ? `<span class="px-2.5 py-1 rounded-lg bg-orange-100 text-[#F26522] font-mono font-black text-sm">${eff.totalStaff} người</span>`
                        : `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold">Chưa cập nhật</span>`}
                    </td>
                    <td class="py-2 px-2 text-center bg-emerald-50/20">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value="${eff.newJoiners !== null ? eff.newJoiners : ''}"
                        oninput="ShopsModule.handleInlineStaffInput('${shop.dvn}', 'newJoiners', this)"
                        class="w-14 px-1.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-center font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td class="py-2 px-2 text-center bg-rose-50/20">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value="${eff.resigned !== null ? eff.resigned : ''}"
                        oninput="ShopsModule.handleInlineStaffInput('${shop.dvn}', 'resigned', this)"
                        class="w-14 px-1.5 py-1.5 rounded-lg border border-rose-300 bg-white text-center font-mono font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </td>
                    <td class="py-2.5 px-3 text-center whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onclick="ShopsModule.saveSingleShopStaff('${shop.dvn}')"
                          class="px-2.5 py-1 rounded-lg bg-[#111625] hover:bg-[#F26522] text-white text-[11px] font-bold transition cursor-pointer"
                          title="Lưu riêng cửa hàng này"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onclick="ShopsModule.openStaffHistoryModal('${shop.dvn}')"
                          class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                          title="Xem lịch sử người chỉnh sửa và thời gian chỉnh sửa"
                        >
                          <i class="fa-solid fa-clock-rotate-left"></i>
                          <span>${eff.history.length > 0 ? eff.history.length : ''}</span>
                        </button>
                      </div>
                      ${eff.updatedBy ? `<div class="text-[9.5px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">${eff.updatedBy}</div>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
              ${filteredShops.length === 0 ? `
                <tr>
                  <td colspan="11" class="py-10 text-center text-slate-400 font-bold">
                    Không có cửa hàng nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStaffStatsSubTab(filteredShops, db) {
    const groupedRows = this.computeGroupStatistics(filteredShops, db);
    const mStr = String(this.selectedMonth).padStart(2, '0');

    return `
      <div class="card-3d p-5 space-y-4 bg-white dark:bg-slate-900">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 class="font-extrabold text-sm sm:text-base uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-table-list text-[#F26522]"></i>
              Bảng Thống Kê Cơ Cấu Độ Tuổi & Biến Động Nhân Sự (Tháng ${mStr}/${this.selectedYear})
            </h3>
            <p class="text-xs text-slate-500">
              Tổng hợp số Shop đã cập nhật/chưa cập nhật, số lượng & tỷ trọng từng nhóm tuổi, số Shop tăng/giảm nhân sự và bình quân nhân sự/Shop
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-extrabold">
            ${[
              { id: 'NATIONAL', label: 'Toàn quốc / Miền' },
              { id: 'SUB_REGION', label: 'Theo Khu vực' },
              { id: 'DIRECTOR', label: 'Theo Giám đốc KV' },
              { id: 'SUPERVISOR', label: 'Theo Giám sát' },
              { id: 'SALE', label: 'Theo Sale' },
              { id: 'SHOP', label: 'Theo Từng Shop' }
            ].map(tab => `
              <button
                type="button"
                onclick="ShopsModule.setStatsGroupBy('${tab.id}')"
                class="px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  this.statsGroupBy === tab.id ? 'bg-[#111625] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }"
              >
                ${tab.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="overflow-x-auto max-h-[60vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
              <tr>
                <th class="py-3 px-3">#</th>
                <th class="py-3 px-3">Đơn Vị / Nhóm Thống Kê</th>
                <th class="py-3 px-3 text-center">Đã CN / Chưa CN</th>
                <th class="py-3 px-3 text-right text-[#F26522]">Tổng Nhân Sự</th>
                <th class="py-3 px-3 text-center bg-sky-50/60">18–22 Tuổi (SL / %)</th>
                <th class="py-3 px-3 text-center bg-orange-50/60">23–27 Tuổi (SL / %)</th>
                <th class="py-3 px-3 text-center bg-indigo-50/60">≥ 28 Tuổi (SL / %)</th>
                <th class="py-3 px-3 text-center">Tăng/Giảm vs Tháng Trước</th>
                <th class="py-3 px-3 text-center">Mới Vào / Nghỉ</th>
                <th class="py-3 px-3 text-center">Shop Tăng / Giảm / Giữ Nguyên</th>
                <th class="py-3 px-3 text-right">TB Nhân Sự / Shop</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${groupedRows.map((g, idx) => `
                <tr class="hover:bg-orange-50/30 transition">
                  <td class="py-3 px-3 font-mono font-bold text-slate-400">${idx + 1}</td>
                  <td class="py-3 px-3">
                    <div class="font-extrabold text-slate-900 dark:text-white">${g.name}</div>
                    <div class="text-[10px] text-slate-400">${g.subLabel}</div>
                  </td>
                  <td class="py-3 px-3 text-center font-mono">
                    <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">${g.updatedShops}</span> /
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">${g.notUpdatedShops}</span>
                    <span class="text-[10px] text-slate-400 block mt-0.5">Tổng: ${g.totalShops} shop</span>
                  </td>
                  <td class="py-3 px-3 text-right font-mono font-black text-sm text-[#F26522]">
                    ${g.updatedShops > 0 ? `${g.totalStaff.toLocaleString()} người` : '<span class="text-slate-400 text-xs">Chưa cập nhật</span>'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono bg-sky-50/20">
                    ${g.updatedShops > 0 ? `<strong class="text-sky-700">${g.age18_22}</strong> <span class="text-[10px] text-slate-500">(${g.pct18}%)</span>` : '—'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono bg-orange-50/20">
                    ${g.updatedShops > 0 ? `<strong class="text-orange-700">${g.age23_27}</strong> <span class="text-[10px] text-slate-500">(${g.pct23}%)</span>` : '—'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono bg-indigo-50/20">
                    ${g.updatedShops > 0 ? `<strong class="text-indigo-700">${g.age28_plus}</strong> <span class="text-[10px] text-slate-500">(${g.pct28}%)</span>` : '—'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono">
                    ${g.momDiff !== null ? `
                      <span class="font-extrabold ${g.momDiff > 0 ? 'text-emerald-600' : g.momDiff < 0 ? 'text-rose-600' : 'text-slate-600'}">
                        ${g.momDiff > 0 ? '+' + g.momDiff : g.momDiff} người
                      </span>
                      ${g.momPct !== null ? `<span class="block text-[10px] text-slate-400">(${Number(g.momPct) >= 0 ? '+' : ''}${g.momPct}%)</span>` : ''}
                    ` : '<span class="text-slate-400 text-[11px]">Chưa đủ DL</span>'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono">
                    ${g.updatedShops > 0 ? `
                      <span class="text-emerald-600 font-bold">+${g.newJoiners}</span> / <span class="text-rose-600 font-bold">-${g.resigned}</span>
                    ` : '—'}
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-[11px]">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold" title="Số Shop tăng nhân sự">▲ ${g.increasedShops}</span> /
                    <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold" title="Số Shop giảm nhân sự">▼ ${g.decreasedShops}</span> /
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold" title="Số Shop giữ nguyên">= ${g.unchangedShops}</span>
                  </td>
                  <td class="py-3 px-3 text-right font-mono font-bold text-blue-600">
                    ${g.avgStaff !== null ? `${g.avgStaff} ng/shop` : '—'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStaffChartsSubTab(filteredShops, db, series12) {
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const mStr = String(m).padStart(2, '0');
    const prev = this.getPrevYearMonth(y, m);
    const prevMStr = String(prev.month).padStart(2, '0');

    const curMonthStat = series12[m - 1];
    const totalCur = curMonthStat?.totalStaff || 0;
    const a18 = curMonthStat?.age18_22 || 0;
    const a23 = curMonthStat?.age23_27 || 0;
    const a28 = curMonthStat?.age28_plus || 0;

    const p18 = totalCur > 0 ? Math.round((a18 / totalCur) * 100) : 0;
    const p23 = totalCur > 0 ? Math.round((a23 / totalCur) * 100) : 0;
    const p28 = totalCur > 0 ? Math.max(0, 100 - p18 - p23) : 0;

    return `
      <div class="space-y-5">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="card-3d p-5 lg:col-span-8 bg-white dark:bg-slate-900 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-chart-column text-[#F26522]"></i>
                  Biểu Đồ Biến Động Tổng Nhân Sự & Cơ Cấu Độ Tuổi 12 Tháng (Năm ${y})
                </h3>
                <p class="text-[11px] text-slate-500">
                  Các tháng chưa nhập hiển thị rõ "Chưa CN", tuyệt đối không tự tính bằng 0.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-sky-500 inline-block"></span> 18–22 tuổi</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-[#F26522] inline-block"></span> 23–27 tuổi</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-indigo-600 inline-block"></span> ≥ 28 tuổi</span>
              </div>
            </div>
            <div class="w-full overflow-x-auto">
              ${this.render12MonthStaffChartSVG(series12, y)}
            </div>
          </div>

          <div class="card-3d p-5 lg:col-span-4 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-indigo-600"></i>
                Cơ Cấu 3 Nhóm Tuổi (Tháng ${mStr}/${y})
              </h3>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Phân bổ tỷ trọng độ tuổi nhân sự của các cửa hàng đã cập nhật
              </p>
            </div>

            ${curMonthStat && curMonthStat.hasStaffData ? `
              <div class="space-y-4 my-auto">
                <div class="h-7 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-100 p-0.5 gap-0.5">
                  ${p18 > 0 ? `<div style="width:${p18}%" class="bg-sky-500 h-full flex items-center justify-center text-[10px] font-mono font-black text-white">${p18}%</div>` : ''}
                  ${p23 > 0 ? `<div style="width:${p23}%" class="bg-[#F26522] h-full flex items-center justify-center text-[10px] font-mono font-black text-white">${p23}%</div>` : ''}
                  ${p28 > 0 ? `<div style="width:${p28}%" class="bg-indigo-600 h-full flex items-center justify-center text-[10px] font-mono font-black text-white">${p28}%</div>` : ''}
                </div>

                <div class="space-y-2.5 text-xs">
                  <div class="p-3 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-sky-900">1. Nhóm 18–22 tuổi (Trẻ / Năng động)</span>
                      <div class="text-[10px] text-sky-700">Tỷ trọng: ${p18}% tổng nhân sự</div>
                    </div>
                    <span class="font-mono font-black text-base text-sky-700">${a18} người</span>
                  </div>

                  <div class="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-orange-900">2. Nhóm 23–27 tuổi (Nòng cốt)</span>
                      <div class="text-[10px] text-orange-700">Tỷ trọng: ${p23}% tổng nhân sự</div>
                    </div>
                    <span class="font-mono font-black text-base text-[#F26522]">${a23} người</span>
                  </div>

                  <div class="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                    <div>
                      <span class="font-extrabold text-indigo-900">3. Nhóm từ 28 tuổi trở lên (Kinh nghiệm)</span>
                      <div class="text-[10px] text-indigo-700">Tỷ trọng: ${p28}% tổng nhân sự</div>
                    </div>
                    <span class="font-mono font-black text-base text-indigo-700">${a28} người</span>
                  </div>
                </div>
              </div>
            ` : `
              <div class="py-12 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed my-auto">
                Tháng ${mStr}/${y} chưa cập nhật dữ liệu nhân sự.
              </div>
            `}

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-500 font-semibold">Biến động tuyển mới / nghỉ việc T${mStr}:</span>
              <span class="font-mono font-black">
                <span class="text-emerald-600">+${curMonthStat?.newJoiners ?? 0} mới</span> •
                <span class="text-rose-600">-${curMonthStat?.resigned ?? 0} nghỉ</span>
              </span>
            </div>
          </div>
        </div>

        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-code-compare text-blue-600"></i>
              Bảng Đối Chiếu Chi Tiết Nhân Sự Tháng Trước (T${prevMStr}/${prev.year}) vs Tháng Hiện Tại (T${mStr}/${y})
            </h3>
            <span class="text-xs font-bold text-slate-500">${filteredShops.length} cửa hàng trong bộ lọc</span>
          </div>

          <div class="overflow-x-auto max-h-[52vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-3 px-3">Mã DVN</th>
                  <th class="py-3 px-3">Tên Cửa Hàng</th>
                  <th class="py-3 px-3">GĐKV / Sale</th>
                  <th class="py-3 px-3 text-center">Tổng NS T${prevMStr}/${prev.year}</th>
                  <th class="py-3 px-3 text-center text-[#F26522]">Tổng NS T${mStr}/${y}</th>
                  <th class="py-3 px-3 text-center">Chênh Lệch Số Người</th>
                  <th class="py-3 px-3 text-center">Tỷ Lệ % Tăng/Giảm</th>
                  <th class="py-3 px-3 text-center">Cơ Cấu T${mStr} (18-22 / 23-27 / 28+)</th>
                  <th class="py-3 px-3 text-center">Mới Vào / Nghỉ Việc</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredShops.map(s => {
                  const cur = this.getRecord(s.dvn, y, m, db);
                  const prv = this.getRecord(s.dvn, prev.year, prev.month, db);
                  const diff = (cur && prv) ? (cur.totalStaff - prv.totalStaff) : null;
                  const pct = (cur && prv && prv.totalStaff > 0)
                    ? (((cur.totalStaff - prv.totalStaff) / prv.totalStaff) * 100).toFixed(1)
                    : null;

                  return `
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-mono font-black text-blue-600">${s.dvn}</td>
                      <td class="py-2.5 px-3 font-bold text-slate-900">${s.name}</td>
                      <td class="py-2.5 px-3 text-[11px]">
                        <div>GĐ: <strong>${s.director}</strong></div>
                        <div class="text-blue-600 font-bold">Sale: ${s.sale}</div>
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        ${prv ? `<span class="font-bold">${prv.totalStaff} người</span>` : '<span class="text-slate-400">Chưa cập nhật</span>'}
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        ${cur ? `<span class="font-black text-sm text-[#F26522]">${cur.totalStaff} người</span>` : '<span class="text-slate-400">Chưa cập nhật</span>'}
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono font-extrabold ${diff === null ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-600'}">
                        ${diff === null ? '—' : (diff > 0 ? `+${diff} người` : `${diff} người`)}
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        ${pct === null ? '<span class="text-slate-400">—</span>' : `
                          <span class="px-2 py-0.5 rounded text-[10px] font-black ${Number(pct) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                            ${Number(pct) >= 0 ? '+' : ''}${pct}%
                          </span>
                        `}
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        ${cur ? `${cur.age18_22} / ${cur.age23_27} / ${cur.age28_plus}` : '—'}
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        ${cur ? `<span class="text-emerald-600 font-bold">+${cur.newJoiners}</span> / <span class="text-rose-600 font-bold">-${cur.resigned}</span>` : '—'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderStaffVsSOSubTab(filteredShops, db, series12) {
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const mStr = String(m).padStart(2, '0');
    const prev = this.getPrevYearMonth(y, m);

    return `
      <div class="space-y-5">
        <div class="card-3d p-4 bg-gradient-to-r from-amber-50/90 to-white border-l-4 border-l-[#F26522] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="font-bold text-slate-800">
            <i class="fa-solid fa-scale-balanced text-[#F26522] mr-1.5"></i>
            Nguyên tắc đối chiếu Nhân sự & Sản lượng S.O:
            <span class="font-normal text-slate-600 ml-1">
              Bảng và biểu đồ dưới đây phản ánh song song biến động nhân sự và biến động doanh số S.O thực tế để hỗ trợ công tác giám sát, <strong>không tự động kết luận nhân sự là nguyên nhân khiến doanh số tăng hoặc giảm</strong>.
            </span>
          </div>
        </div>

        <div class="card-3d p-5 bg-white dark:bg-slate-900 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-line text-[#F26522]"></i>
                Biểu Đồ Xu Hướng Tổng Nhân Sự & Sản Lượng S.O 12 Tháng (Năm ${y})
              </h3>
              <p class="text-[11px] text-slate-500">
                Cột Xanh: Tổng nhân sự (người) • Đường Cam: Sản lượng S.O (xe) • Dòng chỉ số dưới đáy: Năng suất S.O/Nhân sự (xe/người)
              </p>
            </div>
            <div class="flex items-center gap-4 text-xs font-bold">
              <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-blue-600 inline-block"></span> Tổng Nhân Sự (Người)</span>
              <span class="flex items-center gap-1.5"><span class="w-3.5 h-3.5 rounded bg-[#F26522] inline-block"></span> Sản Lượng S.O (Xe)</span>
            </div>
          </div>
          <div class="w-full overflow-x-auto">
            ${this.renderStaffVsSOChartSVG(series12, y)}
          </div>
        </div>

        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-table text-indigo-600"></i>
              Bảng Đối Chiếu Nhân Sự & Doanh Số S.O Theo 12 Tháng (Năm ${y})
            </h3>
            <span class="text-xs font-bold text-[#F26522]">Đơn vị năng suất: Xe / Nhân sự</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-3.5 px-4">Tháng</th>
                  <th class="py-3.5 px-4 text-right">Tổng Nhân Sự</th>
                  <th class="py-3.5 px-4 text-center">Biến Động Nhân Sự (vs Tháng Trước)</th>
                  <th class="py-3.5 px-4 text-right text-[#F26522]">S.O (Xe)</th>
                  <th class="py-3.5 px-4 text-center">Biến Động S.O (vs Tháng Trước)</th>
                  <th class="py-3.5 px-4 text-right bg-indigo-50/60 text-indigo-900">S.O / Nhân Sự (Năng Suất TB)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${series12.map(row => `
                  <tr class="${row.month === m ? 'bg-orange-50/40 font-bold' : 'hover:bg-slate-50'}">
                    <td class="py-3 px-4 font-sans font-extrabold text-slate-900">
                      Tháng ${row.monthLabel.replace('T', '')}/${y}
                      ${row.hasStaffData ? `<span class="ml-1.5 text-[10px] font-normal text-slate-400">(${row.updatedShops} shop)</span>` : ''}
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-blue-700">
                      ${row.hasStaffData ? `${row.totalStaff.toLocaleString()} người` : '<span class="text-slate-400 font-sans font-semibold">Chưa cập nhật</span>'}
                    </td>
                    <td class="py-3 px-4 text-center">
                      ${!row.hasStaffData
                        ? '<span class="text-slate-400 font-sans">Chưa cập nhật</span>'
                        : (row.staffDiff !== null
                            ? `<span class="font-extrabold ${row.staffDiff > 0 ? 'text-emerald-600' : row.staffDiff < 0 ? 'text-rose-600' : 'text-slate-600'}">
                                 ${row.staffDiff > 0 ? '+' + row.staffDiff : row.staffDiff} người (${row.staffMoMPct !== null ? (row.staffMoMPct >= 0 ? '+' + row.staffMoMPct + '%' : row.staffMoMPct + '%') : '—'})
                               </span>`
                            : '<span class="text-slate-400">—</span>')}
                    </td>
                    <td class="py-3 px-4 text-right font-black text-sm text-[#F26522]">
                      ${row.hasAnySO ? `${row.totalSO.toLocaleString()} xe` : '<span class="text-slate-400 font-normal">Chưa có S.O</span>'}
                    </td>
                    <td class="py-3 px-4 text-center">
                      ${row.soDiff !== null ? `
                        <span class="font-extrabold ${row.soDiff > 0 ? 'text-emerald-600' : row.soDiff < 0 ? 'text-rose-600' : 'text-slate-600'}">
                          ${row.soDiff > 0 ? '+' + row.soDiff.toLocaleString() : row.soDiff.toLocaleString()} xe
                          ${row.soMoMPct !== null ? `(${row.soMoMPct >= 0 ? '+' + row.soMoMPct + '%' : row.soMoMPct + '%'})` : ''}
                        </span>
                      ` : '<span class="text-slate-400">—</span>'}
                    </td>
                    <td class="py-3 px-4 text-right font-black bg-indigo-50/30 text-indigo-700">
                      ${row.soPerStaff !== null ? `${row.soPerStaff} xe / người` : '<span class="text-slate-400 font-normal">—</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
          <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="font-extrabold text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-magnifying-glass-chart text-[#F26522]"></i>
                Chi Tiết Cửa Hàng: Biến Động Nhân Sự & Biến Động Doanh Số S.O (Tháng ${mStr}/${y})
              </h3>
              <p class="text-[11px] text-slate-500">
                Giúp nhận diện các cửa hàng có thay đổi nhân sự đi kèm biến động sản lượng S.O trong kỳ
              </p>
            </div>
          </div>

          <div class="overflow-x-auto max-h-[50vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 bg-slate-100 text-slate-700 uppercase font-extrabold border-b">
                <tr>
                  <th class="py-3 px-3">Mã DVN</th>
                  <th class="py-3 px-3">Tên Cửa Hàng</th>
                  <th class="py-3 px-3">Khu Vực / Sale</th>
                  <th class="py-3 px-3 text-right">Tổng Nhân Sự T${mStr}</th>
                  <th class="py-3 px-3 text-center">Biến Động Nhân Sự</th>
                  <th class="py-3 px-3 text-right text-[#F26522]">S.O T${mStr}/${y}</th>
                  <th class="py-3 px-3 text-center">Biến Động S.O (MoM)</th>
                  <th class="py-3 px-3 text-right">S.O / Nhân Sự</th>
                  <th class="py-3 px-3 text-center">Ghi Nhận Trạng Thái Song Hành</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${filteredShops.map(s => {
                  const curNS = this.getRecord(s.dvn, y, m, db);
                  const prvNS = this.getRecord(s.dvn, prev.year, prev.month, db);
                  const nsDiff = (curNS && prvNS) ? (curNS.totalStaff - prvNS.totalStaff) : null;

                  const curSO = this.getShopRawSO(s.rawRef, y, m);
                  const prvSO = this.getShopRawSO(s.rawRef, prev.year, prev.month);
                  const soDiff = (curSO !== null && prvSO !== null) ? (curSO - prvSO) : null;

                  const prod = (curNS && curNS.totalStaff > 0 && curSO !== null)
                    ? (curSO / curNS.totalStaff).toFixed(2)
                    : null;

                  let coMovementBadge = '<span class="text-slate-400 font-sans">Chưa đủ DL đối chiếu</span>';
                  if (nsDiff !== null && soDiff !== null) {
                    if (nsDiff > 0 && soDiff > 0) {
                      coMovementBadge = '<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-sans font-bold text-[10px]">Nhân sự ▲ • S.O ▲</span>';
                    } else if (nsDiff < 0 && soDiff < 0) {
                      coMovementBadge = '<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-sans font-bold text-[10px]">Nhân sự ▼ • S.O ▼</span>';
                    } else if (nsDiff > 0 && soDiff < 0) {
                      coMovementBadge = '<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-sans font-bold text-[10px]">Nhân sự ▲ • S.O ▼</span>';
                    } else if (nsDiff < 0 && soDiff > 0) {
                      coMovementBadge = '<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-sans font-bold text-[10px]">Nhân sự ▼ • S.O ▲</span>';
                    } else {
                      coMovementBadge = '<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-sans font-bold text-[10px]">Ổn định / Ít biến động</span>';
                    }
                  }

                  return `
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-black text-blue-600">${s.dvn}</td>
                      <td class="py-2.5 px-3 font-sans font-bold text-slate-900">${s.name}</td>
                      <td class="py-2.5 px-3 font-sans text-[11px]">
                        <div class="font-bold text-orange-600">${s.subRegion}</div>
                        <div class="text-slate-500">Sale: ${s.sale}</div>
                      </td>
                      <td class="py-2.5 px-3 text-right font-bold">
                        ${curNS ? `${curNS.totalStaff} người` : '<span class="text-slate-400 font-sans">Chưa cập nhật</span>'}
                      </td>
                      <td class="py-2.5 px-3 text-center ${nsDiff === null ? 'text-slate-400' : nsDiff > 0 ? 'text-emerald-600 font-bold' : nsDiff < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}">
                        ${nsDiff === null ? '—' : (nsDiff > 0 ? `+${nsDiff} ng` : `${nsDiff} ng`)}
                      </td>
                      <td class="py-2.5 px-3 text-right font-black text-[#F26522]">
                        ${curSO !== null ? `${curSO} xe` : '<span class="text-slate-400">NULL</span>'}
                      </td>
                      <td class="py-2.5 px-3 text-center ${soDiff === null ? 'text-slate-400' : soDiff > 0 ? 'text-emerald-600 font-bold' : soDiff < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}">
                        ${soDiff === null ? '—' : (soDiff > 0 ? `+${soDiff} xe` : `${soDiff} xe`)}
                      </td>
                      <td class="py-2.5 px-3 text-right font-black text-indigo-700">
                        ${prod !== null ? `${prod} xe/ng` : '—'}
                      </td>
                      <td class="py-2.5 px-3 text-center">${coMovementBadge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 8. RENDER TỔNG THỂ TAB QUẢN LÝ NHÂN SỰ (GRADING)
  // =========================================================================
  renderStaffStructureSystem() {
    this.ensureGradingHeaderHook();
    this.syncHeaderFilterBar(true);

    // Đảm bảo ẩn thanh lọc trên Header kể cả sau khi các hook khác vừa chạy xong
    setTimeout(() => this.syncHeaderFilterBar(true), 0);

    this.syncPeriodWithHeader();
    this.fetchStaffFromSupabaseIfNeeded(false);

    const db = this.getStaffDB();
    const authorizedShops = this.getAuthorizedShops();

    const subRegions = [...new Set(authorizedShops.map(s => s.subRegion).filter(Boolean))].sort();

    const shopsBySubReg = authorizedShops.filter(s =>
      this.subRegionFilter === 'ALL' || s.subRegion === this.subRegionFilter
    );
    const directors = [...new Set(shopsBySubReg.map(s => s.director).filter(Boolean))].sort();

    const shopsByDir = shopsBySubReg.filter(s =>
      this.directorFilter === 'ALL' || s.director === this.directorFilter
    );
    const supervisors = [...new Set(shopsByDir.map(s => s.supervisor).filter(Boolean))].sort();

    const shopsBySup = shopsByDir.filter(s =>
      this.supervisorFilter === 'ALL' || s.supervisor === this.supervisorFilter
    );
    const sales = [...new Set(shopsBySup.map(s => s.sale).filter(Boolean))].sort();

    const shopsBySale = shopsBySup.filter(s =>
      this.saleFilter === 'ALL' || s.sale === this.saleFilter
    );

    const filteredShops = this.getFilteredStaffShops(authorizedShops, db);
    const series12 = this.compute12MonthsSeries(filteredShops, db);

    const y = this.selectedYear;
    const m = this.selectedMonth;
    const mStr = String(m).padStart(2, '0');
    const prev = this.getPrevYearMonth(y, m);

    let updatedShopsCount = 0;
    let sum18 = 0, sum23 = 0, sum28 = 0, sumTotal = 0;
    let sumNew = 0, sumResign = 0;
    let compCur = 0, compPrev = 0, compShops = 0;
    let sumSO = 0, shopsWithSO = 0;

    filteredShops.forEach(s => {
      const rec = this.getRecord(s.dvn, y, m, db);
      const prv = this.getRecord(s.dvn, prev.year, prev.month, db);
      if (rec) {
        updatedShopsCount++;
        sum18 += rec.age18_22;
        sum23 += rec.age23_27;
        sum28 += rec.age28_plus;
        sumTotal += rec.totalStaff;
        sumNew += rec.newJoiners;
        sumResign += rec.resigned;
        if (prv) {
          compShops++;
          compCur += rec.totalStaff;
          compPrev += prv.totalStaff;
        }
      }
      const soVal = this.getShopRawSO(s.rawRef, y, m);
      if (soVal !== null) {
        sumSO += soVal;
        shopsWithSO++;
      }
    });

    const notUpdatedCount = filteredShops.length - updatedShopsCount;
    const avgStaffPerShop = updatedShopsCount > 0 ? (sumTotal / updatedShopsCount).toFixed(1) : '—';
    const momDiffTotal = compShops > 0 ? (compCur - compPrev) : null;
    const avgSOPerStaff = (sumTotal > 0 && shopsWithSO > 0) ? (sumSO / sumTotal).toFixed(2) : '—';

    const hasActiveFilter =
      this.subRegionFilter !== 'ALL' ||
      this.directorFilter !== 'ALL' ||
      this.supervisorFilter !== 'ALL' ||
      this.saleFilter !== 'ALL' ||
      this.shopFilter !== 'ALL' ||
      this.updateStatusFilter !== 'ALL' ||
      this.searchQuery.trim() !== '';

    return `
      <input
        id="staff-excel-import-input"
        type="file"
        accept=".xlsx, .xls, .csv"
        class="hidden"
        onchange="ShopsModule.handleStaffExcelFileSelect(event)"
      />

      <div class="space-y-5">
        <!-- 1. HEADER & CÔNG CỤ EXCEL + CHỌN THÁNG/NĂM -->
        <div class="card-3d p-5 bg-white dark:bg-slate-900 border-t-4 border-t-[#F26522] space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-[#111625] text-amber-400 text-xs font-black uppercase">
                  HR & S.O STRUCTURE
                </span>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase">
                  Hệ Thống Quản Trị Cơ Cấu Nhân Sự Cửa Hàng Theo Tháng
                </h2>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Quản lý nhân sự 3 nhóm tuổi (18–22, 23–27, ≥28 tuổi), biến động tuyển mới/nghỉ việc và đối chiếu năng suất Sell-out theo mã DVN
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs">
              <div class="flex items-center gap-1.5 bg-orange-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-orange-200 font-bold">
                <i class="fa-regular fa-calendar-days text-[#F26522]"></i>
                <select
                  onchange="ShopsModule.setStaffPeriod(null, this.value)"
                  class="bg-transparent font-black text-[#F26522] focus:outline-none cursor-pointer"
                >
                  ${[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => `
                    <option value="${mo}" ${this.selectedMonth === mo ? 'selected' : ''} class="text-black">Tháng ${String(mo).padStart(2, '0')}</option>
                  `).join('')}
                </select>
                <span class="text-slate-300">/</span>
                <select
                  onchange="ShopsModule.setStaffPeriod(this.value, null)"
                  class="bg-transparent font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  ${[2025, 2026, 2027, 2028].map(yr => `
                    <option value="${yr}" ${this.selectedYear === yr ? 'selected' : ''} class="text-black">Năm ${yr}</option>
                  `).join('')}
                </select>
              </div>

              <button
                type="button"
                onclick="ShopsModule.exportStaffExcelTemplate()"
                class="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <i class="fa-solid fa-download"></i>
                <span>Xuất Excel Mẫu</span>
              </button>

              <button
                type="button"
                onclick="ShopsModule.triggerStaffExcelImport()"
                class="px-3.5 py-2 rounded-xl bg-[#111625] hover:bg-slate-800 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <i class="fa-solid fa-file-import text-amber-400"></i>
                <span>Import Excel</span>
              </button>

              <button
                type="button"
                onclick="ShopsModule.exportFilteredStaffReportExcel()"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <i class="fa-solid fa-file-excel"></i>
                <span>Xuất Báo Cáo Lọc</span>
              </button>
            </div>
          </div>

          <!-- BỘ LỌC LIÊN ĐỘNG 7 CẤP -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Khu Vực</label>
              <select
                onchange="ShopsModule.setStaffFilter('subRegionFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả KV (${subRegions.length}) --</option>
                ${subRegions.map(r => `<option value="${r}" ${this.subRegionFilter === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Giám Đốc KV</label>
              <select
                onchange="ShopsModule.setStaffFilter('directorFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả GĐKV (${directors.length}) --</option>
                ${directors.map(d => `<option value="${d}" ${this.directorFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Giám Sát</label>
              <select
                onchange="ShopsModule.setStaffFilter('supervisorFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-indigo-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả GS (${supervisors.length}) --</option>
                ${supervisors.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">4. Sale Phụ Trách</label>
              <select
                onchange="ShopsModule.setStaffFilter('saleFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-blue-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Sale (${sales.length}) --</option>
                ${sales.map(sl => `<option value="${sl}" ${this.saleFilter === sl ? 'selected' : ''}>${sl}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">5. Cửa Hàng (${shopsBySale.length})</label>
              <select
                onchange="ShopsModule.setStaffFilter('shopFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Shop (${shopsBySale.length}) --</option>
                ${shopsBySale.map(sh => `<option value="${sh.dvn}" ${String(this.shopFilter) === String(sh.dvn) ? 'selected' : ''}>${sh.dvn} - ${sh.name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">6. Trạng Thái Nhập</label>
              <select
                onchange="ShopsModule.setStaffFilter('updateStatusFilter', this.value)"
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL" ${this.updateStatusFilter === 'ALL' ? 'selected' : ''}>-- Mọi trạng thái --</option>
                <option value="UPDATED" ${this.updateStatusFilter === 'UPDATED' ? 'selected' : ''}>Đã cập nhật (${updatedShopsCount})</option>
                <option value="NOT_UPDATED" ${this.updateStatusFilter === 'NOT_UPDATED' ? 'selected' : ''}>Chưa cập nhật (${notUpdatedCount})</option>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-[10px] font-extrabold uppercase text-slate-400">7. Tìm Nhanh DVN/Tên</label>
                ${hasActiveFilter ? `
                  <button type="button" onclick="ShopsModule.resetStaffFilters()" class="text-[10px] font-extrabold text-rose-600 hover:underline cursor-pointer">Đặt lại</button>
                ` : ''}
              </div>
              <input
                id="staff-search-input"
                type="text"
                value="${this.searchQuery}"
                oninput="ShopsModule.setStaffFilter('searchQuery', this.value)"
                placeholder="Gõ mã DVN, tên shop..."
                class="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>
        </div>

        <!-- 2. 6 THẺ KPI TỔNG HỢP NHÂN SỰ & NĂNG SUẤT -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="card-3d tilt-card p-4 border-t-4 border-t-emerald-500">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">TIẾN ĐỘ CẬP NHẬT T${mStr}</div>
            <div class="my-1 text-xl font-black font-mono text-emerald-600">${updatedShopsCount} / ${filteredShops.length} <span class="text-xs">Shop</span></div>
            <div class="text-[11px] text-slate-500">Chưa cập nhật: <strong class="text-rose-600">${notUpdatedCount}</strong></div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">TỔNG NHÂN SỰ HIỆN TẠI</div>
            <div class="my-1 text-xl font-black font-mono text-[#F26522]">
              ${updatedShopsCount > 0 ? `${sumTotal.toLocaleString()} người` : 'Chưa CN'}
            </div>
            <div class="text-[11px] text-slate-500">Trung bình: <strong>${avgStaffPerShop} ng/shop</strong></div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-sky-500">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">CƠ CẤU 3 NHÓM TUỔI</div>
            <div class="my-1 text-base font-black font-mono text-slate-900 dark:text-white">
              <span class="text-sky-600">${sum18}</span> / <span class="text-[#F26522]">${sum23}</span> / <span class="text-indigo-600">${sum28}</span>
            </div>
            <div class="text-[10px] text-slate-500">18-22T • 23-27T • ≥28T</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-600">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">SO VỚI THÁNG TRƯỚC</div>
            <div class="my-1 text-xl font-black font-mono ${momDiffTotal === null ? 'text-slate-400' : momDiffTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${momDiffTotal === null ? 'Chưa đủ DL' : `${momDiffTotal >= 0 ? '+' : ''}${momDiffTotal} người`}
            </div>
            <div class="text-[11px] text-slate-500">Đối chiếu trên ${compShops} shop</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-purple-500">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">BIẾN ĐỘNG TRONG THÁNG</div>
            <div class="my-1 text-lg font-black font-mono">
              <span class="text-emerald-600">+${sumNew}</span> / <span class="text-rose-600">-${sumResign}</span>
            </div>
            <div class="text-[11px] text-slate-500">Tuyển mới vào / Nghỉ việc</div>
          </div>

          <div class="card-3d tilt-card p-4 border-t-4 border-t-indigo-600">
            <div class="text-[10px] font-extrabold uppercase text-slate-500">NĂNG SUẤT S.O / NHÂN SỰ</div>
            <div class="my-1 text-xl font-black font-mono text-indigo-600">
              ${avgSOPerStaff !== '—' ? `${avgSOPerStaff} xe/ng` : '—'}
            </div>
            <div class="text-[11px] text-slate-500">Tổng S.O lọc: <strong>${sumSO.toLocaleString()} xe</strong></div>
          </div>
        </div>

        <!-- 3. THANH CHUYỂN 4 PHÂN KHU NGHIỆP VỤ -->
        <div class="card-3d p-3.5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            ${[
              { id: 'INPUT', label: '1. Nhập Nhân Sự Theo Tháng', icon: 'fa-user-pen' },
              { id: 'STATS', label: '2. Bảng Thống Kê Cơ Cấu Nhân Sự', icon: 'fa-table-list' },
              { id: 'CHARTS', label: '3. Biểu Đồ Biến Động 12 Tháng & Độ Tuổi', icon: 'fa-chart-column' },
              { id: 'SO_COMPARE', label: '4. Đối Chiếu Nhân Sự vs Doanh Số S.O', icon: 'fa-chart-line' }
            ].map(t => `
              <button
                type="button"
                onclick="ShopsModule.setStaffSubTab('${t.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  this.staffSubTab === t.id
                    ? 'bg-[#111625] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#F26522]'
                }"
              >
                <i class="fa-solid ${t.icon} ${this.staffSubTab === t.id ? 'text-[#F26522]' : ''}"></i>
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>

          <span class="text-[11px] font-bold text-slate-500 px-2">
            Đang hiển thị: <strong class="text-[#F26522]">${filteredShops.length} cửa hàng</strong> (Kỳ Tháng ${mStr}/${y})
          </span>
        </div>

        <!-- 4. NỘI DUNG TỪNG TAB CON -->
        ${this.staffSubTab === 'INPUT' ? this.renderStaffInputSubTab(filteredShops, db) : ''}
        ${this.staffSubTab === 'STATS' ? this.renderStaffStatsSubTab(filteredShops, db) : ''}
        ${this.staffSubTab === 'CHARTS' ? this.renderStaffChartsSubTab(filteredShops, db, series12) : ''}
        ${this.staffSubTab === 'SO_COMPARE' ? this.renderStaffVsSOSubTab(filteredShops, db, series12) : ''}
      </div>
    `;
  },

  // =========================================================================
  // HÀM RENDER CHÍNH (ĐIỀU HƯỚNG TỰ ĐỘNG THEO ACTIVE MODULE)
  // =========================================================================
  render() {
    this.ensureGradingHeaderHook();
    const activeMod = window.AppState?.activeModule || 'shops';

    // 1. KHI Ở MỤC "4. QUẢN LÝ CỬA HÀNG" (shops) -> HIỆN THANH LỌC HEADER & LIÊN KẾT TAB CHUYẾN THĂM CỬA HÀNG
    if (activeMod === 'shops' && window.TasksModule) {
      this.syncHeaderFilterBar(false);
      window.TasksModule.ensureI18n();
      window.TasksModule.fetchTasksFromSupabaseIfNeeded();

      const filteredTasks = window.TasksModule.getFilteredTasks();
      const { supervisors } = window.TasksModule.getRealShopsAndSupervisors();

      return `
        <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="px-3 py-1.5 rounded-xl bg-[#111625] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm">
              <i class="fa-solid fa-camera-retro text-[#F26522]"></i>
              <span>4. Quản Lý Cửa Hàng • Check-in & Up Hình Thực Địa</span>
            </span>

            <button
              onclick="ShopsModule.jumpToStoreVisitTab()"
              class="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              title="Mở trong giao diện 2. Việc cần làm -> 4. Chuyến thăm cửa hàng"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Mở Tab Gốc (2. Việc cần làm / 4. Chuyến thăm cửa hàng)</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <input
              id="task-search-input"
              type="text"
              value="${window.TasksModule.searchQuery}"
              oninput="TasksModule.setFilter('searchQuery', this.value)"
              placeholder="Tìm mã DVN, tên shop..."
              class="px-3 py-2 rounded-xl border border-slate-200 font-semibold w-48 focus:outline-none focus:border-[#F26522]"
            />

            <select
              onchange="TasksModule.setFilter('supervisorFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám sát --</option>
              ${supervisors.map(s => `<option value="${s}" ${window.TasksModule.supervisorFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>

            <select
              onchange="TasksModule.setFilter('statusFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL" ${window.TasksModule.statusFilter === 'ALL' ? 'selected' : ''}>-- Mọi trạng thái --</option>
              <option value="PENDING_APPROVAL" ${window.TasksModule.statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>Chờ phê duyệt</option>
              <option value="COMPLETED" ${window.TasksModule.statusFilter === 'COMPLETED' ? 'selected' : ''}>Hoàn thành</option>
              <option value="REVISION_REQUIRED" ${window.TasksModule.statusFilter === 'REVISION_REQUIRED' ? 'selected' : ''}>Yêu cầu bổ sung</option>
            </select>
          </div>
        </div>

        ${window.TasksModule.renderStoreVisitTab(filteredTasks)}
      `;
    }

    // 2. KHI Ở TAB "QUẢN LÝ NHÂN SỰ" (grading) -> ẨN BỘ LỌC HEADER & HIỂN THỊ HỆ THỐNG CƠ CẤU NHÂN SỰ
    if (activeMod === 'grading') {
      return this.renderStaffStructureSystem();
    }

    // 3. KHI Ở MỤC KẾ HOẠCH CẢI THIỆN (improvement) -> HIỆN LẠI BỘ LỌC HEADER BÌNH THƯỜNG
    this.syncHeaderFilterBar(false);
    const region = window.AppState.region;
    const shops = window.AppStore.shops.filter(s => region === 'ALL' || s.region === region);

    return `
      <div class="card-3d p-4 bg-gradient-to-r from-amber-50/70 to-white flex flex-wrap items-center justify-between gap-4">
        <div class="text-xs">
          <span class="font-bold text-[#172033]">Tiêu chí Phân loại Cửa hàng thực tế:</span>
          <span class="ml-2 text-[#667085]">Tốt: <strong>S.O >= 35 xe</strong> (hoặc >= 25 xe tăng trưởng >= 20%) • Trung bình: <strong>15 - 34 xe</strong> • Yếu: <strong>&lt; 15 xe</strong></span>
        </div>
        <span class="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
          Quy tắc: Không tự ý xếp Shop Yếu khi thiếu dữ liệu lịch sử
        </span>
      </div>

      <div class="card-3d overflow-hidden">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-[#F5F6F8] border-b text-[#667085] uppercase">
              <th class="p-3.5">${t('col_dvn')}</th>
              <th class="p-3.5">${t('col_shop_name')}</th>
              <th class="p-3.5">${t('col_region')}</th>
              <th class="p-3.5">S.O / Chỉ tiêu</th>
              <th class="p-3.5">MoM / YoY</th>
              <th class="p-3.5">${t('col_grade')}</th>
              <th class="p-3.5">${t('col_supervisor')}</th>
              <th class="p-3.5">Kế hoạch cải thiện</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${shops.map(s => {
              const ev = window.AppStore.evaluateShop(s);
              return `
                <tr class="hover:bg-gray-50">
                  <td class="p-3.5">
                    <button onclick="ShopsModule.openShopModal('${s.dvn}')" class="font-mono font-bold text-blue-600 hover:underline">${s.dvn}</button>
                  </td>
                  <td class="p-3.5 font-bold text-[#172033]">${s.name}</td>
                  <td class="p-3.5">${s.region}</td>
                  <td class="p-3.5 font-semibold">${s.currentSO === null ? '<span class="text-gray-400">NULL</span>' : s.currentSO} / ${s.targetSO}</td>
                  <td class="p-3.5">${s.mom === null ? 'N/A' : s.mom + '%'} / ${s.yoy === null ? 'N/A' : s.yoy + '%'}</td>
                  <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold border ${ev.color}">${ev.label}</span></td>
                  <td class="p-3.5 font-medium">${s.supervisor}</td>
                  <td class="p-3.5 max-w-xs truncate text-[#667085]" title="${s.improvementPlan}">${s.improvementPlan}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

window.ShopsModule.initModuleSetup();
window.addEventListener('DOMContentLoaded', () => window.ShopsModule.initModuleSetup());