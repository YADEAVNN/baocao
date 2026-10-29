// modules/tasks/tasks.market_plan.js
Object.assign(window.TasksModule, {
  planSupervisor: '',
  planSaleFilter: 'ALL',
  selectedPlanShops: [],

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
  }
});