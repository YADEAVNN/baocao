// app.js
window.AppState = {
  isAuthenticated: false,
  lang: 'vi',
  role: 'SALE',
  assignedRegion: 'SOUTH',
  activeModule: 'dashboard',
  month: '2026-09',
  region: 'SOUTH',
  sidebarCollapsed: false,
  userName: '',
  userEmail: '',
  expandedGroups: {
    'MAIN': true,
    'KPI': false,
    'DATA': false,
    'ADMIN': true
  }
};

window.App = {
  RoleLabels: {
    'ADMIN': 'Admin (Toàn quốc)',
    'REGIONAL_DIRECTOR': 'Giám đốc Khu vực',
    'SUPERVISOR': 'Giám sát Bán lẻ',
    'SALE': 'Nhân viên Kinh doanh'
  },

  RegionLabels: {
    'ALL': 'Toàn bộ Shop (Toàn quốc)',
    'NORTH': 'Khu vực Miền Bắc',
    'CENTRAL': 'Khu vực Miền Trung',
    'SOUTH': 'Khu vực Miền Nam'
  },

  async init() {
    if (window.SupabaseService) {
      window.SupabaseService.init();
    }

    // Đồng bộ ngay danh sách Shop thực tế từ LocalStorage / Supabase vào AppStore khi khởi động
    if (window.AdminShopsModule) {
      const initialShops = window.AdminShopsModule.getList();
      window.AdminShopsModule.syncToGlobalAppStore(initialShops);
      window.AdminShopsModule.fetchFromSupabaseIfNeeded();
    }

    const savedSession = localStorage.getItem('yadea_active_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        this.applyAuthenticatedUser(user);
        await window.SupabaseService.syncAllData();
        this.populateHeaderAdvancedFilters();
        this.renderCurrentModule();
      } catch (e) {
        this.openLoginModal('LOGIN');
      }
    } else {
      this.openLoginModal('LOGIN');
    }
    this.translateStaticDOM();
  },

  applyAuthenticatedUser(user) {
    AppState.isAuthenticated = true;
    AppState.userName = user.fullName;
    AppState.userEmail = user.email;
    AppState.role = user.role;
    AppState.assignedRegion = user.role === 'ADMIN' ? 'ALL' : user.assignedRegion;
    AppState.region = AppState.assignedRegion;

    this.applyRoleAndRegionLock();
    this.populateHeaderAdvancedFilters();
    
    const currentNav = window.NavigationConfig.find(n => n.id === AppState.activeModule);
    if (currentNav) {
      AppState.expandedGroups[currentNav.group] = true;
    }

    this.renderSidebar();
    this.renderCurrentModule();
    this.closeLoginModal();
  },

  logout() {
    localStorage.removeItem('yadea_active_session');
    AppState.isAuthenticated = false;
    const pwdInput = document.getElementById('loginPassword');
    if (pwdInput) pwdInput.value = '';
    this.openLoginModal('LOGIN');
  },

  switchAuthMode(mode) {
    const loginBox = document.getElementById('loginFormContainer');
    const regBox = document.getElementById('registerFormContainer');
    const alertBox = document.getElementById('authAlertBox');
    if (alertBox) alertBox.classList.add('hidden');

    if (mode === 'REGISTER') {
      loginBox.classList.add('hidden');
      regBox.classList.remove('hidden');
      this.toggleRegisterRegionField();
    } else {
      regBox.classList.add('hidden');
      loginBox.classList.remove('hidden');
    }
  },

  togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.className = 'fa-solid fa-eye-slash text-sm text-orange-500';
    } else {
      input.type = 'password';
      if (icon) icon.className = 'fa-solid fa-eye text-sm';
    }
  },

  toggleRegisterRegionField() {
    const roleVal = document.getElementById('regRole')?.value;
    const regionWrap = document.getElementById('regRegionWrapper');
    if (!regionWrap) return;
    if (roleVal === 'ADMIN') {
      regionWrap.classList.add('hidden');
    } else {
      regionWrap.classList.remove('hidden');
    }
  },

  showAuthMessage(msg, isError = false) {
    const box = document.getElementById('authAlertBox');
    if (!box) return;
    box.classList.remove('hidden');
    box.className = `mb-4 p-3 rounded-xl text-xs font-bold border ${
      isError
        ? 'bg-rose-50 text-rose-700 border-rose-300'
        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
    }`;
    box.innerText = msg;
  },

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value.trim();
    const role = document.getElementById('regRole').value;
    const assignedRegion = role === 'ADMIN' ? 'ALL' : document.getElementById('regRegion').value;
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
      await window.SupabaseService.signUp({ fullName, email, password, role, assignedRegion });
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = '';
      this.switchAuthMode('LOGIN');
      this.showAuthMessage(`Đăng ký thành công! Tài khoản "${fullName}" đã được lưu. Vui lòng đợi Admin phê duyệt!`);
    } catch (err) {
      this.showAuthMessage(err.message || 'Lỗi đăng ký!', true);
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const user = await window.SupabaseService.signIn(email, password);
      localStorage.setItem('yadea_active_session', JSON.stringify(user));
      this.applyAuthenticatedUser(user);
    } catch (err) {
      this.showAuthMessage(err.message || 'Đăng nhập thất bại!', true);
    }
  },

  applyRoleAndRegionLock() {
    const regionFilter = document.getElementById('filter-region');
    const roleBadge = document.getElementById('header-role-badge');
    if (roleBadge) roleBadge.innerText = `${this.RoleLabels[AppState.role]}`;

    if (AppState.role === 'ADMIN') {
      if (regionFilter) {
        regionFilter.disabled = false;
        regionFilter.value = AppState.region;
      }
    } else {
      AppState.region = AppState.assignedRegion;
      if (regionFilter) {
        regionFilter.value = AppState.assignedRegion;
        regionFilter.disabled = true;
      }
    }

    // Rút gọn tinh tế phần hiển thị góc trái Sidebar
    const shortRole = {
      'ADMIN': 'Admin',
      'REGIONAL_DIRECTOR': 'GĐ Khu vực',
      'SUPERVISOR': 'Giám sát',
      'SALE': 'NVKD'
    };
    const shortRegion = {
      'ALL': 'Toàn quốc',
      'NORTH': 'Miền Bắc',
      'CENTRAL': 'Miền Trung',
      'SOUTH': 'Miền Nam'
    };

    const nameEl = document.getElementById('sidebar-user-name');
    const scopeEl = document.getElementById('sidebar-user-scope');
    const cleanName = (AppState.userName || 'Người dùng').replace(/\s*\(Admin\)/i, '');

    if (nameEl) nameEl.innerText = cleanName;
    if (scopeEl) {
      scopeEl.innerText = `${shortRole[AppState.role] || AppState.role} • ${shortRegion[AppState.region] || AppState.region}`;
    }
  },

  // Xử lý khi người dùng chọn Tháng hoặc Năm trên thanh công cụ Header
  updatePeriodFilter() {
    const m = document.getElementById('filter-month-num')?.value || '09';
    const y = document.getElementById('filter-year-num')?.value || '2026';
    AppState.month = `${y}-${m}`;

    // Nếu đang ở trang Admin Shops (Tab Nhập S.O), đồng bộ luôn kỳ nhập
    if (window.AdminShopsModule) {
      window.AdminShopsModule.selectedYear = Number(y);
      window.AdminShopsModule.selectedMonth = Number(m);
    }

    this.renderCurrentModule();
  },

  updateFilter(key, val) {
    if (key === 'region' && AppState.role !== 'ADMIN') {
      val = AppState.assignedRegion;
    }
    AppState[key] = val;
    this.populateHeaderAdvancedFilters();
    this.renderCurrentModule();
  },

  // Tự động đổ danh sách Tỉnh/thành, Giám sát, Sale thật vào Hàng 2 của Bộ lọc Header
  populateHeaderAdvancedFilters() {
    if (!window.AdminShopsModule) return;
    const allShops = window.AdminShopsModule.getList();
    const region = AppState.region;

    const regionShops = allShops.filter(s => {
      if (region === 'ALL') return true;
      const enumR = window.AdminShopsModule.mapRegionEnum(s.mien, s.region);
      return enumR === region;
    });

    const provinces = [...new Set(regionShops.map(s => s.province).filter(Boolean))].sort();
    const supervisors = [...new Set(regionShops.map(s => s.supervisor || s.gdMien).filter(Boolean))].sort();
    const sales = [...new Set(regionShops.map(s => s.sale).filter(Boolean))].sort();

    const provEl = document.getElementById('adv-filter-province');
    const supEl = document.getElementById('adv-filter-supervisor');
    const saleEl = document.getElementById('adv-filter-sale');

    if (provEl) {
      provEl.innerHTML = `<option value="ALL">-- Tỉnh / thành (${provinces.length}) --</option>` +
        provinces.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    if (supEl) {
      supEl.innerHTML = `<option value="ALL">-- Giám sát (${supervisors.length}) --</option>` +
        supervisors.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    if (saleEl) {
      saleEl.innerHTML = `<option value="ALL">-- Sale phụ trách (${sales.length}) --</option>` +
        sales.map(sl => `<option value="${sl}">${sl}</option>`).join('');
    }
  },

  // Khi người dùng chọn lọc nâng cao trên Header -> Mở bảng tra cứu Shop tương ứng
  applyQuickAdvancedFilter(type, val) {
    if (!window.DashboardModule) return;
    window.DashboardModule.openGradeDrilldownModal(
      type === 'grade' ? val : window.DashboardModule.gradeModalState.grade
    );
    if (type === 'supervisor') {
      window.DashboardModule.updateGradeModalFilter('supervisor', val);
    } else if (type === 'sale') {
      window.DashboardModule.updateGradeModalFilter('sale', val);
    } else if (type === 'province' || type === 'search') {
      window.DashboardModule.updateGradeModalFilter('search', val === 'ALL' ? '' : val);
    }
  },

  resetQuickAdvancedFilter() {
    ['adv-filter-province', 'adv-filter-supervisor', 'adv-filter-sale', 'adv-filter-grade'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 'ALL';
    });
    const searchEl = document.getElementById('adv-filter-search');
    if (searchEl) searchEl.value = '';
    this.closeModal();
  },

  toggleSidebar() {
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
    const sb = document.getElementById('sidebar');
    const brandText = document.getElementById('brand-text');
    sb.classList.toggle('w-72', !AppState.sidebarCollapsed);
    sb.classList.toggle('w-20', AppState.sidebarCollapsed);
    if (brandText) brandText.classList.toggle('hidden', AppState.sidebarCollapsed);
    document.querySelectorAll('.sidebar-hideable').forEach(el => {
      el.classList.toggle('hidden', AppState.sidebarCollapsed);
    });
    this.renderSidebar();
  },

  toggleGroup(groupId) {
    if (AppState.sidebarCollapsed) {
      this.toggleSidebar(); 
    }
    AppState.expandedGroups[groupId] = !AppState.expandedGroups[groupId];
    this.renderSidebar();
  },

  toggleDarkMode() {
    const htmlEl = document.documentElement;
    const iconEl = document.getElementById('themeIcon');
    htmlEl.classList.toggle('dark');
    if (iconEl) {
      iconEl.className = htmlEl.classList.contains('dark')
        ? 'fa-solid fa-sun text-xs text-amber-300'
        : 'fa-solid fa-moon text-xs';
    }
  },

  toggleAdvancedFilters() {
    const filterPanel = document.getElementById('advanced-filters');
    const chevronIcon = document.getElementById('filter-chevron');
    this.populateHeaderAdvancedFilters();
    
    if (filterPanel.classList.contains('hidden')) {
      filterPanel.classList.remove('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(180deg)';
    } else {
      filterPanel.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
    }
  },

  openLoginModal(defaultMode = 'LOGIN') {
    this.switchAuthMode(defaultMode);
    const modal = document.getElementById('loginModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeLoginModal() {
    if (!AppState.isAuthenticated) return;
    const modal = document.getElementById('loginModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  toggleLang() {
    AppState.lang = AppState.lang === 'vi' ? 'zh' : 'vi';
    const lbl = document.getElementById('lang-label');
    const lblModal = document.getElementById('lang-label-modal');
    const text = AppState.lang === 'vi' ? 'VN' : '中文';
    if (lbl) lbl.innerText = text;
    if (lblModal) lblModal.innerText = text;
    this.translateStaticDOM();
    this.renderSidebar();
    this.renderCurrentModule();
  },

  navigate(moduleId) {
    const navItem = window.NavigationConfig.find(n => n.id === moduleId);
    const allowed = navItem?.roles.includes(AppState.role);
    if (!allowed) return;
    
    AppState.activeModule = moduleId;
    AppState.expandedGroups[navItem.group] = true;
    
    this.renderSidebar();
    this.renderCurrentModule();
  },

  closeModal() {
    const modal = document.getElementById('global-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  translateStaticDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(window.t) el.innerText = window.t(key);
    });
  },

  init3DTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / (rect.height / 2)) * 4;
        const rotateY = (x / (rect.width / 2)) * 4;
        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  },

  renderSidebar() {
    const navEl = document.getElementById('sidebar-nav');
    const role = AppState.role;
    const allowedItems = window.NavigationConfig.filter(item => item.roles.includes(role));
    
    let sidebarHTML = '';
    let globalIndex = 1;
    
    window.NavigationGroups.forEach(group => {
      const itemsInGroup = allowedItems.filter(item => item.group === group.id);
      
      if (itemsInGroup.length > 0) {
        const isExpanded = AppState.expandedGroups[group.id];
        const hasActiveItem = itemsInGroup.some(item => item.id === AppState.activeModule);
        
        sidebarHTML += `
          <div class="mt-4 mb-2 px-2 ${AppState.sidebarCollapsed ? 'hidden' : ''}">
            <button onclick="App.toggleGroup('${group.id}')" 
                    class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 border-t border-slate-600 shadow-[0_4px_0_#020617] active:translate-y-1 active:shadow-[0_0px_0_#020617] transition-all group cursor-pointer">
              <span class="text-xs font-black uppercase tracking-wider ${hasActiveItem ? 'text-[#F26522]' : 'text-white'} group-hover:text-[#F26522] transition-colors">
                ${group.title}
              </span>
              <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4 ${hasActiveItem ? 'text-[#F26522]' : 'text-slate-400'} group-hover:text-[#F26522]"></i>
            </button>
          </div>
        `;
        
        if (isExpanded || AppState.sidebarCollapsed) {
          sidebarHTML += `<div class="space-y-1 mb-2 px-2">`;
          sidebarHTML += itemsInGroup.map(item => {
            const isActive = item.id === AppState.activeModule;
            let rawLabel = (window.t && window.I18N) ? window.t(item.i18nKey) : item.i18nKey;
            rawLabel = rawLabel.replace(/^\d+\.\s*/, ''); 
            const menuLabel = `${globalIndex}. ${rawLabel}`;
            globalIndex++;

            return `
              <button onclick="App.navigate('${item.id}')" class="nav-item-3d w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-gray-300 cursor-pointer ${isActive ? 'active' : ''}">
                <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0 ${isActive ? 'text-[#F26522]' : 'text-gray-400'}"></i>
                <span class="${AppState.sidebarCollapsed ? 'hidden' : 'truncate'}">${menuLabel}</span>
              </button>
            `;
          }).join('');
          sidebarHTML += `</div>`;
        }
      }
    });

    navEl.innerHTML = sidebarHTML;
    if (window.lucide) window.lucide.createIcons();
  },

  renderCurrentModule() {
    const viewport = document.getElementById('app-viewport');
    const currentNav = window.NavigationConfig.find(n => n.id === AppState.activeModule);
    
    let navLabel = '';
    if (currentNav) {
      const allowedItems = window.NavigationConfig.filter(item => item.roles.includes(AppState.role));
      const navIndex = allowedItems.findIndex(item => item.id === AppState.activeModule) + 1;
      let rawLabel = (window.t && window.I18N) ? window.t(currentNav.i18nKey) : currentNav.i18nKey;
      rawLabel = rawLabel.replace(/^\d+\.\s*/, '');
      navLabel = `${navIndex}. ${rawLabel}`;
    }

    document.getElementById('header-breadcrumb').innerHTML = `
      <span class="text-slate-400">YADEA</span>
      <span class="text-slate-300">/</span>
      <span class="text-slate-900 dark:text-white font-extrabold">${navLabel}</span>
      <span class="ml-2 px-2.5 py-0.5 rounded-md bg-orange-500/10 text-[#F26522] text-[11px] font-bold">
        ${this.RegionLabels[AppState.region] || AppState.region}
      </span>
    `;

    switch (AppState.activeModule) {
      case 'dashboard':
        viewport.innerHTML = window.DashboardModule.render();
        break;
      case 'tasks':
        viewport.innerHTML = window.TasksModule.render();
        break;
      case 'kpi':
        viewport.innerHTML = window.KpiModule.render();
        break;
      case 'sellout':
        viewport.innerHTML = window.SelloutModule.render();
        break;
      case 'shops':
      case 'grading':
      case 'improvement':
        viewport.innerHTML = window.ShopsModule.render();
        break;
      case 'admin_shops':
        viewport.innerHTML = window.AdminShopsModule.render();
        break;
      default:
        viewport.innerHTML = window.OperationsModule.render(AppState.activeModule);
        break;
    }

    if (window.lucide) window.lucide.createIcons();
    this.init3DTiltCards();
  }
};

window.addEventListener('DOMContentLoaded', () => window.App.init());