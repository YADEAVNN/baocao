# SYSTEM MAP – YADEA RETAIL SUPERVISOR (MODULAR v2.0-PRO)

## 1. Lớp Giao diện & Tiện ích Lõi (`styles/`, `core/`, `data/`)
- Đổi màu sắc, chiều sâu 3D, cột biểu đồ 3D -> `styles/theme-3d.css`
- Sửa từ điển Việt / Trung toàn hệ thống -> `core/i18n.js`
- Sửa hàm nén ảnh, chuẩn hóa tên, nạp thư viện Excel -> `core/utils.js`
- Ẩn/hiện hoặc phân quyền Menu Sidebar -> `core/navigation.js`
- Sửa tiêu chí xếp loại Shop (Tốt >= 35 xe, TB 15-34 xe, Yếu < 15 xe) -> `core/store.js`
- Sửa kết nối Cloud & Auth Supabase -> `core/supabase.js`
- Sửa dữ liệu mẫu mặc định (Mock Shops & Default KPI Boards) -> `data/default_data.js`

## 2. Các Module Nghiệp vụ Đã Tách Nhỏ (`modules/`)
- **Mục 1. Tổng quan (`modules/dashboard/`):**
  - Giao diện chính, 10 thẻ KPI & biểu đồ 3D -> `modules/dashboard/dashboard.main.js`
  - Modal tra cứu danh sách Shop theo xếp loại (4 cấp lọc) -> `modules/dashboard/dashboard.drilldown.js`
- **Mục 2. Việc cần làm (`modules/tasks/`):**
  - Khung điều hướng 5 tab, lọc theo tháng, lưu Supabase -> `modules/tasks/tasks.main.js`
  - Tab 1 (Danh sách nhiệm vụ) & Tab 2 (Bảng kéo thả Kanban) -> `modules/tasks/tasks.list_kanban.js`
  - Tab 3 (Lập kế hoạch thị trường tuần theo Sale) -> `modules/tasks/tasks.market_plan.js`
  - Tab 4 (Nhật ký Check-in cửa hàng & Up ảnh thực địa) -> `modules/tasks/tasks.store_visit.js`
  - Tab 5 (Đề xuất giao việc hỗ trợ từ dữ liệu S.O yếu) -> `modules/tasks/tasks.so_proposal.js`
  - Modal Tạo nhiệm vụ mới & Modal Chi tiết / Phê duyệt -> `modules/tasks/tasks.modals.js`
- **Mục 3. Tiến độ KPI (`modules/kpi/`):**
  - Bảng tiến độ KPI, tính tổng tự động, gộp ô rowspan, sửa số trực tiếp -> `modules/kpi/kpi.main.js`
  - Upload Excel KPI (5 cột / 6 cột), dán ảnh Ctrl+V, xuất Excel -> `modules/kpi/kpi.importer.js`
- **Mục 4, 6, 7. Quản lý / Phân loại / Cải thiện Cửa hàng:** -> `modules/shops.module.js`
- **Mục 5. Hiệu quả Giám sát 360° (`evidence`):** -> `modules/efficiency.module.js`
- **Mục 6 (DATA). Phân tích Sell-out (`sellout`):** -> `modules/sellout.module.js`
- **Mục Admin 1. Duyệt & Phân quyền Tài khoản (`accounts`):** -> `modules/accounts.module.js`
- **Mục Admin 2. Quản trị Danh sách Shop & Nhập S.O (`modules/admin_shops/`):**
  - Tab 1: Danh sách Shop Master Data, sửa Shop, Import/Export tổng -> `modules/admin_shops/admin_shops.list.js`
  - Tab 2: Nhập liệu Sell-out theo từng Tháng/Năm & Excel mẫu tháng -> `modules/admin_shops/admin_shops.so_input.js`