// modules/sellout.module.js
window.SelloutModule = {
  groupByMode: 'SUB_REGION', // 'SUB_REGION' (Khu vực) | 'DIRECTOR' (GĐ Khu vực) | 'SUPERVISOR' (Giám sát) | 'SALE' (Sale)
  supervisorFilter: 'ALL',
  directorFilter: 'ALL',
  saleFilter: 'ALL',
  shopFilter: 'ALL',         // Lọc Shop cụ thể (tự động cập nhật danh sách theo Sale)
  shopTypeFilter: 'ALL',     // Size shop: 'ALL' | 'S' | 'A' | 'B'
  gradeFilter: 'ALL',        // Xếp loại: 'ALL' | 'GOOD' | 'AVG' | 'WEAK' | 'NODATA'
  searchQuery: '',

  // Tự động ẩn dòng chữ "Dữ liệu thực tế • Đồng bộ Cloud Supabase" trên thanh công cụ
  hideCloudSyncBadge() {
    const badge = document.getElementById('cloud-sync-badge');
    if (badge) badge.remove();
  },

  setMode(key, val) {
    this[key] = val;

    // Khi đổi Giám sát, Giám đốc hoặc Sale -> Tự động reset bộ lọc cấp dưới để danh sách Shop theo Sale luôn chuẩn xác
    if (key === 'supervisorFilter') {
      this.directorFilter = 'ALL';
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'directorFilter') {
      this.saleFilter = 'ALL';
      this.shopFilter = 'ALL';
    } else if (key === 'saleFilter') {
      this.shopFilter = 'ALL';
    }

    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('sellout-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  resetDetailFilters() {
    this.supervisorFilter = 'ALL';
    this.directorFilter = 'ALL';
    this.saleFilter = 'ALL';
    this.shopFilter = 'ALL';
    this.shopTypeFilter = 'ALL';
    this.gradeFilter = 'ALL';
    this.searchQuery = '';
    window.App.renderCurrentModule();
  },

  // Xuất Báo cáo Phân tích Sell-out chi tiết ra file Excel
  async exportSelloutAnalysisExcel() {
    if (window.AdminShopsModule) {
      await window.AdminShopsModule.ensureXLSXLoaded();
    }
    if (!window.XLSX) {
      alert('Chưa tải được thư viện xuất Excel!');
      return;
    }

    const { shops, effectiveYear, effectiveMonth } = window.DashboardModule.getEvaluatedRealShops();
    const filtered = this.getFilteredShops(shops);

    const rows = filtered.map(s => {
      const rowObj = {
        'MIỀN': s.mienLabel,
        'KHU VỰC': s.subRegion,
        'TỈNH/THÀNH': s.province,
        'MÃ SVN': String(s.svn || ''),
        'MÃ DVN': String(s.dvn || ''), // Giữ chuẩn String theo quy tắc
        'SIZE SHOP / LOẠI HÌNH': s.shopType,
        'TÊN CỬA HÀNG': s.name,
        'GIÁM SÁT': s.supervisor,
        'GĐ KHU VỰC': s.director,
        'SALE': s.sale,
        [`S.O CÙNG KỲ (T${effectiveMonth}/${effectiveYear - 1})`]: s.lastYearSO ?? '',
        'S.O THÁNG TRƯỚC': s.prevSO ?? '',
        [`S.O THÁNG ${effectiveMonth}/${effectiveYear}`]: s.currentSO ?? '',
        'TĂNG TRƯỞNG MoM (%)': s.mom !== null ? `${s.mom}%` : '',
        'TĂNG TRƯỞNG YoY (%)': s.yoy !== null ? `${s.yoy}%` : '',
        'XẾP LOẠI': s.eval.label
      };
      return rowObj;
    });

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, `Phan_Tich_SO_T${effectiveMonth}_${effectiveYear}`);
    window.XLSX.writeFile(wb, `YADEA_Phan_Tich_SellOut_T${effectiveMonth}_${effectiveYear}.xlsx`);
  },

  getFilteredShops(shops) {
    const q = this.searchQuery.trim().toLowerCase();
    return shops.filter(s => {
      const matchSup = this.supervisorFilter === 'ALL' || s.supervisor === this.supervisorFilter;
      const matchDir = this.directorFilter === 'ALL' || s.director === this.directorFilter;
      const matchSale = this.saleFilter === 'ALL' || s.sale === this.saleFilter;
      const matchShop = this.shopFilter === 'ALL' || String(s.dvn).trim() === String(this.shopFilter).trim();

      const typeUpper = String(s.shopType || '').toUpperCase();
      const matchType =
        this.shopTypeFilter === 'ALL' ||
        (this.shopTypeFilter === 'S' && typeUpper.includes('S')) ||
        (this.shopTypeFilter === 'A' && typeUpper.includes('A')) ||
        (this.shopTypeFilter === 'B' && typeUpper.includes('B'));

      const matchGrade = this.gradeFilter === 'ALL' || s.eval.grade === this.gradeFilter;

      const matchQ = !q ||
        String(s.dvn || '').toLowerCase().includes(q) ||
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.subRegion || '').toLowerCase().includes(q) ||
        String(s.province || '').toLowerCase().includes(q) ||
        String(s.supervisor || '').toLowerCase().includes(q) ||
        String(s.director || '').toLowerCase().includes(q) ||
        String(s.sale || '').toLowerCase().includes(q);

      return matchSup && matchDir && matchSale && matchShop && matchType && matchGrade && matchQ;
    });
  },

  render() {
    this.hideCloudSyncBadge();
    if (!window.DashboardModule) return '';
    const { shops, effectiveYear, effectiveMonth } = window.DashboardModule.getEvaluatedRealShops();
    const filtered = this.getFilteredShops(shops);

    // Tạo danh sách lựa chọn liên hoàn (Cascading Filters): Giám sát -> Giám đốc -> Sale -> Shop (theo Sale)
    const supervisors = [...new Set(shops.map(s => s.supervisor).filter(Boolean))].sort();

    const shopsBySup = shops.filter(s =>
      this.supervisorFilter === 'ALL' || s.supervisor === this.supervisorFilter
    );
    const directors = [...new Set(shopsBySup.map(s => s.director).filter(Boolean))].sort();

    const shopsByDir = shopsBySup.filter(s =>
      this.directorFilter === 'ALL' || s.director === this.directorFilter
    );
    const sales = [...new Set(shopsByDir.map(s => s.sale).filter(Boolean))].sort();

    const shopsBySale = shopsByDir
      .filter(s => this.saleFilter === 'ALL' || s.sale === this.saleFilter)
      .sort((a, b) => String(a.dvn).localeCompare(String(b.dvn)));

    const hasActiveFilters =
      this.supervisorFilter !== 'ALL' ||
      this.directorFilter !== 'ALL' ||
      this.saleFilter !== 'ALL' ||
      this.shopFilter !== 'ALL' ||
      this.shopTypeFilter !== 'ALL' ||
      this.gradeFilter !== 'ALL' ||
      this.searchQuery.trim() !== '';

    // 1. Phân tích theo 3 Loại hình cửa hàng (Size Shop): S旗舰店, A形象店, B标准店
    const calcTypeStats = (prefix) => {
      const list = shops.filter(s => String(s.shopType || '').toUpperCase().includes(prefix));
      const totalSO = list.reduce((a, b) => a + (b.currentSO || 0), 0);
      const prevSO = list.reduce((a, b) => a + (b.prevSO || 0), 0);
      const lastY = list.reduce((a, b) => a + (b.lastYearSO || 0), 0);
      const avg = list.length > 0 ? (totalSO / list.length).toFixed(1) : 0;
      const yoy = lastY > 0 ? Math.round(((totalSO - lastY) / lastY) * 100) : null;
      const mom = prevSO > 0 ? Math.round(((totalSO - prevSO) / prevSO) * 100) : null;
      return { count: list.length, totalSO, avg, yoy, mom };
    };

    const statS = calcTypeStats('S');
    const statA = calcTypeStats('A');
    const statB = calcTypeStats('B');

    // 2. Gom nhóm thống kê theo chiều được chọn (Khu vực / Giám đốc KV / Giám sát / Sale)
    const groupMap = new Map();
    filtered.forEach(s => {
      let key = s.subRegion || 'Khác';
      if (this.groupByMode === 'DIRECTOR') key = s.director || 'Chưa phân công';
      if (this.groupByMode === 'SUPERVISOR') key = s.supervisor || 'Chưa phân công';
      if (this.groupByMode === 'SALE') key = s.sale || 'Chưa phân công';

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: key,
          mien: s.mienLabel,
          shopCount: 0,
          currentSO: 0,
          prevSO: 0,
          lastYearSO: 0,
          goodCount: 0,
          avgCount: 0,
          weakCount: 0
        });
      }
      const g = groupMap.get(key);
      g.shopCount += 1;
      g.currentSO += (s.currentSO || 0);
      g.prevSO += (s.prevSO || 0);
      g.lastYearSO += (s.lastYearSO || 0);
      if (s.eval.grade === 'GOOD') g.goodCount += 1;
      if (s.eval.grade === 'AVG') g.avgCount += 1;
      if (s.eval.grade === 'WEAK') g.weakCount += 1;
    });

    const groupedRows = Array.from(groupMap.values())
      .map(g => ({
        ...g,
        avgPerShop: g.shopCount > 0 ? (g.currentSO / g.shopCount).toFixed(1) : 0,
        mom: g.prevSO > 0 ? Math.round(((g.currentSO - g.prevSO) / g.prevSO) * 100) : null,
        yoy: g.lastYearSO > 0 ? Math.round(((g.currentSO - g.lastYearSO) / g.lastYearSO) * 100) : null
      }))
      .sort((a, b) => b.currentSO - a.currentSO);

    const totalFilteredSO = filtered.reduce((acc, s) => acc + (s.currentSO || 0), 0);

    return `
      <!-- KHỐI 1: THỐNG KÊ HIỆU SUẤT THEO 3 HẠNG CỬA HÀNG (S旗舰店 / A形象店 / B标准店) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${[
          { code: 'S', title: 'Hạng S • S旗舰店 (Flagship)', stat: statS, accent: 'border-t-purple-600', badge: 'bg-purple-100 text-purple-800' },
          { code: 'A', title: 'Hạng A • A形象店 (Shop Hình Ảnh)', stat: statA, accent: 'border-t-orange-500', badge: 'bg-orange-100 text-orange-800' },
          { code: 'B', title: 'Hạng B • B标准店 (Shop Tiêu Chuẩn)', stat: statB, accent: 'border-t-blue-500', badge: 'bg-blue-100 text-blue-800' }
        ].map(card => `
          <div
            onclick="SelloutModule.setMode('shopTypeFilter', '${this.shopTypeFilter === card.code ? 'ALL' : card.code}')"
            class="card-3d p-5 border-t-4 ${card.accent} cursor-pointer transition ${this.shopTypeFilter === card.code ? 'ring-2 ring-[#F26522]' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${card.badge}">${card.title}</span>
              <span class="text-xs font-bold text-slate-500">${card.stat.count} cửa hàng</span>
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <div>
                <div class="text-2xl font-black font-mono text-slate-900 dark:text-white">${card.stat.totalSO.toLocaleString()} xe</div>
                <div class="text-xs text-slate-500 mt-0.5">Trung bình: <strong class="text-slate-800 dark:text-slate-200">${card.stat.avg} xe/shop</strong></div>
              </div>
              <div class="text-right font-mono text-xs space-y-0.5">
                <div class="${card.stat.mom === null ? 'text-slate-400' : card.stat.mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                  MoM: ${card.stat.mom === null ? '—' : (card.stat.mom >= 0 ? '+' + card.stat.mom + '%' : card.stat.mom + '%')}
                </div>
                <div class="${card.stat.yoy === null ? 'text-slate-400' : card.stat.yoy >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                  YoY: ${card.stat.yoy === null ? '—' : (card.stat.yoy >= 0 ? '+' + card.stat.yoy + '%' : card.stat.yoy + '%')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- KHỐI 2: BẢNG TỔNG HỢP PHÂN TÍCH S.O THEO KHU VỰC / GIÁM ĐỐC / GIÁM SÁT / SALE -->
      <div class="card-3d p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-[#F26522]"></i>
              Báo Cáo Tổng Hợp Sell-Out Tháng ${effectiveMonth}/${effectiveYear}
            </h3>
            <p class="text-xs text-slate-500">So sánh trực tiếp sản lượng S.O, năng suất trung bình/shop và tỷ lệ Shop Tốt - Trung bình - Yếu</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
              ${[
                { id: 'SUB_REGION', label: 'Theo Khu vực' },
                { id: 'DIRECTOR', label: 'Theo GĐ Khu vực' },
                { id: 'SUPERVISOR', label: 'Theo Giám sát' },
                { id: 'SALE', label: 'Theo Sale' }
              ].map(tab => `
                <button
                  onclick="SelloutModule.setMode('groupByMode', '${tab.id}')"
                  class="px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    this.groupByMode === tab.id ? 'bg-[#111625] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  ${tab.label}
                </button>
              `).join('')}
            </div>

            <button
              onclick="SelloutModule.exportSelloutAnalysisExcel()"
              class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <i class="fa-solid fa-file-excel"></i>
              <span>Xuất Excel Phân Tích</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto max-h-[42vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 text-slate-600 uppercase font-extrabold border-b">
              <tr>
                <th class="py-3 px-4">#</th>
                <th class="py-3 px-4">
                  ${this.groupByMode === 'SUB_REGION' ? 'Khu Vực (区域)' : this.groupByMode === 'DIRECTOR' ? 'Giám Đốc Khu Vực' : this.groupByMode === 'SUPERVISOR' ? 'Giám Sát Phụ Trách' : 'Nhân Viên Sale'}
                </th>
                <th class="py-3 px-3 text-center">Số Shop</th>
                <th class="py-3 px-3 text-right">Cùng kỳ (T${effectiveMonth}/${effectiveYear - 1})</th>
                <th class="py-3 px-3 text-right">Tháng trước</th>
                <th class="py-3 px-3 text-right text-[#F26522]">S.O T${effectiveMonth}/${effectiveYear}</th>
                <th class="py-3 px-3 text-right">TB Xe / Shop</th>
                <th class="py-3 px-3 text-center">Tăng trưởng (MoM / YoY)</th>
                <th class="py-3 px-3 text-center">Tốt / TB / Yếu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${groupedRows.map((g, idx) => `
                <tr class="hover:bg-orange-50/40 transition">
                  <td class="py-3 px-4 font-mono font-bold text-slate-400">${idx + 1}</td>
                  <td class="py-3 px-4 font-extrabold text-slate-900">${g.name}</td>
                  <td class="py-3 px-3 text-center font-mono font-bold">${g.shopCount}</td>
                  <td class="py-3 px-3 text-right font-mono text-slate-500">${g.lastYearSO.toLocaleString()}</td>
                  <td class="py-3 px-3 text-right font-mono text-slate-600">${g.prevSO.toLocaleString()}</td>
                  <td class="py-3 px-3 text-right font-mono font-black text-sm text-[#F26522]">${g.currentSO.toLocaleString()} xe</td>
                  <td class="py-3 px-3 text-right font-mono font-bold text-blue-600">${g.avgPerShop} xe</td>
                  <td class="py-3 px-3 text-center font-mono">
                    <span class="${g.mom === null ? 'text-slate-400' : g.mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${g.mom === null ? '—' : (g.mom >= 0 ? '+' + g.mom + '%' : g.mom + '%')}
                    </span>
                    <span class="text-slate-300 mx-1">/</span>
                    <span class="${g.yoy === null ? 'text-slate-400' : g.yoy >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${g.yoy === null ? '—' : (g.yoy >= 0 ? '+' + g.yoy + '%' : g.yoy + '%')}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-[11px]">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">${g.goodCount}</span> /
                    <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">${g.avgCount}</span> /
                    <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">${g.weakCount}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- KHỐI 3: BẢNG TRA CỨU CHI TIẾT TỪNG CỬA HÀNG (KÈM BỘ LỌC NHANH 6 CẤP) -->
      <div class="card-3d p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <h3 class="font-extrabold text-sm text-slate-900 dark:text-white uppercase">Chi Tiết Sản Lượng Từng Cửa Hàng</h3>
            <span class="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-xs">${filtered.length} Shop</span>
            <span class="px-2.5 py-0.5 rounded-md bg-orange-50 text-[#F26522] font-extrabold font-mono text-xs">
              Tổng S.O: ${totalFilteredSO.toLocaleString()} xe
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="sellout-search-input"
                type="text"
                value="${this.searchQuery}"
                oninput="SelloutModule.setMode('searchQuery', this.value)"
                placeholder="Tìm nhanh DVN, tên shop, tỉnh..."
                class="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 w-64 font-semibold focus:outline-none focus:border-[#F26522]"
              />
            </div>

            ${hasActiveFilters ? `
              <button
                type="button"
                onclick="SelloutModule.resetDetailFilters()"
                class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold transition cursor-pointer flex items-center gap-1"
              >
                <i class="fa-solid fa-rotate-left"></i>
                <span>Đặt lại bộ lọc</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- THANH BỘ LỌC LIÊN HOÀN 6 CẤP: GIÁM SÁT - GIÁM ĐỐC - SALE - SHOP (THEO SALE) - SIZE SHOP - XẾP LOẠI -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
          <!-- 1. Lọc Giám sát -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Giám Sát</label>
            <select
              onchange="SelloutModule.setMode('supervisorFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám sát (${supervisors.length}) --</option>
              ${supervisors.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
            </select>
          </div>

          <!-- 2. Lọc Giám Đốc -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Giám Đốc KV</label>
            <select
              onchange="SelloutModule.setMode('directorFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám đốc (${directors.length}) --</option>
              ${directors.map(dir => `<option value="${dir}" ${this.directorFilter === dir ? 'selected' : ''}>${dir}</option>`).join('')}
            </select>
          </div>

          <!-- 3. Lọc Sale -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Nhân Viên Sale</label>
            <select
              onchange="SelloutModule.setMode('saleFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-blue-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Sale (${sales.length}) --</option>
              ${sales.map(sl => {
                const count = shopsByDir.filter(x => x.sale === sl).length;
                return `<option value="${sl}" ${this.saleFilter === sl ? 'selected' : ''}>${sl} (${count} shop)</option>`;
              }).join('')}
            </select>
          </div>

          <!-- 4. Lọc Shop (Danh sách tự động thu hẹp theo Sale đã chọn) -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
              4. Shop ${this.saleFilter !== 'ALL' ? `(Của ${this.saleFilter})` : '(Theo Sale)'}
            </label>
            <select
              onchange="SelloutModule.setMode('shopFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Shop (${shopsBySale.length}) --</option>
              ${shopsBySale.map(sh => `
                <option value="${sh.dvn}" ${String(this.shopFilter) === String(sh.dvn) ? 'selected' : ''}>
                  ${sh.dvn} - ${sh.name}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 5. Lọc Size Shop (Loại hình S / A / B) -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">5. Size Shop (Loại hình)</label>
            <select
              onchange="SelloutModule.setMode('shopTypeFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-purple-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL" ${this.shopTypeFilter === 'ALL' ? 'selected' : ''}>-- Mọi Size Shop --</option>
              <option value="S" ${this.shopTypeFilter === 'S' ? 'selected' : ''}>Size S • S旗舰店 (Flagship)</option>
              <option value="A" ${this.shopTypeFilter === 'A' ? 'selected' : ''}>Size A • A形象店 (Hình ảnh)</option>
              <option value="B" ${this.shopTypeFilter === 'B' ? 'selected' : ''}>Size B • B标准店 (Tiêu chuẩn)</option>
            </select>
          </div>

          <!-- 6. Lọc Xếp loại -->
          <div>
            <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">6. Xếp Loại S.O</label>
            <select
              onchange="SelloutModule.setMode('gradeFilter', this.value)"
              class="w-full p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 font-bold text-emerald-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL" ${this.gradeFilter === 'ALL' ? 'selected' : ''}>-- Mọi xếp loại --</option>
              <option value="GOOD" ${this.gradeFilter === 'GOOD' ? 'selected' : ''}>Tốt (>= 35 xe)</option>
              <option value="AVG" ${this.gradeFilter === 'AVG' ? 'selected' : ''}>Trung bình (15 - 34 xe)</option>
              <option value="WEAK" ${this.gradeFilter === 'WEAK' ? 'selected' : ''}>Yếu (< 15 xe)</option>
              <option value="NODATA" ${this.gradeFilter === 'NODATA' ? 'selected' : ''}>Chưa đủ dữ liệu</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto max-h-[55vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 text-slate-600 uppercase font-extrabold border-b">
              <tr>
                <th class="py-3 px-3">Mã DVN</th>
                <th class="py-3 px-3">Tên Đại Lý</th>
                <th class="py-3 px-3">Loại Hình</th>
                <th class="py-3 px-3">Khu Vực / Tỉnh</th>
                <th class="py-3 px-3">Giám Sát / GĐKV / Sale</th>
                <th class="py-3 px-3 text-right">CK T${effectiveMonth}/${effectiveYear - 1}</th>
                <th class="py-3 px-3 text-right">Tháng Trước</th>
                <th class="py-3 px-3 text-right text-[#F26522]">S.O T${effectiveMonth}/${effectiveYear}</th>
                <th class="py-3 px-3 text-center">MoM / YoY</th>
                <th class="py-3 px-3 text-center">Xếp Loại</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.map(s => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-2.5 px-3 font-mono font-black text-blue-600">${s.dvn}</td>
                  <td class="py-2.5 px-3 font-bold text-slate-900">${s.name}</td>
                  <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-[11px]">${s.shopType}</span></td>
                  <td class="py-2.5 px-3">
                    <div class="font-bold text-orange-600 text-[11px]">${s.subRegion}</div>
                    <div class="text-[11px] text-slate-500">${s.province}</div>
                  </td>
                  <td class="py-2.5 px-3 text-[11px]">
                    <div>GS: <strong>${s.supervisor}</strong></div>
                    <div class="text-slate-500">GĐ: ${s.director} • Sale: <strong class="text-blue-600">${s.sale}</strong></div>
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-slate-500">${s.lastYearSO ?? 'NULL'}</td>
                  <td class="py-2.5 px-3 text-right font-mono text-slate-600">${s.prevSO ?? 'NULL'}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-black text-sm text-slate-900">${s.currentSO ?? 'NULL'}</td>
                  <td class="py-2.5 px-3 text-center font-mono">
                    <span class="${s.mom === null ? 'text-slate-400' : s.mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${s.mom === null ? '—' : (s.mom >= 0 ? '+' + s.mom + '%' : s.mom + '%')}
                    </span>
                    /
                    <span class="${s.yoy === null ? 'text-slate-400' : s.yoy >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${s.yoy === null ? '—' : (s.yoy >= 0 ? '+' + s.yoy + '%' : s.yoy + '%')}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.eval.color}">${s.eval.label}</span>
                  </td>
                </tr>
              `).join('')}
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="10" class="py-10 text-center text-slate-400 font-semibold">
                    Không tìm thấy cửa hàng nào khớp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};