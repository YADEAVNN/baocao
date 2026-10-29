// modules/tasks/tasks.so_proposal.js
Object.assign(window.TasksModule, {
  proposalDirectorFilter: 'ALL',
  proposalSupervisorFilter: 'ALL',
  proposalSaleFilter: 'ALL',
  proposalSearchQuery: '',

  resetProposalFilters() {
    this.proposalDirectorFilter = 'ALL';
    this.proposalSupervisorFilter = 'ALL';
    this.proposalSaleFilter = 'ALL';
    this.proposalSearchQuery = '';
    window.App.renderCurrentModule();
  },

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
      const enumRegion = window.AppUtils
        ? window.AppUtils.resolveMienCode(item.mien, item.region)
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
  }
});