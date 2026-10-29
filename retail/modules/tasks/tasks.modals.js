// modules/tasks/tasks.modals.js
Object.assign(window.TasksModule, {
  openCreateTaskModal(preset = {}) {
    const { shops, supervisors } = this.getRealShopsAndSupervisors();
    const isManager = this.isManagerRole();
    const currentUserName = window.AppState?.userName || 'Giám sát';
    const taskType = preset.taskType || 'TASK';
    const today = new Date().toISOString().slice(0, 10);

    const preselectedShop = preset.dvn
      ? shops.find(s => String(s.dvn).trim() === String(preset.dvn).trim())
      : null;
    const preselectedDisplay = preselectedShop
      ? `${preselectedShop.dvn} - ${preselectedShop.name}`
      : (preset.dvn || '');

    const modalTitles = {
      'TASK': isManager ? 'Giao Nhiệm Vụ Mới Cho Giám Sát (派发新任务)' : 'Tạo Nhiệm Vụ Cá Nhân (创建个人任务)',
      'MARKET_PLAN': 'Đăng Ký Kế Hoạch Tuần / Lịch Thị Trường (市场周计划)',
      'STORE_VISIT': 'Check-in & Báo Cáo Chuyến Thăm Cửa Hàng (门店巡访打卡)'
    };

    document.getElementById('modal-title').innerText = modalTitles[taskType] || modalTitles['TASK'];
    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="TasksModule.handleSaveNewTask(event, '${taskType}')" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div class="md:col-span-2">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              ${taskType === 'STORE_VISIT' ? 'Nội dung kiểm tra / Check-in cửa hàng *' : 'Tiêu đề nhiệm vụ / Công việc *'}
            </label>
            <input
              id="new-task-title"
              type="text"
              required
              value="${preset.title || ''}"
              placeholder="VD: Kiểm tra trưng bày 3824 & hỗ trợ đẩy S.O tại cửa hàng..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div class="relative">
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Cửa hàng liên quan (Gõ mã DVN hoặc Tên Shop)
            </label>
            <input type="hidden" id="new-task-dvn" value="${preset.dvn || ''}" />
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="modal-shop-search-input"
                type="text"
                autocomplete="off"
                value="${preselectedDisplay}"
                onfocus="TasksModule.filterShopAutocomplete('modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                oninput="TasksModule.filterShopAutocomplete('modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                placeholder="Gõ DVN hoặc tên cửa hàng..."
                class="w-full pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 font-bold text-blue-700 focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="button"
                onclick="TasksModule.selectShopOption('', '', '', 'modal-shop-search-input', 'modal-shop-dropdown', 'new-task-dvn')"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
              >×</button>
            </div>
            <div
              id="modal-shop-dropdown"
              class="hidden absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-50"
            ></div>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Giám sát thực hiện *</label>
            <select
              id="new-task-assignee"
              required
              class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-orange-600 focus:outline-none focus:border-[#F26522]"
            >
              ${supervisors.length > 0 ? supervisors.map(sup => `
                <option value="${sup}" ${(preset.assignee === sup || currentUserName.includes(sup)) ? 'selected' : ''}>${sup}</option>
              `).join('') : `<option value="${currentUserName}">${currentUserName}</option>`}
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Ngày bắt đầu / Ngày Check-in *</label>
            <input
              id="new-task-start"
              type="date"
              required
              value="${preset.startDate || today}"
              class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Hạn hoàn thành (Deadline) *</label>
            <input
              id="new-task-deadline"
              type="date"
              required
              value="${preset.deadline || today}"
              class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Mức độ ưu tiên</label>
            <select id="new-task-priority" class="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-[#F26522]">
              <option value="HIGH" ${preset.priority === 'HIGH' ? 'selected' : ''}>🔥 Khẩn cấp / Cao (HIGH)</option>
              <option value="MEDIUM" ${(!preset.priority || preset.priority === 'MEDIUM') ? 'selected' : ''}>⚡ Trung bình (MEDIUM)</option>
              <option value="LOW" ${preset.priority === 'LOW' ? 'selected' : ''}>📌 Thông thường (LOW)</option>
            </select>
          </div>

          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Tiến độ (%)</label>
            <input id="new-task-progress" type="number" min="0" max="100" value="${taskType === 'STORE_VISIT' ? 100 : 0}" class="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold" />
          </div>
        </div>

        ${taskType === 'STORE_VISIT' ? `
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="font-extrabold text-slate-800 uppercase text-[11px]">Checklist Kiểm Tra Tiêu Chuẩn Cửa Hàng (3824 & Vận hành)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-signboard" checked class="accent-[#F26522]" /> 1. Biển hiệu & Mặt tiền sạch chuẩn</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-display" checked class="accent-[#F26522]" /> 2. Trưng bày xe & Đủ bảng giá POP</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-staff" checked class="accent-[#F26522]" /> 3. Tác phong & Kỹ năng tư vấn Sale</label>
              <label class="flex items-center gap-2 font-semibold cursor-pointer"><input type="checkbox" id="chk-inventory" checked class="accent-[#F26522]" /> 4. Kiểm đếm tồn kho thực tế & Cloud Sale</label>
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Nội dung công việc / Vấn đề ghi nhận tại Shop</label>
            <textarea
              id="new-task-note"
              rows="3"
              placeholder="Ghi rõ các đầu việc, hiện trạng trưng bày, tồn kho hoặc nguyên nhân S.O thấp..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#F26522]"
            >${preset.note || ''}</textarea>
          </div>
          <div>
            <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">Giải pháp thực thi / Đề xuất hỗ trợ</label>
            <textarea
              id="new-task-solution"
              rows="3"
              placeholder="Phương án xử lý, đào tạo nhân sự hoặc kế hoạch thúc đẩy S.O..."
              class="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#F26522]"
            >${preset.solution || ''}</textarea>
          </div>
        </div>

        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Hình ảnh Check-in / Minh chứng thực địa
          </label>
          <input
            id="new-task-files"
            type="file"
            accept="image/*"
            multiple
            onchange="TasksModule.previewCompressedFiles(this, 'new-task-image-preview')"
            class="w-full p-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs cursor-pointer"
          />
          <div id="new-task-image-preview" class="mt-2"></div>
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-paper-plane mr-1"></i> Lưu & Triển Khai
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async handleSaveNewTask(e, taskType) {
    e.preventDefault();
    const { shops } = this.getRealShopsAndSupervisors();
    const dvnVal = String(document.getElementById('new-task-dvn')?.value || '').trim();
    const matchedShop = shops.find(s => String(s.dvn).trim() === dvnVal);

    const title = document.getElementById('new-task-title').value.trim();
    const assignee = document.getElementById('new-task-assignee').value.trim();
    const startDate = document.getElementById('new-task-start').value;
    const deadline = document.getElementById('new-task-deadline').value;
    const priority = document.getElementById('new-task-priority').value;
    const note = document.getElementById('new-task-note').value.trim();
    const solution = document.getElementById('new-task-solution')?.value.trim() || '';
    const initProgress = Number(document.getElementById('new-task-progress')?.value || 0);
    const fileInput = document.getElementById('new-task-files');
    const uploadedImages = await this.readFilesAsDataUrls(fileInput?.files);

    let initialStatus = 'NOT_STARTED';
    if (taskType === 'MARKET_PLAN') initialStatus = 'IN_PROGRESS';
    else if (taskType === 'STORE_VISIT') initialStatus = 'PENDING_APPROVAL';
    else if (initProgress > 0 && initProgress < 100) initialStatus = 'IN_PROGRESS';
    else if (initProgress === 100) initialStatus = 'PENDING_APPROVAL';

    const checklist = taskType === 'STORE_VISIT' ? {
      signboard: Boolean(document.getElementById('chk-signboard')?.checked),
      display: Boolean(document.getElementById('chk-display')?.checked),
      staff: Boolean(document.getElementById('chk-staff')?.checked),
      inventory: Boolean(document.getElementById('chk-inventory')?.checked)
    } : {};

    const prefix = taskType === 'MARKET_PLAN' ? 'PLAN' : taskType === 'STORE_VISIT' ? 'VISIT' : 'TASK';
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const actor = window.AppState?.userName || 'Hệ thống';

    const newTask = {
      id: newId,
      taskType: taskType,
      title: title,
      note: note,
      issues: note,
      solution: solution,
      dvn: dvnVal,
      shopName: matchedShop ? matchedShop.name : '',
      region: matchedShop
        ? (window.AppUtils ? window.AppUtils.resolveMienCode(matchedShop.mien, matchedShop.region) : 'SOUTH')
        : (window.AppState?.region === 'ALL' ? 'SOUTH' : window.AppState?.region),
      assignee: assignee,
      assigner: actor,
      priority: priority,
      startDate: startDate,
      deadline: deadline,
      progress: taskType === 'STORE_VISIT' ? 100 : initProgress,
      status: initialStatus,
      isSpecialTrip: false,
      checklist: checklist,
      evidenceUrls: uploadedImages,
      history: [
        {
          time: new Date().toLocaleString('vi-VN'),
          isoDate: new Date().toISOString().slice(0, 10),
          actor: actor,
          action: taskType === 'STORE_VISIT'
            ? `Check-in cửa hàng (${uploadedImages.length} ảnh minh chứng)`
            : 'Khởi tạo nhiệm vụ mới'
        }
      ],
      createdAt: new Date().toISOString()
    };

    await this.persistTask(newTask);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  openTaskDetailModal(taskId) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const isManager = this.isManagerRole();
    const historyList = Array.isArray(task.history) ? task.history : [];
    const images = Array.isArray(task.evidenceUrls) ? task.evidenceUrls : [];

    document.getElementById('modal-title').innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-400">${task.id}</span>
        <span>${task.title}</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Mã DVN / Cửa hàng</div>
            <div class="font-mono font-black text-blue-600 mt-0.5">${task.dvn || 'Toàn vùng'}</div>
            <div class="font-bold text-slate-800 truncate">${task.shopName || '—'}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Giám sát thực hiện</div>
            <div class="font-extrabold text-orange-600 mt-0.5">${task.assignee || '—'}</div>
            <div class="text-[10px] text-slate-500">Người tạo: ${task.assigner || 'Admin'}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Thời gian</div>
            <div class="font-mono font-bold text-slate-800 mt-0.5">${task.startDate || '—'} → ${task.deadline || '—'}</div>
            <div class="mt-0.5">${this.renderPriorityBadge(task.priority)}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</div>
            <div class="mt-1">${this.renderStatusBadge(task)}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white">
          <div class="font-extrabold text-slate-900 uppercase text-xs flex items-center justify-between">
            <span>Cập Nhật Tiến Độ, Danh Sách Việc Tuần & Hình Ảnh Check-in</span>
            <span class="font-mono text-[#F26522] font-black">${task.progress || 0}%</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-600 mb-1">Tiến độ hoàn thành (%)</label>
              <input id="detail-task-progress" type="range" min="0" max="100" step="10" value="${task.progress || 0}" oninput="document.getElementById('detail-prog-label').innerText = this.value + '%'" class="w-full accent-[#F26522] cursor-pointer" />
              <div class="flex justify-between text-[11px] font-mono text-slate-500"><span>0%</span><strong id="detail-prog-label" class="text-[#F26522]">${task.progress || 0}%</strong><span>100%</span></div>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Trạng thái xử lý</label>
              <select id="detail-task-status" class="w-full p-2 rounded-xl border border-slate-300 font-bold">
                <option value="NOT_STARTED" ${task.status === 'NOT_STARTED' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="PENDING_APPROVAL" ${task.status === 'PENDING_APPROVAL' ? 'selected' : ''}>Gửi chờ phê duyệt</option>
                ${isManager ? `
                  <option value="REVISION_REQUIRED" ${task.status === 'REVISION_REQUIRED' ? 'selected' : ''}>Yêu cầu bổ sung</option>
                  <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Phê duyệt Hoàn thành</option>
                  <option value="CANCELLED" ${task.status === 'CANCELLED' ? 'selected' : ''}>Hủy nhiệm vụ</option>
                ` : ''}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Danh sách đầu việc / Vấn đề ghi nhận</label>
              <textarea id="detail-task-issues" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-medium">${task.issues || task.note || ''}</textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Kết quả đạt được / Giải pháp</label>
              <textarea id="detail-task-solution" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-medium">${task.solution || ''}</textarea>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Tải thêm ảnh Check-in thực địa</label>
            <input
              id="detail-task-files"
              type="file"
              accept="image/*"
              multiple
              onchange="TasksModule.previewCompressedFiles(this, 'detail-image-preview')"
              class="w-full p-1.5 rounded-xl border border-dashed border-slate-300 text-xs cursor-pointer"
            />
            <div id="detail-image-preview" class="mt-2"></div>
          </div>

          ${images.length > 0 ? `
            <div>
              <div class="font-bold text-slate-600 mb-1.5">Hình ảnh Check-in đã lưu (${images.length} ảnh):</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${images.map(url => `<img src="${url}" onclick="window.open('${url}')" class="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90" />`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <div class="flex flex-wrap items-center gap-2">
              ${isManager ? `
                <button
                  type="button"
                  onclick="TasksModule.managerQuickReview('${task.id}', 'COMPLETED')"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                >
                  <i class="fa-solid fa-check mr-1"></i> Phê Duyệt Hoàn Thành
                </button>
                <button
                  type="button"
                  onclick="TasksModule.managerQuickReview('${task.id}', 'REVISION_REQUIRED')"
                  class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold cursor-pointer"
                >
                  <i class="fa-solid fa-rotate-left mr-1"></i> Yêu Cầu Bổ Sung
                </button>
              ` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="TasksModule.saveTaskDetailUpdate('${task.id}', true)"
                class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold cursor-pointer"
              >
                Báo Cáo Hoàn Tất
              </button>
              <button
                type="button"
                onclick="TasksModule.saveTaskDetailUpdate('${task.id}', false)"
                class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold cursor-pointer"
              >
                Lưu Cập Nhật
              </button>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="font-extrabold text-slate-700 uppercase text-[11px]">Lịch Sử Theo Dõi & Cập Nhật (${historyList.length})</div>
          <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            ${historyList.map(h => `
              <div class="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                <div><strong class="text-slate-800">${h.actor}:</strong> <span class="text-slate-600">${h.action}</span></div>
                <span class="font-mono text-[10px] text-slate-400 shrink-0 ml-2">${h.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async saveTaskDetailUpdate(taskId, submitForApproval = false) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const progress = Number(document.getElementById('detail-task-progress')?.value || task.progress || 0);
    let status = document.getElementById('detail-task-status')?.value || task.status;
    if (submitForApproval) status = 'PENDING_APPROVAL';

    const issues = document.getElementById('detail-task-issues')?.value.trim() || '';
    const solution = document.getElementById('detail-task-solution')?.value.trim() || '';
    const fileInput = document.getElementById('detail-task-files');
    const newImages = await this.readFilesAsDataUrls(fileInput?.files);

    task.progress = submitForApproval ? 100 : progress;
    task.status = status;
    task.issues = issues;
    task.note = issues;
    task.solution = solution;
    if (newImages.length > 0) {
      task.evidenceUrls = [...(task.evidenceUrls || []), ...newImages];
    }

    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Giám sát',
      action: submitForApproval
        ? `Báo cáo hoàn tất (${newImages.length > 0 ? '+' + newImages.length + ' ảnh' : 'Chờ duyệt'})`
        : `Cập nhật tiến độ (${task.progress}%)`
    });

    await this.persistTask(task);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  async managerQuickReview(taskId, targetStatus) {
    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task) return;

    const feedback = targetStatus === 'REVISION_REQUIRED'
      ? prompt('Nhập ghi chú yêu cầu bổ sung gửi cho Giám sát:', 'Vui lòng bổ sung thêm hình ảnh check-in tại cửa hàng.')
      : 'Đã xác nhận hoàn thành';

    if (targetStatus === 'REVISION_REQUIRED' && feedback === null) return;

    task.status = targetStatus;
    if (targetStatus === 'COMPLETED') task.progress = 100;
    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Trưởng phòng',
      action: targetStatus === 'COMPLETED' ? 'Xác nhận Hoàn thành' : `Yêu cầu bổ sung: ${feedback}`
    });

    await this.persistTask(task);
    window.App.closeModal();
    window.App.renderCurrentModule();
  }
});