// modules/kpi/kpi.importer.js
Object.assign(window.KpiModule, {
  openUploadKpiModal(mode = 'NEW') {
    if (!this.isAdmin()) return;
    const currentBoard = this.getActiveBoard();
    const isUpdate = mode === 'UPDATE' && currentBoard;
    const selectedYM = isUpdate ? (currentBoard.month || this.getSelectedYearMonth()) : this.getSelectedYearMonth();

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-file-excel text-emerald-600"></i>
        <span>${isUpdate ? `Cập Nhật File Excel: ${currentBoard.title}` : 'Thêm Bảng KPI Mới Theo Tháng (Từ File Excel)'}</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="KpiModule.handleExcelKpiSubmit(event, '${mode}')" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Tên Bảng KPI (Hoặc để trống sẽ tự lấy theo tên File)
            </label>
            <input
              id="kpi-upload-title"
              type="text"
              value="${isUpdate ? currentBoard.title : ''}"
              placeholder="VD: QUẢN LÝ CỬA HÀNG - TIẾN ĐỘ 3824..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Áp dụng cho Tháng / Năm *
            </label>
            <input
              id="kpi-upload-month"
              type="month"
              required
              value="${selectedYM}"
              class="w-full p-2.5 rounded-xl border border-orange-300 bg-orange-50/40 font-mono font-extrabold text-[#F26522] focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 text-[11px] text-emerald-900">
          <div class="font-extrabold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Tự động nhận diện thông minh:</div>
          <div>• <strong>Mẫu 6 cột</strong>: Giám sát (Cột A) | Khu vực (Cột B) | Sales (Cột C) | Chỉ tiêu (Cột D) | Hoàn thành (Cột E) | Tỷ lệ (Cột F).</div>
          <div>• <strong>Mẫu 5 cột</strong>: Khu vực (Cột A) | Họ tên (Cột B) | Tổng số (Cột C) | Đã kích hoạt (Cột D) | Tỷ lệ (Cột E).</div>
          <div>• Bảng KPI của tháng nào sẽ chỉ hiển thị khi chọn đúng tháng đó trên thanh công cụ.</div>
        </div>

        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Chọn File Excel (.xlsx, .xls, .csv) *
          </label>
          <input
            id="kpi-excel-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            required
            class="w-full p-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/30 font-semibold cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50 cursor-pointer">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up mr-1"></i> ${isUpdate ? 'Cập Nhật Ngay' : 'Tải Lên & Hiển Thị'}
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  parseNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/,/g, '').replace(/%/g, '').trim();
    const n = Number(clean);
    return isNaN(n) ? 0 : n;
  },

  async handleExcelKpiSubmit(e, mode) {
    e.preventDefault();
    const rawTitleInput = document.getElementById('kpi-upload-title')?.value.trim();
    const targetMonth = document.getElementById('kpi-upload-month')?.value || this.getSelectedYearMonth();
    const fileInput = document.getElementById('kpi-excel-file-input');
    const file = fileInput?.files?.[0];
    if (!file) return;

    if (window.AppUtils) {
      await window.AppUtils.ensureXLSXLoaded();
    }
    if (!window.XLSX) {
      alert('Không thể tải thư viện đọc Excel (SheetJS)!');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array', cellStyles: true });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const rawRows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const rowMeta = ws['!rows'] || [];

      if (!rawRows || rawRows.length < 2) {
        alert('File Excel không có dữ liệu!');
        return;
      }

      let headerIdx = 0;
      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const rowStr = (rawRows[i] || []).map(c => String(c || '')).join(' ').toUpperCase();
        if (rowStr.includes('KHU VỰC') || rowStr.includes('GIÁM SÁT') || rowStr.includes('区域') || rowStr.includes('督导')) {
          headerIdx = i;
          break;
        }
      }

      const hRow = (rawRows[headerIdx] || []).map(c => String(c || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim());
      const firstColHeader = (hRow[0] || '').toUpperCase();
      const thirdColHeader = (hRow[2] || '').toUpperCase();
      const is6ColLayout =
        firstColHeader.includes('GIÁM SÁT') ||
        firstColHeader.includes('督导') ||
        thirdColHeader.includes('SALE') ||
        thirdColHeader.includes('销售') ||
        thirdColHeader.includes('HỌ TÊN');

      const headers = is6ColLayout
        ? [
            hRow[0] || 'Giám sát 督导人员',
            hRow[1] || 'Khu vực 负责区域',
            hRow[2] || 'Sales 销售人员',
            hRow[3] || 'Chỉ tiêu 3824 3824目标',
            hRow[4] || 'Hoàn thành 已完成',
            hRow[5] || 'Tỷ lệ hoàn thành 完成率'
          ]
        : [
            hRow[0] || 'Khu vực 区域',
            hRow[1] || 'Họ tên 姓名',
            hRow[2] || 'Tổng số cửa hàng 总数量',
            hRow[3] || 'Đã kích hoạt 已激活数量',
            hRow[4] || 'Tỷ lệ hoàn thành 完成率'
          ];

      const tempRows = [];
      let lastSupervisor = '';
      let lastRegion = '';

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        if (rowMeta[r] && rowMeta[r].hidden) continue;

        const row = rawRows[r] || [];
        if (is6ColLayout) {
          const c0 = row[0] !== null && row[0] !== undefined ? String(row[0]).replace(/\r?\n/g, ' ').trim() : '';
          const c1 = row[1] !== null && row[1] !== undefined ? String(row[1]).replace(/\r?\n/g, ' ').trim() : '';
          const c2 = row[2] !== null && row[2] !== undefined ? String(row[2]).replace(/\r?\n/g, ' ').trim() : '';
          const rawTarget = row[3];
          const rawActual = row[4];

          if (!c0 && !c1 && !c2 && rawTarget === null && rawActual === null) continue;

          let rowType = 'STAFF';
          if (c0.toUpperCase().includes('TỔNG') || c1.toUpperCase() === 'TỔNG') {
            rowType = 'GRAND_TOTAL';
          } else if (c1 && !c2 && rawTarget !== null) {
            rowType = 'MIEN_TOTAL';
          }

          if (c0 && rowType !== 'GRAND_TOTAL') lastSupervisor = c0;
          if (c1 && rowType === 'STAFF') lastRegion = c1;

          const totalNum = this.parseNum(rawTarget);
          const actualNum = this.parseNum(rawActual);
          const rateNum = totalNum > 0 ? Math.round((actualNum / totalNum) * 100) : 0;

          tempRows.push({
            supervisor: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? '' : lastSupervisor),
            region: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? c1 : (c1 || lastRegion)),
            name: rowType === 'GRAND_TOTAL' ? 'TỔNG TOÀN QUỐC' : (rowType === 'MIEN_TOTAL' ? c1 : c2),
            total: totalNum,
            actual: actualNum,
            rate: rateNum,
            rowType: rowType,
            mien: 'NORTH'
          });
        } else {
          const c0 = row[0] !== null && row[0] !== undefined ? String(row[0]).replace(/\r?\n/g, ' ').trim() : '';
          const c1 = row[1] !== null && row[1] !== undefined ? String(row[1]).replace(/\r?\n/g, ' ').trim() : '';
          const rawTarget = row[2];
          const rawActual = row[3];

          if (!c0 && !c1 && rawTarget === null && rawActual === null) continue;

          const upperAll = `${c0} ${c1}`.toUpperCase();
          let rowType = 'STAFF';
          if (upperAll === 'TỔNG' || upperAll.includes('TỔNG CỘNG')) {
            rowType = 'GRAND_TOTAL';
          } else if (upperAll.includes('MIỀN BẮC') || upperAll.includes('北部') || upperAll.includes('MIỀN NAM') || upperAll.includes('南部')) {
            rowType = 'MIEN_TOTAL';
          } else if (c0) {
            lastRegion = c0;
          }

          const totalNum = this.parseNum(rawTarget);
          const actualNum = this.parseNum(rawActual);
          const rateNum = totalNum > 0 ? Math.round((actualNum / totalNum) * 100) : 0;

          tempRows.push({
            supervisor: '',
            region: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? (c0 || c1) : (c0 || lastRegion)),
            name: c1 || c0 || '',
            total: totalNum,
            actual: actualNum,
            rate: rateNum,
            rowType: rowType,
            mien: 'NORTH'
          });
        }
      }

      const cleanedRows = [];
      let seenGrandTotal = false;
      for (const item of tempRows) {
        if (item.rowType === 'GRAND_TOTAL') {
          if (seenGrandTotal) continue;
          seenGrandTotal = true;
        }
        cleanedRows.push(item);
      }

      let currentMien = 'NORTH';
      const southKeywords = ['NAM TRUNG BỘ', 'TÂY NGUYÊN', 'ĐÔNG NAM', 'HỒ CHÍ MINH', 'TÂY NAM', 'SÔNG CỬU LONG', 'MIỀN NAM', '南部', '胡志明', 'TRẦN PHI LONG'];

      for (let i = 0; i < cleanedRows.length; i++) {
        const item = cleanedRows[i];
        const checkStr = `${item.region} ${item.name}`.toUpperCase();
        if (southKeywords.some(k => checkStr.includes(k))) {
          currentMien = 'SOUTH';
        }
        item.mien = item.rowType === 'GRAND_TOTAL' ? 'ALL' : currentMien;
        if (item.rowType === 'MIEN_TOTAL' && currentMien === 'NORTH') {
          currentMien = 'SOUTH';
        }
      }

      let startIdx = 0;
      while (startIdx < cleanedRows.length) {
        if (cleanedRows[startIdx].rowType !== 'STAFF') {
          startIdx++;
          continue;
        }
        const reg = cleanedRows[startIdx].region;
        let endIdx = startIdx;
        while (endIdx + 1 < cleanedRows.length && cleanedRows[endIdx + 1].rowType === 'STAFF' && cleanedRows[endIdx + 1].region === reg) {
          endIdx++;
        }
        const groupLen = endIdx - startIdx + 1;
        if (groupLen >= 2) {
          let sumBeforeLast = 0;
          for (let k = startIdx; k < endIdx; k++) {
            sumBeforeLast += cleanedRows[k].total;
          }
          const lastRow = cleanedRows[endIdx];
          if ((sumBeforeLast > 0 && lastRow.total === sumBeforeLast) || lastRow.name.toUpperCase().includes('TỔNG')) {
            lastRow.rowType = 'SUBTOTAL';
          }
        }
        startIdx = endIdx + 1;
      }

      const finalTitle = rawTitleInput || file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const boards = this.getBoards();
      const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
      const bType = is6ColLayout ? 'EXCEL_6COL' : 'EXCEL_5COL';

      if (mode === 'UPDATE' && this.activeBoardId) {
        const idx = boards.findIndex(b => b.id === this.activeBoardId);
        if (idx >= 0) {
          boards[idx] = {
            ...boards[idx],
            title: finalTitle,
            boardType: bType,
            month: targetMonth,
            headers: headers,
            rows: cleanedRows,
            updatedAt: nowStr,
            updatedBy: window.AppState?.userName || 'Admin'
          };
        }
      } else {
        const newId = 'KPI-' + Date.now().toString().slice(-6);
        boards.unshift({
          id: newId,
          title: finalTitle,
          boardType: bType,
          month: targetMonth,
          updatedAt: nowStr,
          updatedBy: window.AppState?.userName || 'Admin',
          headers: headers,
          rows: cleanedRows
        });
        this.activeBoardId = newId;
      }

      if (window.AppState) window.AppState.month = targetMonth;
      this.saveBoards(boards);
      window.App.closeModal();
      window.App.renderCurrentModule();
    } catch (err) {
      alert('Lỗi đọc file Excel: ' + err.message);
    }
  },

  openImageKpiModal() {
    if (!this.isAdmin()) return;
    this._tempPastedImage = null;
    const selectedYM = this.getSelectedYearMonth();

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-image text-[#F26522]"></i>
        <span>Thêm / Dán Hình Ảnh Báo Cáo Tiến Độ KPI Theo Tháng</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="KpiModule.handleSaveImageKpiBoard(event)" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Tiêu Đề Bảng Tiến Độ KPI *
            </label>
            <input
              id="kpi-img-title"
              type="text"
              required
              placeholder="VD: Tiến độ Case Study / KPI trưng bày..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Áp dụng cho Tháng / Năm *
            </label>
            <input
              id="kpi-img-month"
              type="month"
              required
              value="${selectedYM}"
              class="w-full p-2.5 rounded-xl border border-orange-300 bg-orange-50/40 font-mono font-extrabold text-[#F26522] focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        <div
          id="kpi-paste-zone"
          tabindex="0"
          onpaste="KpiModule.handlePasteImageEvent(event)"
          class="p-6 rounded-2xl border-2 border-dashed border-[#F26522] bg-orange-50/40 text-center space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F26522]"
        >
          <i class="fa-solid fa-paste text-2xl text-[#F26522]"></i>
          <div class="font-extrabold text-slate-800 text-sm">
            Cách 1: Bấm vào khung này rồi nhấn <kbd class="px-2 py-0.5 rounded bg-slate-800 text-white font-mono">Ctrl + V</kbd> để dán trực tiếp ảnh chụp màn hình Excel / Zalo
          </div>
          <div class="text-slate-500">Hoặc Cách 2: Chọn file ảnh từ máy tính ở bên dưới</div>
          <input
            id="kpi-img-file-input"
            type="file"
            accept="image/*"
            onchange="KpiModule.handleImageFileSelect(this)"
            class="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#111625] file:text-white cursor-pointer"
          />
        </div>

        <div id="kpi-img-preview-box" class="hidden space-y-1">
          <div class="font-bold text-emerald-700"><i class="fa-solid fa-check-circle mr-1"></i> Đã nhận hình ảnh bảng KPI:</div>
          <img id="kpi-img-preview-el" src="" class="max-h-72 w-auto mx-auto rounded-xl border shadow-md" />
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50 cursor-pointer">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Lưu Hình Ảnh KPI
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async compressKpiImage(file) {
    if (window.AppUtils && window.AppUtils.compressImage) {
      return window.AppUtils.compressImage(file, 1600, 1600, 0.85);
    }
    return null;
  },

  async handlePasteImageEvent(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const dataUrl = await this.compressKpiImage(file);
          this._tempPastedImage = dataUrl;
          const box = document.getElementById('kpi-img-preview-box');
          const imgEl = document.getElementById('kpi-img-preview-el');
          if (box && imgEl) {
            imgEl.src = dataUrl;
            box.classList.remove('hidden');
          }
        }
        break;
      }
    }
  },

  async handleImageFileSelect(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;
    const dataUrl = await this.compressKpiImage(file);
    this._tempPastedImage = dataUrl;
    const box = document.getElementById('kpi-img-preview-box');
    const imgEl = document.getElementById('kpi-img-preview-el');
    if (box && imgEl) {
      imgEl.src = dataUrl;
      box.classList.remove('hidden');
    }
  },

  handleSaveImageKpiBoard(e) {
    e.preventDefault();
    const title = document.getElementById('kpi-img-title')?.value.trim() || 'Bảng Ảnh Tiến Độ KPI';
    const targetMonth = document.getElementById('kpi-img-month')?.value || this.getSelectedYearMonth();
    if (!this._tempPastedImage) {
      alert('Vui lòng dán ảnh (Ctrl + V) hoặc chọn file ảnh bảng KPI trước khi lưu!');
      return;
    }

    const boards = this.getBoards();
    const newId = 'KPI-IMG-' + Date.now().toString().slice(-6);
    const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

    boards.unshift({
      id: newId,
      title: title.toUpperCase(),
      boardType: 'IMAGE_BOARD',
      month: targetMonth,
      imageUrl: this._tempPastedImage,
      updatedAt: nowStr,
      updatedBy: window.AppState?.userName || 'Admin',
      headers: [],
      rows: []
    });

    this.activeBoardId = newId;
    this._tempPastedImage = null;
    if (window.AppState) window.AppState.month = targetMonth;
    this.saveBoards(boards);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  async downloadSampleExcel() {
    if (window.AppUtils) {
      await window.AppUtils.ensureXLSXLoaded();
    }
    if (!window.XLSX) return;

    const board = this.getActiveBoard();
    if (!board || board.boardType === 'IMAGE_BOARD') return;

    const is6Col = board.boardType === 'EXCEL_6COL';
    const aoa = [board.headers];

    board.rows.forEach(r => {
      if (is6Col) {
        aoa.push([r.supervisor || '', r.region, r.name, r.total, r.actual, `${r.rate}%`]);
      } else {
        aoa.push([r.region, r.name, r.total, r.actual, `${r.rate}%`]);
      }
    });

    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Tien_Do_KPI');
    const safeName = board.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9\s]/g, '').trim().replace(/\s+/g, '_');
    window.XLSX.writeFile(wb, `YADEA_${safeName}.xlsx`);
  }
});