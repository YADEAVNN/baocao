// modules/accounts.module.js
window.AccountsModule = {
  searchQuery: '',
  roleFilter: 'ALL',
  statusFilter: 'ALL',

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
  },

  async refreshAccounts() {
    await window.SupabaseService.fetchAllProfiles();
    window.App.renderCurrentModule();
  },

  async toggleAccountStatus(email, currentStatus) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    await window.SupabaseService.updateProfileOnSupabase(email, { status: nextStatus });
    await this.refreshAccounts();
  },

  async resetUserPassword(email, fullName) {
    const newPass = prompt(`Nhập mật khẩu mới cho tài khoản [${fullName} - ${email}]:`, '123456');
    if (!newPass || !newPass.trim()) return;
    await window.SupabaseService.updateProfileOnSupabase(email, { password: newPass.trim() });
    alert(`Đã cập nhật mật khẩu mới cho ${email}!`);
    await this.refreshAccounts();
  },

  openEditUserModal(email) {
    const users = window.SupabaseService.getLocalProfiles();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;

    document.getElementById('modal-title').innerText = `Phân quyền & Khu vực: ${user.fullName}`;
    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Họ và Tên / Mã DVN</label>
          <input id="edit-user-name" type="text" value="${user.fullName}" class="w-full p-2.5 rounded-xl border font-bold" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Vai trò truy cập</label>
          <select id="edit-user-role" class="w-full p-2.5 rounded-xl border font-bold">
            <option value="SALE" ${user.role === 'SALE' ? 'selected' : ''}>Sale (Nhân viên Kinh doanh)</option>
            <option value="SUPERVISOR" ${user.role === 'SUPERVISOR' ? 'selected' : ''}>Giám sát (Supervisor)</option>
            <option value="REGIONAL_DIRECTOR" ${user.role === 'REGIONAL_DIRECTOR' ? 'selected' : ''}>Giám Đốc Khu vực</option>
            <option value="SHOP" ${user.role === 'SHOP' ? 'selected' : ''}>Cửa hàng (Shop DVN)</option>
            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin (Toàn quốc)</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Khu vực quản lý (Auto Filter)</label>
          <select id="edit-user-region" class="w-full p-2.5 rounded-xl border font-bold">
            <option value="ALL" ${user.assignedRegion === 'ALL' ? 'selected' : ''}>Toàn quốc (ALL)</option>
            <option value="SOUTH" ${user.assignedRegion === 'SOUTH' ? 'selected' : ''}>Miền Nam</option>
            <option value="NORTH" ${user.assignedRegion === 'NORTH' ? 'selected' : ''}>Miền Bắc</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Trạng thái duyệt</label>
          <select id="edit-user-status" class="w-full p-2.5 rounded-xl border font-bold">
            <option value="ACTIVE" ${user.status === 'ACTIVE' ? 'selected' : ''}>HOẠT ĐỘNG (Đã duyệt)</option>
            <option value="PENDING" ${user.status === 'PENDING' ? 'selected' : ''}>CHỜ DUYỆT (Chặn đăng nhập)</option>
            <option value="LOCKED" ${user.status === 'LOCKED' ? 'selected' : ''}>ĐÃ KHÓA</option>
          </select>
        </div>
        <div class="pt-2 flex justify-end gap-2">
          <button onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold">Hủy</button>
          <button onclick="AccountsModule.saveUserEdits('${user.email}')" class="btn-3d-orange px-5 py-2 rounded-xl font-bold">Lưu Thay Đổi</button>
        </div>
      </div>
    `;
    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async saveUserEdits(email) {
    const fullName = document.getElementById('edit-user-name').value.trim();
    const role = document.getElementById('edit-user-role').value;
    const assignedRegion = role === 'ADMIN' ? 'ALL' : document.getElementById('edit-user-region').value;
    const status = document.getElementById('edit-user-status').value;

    await window.SupabaseService.updateProfileOnSupabase(email, {
      fullName,
      role,
      assignedRegion,
      status
    });
    window.App.closeModal();
    await this.refreshAccounts();
  },

  async removeAccount(email) {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản [${email}] khỏi hệ thống và Supabase?`)) return;
    try {
      await window.SupabaseService.deleteProfileOnSupabase(email);
      await this.refreshAccounts();
    } catch (err) {
      alert(err.message);
    }
  },

  render() {
    const allUsers = window.SupabaseService.getLocalProfiles();
    const q = this.searchQuery.trim().toLowerCase();

    const filtered = allUsers.filter(u => {
      const matchQuery = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = this.roleFilter === 'ALL' || u.role === this.roleFilter;
      const matchStatus = this.statusFilter === 'ALL' || u.status === this.statusFilter;
      return matchQuery && matchRole && matchStatus;
    });

    const roleBadgeMap = {
      'ADMIN': '<span class="px-3 py-1 rounded-lg bg-slate-900 text-amber-400 font-extrabold text-xs">Admin</span>',
      'REGIONAL_DIRECTOR': '<span class="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">Giám Đốc</span>',
      'SUPERVISOR': '<span class="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs border border-indigo-100">Giám sát</span>',
      'SALE': '<span class="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">Sale</span>',
      'SHOP': '<span class="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">Cửa hàng</span>'
    };

    const regionBadgeMap = {
      'ALL': '<span class="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-extrabold text-xs">Toàn quốc</span>',
      'NORTH': '<span class="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-extrabold text-xs">Miền Bắc</span>',
      'CENTRAL': '<span class="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-extrabold text-xs">Miền Trung</span>',
      'SOUTH': '<span class="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-extrabold text-xs">Miền Nam</span>'
    };

    const statusBadgeMap = {
      'ACTIVE': '<span class="px-3 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-[11px] uppercase tracking-wider">HOẠT ĐỘNG</span>',
      'PENDING': '<span class="px-3 py-1 rounded-md bg-amber-100 text-amber-700 font-extrabold text-[11px] uppercase tracking-wider animate-pulse">CHỜ DUYỆT</span>',
      'LOCKED': '<span class="px-3 py-1 rounded-md bg-rose-50 text-rose-600 font-extrabold text-[11px] uppercase tracking-wider">ĐÃ KHÓA</span>'
    };

    return `
      <div class="card-3d p-5 flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">DUYỆT TÀI KHOẢN</h2>

        <div class="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value="${this.searchQuery}"
            oninput="AccountsModule.setFilter('searchQuery', this.value)"
            placeholder="Tìm theo tên hoặc email nhân sự.."
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold w-64 focus:outline-none focus:border-[#F26522]"
          />

          <select
            onchange="AccountsModule.setFilter('roleFilter', this.value)"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL" ${this.roleFilter === 'ALL' ? 'selected' : ''}>-- Tất cả vai trò --</option>
            <option value="ADMIN" ${this.roleFilter === 'ADMIN' ? 'selected' : ''}>Admin (Toàn quốc)</option>
            <option value="REGIONAL_DIRECTOR" ${this.roleFilter === 'REGIONAL_DIRECTOR' ? 'selected' : ''}>Giám Đốc Khu vực</option>
            <option value="SUPERVISOR" ${this.roleFilter === 'SUPERVISOR' ? 'selected' : ''}>Giám sát</option>
            <option value="SALE" ${this.roleFilter === 'SALE' ? 'selected' : ''}>Sale</option>
            <option value="SHOP" ${this.roleFilter === 'SHOP' ? 'selected' : ''}>Cửa hàng</option>
          </select>

          <select
            onchange="AccountsModule.setFilter('statusFilter', this.value)"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>-- Tất cả trạng thái --</option>
            <option value="PENDING" ${this.statusFilter === 'PENDING' ? 'selected' : ''}>CHỜ DUYỆT</option>
            <option value="ACTIVE" ${this.statusFilter === 'ACTIVE' ? 'selected' : ''}>HOẠT ĐỘNG</option>
            <option value="LOCKED" ${this.statusFilter === 'LOCKED' ? 'selected' : ''}>ĐÃ KHÓA</option>
          </select>

          <button
            onclick="AccountsModule.refreshAccounts()"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-extrabold flex items-center gap-2 transition"
          >
            <i class="fa-solid fa-rotate"></i>
            <span>LÀM MỚI</span>
          </button>
        </div>
      </div>

      <div class="card-3d overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b">
              <th class="py-4 px-6">NHÂN SỰ</th>
              <th class="py-4 px-6 text-center">KHU VỰC (AUTO)</th>
              <th class="py-4 px-6 text-center">VAI TRÒ</th>
              <th class="py-4 px-6 text-center">TRẠNG THÁI</th>
              <th class="py-4 px-6 text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            ${filtered.map(u => {
              const isDvnShop = String(u.fullName).toUpperCase().startsWith('DVN');
              return `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td class="py-4 px-6">
                    <div class="font-extrabold text-slate-900 dark:text-white text-sm">${u.fullName}</div>
                    ${isDvnShop || u.shopName ? `
                      <div class="text-xs font-extrabold text-blue-600 flex items-center gap-1.5 mt-0.5">
                        <i class="fa-solid fa-store text-[11px]"></i>
                        <span>${u.shopName || 'YADEA SHOP CHÍNH HÃNG'}</span>
                      </div>
                    ` : ''}
                    <div class="text-xs text-slate-500 mt-0.5">${u.email}</div>
                  </td>
                  <td class="py-4 px-6 text-center">
                    ${regionBadgeMap[u.assignedRegion] || `<span class="text-xs italic text-slate-400">Chưa gán shop</span>`}
                  </td>
                  <td class="py-4 px-6 text-center">${roleBadgeMap[u.role] || u.role}</td>
                  <td class="py-4 px-6 text-center">${statusBadgeMap[u.status] || statusBadgeMap['PENDING']}</td>
                  <td class="py-4 px-6 text-center">
                    <div class="flex items-center justify-center gap-3.5">
                      ${u.status === 'PENDING' ? `
                        <button
                          onclick="AccountsModule.toggleAccountStatus('${u.email}', 'PENDING')"
                          class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                        >
                          <i class="fa-solid fa-check mr-1"></i> Duyệt ngay
                        </button>
                      ` : ''}
                      <button onclick="AccountsModule.openEditUserModal('${u.email}')" class="text-blue-600 hover:scale-110 transition">
                        <i class="fa-regular fa-pen-to-square text-base"></i>
                      </button>
                      <button onclick="AccountsModule.resetUserPassword('${u.email}', '${u.fullName}')" class="text-purple-600 hover:scale-110 transition">
                        <i class="fa-solid fa-key text-base"></i>
                      </button>
                      <button onclick="AccountsModule.toggleAccountStatus('${u.email}', '${u.status}')" class="${u.status === 'ACTIVE' ? 'text-orange-500' : 'text-emerald-600'} hover:scale-110 transition">
                        <i class="fa-solid ${u.status === 'ACTIVE' ? 'fa-lock' : 'fa-lock-open'} text-base"></i>
                      </button>
                      <button onclick="AccountsModule.removeAccount('${u.email}')" class="text-rose-500 hover:scale-110 transition">
                        <i class="fa-solid fa-trash-can text-base"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// Bộ điều hướng tương thích ngược cho window.OperationsModule
window.OperationsModule = {
  render(moduleId) {
    if (moduleId === 'accounts') {
      return window.AccountsModule.render();
    }
    if (moduleId === 'evidence') {
      return window.EfficiencyModule.render();
    }
    return `
      <div class="card-3d p-5 space-y-3">
        <h3 class="font-bold text-base text-[#172033]">Module Quản trị Hệ thống (${String(moduleId).toUpperCase()})</h3>
        <p class="text-xs text-[#667085]">Module đang hoạt động và kết nối trực tiếp với cơ sở dữ liệu Supabase.</p>
      </div>
    `;
  }
};