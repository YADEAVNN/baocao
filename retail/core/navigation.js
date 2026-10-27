window.NavigationGroups = [
  { id: 'MAIN', title: 'TỔNG QUAN & CÔNG VIỆC' },
  { id: 'KPI', title: 'KPI THÁNG' },
  { id: 'DATA', title: 'SỐ LIỆU' },
  { id: 'ADMIN', title: 'GIAO DIỆN ADMIN' }
];

window.NavigationConfig = [
  // 1. Tổng quan & Công việc
  { id: 'dashboard', i18nKey: 'menu_dashboard', icon: 'layout-dashboard', group: 'MAIN', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  { id: 'tasks', i18nKey: 'menu_tasks', icon: 'check-square', group: 'MAIN', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  
  // 2. KPI Tháng
  { id: 'kpi', i18nKey: 'menu_kpi', icon: 'target', group: 'KPI', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  { id: 'shops', i18nKey: 'menu_shops', icon: 'store', group: 'KPI', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  { id: 'evidence', i18nKey: 'menu_evidence', icon: 'camera', group: 'KPI', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  
  // 3. Số Liệu
  { id: 'sellout', i18nKey: 'menu_sellout', icon: 'bar-chart-3', group: 'DATA', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  { id: 'grading', i18nKey: 'menu_grading', icon: 'award', group: 'DATA', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  { id: 'improvement', i18nKey: 'menu_improvement', icon: 'trending-up', group: 'DATA', roles: ['ADMIN', 'REGIONAL_DIRECTOR', 'SUPERVISOR', 'SALE'] },
  
  // 4. Giao diện Admin (Chỉ ADMIN)
  { id: 'accounts', i18nKey: 'menu_accounts', icon: 'user-check', group: 'ADMIN', roles: ['ADMIN'] },
  { id: 'admin_shops', i18nKey: 'Danh sách Shop', icon: 'database', group: 'ADMIN', roles: ['ADMIN'] }
];