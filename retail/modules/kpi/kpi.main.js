// modules/kpi/kpi.main.js
window.KpiModule = {
  activeBoardId: null,
  searchQuery: '',
  supervisorFilter: 'ALL',
  subRegionFilter: 'ALL',
  onlyZeroFilter: false,
  isEditingInline: false,
  hasLoadedFromSupabase: false,

  isAdmin() {
    return window.AppState?.role === 'ADMIN';
  },

  syncHeaderFilterUI() {
    setTimeout(() => {
      const isKpiView = window.AppState?.activeModule === 'kpi';
      const advPanel = document.getElementById('advanced-filters');
      if (advPanel && isKpiView) {
        advPanel.classList.add('hidden');
      }

      const toggleBtn = document.querySelector('button[onclick*="toggleAdvancedFilters"]');
      if (toggleBtn) {
        const divider = toggleBtn.previousElementSibling;
        if (isKpiView) {
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
    return window.AppState?.month || '2026-10';
  },

  switchToMonth(ym) {
    if (!ym || !ym.includes('-')) return;
    const [yStr, mStr] = ym.split('-');
    if (window.AppState) window.AppState.month = ym;
    const mEl = document.getElementById('filter-month-num');
    const yEl = document.getElementById('filter-year-num');
    if (mEl) mEl.value = mStr;
    if (yEl) yEl.value = yStr;
    window.App.renderCurrentModule();
  },

  normalizeBoardMonth(board) {
    if (board.month && /^\d{4}-\d{2}$/.test(board.month)) {
      return board.month;
    }
    const titleUpper = String(board.title || '').toUpperCase();
    const matchMonth = titleUpper.match(/THÁNG\s*(\d{1,2})/);
    if (matchMonth) {
      const m = String(parseInt(matchMonth[1], 10)).padStart(2, '0');
      return `2026-${m}`;
    }
    return '2026-10';
  },

  getBoards() {
    const STORAGE_KEY = 'yadea_kpi_excel_boards_v3';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(b => {
            b.month = this.normalizeBoardMonth(b);
          });
          return parsed;
        }
      } catch (e) {
        console.warn('Lỗi đọc KPI boards:', e);
      }
    }
    const defaults = window.DefaultData?.defaultKpiBoards || [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  },

  getBoardsForSelectedMonth() {
    const selectedYM = this.getSelectedYearMonth();
    const allBoards = this.getBoards();
    return allBoards.filter(b => this.normalizeBoardMonth(b) === selectedYM);
  },

  saveBoards(boards) {
    try {
      localStorage.setItem('yadea_kpi_excel_boards_v3', JSON.stringify(boards));
    } catch (e) {
      console.warn('Bộ nhớ LocalStorage đầy, ưu tiên đồng bộ Cloud:', e);
    }
    this.syncBoardsToSupabase(boards);
  },

  async syncBoardsToSupabase(boards) {
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;
    try {
      const payload = {
        id: 'KPI-BOARDS-CLOUD-V3',
        task_type: 'KPI_BOARDS_STORAGE',
        title: 'Dữ liệu Bảng Tiến Độ KPI V3',
        note: JSON.stringify(boards),
        region: 'ALL',
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      };
      await window.SupabaseService.client.from('tasks').upsert([payload], { onConflict: 'id' });
    } catch (e) {
      console.warn('[KpiModule] Lưu Cloud:', e);
    }
  },

  async fetchBoardsFromSupabase(force = false) {
    if (this.hasLoadedFromSupabase && !force) return;
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;
    this.hasLoadedFromSupabase = true;

    try {
      const { data, error } = await window.SupabaseService.client
        .from('tasks')
        .select('note, updated_at')
        .eq('id', 'KPI-BOARDS-CLOUD-V3')
        .maybeSingle();

      if (!error && data && data.note) {
        const cloudBoards = JSON.parse(data.note);
        if (Array.isArray(cloudBoards) && cloudBoards.length > 0) {
          cloudBoards.forEach(b => {
            b.month = this.normalizeBoardMonth(b);
          });
          localStorage.setItem('yadea_kpi_excel_boards_v3', JSON.stringify(cloudBoards));
          if (window.AppState?.activeModule === 'kpi') {
            window.App.renderCurrentModule();
          }
        }
      }
    } catch (e) {
      console.warn('[KpiModule] Tải Cloud:', e);
    }
  },

  getActiveBoard() {
    const monthBoards = this.getBoardsForSelectedMonth();
    if (monthBoards.length === 0) return null;
    if (!this.activeBoardId || !monthBoards.some(b => b.id === this.activeBoardId)) {
      this.activeBoardId = monthBoards[0].id;
    }
    return monthBoards.find(b => b.id === this.activeBoardId) || monthBoards[0];
  },

  selectBoard(boardId) {
    this.activeBoardId = boardId;
    this.supervisorFilter = 'ALL';
    this.subRegionFilter = 'ALL';
    this.isEditingInline = false;
    window.App.renderCurrentModule();
  },

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('kpi-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  toggleZeroFilter() {
    this.onlyZeroFilter = !this.onlyZeroFilter;
    window.App.renderCurrentModule();
  },

  toggleInlineEdit() {
    this.isEditingInline = !this.isEditingInline;
    window.App.renderCurrentModule();
  },

  handleInlineCellChange(rowIndex, field, rawVal) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === this.activeBoardId);
    if (!board || !board.rows[rowIndex]) return;

    const numVal = Math.max(0, Number(rawVal) || 0);
    board.rows[rowIndex][field] = numVal;

    const r = board.rows[rowIndex];
    r.rate = r.total > 0 ? Math.round((r.actual / r.total) * 100) : 0;

    this.recalculateBoardTotals(board);
    board.updatedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    board.updatedBy = window.AppState?.userName || 'Admin';

    this.saveBoards(boards);
    window.App.renderCurrentModule();
  },

  recalculateBoardTotals(board) {
    if (!board || !Array.isArray(board.rows)) return;

    let groupTotal = 0;
    let groupActual = 0;
    let northTotal = 0, northActual = 0;
    let southTotal = 0, southActual = 0;

    board.rows.forEach(row => {
      if (row.rowType === 'STAFF') {
        const t = Number(row.total) || 0;
        const a = Number(row.actual) || 0;
        row.rate = t > 0 ? Math.round((a / t) * 100) : 0;
        groupTotal += t;
        groupActual += a;
        if (row.mien === 'SOUTH') {
          southTotal += t;
          southActual += a;
        } else {
          northTotal += t;
          northActual += a;
        }
      } else if (row.rowType === 'SUBTOTAL') {
        row.total = groupTotal;
        row.actual = groupActual;
        row.rate = groupTotal > 0 ? Math.round((groupActual / groupTotal) * 100) : 0;
        groupTotal = 0;
        groupActual = 0;
      } else if (row.rowType === 'MIEN_TOTAL') {
        if (row.mien === 'NORTH') {
          row.total = northTotal;
          row.actual = northActual;
          row.rate = northTotal > 0 ? Math.round((northActual / northTotal) * 100) : 0;
        } else {
          row.total = southTotal;
          row.actual = southActual;
          row.rate = southTotal > 0 ? Math.round((southActual / southTotal) * 100) : 0;
        }
      } else if (row.rowType === 'GRAND_TOTAL') {
        const grandT = northTotal + southTotal;
        const grandA = northActual + southActual;
        row.total = grandT;
        row.actual = grandA;
        row.rate = grandT > 0 ? Math.round((grandA / grandT) * 100) : 0;
      }
    });
  },

  deleteCurrentBoard() {
    if (!this.isAdmin()) return;
    const cur = this.getActiveBoard();
    if (!cur) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa bảng "${cur.title}" khỏi Tháng ${cur.month} không?`)) return;

    const allBoards = this.getBoards().filter(b => b.id !== cur.id);
    this.activeBoardId = null;
    this.saveBoards(allBoards);
    window.App.renderCurrentModule();
  },

  buildTableRowsWithRowspan(rows) {
    const result = rows.map((r, idx) => ({
      ...r,
      _origIdx: idx,
      supRowspan: 1,
      hideSupCell: false,
      regRowspan: 1,
      hideRegCell: false
    }));

    let i = 0;
    while (i < result.length) {
      const cur = result[i];
      if (cur.rowType === 'MIEN_TOTAL' || cur.rowType === 'GRAND_TOTAL') {
        i++;
        continue;
      }
      let span = 1;
      while (
        i + span < result.length &&
        result[i + span].rowType !== 'MIEN_TOTAL' &&
        result[i + span].rowType !== 'GRAND_TOTAL' &&
        result[i + span].region === cur.region
      ) {
        result[i + span].hideRegCell = true;
        span++;
      }
      cur.regRowspan = span;
      i += span;
    }

    let j = 0;
    while (j < result.length) {
      const cur = result[j];
      if (cur.rowType === 'MIEN_TOTAL' || cur.rowType === 'GRAND_TOTAL' || !cur.supervisor) {
        j++;
        continue;
      }
      let span = 1;
      while (
        j + span < result.length &&
        result[j + span].rowType !== 'MIEN_TOTAL' &&
        result[j + span].rowType !== 'GRAND_TOTAL' &&
        result[j + span].supervisor === cur.supervisor
      ) {
        result[j + span].hideSupCell = true;
        span++;
      }
      cur.supRowspan = span;
      j += span;
    }

    return result;
  },

  render() {
    this.syncHeaderFilterUI();
    this.fetchBoardsFromSupabase(false);

    const selectedYM = this.getSelectedYearMonth();
    const [yStr, mStr] = selectedYM.split('-');
    const allBoards = this.getBoards();
    const monthBoards = this.getBoardsForSelectedMonth();
    const board = this.getActiveBoard();
    const isAdmin = this.isAdmin();
    const headerRegion = window.AppState?.region || 'ALL';

    const availableMonths = [...new Set(allBoards.map(b => this.normalizeBoardMonth(b)))].sort().reverse();

    // 1. THÁNG ĐANG CHỌN CHƯA CÓ BẢNG KPI
    if (!board || monthBoards.length === 0) {
      return `
        <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-xl bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-extrabold font-mono">
              Kỳ KPI: Tháng ${mStr}/${yStr}
            </span>
            <span class="text-xs font-bold text-slate-500">Chưa có danh mục KPI nào trong tháng này</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            ${isAdmin ? `
              <button
                onclick="KpiModule.openUploadKpiModal('NEW')"
                class="btn-3d-orange px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Thêm Bảng KPI Tháng ${mStr}/${yStr} (Excel)</span>
              </button>
              <button
                onclick="KpiModule.openImageKpiModal()"
                class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <i class="fa-solid fa-image"></i>
                <span>Thêm Ảnh KPI Tháng ${mStr}/${yStr} (Ctrl+V)</span>
              </button>
            ` : `
              <button
                onclick="KpiModule.fetchBoardsFromSupabase(true)"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i class="fa-solid fa-rotate text-[#F26522]"></i>
                <span>Đồng Bộ Tiến Độ Mới Nhất</span>
              </button>
            `}
          </div>
        </div>

        <div class="card-3d p-12 text-center bg-white dark:bg-slate-900 space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center mx-auto text-2xl shadow-sm">
            <i class="fa-solid fa-calendar-xmark"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white uppercase">
              Tháng ${mStr}/${yStr} Chưa Có Danh Mục KPI Nào Được Giao
            </h3>
            <p class="text-xs text-slate-500 max-w-lg mx-auto">
              Mỗi tháng có các hạng mục KPI độc lập. ${isAdmin ? `Hãy bấm nút <strong>"Thêm Bảng KPI Tháng ${mStr}/${yStr}"</strong> ở góc phải phía trên để tải file Excel hoặc dán ảnh KPI cho tháng này.` : 'Vui lòng chọn các tháng trước trên thanh công cụ để xem tiến độ KPI.'}
            </p>
          </div>

          ${availableMonths.length > 0 ? `
            <div class="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span class="font-bold text-slate-400">Xem nhanh các tháng đã có KPI:</span>
              ${availableMonths.map(ym => {
                const [y, m] = ym.split('-');
                const count = allBoards.filter(b => this.normalizeBoardMonth(b) === ym).length;
                return `
                  <button
                    onclick="KpiModule.switchToMonth('${ym}')"
                    class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#111625] text-slate-700 hover:text-white font-extrabold transition cursor-pointer"
                  >
                    Tháng ${m}/${y} (${count} KPI)
                  </button>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 2. BẢNG HÌNH ẢNH (IMAGE_BOARD)
    if (board.boardType === 'IMAGE_BOARD') {
      return `
        <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-extrabold font-mono">
              T${mStr}/${yStr}
            </span>
            <span class="text-xs font-extrabold uppercase text-slate-400 mr-1">DANH MỤC KPI (${monthBoards.length}):</span>
            ${monthBoards.map((b, idx) => `
              <button
                onclick="KpiModule.selectBoard('${b.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                  b.id === board.id ? 'bg-[#111625] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:text-[#F26522]'
                }"
              >
                <span class="w-4 h-4 rounded-full ${b.id === board.id ? 'bg-[#F26522] text-white' : 'bg-slate-300 text-slate-700'} text-[10px] flex items-center justify-center font-mono">${idx + 1}</span>
                <span>${b.title}</span>
              </button>
            `).join('')}
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            ${isAdmin ? `
              <button onclick="KpiModule.openUploadKpiModal('NEW')" class="btn-3d-orange px-3.5 py-2 rounded-xl font-extrabold cursor-pointer">
                <i class="fa-solid fa-file-excel mr-1"></i> + Thêm Bảng Excel
              </button>
              <button onclick="KpiModule.openImageKpiModal()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer">
                <i class="fa-solid fa-image mr-1"></i> + Thêm / Dán Ảnh KPI
              </button>
              <button onclick="KpiModule.deleteCurrentBoard()" class="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer" title="Xóa bảng KPI này">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : `
              <button
                onclick="KpiModule.fetchBoardsFromSupabase(true)"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i class="fa-solid fa-rotate text-[#F26522]"></i>
                <span>Đồng Bộ Tiến Độ Mới Nhất</span>
              </button>
            `}
          </div>
        </div>

        <div class="card-3d p-5 bg-white dark:bg-slate-900 space-y-3 text-center">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-extrabold text-base text-slate-900 dark:text-white uppercase">${board.title} (Tháng ${mStr}/${yStr})</h3>
            <span class="text-xs font-bold text-emerald-600">Cập nhật: ${board.updatedAt}</span>
          </div>
          <div class="overflow-auto max-h-[75vh] p-2 bg-slate-50 rounded-2xl border">
            <img src="${board.imageUrl}" onclick="window.open(this.src)" class="max-w-full h-auto mx-auto rounded-lg shadow cursor-zoom-in" title="Bấm vào ảnh để phóng to" />
          </div>
        </div>
      `;
    }

    // 3. BẢNG EXCEL TIẾN ĐỘ KPI
    const is6Col = board.boardType === 'EXCEL_6COL';
    const headers = board.headers || [];

    const regionFilteredRows = (board.rows || []).filter(r => {
      if (headerRegion === 'ALL') return true;
      if (r.rowType === 'GRAND_TOTAL') return false;
      return r.mien === headerRegion;
    });

    const supervisors = [...new Set(regionFilteredRows.map(r => r.supervisor).filter(s => s && s !== 'TỔNG'))];
    const subRegions = [...new Set(
      regionFilteredRows
        .filter(r => r.rowType === 'STAFF' || r.rowType === 'SUBTOTAL')
        .map(r => r.region)
    )];

    const staffRows = regionFilteredRows.filter(r => r.rowType === 'STAFF');
    const subtotalRows = regionFilteredRows.filter(r => r.rowType === 'SUBTOTAL');

    const sumTarget = staffRows.reduce((a, b) => a + (Number(b.total) || 0), 0);
    const sumActual = staffRows.reduce((a, b) => a + (Number(b.actual) || 0), 0);
    const overallRate = sumTarget > 0 ? Math.round((sumActual / sumTarget) * 100) : 0;

    const zeroZonesCount = subtotalRows.filter(r => Number(r.total) > 0 && Number(r.actual) === 0).length;
    const zeroStaffCount = staffRows.filter(r => Number(r.total) > 0 && Number(r.actual) === 0).length;
    const completedStaffCount = staffRows.filter(r => Number(r.rate) >= 100).length;

    const q = this.searchQuery.trim().toLowerCase();
    const isFiltering = q !== '' || this.supervisorFilter !== 'ALL' || this.subRegionFilter !== 'ALL' || this.onlyZeroFilter;

    const displayRowsRaw = regionFilteredRows.filter(r => {
      if (this.supervisorFilter !== 'ALL' && r.supervisor !== this.supervisorFilter) return false;
      if (this.subRegionFilter !== 'ALL' && r.region !== this.subRegionFilter) return false;
      if (this.onlyZeroFilter) {
        if (r.rowType === 'MIEN_TOTAL' || r.rowType === 'GRAND_TOTAL') return false;
        if (Number(r.rate) > 0) return false;
      }
      if (q) {
        const matchSup = String(r.supervisor || '').toLowerCase().includes(q);
        const matchReg = String(r.region || '').toLowerCase().includes(q);
        const matchName = String(r.name || '').toLowerCase().includes(q);
        return matchSup || matchReg || matchName;
      }
      return true;
    });

    const processedRows = this.buildTableRowsWithRowspan(displayRowsRaw);
    const targetHeaderLabel = is6Col ? (headers[3] || 'Chỉ tiêu 3824') : (headers[2] || 'Tổng số cửa hàng');
    const actualHeaderLabel = is6Col ? (headers[4] || 'Hoàn thành') : (headers[3] || 'Đã kích hoạt');

    return `
      <!-- 1. THANH CHUYỂN TAB NHIỀU BẢNG KPI -->
      <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-extrabold font-mono">
            Tháng ${mStr}/${yStr}
          </span>
          <span class="text-xs font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1.5">
            <i data-lucide="layers" class="w-4 h-4 text-[#F26522]"></i>
            DANH MỤC KPI (${monthBoards.length}):
          </span>
          ${monthBoards.map((b, idx) => {
            const isActive = b.id === board.id;
            return `
              <button
                onclick="KpiModule.selectBoard('${b.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#111625] text-white shadow-md ring-2 ring-[#F26522]/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:text-[#F26522]'
                }"
              >
                <span class="w-4 h-4 rounded-full ${isActive ? 'bg-[#F26522] text-white' : 'bg-slate-300 text-slate-700'} text-[10px] flex items-center justify-center font-mono">${idx + 1}</span>
                <span>${b.title}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          ${isAdmin ? `
            <button
              onclick="KpiModule.openUploadKpiModal('NEW')"
              class="btn-3d-orange px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-plus"></i>
              <span>Thêm Bảng KPI (Excel)</span>
            </button>

            <button
              onclick="KpiModule.openImageKpiModal()"
              class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Dán trực tiếp hình ảnh bảng Excel (Ctrl+V) hoặc tải ảnh lên"
            >
              <i class="fa-solid fa-image"></i>
              <span>Thêm Ảnh KPI (Ctrl+V)</span>
            </button>

            <button
              onclick="KpiModule.openUploadKpiModal('UPDATE')"
              class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <i class="fa-solid fa-file-arrow-up"></i>
              <span>Cập Nhật File Excel</span>
            </button>

            <button
              onclick="KpiModule.toggleInlineEdit()"
              class="px-3 py-2 rounded-xl border ${this.isEditingInline ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'} font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              <span>${this.isEditingInline ? 'Đóng Sửa Nhanh' : 'Sửa Số Trực Tiếp'}</span>
            </button>

            <button
              onclick="KpiModule.deleteCurrentBoard()"
              class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
              title="Xóa bảng KPI này"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : `
            <button
              onclick="KpiModule.fetchBoardsFromSupabase(true)"
              class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid fa-rotate text-[#F26522]"></i>
              <span>Đồng Bộ Tiến Độ Mới Nhất</span>
            </button>
          `}

          <button
            onclick="KpiModule.downloadSampleExcel()"
            class="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <i class="fa-solid fa-file-excel"></i>
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <!-- 2. 5 THẺ KPI TỔNG HỢP -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>${targetHeaderLabel}</span>
            <i data-lucide="target" class="w-4 h-4 text-blue-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-slate-900 dark:text-white">${sumTarget.toLocaleString()}</div>
          <div class="text-[11px] text-slate-400 font-medium">${staffRows.length} Sales phụ trách</div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-emerald-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>${actualHeaderLabel}</span>
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-emerald-600">${sumActual.toLocaleString()}</div>
          <div class="text-[11px] text-slate-400 font-medium">Còn lại: <strong class="text-slate-700">${Math.max(0, sumTarget - sumActual)}</strong></div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>TỶ LỆ HOÀN THÀNH</span>
            <i data-lucide="trending-up" class="w-4 h-4 text-[#F26522]"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-[#F26522]">${overallRate}%</div>
          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
            <div class="h-full bg-emerald-500" style="width:${Math.min(100, overallRate)}%"></div>
          </div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-teal-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>ĐẠT & VƯỢT 100% CHỈ TIÊU</span>
            <i data-lucide="award" class="w-4 h-4 text-teal-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-teal-600">${completedStaffCount} <span class="text-xs font-normal text-slate-400">Sales</span></div>
          <div class="text-[11px] text-slate-400 font-medium">Hoàn thành xuất sắc</div>
        </div>

        <div
          onclick="KpiModule.toggleZeroFilter()"
          class="card-3d tilt-card p-4 border-t-4 border-t-rose-500 cursor-pointer hover:ring-2 hover:ring-rose-400 transition ${this.onlyZeroFilter ? 'ring-2 ring-rose-500 bg-rose-50/40' : ''}"
        >
          <div class="text-[11px] font-extrabold uppercase text-rose-600 flex items-center justify-between">
            <span>CHƯA PHÁT SINH (0%)</span>
            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-rose-600">
            ${zeroZonesCount} <span class="text-xs font-bold">vùng</span> / ${zeroStaffCount} <span class="text-xs font-bold">NV</span>
          </div>
          <div class="text-[10px] text-rose-500 font-bold">${this.onlyZeroFilter ? '✓ Đang lọc 0% (Bấm để bỏ)' : 'Bấm để lọc riêng vị trí 0%'}</div>
        </div>
      </div>

      <!-- 3. BẢNG TIẾN ĐỘ KPI CHI TIẾT -->
      <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <h3 class="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                ${board.title}
              </h3>
              <span class="px-2.5 py-0.5 rounded-md bg-orange-50 text-[#F26522] border border-orange-200 text-[11px] font-extrabold font-mono">
                Tháng ${mStr}/${yStr}
              </span>
              <span class="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                Cập nhật: ${board.updatedAt || 'Mới nhất'}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Hiển thị đầy đủ Giám sát, Khu vực, Sales, Chỉ tiêu và Thanh tiến độ hoàn thành thực tế.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="kpi-search-input"
                type="text"
                value="${this.searchQuery}"
                oninput="KpiModule.setFilter('searchQuery', this.value)"
                placeholder="Tìm Giám sát, Khu vực, Sales..."
                class="pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-semibold w-56 focus:outline-none focus:border-[#F26522]"
              />
            </div>

            ${supervisors.length > 0 ? `
              <select
                onchange="KpiModule.setFilter('supervisorFilter', this.value)"
                class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Giám sát (${supervisors.length}) --</option>
                ${supervisors.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
              </select>
            ` : ''}

            <select
              onchange="KpiModule.setFilter('subRegionFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Khu vực (${subRegions.length}) --</option>
              ${subRegions.map(reg => `<option value="${reg}" ${this.subRegionFilter === reg ? 'selected' : ''}>${reg}</option>`).join('')}
            </select>

            ${isFiltering ? `
              <button
                onclick="KpiModule.setFilter('searchQuery', ''); KpiModule.setFilter('supervisorFilter', 'ALL'); KpiModule.setFilter('subRegionFilter', 'ALL'); KpiModule.onlyZeroFilter = false; window.App.renderCurrentModule();"
                class="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold cursor-pointer"
              >
                Xóa lọc
              </button>
            ` : ''}
          </div>
        </div>

        <div class="overflow-x-auto max-h-[68vh]">
          <table class="w-full border-collapse text-xs select-text">
            <thead class="sticky top-0 z-20">
              <tr class="bg-[#d9d9d9] dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border-b-2 border-slate-400">
                ${is6Col ? `<th class="py-3 px-3 border border-slate-400/80 text-center w-44">${headers[0]}</th>` : ''}
                <th class="py-3 px-3 border border-slate-400/80 text-center w-44">${is6Col ? headers[1] : headers[0]}</th>
                <th class="py-3 px-4 border border-slate-400/80 text-center min-w-[210px]">${is6Col ? headers[2] : headers[1]}</th>
                <th class="py-3 px-3 border border-slate-400/80 text-center w-36">${is6Col ? headers[3] : headers[2]}</th>
                <th class="py-3 px-3 border border-slate-400/80 text-center w-36">${is6Col ? headers[4] : headers[3]}</th>
                <th class="py-3 px-4 border border-slate-400/80 text-center w-48">${is6Col ? headers[5] : headers[4]}</th>
              </tr>
            </thead>
            <tbody>
              ${processedRows.map(row => {
                const isSubtotal = row.rowType === 'SUBTOTAL';
                const isMienTotal = row.rowType === 'MIEN_TOTAL';
                const isGrandTotal = row.rowType === 'GRAND_TOTAL';
                const isZeroSubtotalAlert = isSubtotal && Number(row.total) > 0 && Number(row.rate) === 0;

                let trClass = 'bg-white dark:bg-slate-900 hover:bg-orange-50/40';
                let textClass = 'font-medium text-slate-800 dark:text-slate-200';

                if (isZeroSubtotalAlert) {
                  trClass = 'bg-[#f8696b] text-slate-950 font-extrabold';
                  textClass = 'font-extrabold text-slate-950';
                } else if (isSubtotal) {
                  trClass = 'bg-[#d9d9d9] dark:bg-slate-800 font-extrabold';
                  textClass = 'font-extrabold text-slate-900 dark:text-white';
                } else if (isMienTotal) {
                  trClass = 'bg-[#aeaaaa] dark:bg-slate-700 font-black text-sm';
                  textClass = 'font-black text-slate-950 dark:text-white';
                } else if (isGrandTotal) {
                  trClass = 'bg-[#d9e1f2] dark:bg-indigo-950 font-black text-sm';
                  textClass = 'font-black text-slate-950 dark:text-white';
                }

                const barWidth = Math.min(100, Math.max(0, Number(row.rate) || 0));

                if (isMienTotal || isGrandTotal) {
                  const colSpanCount = is6Col ? 3 : 2;
                  return `
                    <tr class="${trClass} transition">
                      <td colspan="${colSpanCount}" class="py-2.5 px-4 border border-slate-400/80 text-center ${textClass}">
                        ${row.region || row.name}
                      </td>
                      <td class="py-2.5 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                        ${row.total}
                      </td>
                      <td class="py-2.5 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                        ${row.actual}
                      </td>
                      <td class="py-1.5 px-2 border border-slate-400/80 text-center relative overflow-hidden">
                        <div class="relative w-full h-6 flex items-center justify-center">
                          ${barWidth > 0 ? `
                            <div
                              class="absolute left-0 top-0 bottom-0 rounded-sm transition-all duration-500"
                              style="width: ${barWidth}%; background: linear-gradient(90deg, #63be7b 0%, #85d199 65%, #b6e6c3 100%);"
                            ></div>
                          ` : ''}
                          <span class="relative z-10 font-mono ${textClass}">${row.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }

                return `
                  <tr class="${trClass} transition">
                    ${is6Col && !row.hideSupCell ? `
                      <td
                        rowspan="${row.supRowspan}"
                        class="py-2.5 px-3 border border-slate-400/80 text-center align-middle bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white uppercase"
                      >
                        ${row.supervisor || ''}
                      </td>
                    ` : ''}

                    ${!row.hideRegCell ? `
                      <td
                        rowspan="${row.regRowspan}"
                        class="py-2.5 px-3 border border-slate-400/80 text-center align-middle bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                      >
                        ${row.region}
                      </td>
                    ` : ''}

                    <td class="py-2 px-4 border border-slate-400/80 text-center ${textClass}">
                      ${row.name}
                    </td>

                    <td class="py-2 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                      ${this.isEditingInline && row.rowType === 'STAFF' ? `
                        <input
                          type="number"
                          min="0"
                          value="${row.total}"
                          onchange="KpiModule.handleInlineCellChange(${row._origIdx}, 'total', this.value)"
                          class="w-20 px-2 py-1 text-center rounded border border-slate-400 bg-white font-mono font-bold text-slate-900"
                        />
                      ` : row.total}
                    </td>

                    <td class="py-2 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                      ${this.isEditingInline && row.rowType === 'STAFF' ? `
                        <input
                          type="number"
                          min="0"
                          value="${row.actual}"
                          onchange="KpiModule.handleInlineCellChange(${row._origIdx}, 'actual', this.value)"
                          class="w-20 px-2 py-1 text-center rounded border border-orange-400 bg-orange-50 font-mono font-extrabold text-[#F26522]"
                        />
                      ` : row.actual}
                    </td>

                    <td class="py-1.5 px-2 border border-slate-400/80 text-center relative overflow-hidden">
                      <div class="relative w-full h-6 flex items-center justify-center">
                        ${barWidth > 0 && !isZeroSubtotalAlert ? `
                          <div
                            class="absolute left-0 top-0 bottom-0 rounded-sm transition-all duration-500"
                            style="width: ${barWidth}%; background: linear-gradient(90deg, #63be7b 0%, #8ad69e 70%, #c4ebd0 100%);"
                          ></div>
                        ` : ''}
                        <span class="relative z-10 font-mono ${textClass}">${row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};