// modules/dashboard/dashboard.drilldown.js
Object.assign(window.DashboardModule, {
  openGradeDrilldownModal(gradeCode) {
    this.gradeModalState = {
      grade: gradeCode || 'ALL',
      subRegion: 'ALL',
      director: 'ALL',
      supervisor: 'ALL',
      sale: 'ALL',
      search: ''
    };
    this.renderGradeDrilldownModalContent();
    const modal = document.getElementById('global-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  updateGradeModalFilter(key, val) {
    this.gradeModalState[key] = val;
    this.renderGradeDrilldownModalContent();
    if (key === 'search') {
      const inp = document.getElementById('grade-modal-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  renderGradeDrilldownModalContent() {
    const { shops, effectiveYear, effectiveMonth } = this.getEvaluatedRealShops();
    const st = this.gradeModalState;

    const gradeTitles = {
      'ALL': 'Danh Sách Toàn Bộ Cửa Hàng',
      'GOOD': 'Danh Sách Shop TỐT (S.O >= 35 xe hoặc Tăng trưởng bứt phá)',
      'AVG': 'Danh Sách Shop TRUNG BÌNH (S.O từ 15 - 34 xe)',
      'WEAK': 'Danh Sách Shop YẾU - Cần Hỗ Trợ (S.O < 15 xe)',
      'NODATA': 'Danh Sách Shop CHƯA CÓ SỐ LIỆU (NULL)'
    };

    const byGrade = shops.filter(s => st.grade === 'ALL' || s.eval.grade === st.grade);

    const directors = [...new Set(byGrade.map(s => s.director).filter(Boolean))].sort();
    const supervisors = [...new Set(
      byGrade
        .filter(s => st.director === 'ALL' || s.director === st.director)
        .map(s => s.supervisor)
        .filter(Boolean)
    )].sort();
    const sales = [...new Set(
      byGrade
        .filter(s => (st.director === 'ALL' || s.director === st.director) && (st.supervisor === 'ALL' || s.supervisor === st.supervisor))
        .map(s => s.sale)
        .filter(Boolean)
    )].sort();

    const q = st.search.trim().toLowerCase();
    const finalFiltered = byGrade.filter(s => {
      const matchDir = st.director === 'ALL' || s.director === st.director;
      const matchSup = st.supervisor === 'ALL' || s.supervisor === st.supervisor;
      const matchSale = st.sale === 'ALL' || s.sale === st.sale;
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

    const totalGroupSO = finalFiltered.reduce((acc, s) => acc + (s.currentSO || 0), 0);

    document.getElementById('modal-title').innerHTML = `
      <div class="flex flex-wrap items-center gap-2.5">
        <span>${gradeTitles[st.grade] || 'Danh Sách Cửa Hàng'}</span>
        <span class="px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-[#F26522] text-xs font-extrabold">
          Tháng ${effectiveMonth}/${effectiveYear}
        </span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          ${[
            { id: 'ALL', label: `Tất cả (${shops.length})` },
            { id: 'GOOD', label: `Tốt (${shops.filter(x => x.eval.grade === 'GOOD').length})` },
            { id: 'AVG', label: `Trung bình (${shops.filter(x => x.eval.grade === 'AVG').length})` },
            { id: 'WEAK', label: `Yếu < 15 xe (${shops.filter(x => x.eval.grade === 'WEAK').length})` },
            { id: 'NODATA', label: `Thiếu DL (${shops.filter(x => x.eval.grade === 'NODATA').length})` }
          ].map(tab => `
            <button
              onclick="DashboardModule.updateGradeModalFilter('grade', '${tab.id}')"
              class="px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                st.grade === tab.id
                  ? 'bg-[#111625] text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }"
            >
              ${tab.label}
            </button>
          `).join('')}
        </div>

        <div class="text-xs font-bold text-slate-600">
          Hiển thị: <strong class="text-blue-600">${finalFiltered.length}</strong> shop • Tổng S.O: <strong class="text-[#F26522] font-mono">${totalGroupSO.toLocaleString()} xe</strong>
        </div>
      </div>

      <!-- BỘ LỌC 4 CẤP -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 text-xs">
        <div>
          <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">1. Lọc theo Giám Đốc KV</label>
          <select
            onchange="DashboardModule.updateGradeModalFilter('director', this.value)"
            class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#F26522]"
          >
            <option value="ALL">-- Tất cả Giám đốc (${directors.length}) --</option>
            ${directors.map(d => `<option value="${d}" ${st.director === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">2. Lọc theo Giám Sát</label>
          <select
            onchange="DashboardModule.updateGradeModalFilter('supervisor', this.value)"
            class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-orange-600 focus:outline-none focus:border-[#F26522]"
          >
            <option value="ALL">-- Tất cả Giám sát (${supervisors.length}) --</option>
            ${supervisors.map(sup => `<option value="${sup}" ${st.supervisor === sup ? 'selected' : ''}>${sup}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">3. Lọc theo Nhân viên Sale</label>
          <select
            onchange="DashboardModule.updateGradeModalFilter('sale', this.value)"
            class="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold text-blue-600 focus:outline-none focus:border-[#F26522]"
          >
            <option value="ALL">-- Tất cả Sale (${sales.length}) --</option>
            ${sales.map(sl => `<option value="${sl}" ${st.sale === sl ? 'selected' : ''}>${sl}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">4. Tìm nhanh Shop / Mã DVN</label>
          <input
            id="grade-modal-search"
            type="text"
            value="${st.search}"
            oninput="DashboardModule.updateGradeModalFilter('search', this.value)"
            placeholder="Gõ tên shop, DVN, tỉnh..."
            class="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      <!-- BẢNG DANH SÁCH SHOP CHI TIẾT -->
      <div class="overflow-x-auto max-h-[50vh] rounded-xl border border-slate-200">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 z-10 bg-slate-100 text-slate-600 uppercase font-extrabold border-b">
            <tr>
              <th class="py-3 px-3">Mã DVN</th>
              <th class="py-3 px-3">Tên Cửa Hàng</th>
              <th class="py-3 px-3">Khu vực / Tỉnh</th>
              <th class="py-3 px-3">Sale Phụ Trách</th>
              <th class="py-3 px-3">GĐ Khu Vực</th>
              <th class="py-3 px-3">Giám Sát</th>
              <th class="py-3 px-3 text-right">Cùng kỳ / Tháng trước</th>
              <th class="py-3 px-3 text-right text-[#F26522]">S.O T${effectiveMonth}</th>
              <th class="py-3 px-3 text-center">MoM / YoY</th>
              <th class="py-3 px-3 text-center">Đánh Giá</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${finalFiltered.map(s => `
              <tr class="hover:bg-orange-50/40 transition">
                <td class="py-2.5 px-3 font-mono font-black text-blue-600">${s.dvn}</td>
                <td class="py-2.5 px-3 font-bold text-slate-900">
                  ${s.name}
                  <span class="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">${s.shopType}</span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">
                  <div class="font-bold text-[11px] text-slate-700">${s.subRegion}</div>
                  <div class="text-[10px]">${s.province}</div>
                </td>
                <td class="py-2.5 px-3 font-semibold text-slate-800">${s.sale}</td>
                <td class="py-2.5 px-3 font-semibold text-blue-600">${s.director}</td>
                <td class="py-2.5 px-3 font-bold text-orange-600">${s.supervisor}</td>
                <td class="py-2.5 px-3 text-right font-mono text-slate-500">
                  CK: ${s.lastYearSO ?? '—'} | TT: ${s.prevSO ?? '—'}
                </td>
                <td class="py-2.5 px-3 text-right font-mono font-black text-sm text-[#172033]">
                  ${s.currentSO === null ? '<span class="text-slate-400">NULL</span>' : s.currentSO + ' xe'}
                </td>
                <td class="py-2.5 px-3 text-center font-mono text-[11px]">
                  <span class="${s.mom === null ? 'text-slate-400' : s.mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                    ${s.mom === null ? '—' : (s.mom >= 0 ? '+' + s.mom + '%' : s.mom + '%')}
                  </span>
                  /
                  <span class="${s.yoy === null ? 'text-slate-400' : s.yoy >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                    ${s.yoy === null ? '—' : (s.yoy >= 0 ? '+' + s.yoy + '%' : s.yoy + '%')}
                  </span>
                </td>
                <td class="py-2.5 px-3 text-center">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.eval.color}" title="${s.eval.reason}">
                    ${s.eval.label}
                  </span>
                </td>
              </tr>
            `).join('')}
            ${finalFiltered.length === 0 ? `
              <tr>
                <td colspan="10" class="py-8 text-center text-slate-400 font-semibold">
                  Không có cửa hàng nào khớp với điều kiện lọc hiện tại.
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;
  }
});