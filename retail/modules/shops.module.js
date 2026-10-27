// modules/shops.module.js
window.ShopsModule = {
  // Hàm nhảy trực tiếp sang mục "2. Việc cần làm" -> Tab "4. Chuyến thăm cửa hàng"
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

  render() {
    const activeMod = window.AppState?.activeModule || 'shops';

    // 1. KHI Ở MỤC "4. QUẢN LÝ CỬA HÀNG" (shops) -> LIÊN KẾT HIỂN THỊ TRỰC TIẾP TAB "4. CHUYẾN THĂM CỬA HÀNG & UP HÌNH" CỦA TASKS MODULE
    if (activeMod === 'shops' && window.TasksModule) {
      window.TasksModule.ensureI18n();
      window.TasksModule.fetchTasksFromSupabaseIfNeeded();

      const filteredTasks = window.TasksModule.getFilteredTasks();
      const { supervisors } = window.TasksModule.getRealShopsAndSupervisors();

      return `
        <!-- THANH LIÊN KẾT NHANH & BỘ LỌC DÙNG CHUNG VỚI TAB CHUYẾN THĂM CỬA HÀNG -->
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

          <!-- Bộ lọc tìm kiếm liên kết trực tiếp với TasksModule -->
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

        <!-- GỌI THẲNG GIAO DIỆN TAB 4 (CHUYẾN THĂM CỬA HÀNG & UP HÌNH) TỪ TASKS MODULE -->
        ${window.TasksModule.renderStoreVisitTab(filteredTasks)}
      `;
    }

    // 2. GIỮ NGUYÊN BẢNG PHÂN LOẠI & KẾ HOẠCH CẢI THIỆN CHO MỤC 6 (grading) & MỤC 7 (improvement)
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