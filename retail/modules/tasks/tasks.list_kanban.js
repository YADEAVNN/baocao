// modules/tasks/tasks.list_kanban.js
Object.assign(window.TasksModule, {
  handleDragStart(event, taskId) {
    this.draggedTaskId = String(taskId);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(taskId));
    }
  },

  async handleDropOnColumn(event, newStatus) {
    event.preventDefault();
    const taskId = this.draggedTaskId || event.dataTransfer?.getData('text/plain');
    if (!taskId) return;

    const task = (window.AppStore.tasks || []).find(t => String(t.id) === String(taskId));
    if (!task || task.status === newStatus) return;

    if (newStatus === 'COMPLETED' && !this.isManagerRole()) {
      newStatus = 'PENDING_APPROVAL';
    }

    task.status = newStatus;
    if (newStatus === 'COMPLETED') task.progress = 100;
    if (newStatus === 'IN_PROGRESS' && task.progress === 0) task.progress = 25;

    if (!Array.isArray(task.history)) task.history = [];
    task.history.unshift({
      time: new Date().toLocaleString('vi-VN'),
      isoDate: new Date().toISOString().slice(0, 10),
      actor: window.AppState?.userName || 'Người dùng',
      action: `Kéo thả Kanban sang: ${newStatus}`
    });

    this.draggedTaskId = null;
    await this.persistTask(task);
    window.App.renderCurrentModule();
  },

  renderListTab(tasks) {
    const isManager = this.isManagerRole();
    const selectedYM = this.getSelectedYearMonth();
    const [yStr, mStr] = selectedYM.split('-');

    return `
      <div class="card-3d overflow-hidden">
        <div class="overflow-x-auto max-h-[60vh]">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-600 uppercase font-extrabold border-b">
              <tr>
                <th class="p-3.5">Mã CV</th>
                <th class="p-3.5">Nội dung công việc</th>
                <th class="p-3.5">Mã DVN / Shop</th>
                <th class="p-3.5">Giám sát</th>
                <th class="p-3.5">Ưu tiên</th>
                <th class="p-3.5">Thời gian</th>
                <th class="p-3.5">Tiến độ</th>
                <th class="p-3.5">Trạng thái</th>
                <th class="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${tasks.map(task => `
                <tr class="hover:bg-orange-50/30 transition">
                  <td class="p-3.5 font-mono font-black text-slate-800 dark:text-slate-200">
                    <button onclick="TasksModule.openTaskDetailModal('${task.id}')" class="hover:text-[#F26522] hover:underline cursor-pointer">${task.id}</button>
                  </td>
                  <td class="p-3.5 max-w-xs">
                    <div class="font-bold text-slate-900 dark:text-white">${task.title}</div>
                    ${task.note ? `<div class="text-[11px] text-slate-500 line-clamp-2 mt-0.5 whitespace-pre-line">${task.note}</div>` : ''}
                  </td>
                  <td class="p-3.5">
                    ${task.dvn ? `
                      <div class="font-mono font-extrabold text-blue-600">${task.dvn}</div>
                      <div class="text-[11px] text-slate-600 truncate max-w-[160px]">${task.shopName || ''}</div>
                    ` : `<span class="text-slate-400">Lịch vùng / Chung</span>`}
                  </td>
                  <td class="p-3.5 font-extrabold text-orange-600">${task.assignee || '—'}</td>
                  <td class="p-3.5">${this.renderPriorityBadge(task.priority)}</td>
                  <td class="p-3.5 font-mono text-[11px]">
                    <div>${task.startDate || '—'}</div>
                    <div class="${this.isTaskOverdue(task) ? 'text-rose-600 font-black' : 'text-slate-500'}">→ ${task.deadline || '—'}</div>
                  </td>
                  <td class="p-3.5 w-32">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-[#F26522]" style="width:${task.progress || 0}%"></div>
                      </div>
                      <span class="font-mono font-bold">${task.progress || 0}%</span>
                    </div>
                  </td>
                  <td class="p-3.5">${this.renderStatusBadge(task)}</td>
                  <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button
                      onclick="TasksModule.openTaskDetailModal('${task.id}')"
                      class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    ${isManager && task.status === 'PENDING_APPROVAL' ? `
                      <button
                        onclick="TasksModule.managerQuickReview('${task.id}', 'COMPLETED')"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                      >
                        Duyệt
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
              ${tasks.length === 0 ? `
                <tr>
                  <td colspan="9" class="py-12 text-center text-slate-400 font-semibold">
                    Không có nhiệm vụ nào được giao trong Tháng ${mStr}/${yStr}.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderKanbanTab(tasks) {
    const columns = [
      { id: 'NOT_STARTED', title: window.t('tm_st_not_started'), border: 'border-t-slate-400' },
      { id: 'IN_PROGRESS', title: window.t('tm_st_in_progress'), border: 'border-t-blue-500' },
      { id: 'PENDING_APPROVAL', title: window.t('tm_st_pending'), border: 'border-t-amber-500' },
      { id: 'REVISION_REQUIRED', title: window.t('tm_st_revision'), border: 'border-t-purple-500' },
      { id: 'COMPLETED', title: window.t('tm_st_completed'), border: 'border-t-emerald-500' }
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => (t.status || 'NOT_STARTED') === col.id);
          return `
            <div
              ondragover="event.preventDefault()"
              ondrop="TasksModule.handleDropOnColumn(event, '${col.id}')"
              class="card-3d p-3.5 border-t-4 ${col.border} flex flex-col justify-between min-h-[420px] bg-slate-50/70 dark:bg-slate-900/60"
            >
              <div>
                <div class="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <span class="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">${col.title}</span>
                  <span class="px-2 py-0.5 rounded-full bg-white border text-xs font-mono font-black text-[#F26522]">${colTasks.length}</span>
                </div>

                <div class="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                  ${colTasks.map(t => `
                    <div
                      draggable="true"
                      ondragstart="TasksModule.handleDragStart(event, '${t.id}')"
                      onclick="TasksModule.openTaskDetailModal('${t.id}')"
                      class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#F26522] transition cursor-grab active:cursor-grabbing space-y-2 text-xs"
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-[10px] font-black text-blue-600 truncate max-w-[110px]">${t.dvn || t.id}</span>
                        ${this.renderPriorityBadge(t.priority)}
                      </div>
                      <div class="font-bold text-slate-900 dark:text-white leading-snug">${t.title}</div>
                      <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span class="font-bold text-orange-600 truncate">${t.assignee}</span>
                        <span class="font-mono ${this.isTaskOverdue(t) ? 'text-rose-600 font-black' : 'text-slate-400'}">${t.deadline || ''}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="pt-2 text-center text-[10px] text-slate-400 font-medium">Kéo thả thẻ để đổi trạng thái</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
});