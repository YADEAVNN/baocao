// modules/tasks/tasks.store_visit.js
Object.assign(window.TasksModule, {
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
  }
});