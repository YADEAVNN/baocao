// core/store.js
window.AppStore = {
  // Tiêu chí phân loại cửa hàng thực tế theo Sản lượng S.O (Xe/tháng) & Tăng trưởng
  soThresholds: {
    goodMinSO: 35,      // >= 35 xe/tháng -> Tốt
    fastGrowthSO: 25,   // >= 25 xe + tăng trưởng >= 20% -> Tốt
    avgMinSO: 15        // 15 - 34 xe/tháng -> Trung bình, < 15 xe -> Yếu
  },

  // Dữ liệu S.O 12 tháng khởi tạo
  monthlySO12: [
    { month: 'T10/25', value: 0 },
    { month: 'T11/25', value: 0 },
    { month: 'T12/25', value: 0 },
    { month: 'T01/26', value: 0 },
    { month: 'T02/26', value: 0 },
    { month: 'T03/26', value: 0 },
    { month: 'T04/26', value: 0 },
    { month: 'T05/26', value: 0 },
    { month: 'T06/26', value: 0 },
    { month: 'T07/26', value: 0 },
    { month: 'T08/26', value: 0 },
    { month: 'T09/26', value: 0 }
  ],

  shops: JSON.parse(localStorage.getItem('yadea_real_shops') || '[]'),
  tasks: JSON.parse(localStorage.getItem('yadea_real_tasks') || '[]'),
  kpis: JSON.parse(localStorage.getItem('yadea_real_kpis') || '[]'),
  importHistory: JSON.parse(localStorage.getItem('yadea_real_imports') || '[]'),

  saveToStorage() {
    localStorage.setItem('yadea_real_shops', JSON.stringify(this.shops));
    localStorage.setItem('yadea_real_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('yadea_real_kpis', JSON.stringify(this.kpis));
    localStorage.setItem('yadea_real_imports', JSON.stringify(this.importHistory));
  },

  // Phân loại cửa hàng trực tiếp từ Sản lượng S.O và % Tăng trưởng (Không dùng điểm ảo)
  // Quy tắc 3: Không coi dữ liệu thiếu (null) là 0 và không tự ý xếp vào nhóm Yếu
  evaluateShop(shop) {
    if (shop.currentSO === null || shop.currentSO === undefined || !shop.hasFullData) {
      return {
        grade: 'NODATA',
        label: window.t ? window.t('grade_nodata') : 'Chưa đủ dữ liệu',
        reason: 'Chưa có số S.O tháng này',
        color: 'bg-slate-100 text-slate-600 border-slate-300'
      };
    }

    const so = Number(shop.currentSO);
    const yoy = shop.yoy !== null && shop.yoy !== undefined ? Number(shop.yoy) : null;
    const mom = shop.mom !== null && shop.mom !== undefined ? Number(shop.mom) : null;

    // 1. Nhóm TỐT: S.O >= 35 xe (không tụt sâu quá -15% YoY) HOẶC S.O >= 25 xe đang tăng trưởng mạnh >= +20%
    const isHighVolume = so >= 35 && (yoy === null || yoy >= -15);
    const isFastRising = so >= 25 && ((yoy !== null && yoy >= 20) || (mom !== null && mom >= 20));

    if (isHighVolume || isFastRising) {
      return {
        grade: 'GOOD',
        label: window.t ? window.t('grade_good') : 'Tốt',
        reason: so >= 35 ? `S.O cao (${so} xe)` : `Tăng trưởng mạnh (${so} xe)`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-300'
      };
    }

    // 2. Nhóm TRUNG BÌNH: S.O từ 15 -> 34 xe HOẶC S.O >= 35 xe nhưng suy giảm mạnh YoY < -15%
    if (so >= 15) {
      return {
        grade: 'AVG',
        label: window.t ? window.t('grade_avg') : 'Trung bình',
        reason: so >= 35 ? `S.O ${so} xe (Giảm YoY ${yoy}%)` : `S.O duy trì (${so} xe)`,
        color: 'bg-amber-50 text-amber-700 border-amber-300'
      };
    }

    // 3. Nhóm YẾU (Cần hỗ trợ): S.O < 15 xe/tháng
    return {
      grade: 'WEAK',
      label: window.t ? window.t('grade_weak') : 'Yếu',
      reason: `S.O thấp (${so} xe < 15 xe)`,
      color: 'bg-rose-50 text-rose-700 border-rose-300'
    };
  }
};