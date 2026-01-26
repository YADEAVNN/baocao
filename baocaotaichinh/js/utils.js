// js/utils.js

// Format số tiền (VNĐ)
export const fmn = n => new Intl.NumberFormat('vi-VN').format(Math.round(n));

// Parse số từ input (Xóa dấu chấm/phẩy)
export const parseNumber = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseInt(val.replace(/\./g, "").replace(/,/g, "")) || 0;
};

// Safe value (tránh NaN)
export const safeVal = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseInt(v.replace(/[\.,]/g, '')) || 0;
    return 0;
};

// --- CÔNG THỨC TÍNH KPI CHÍNH (LOGIC GỐC) ---
export function calcKPI(r) {
    const rev = safeVal(r.actual_revenue) + safeVal(r.revenue_support);
    const cogs = safeVal(r.cost_goods);
    
    // Chi phí vận hành
    const op = safeVal(r.cost_op_depreciation_build) + safeVal(r.cost_op_depreciation_equip) + safeVal(r.cost_op_rent) + safeVal(r.cost_op_salary) + safeVal(r.cost_op_utility) + safeVal(r.cost_op_maintain) + safeVal(r.cost_op_interest);
    
    // Chi phí Logistic (Đã bao gồm hoa hồng/thưởng từ code cũ)
    const log = safeVal(r.cost_log_shipping) + safeVal(r.cost_log_pdi) + safeVal(r.cost_log_warranty) + safeVal(r.cost_log_warehouse_labor) + safeVal(r.cost_log_display_storage) + safeVal(r.cost_log_plate_support) + safeVal(r.cost_log_maintenance_free) + safeVal(r.cost_log_cskh) + safeVal(r.cost_log_commission) + safeVal(r.cost_log_kpi_bonus) + safeVal(r.cost_log_discount);
    
    // Chi phí MKT
    const mkt = safeVal(r.cost_op_ads_social) + safeVal(r.cost_op_offline_print) + safeVal(r.cost_op_promotion_gift) + safeVal(r.cost_op_event_store) + safeVal(r.cost_mkt_livestream) + safeVal(r.cost_mkt_kol_koc) + safeVal(r.cost_mkt_pr_branding) + safeVal(r.cost_mkt_roadshow) + safeVal(r.cost_mkt_testdrive) + safeVal(r.cost_mkt_school) + safeVal(r.cost_mkt_mobile_sales) + safeVal(r.cost_mkt_square) + safeVal(r.cost_mkt_opening) + safeVal(r.cost_mkt_other);
    
    const other = safeVal(r.cost_other_general);
    const totalExp = op + log + mkt + other + cogs;
    const net = rev - totalExp;

    return { rev, cogs, op, log, mkt, other, totalExp, net };
}
