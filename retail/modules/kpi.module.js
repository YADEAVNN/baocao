// modules/kpi.module.js
window.KpiModule = {
  activeBoardId: 'KPI-3824-OCT',
  searchQuery: '',
  supervisorFilter: 'ALL',
  subRegionFilter: 'ALL',
  onlyZeroFilter: false,
  isEditingInline: false,
  hasLoadedFromSupabase: false,

  // Nạp sẵn cả 2 Bảng KPI chuẩn (Bao gồm chính xác 100% file QUẢN LÝ CỬA HÀNG THÁNG 10.xlsx của bạn)
  defaultBoards: [
    {
      id: 'KPI-3824-OCT',
      title: 'TIẾN ĐỘ 3824 - QUẢN LÝ CỬA HÀNG THÁNG 10 (3824执行进度)',
      boardType: 'EXCEL_6COL',
      month: '2026-10',
      updatedAt: '27/10/2026 11:45',
      updatedBy: 'Admin',
      headers: [
        'Giám sát 督导人员',
        'Khu vực 负责区域',
        'Sales 销售人员',
        'Chỉ tiêu 3824 3824目标',
        'Hoàn thành 已完成',
        'Tỷ lệ hoàn thành 完成率'
      ],
      rows: [
        // 1. GIÁM SÁT: NINH VĂN TUẤN (MIỀN BẮC)
        { supervisor: 'NINH VĂN TUẤN', region: 'Tây Bắc 西北', name: 'Bùi Văn Vang 裴文向', total: 4, actual: 2, rate: 50, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Tây Bắc 西北', name: 'Phạm Xuân Huy', total: 5, actual: 6, rate: 120, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Tây Bắc 西北', name: 'Đào Xuân Cường 陶春强', total: 2, actual: 2, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Tây Bắc 西北', name: 'Khổng Văn Trọng 孔文重', total: 11, actual: 10, rate: 91, rowType: 'SUBTOTAL', mien: 'NORTH' },

        { supervisor: 'NINH VĂN TUẤN', region: 'Hà Nội 河内', name: 'Vũ Ngọc Tú 武玉秀', total: 4, actual: 2, rate: 50, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Hà Nội 河内', name: 'Đinh Đức Tiệp 丁德进', total: 4, actual: 5, rate: 125, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Hà Nội 河内', name: 'Ngô Đăng Tín 吴登信', total: 5, actual: 6, rate: 120, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Hà Nội 河内', name: 'Khuất Văn Đức 庆文德', total: 13, actual: 13, rate: 100, rowType: 'SUBTOTAL', mien: 'NORTH' },

        { supervisor: 'NINH VĂN TUẤN', region: 'Đông Bắc 东北', name: 'Bùi Tuấn Anh 裴俊英', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Đông Bắc 东北', name: 'Chu Tiến Nhật 朱进日', total: 3, actual: 6, rate: 200, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Đông Bắc 东北', name: 'Cao Tất Toàn 高泌全', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Đông Bắc 东北', name: 'Trịnh Trần Cường 郑陈强', total: 9, actual: 12, rate: 133, rowType: 'SUBTOTAL', mien: 'NORTH' },

        { supervisor: 'NINH VĂN TUẤN', region: 'Hồng Hà 红河', name: 'Đoàn Văn Quảng 团文广', total: 5, actual: 4, rate: 80, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Hồng Hà 红河', name: 'Nguyễn Tuấn Quân Vương 阮俊军王', total: 4, actual: 4, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'NINH VĂN TUẤN', region: 'Hồng Hà 红河', name: 'Đỗ Tuấn Minh 杜俊明', total: 9, actual: 8, rate: 89, rowType: 'SUBTOTAL', mien: 'NORTH' },

        // 2. GIÁM SÁT: HÀ TRẦN QUANG HIỆP
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Bắc Trung Bộ 北中部', name: 'Nguyễn Việt Tùng 阮越松', total: 4, actual: 4, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Bắc Trung Bộ 北中部', name: 'Hoàng Kim Anh 黄金英', total: 4, actual: 4, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Bắc Trung Bộ 北中部', name: 'Nguyễn Thế Tuyến 阮世线', total: 8, actual: 4, rate: 50, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Bắc Trung Bộ 北中部', name: 'Nông Đức Long 农德龙', total: 16, actual: 12, rate: 75, rowType: 'SUBTOTAL', mien: 'NORTH' },

        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Trung Trung Bộ 中中部', name: 'Nguyễn Công Huy 阮公辉', total: 5, actual: 4, rate: 80, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Trung Trung Bộ 中中部', name: 'Lê Minh Đức 黎明德', total: 2, actual: 2, rate: 100, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Trung Trung Bộ 中中部', name: 'Bùi Minh Trung 裴明中', total: 7, actual: 6, rate: 86, rowType: 'SUBTOTAL', mien: 'NORTH' },

        // TỔNG MIỀN BẮC (Khuất Văn Đức)
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Khuất Văn Đức 庆文德 (Tổng Miền Bắc)', name: 'Khuất Văn Đức 庆文德', total: 65, actual: 61, rate: 94, rowType: 'MIEN_TOTAL', mien: 'NORTH' },

        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Nam Trung Bộ 南中部', name: 'Võ Đức Nam 武德南', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Nam Trung Bộ 南中部', name: 'Phạm Quang Vũ 范光武', total: 5, actual: 5, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Nam Trung Bộ 南中部', name: 'Cấn Đình Nguyên 詹定原', total: 8, actual: 8, rate: 100, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Tây Nguyên 西原', name: 'Nguyễn Nhật Trường 阮日长', total: 3, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Tây Nguyên 西原', name: 'Lê Công An 黎公安', total: 9, actual: 7, rate: 78, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'HÀ TRẦN QUANG HIỆP', region: 'Tây Nguyên 西原', name: 'Lê Thế Duy 黎世维', total: 12, actual: 7, rate: 58, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        // 3. GIÁM SÁT: VŨ HUY THÀNH (MIỀN NAM)
        { supervisor: 'VŨ HUY THÀNH', region: 'Đông Nam 东南', name: 'Cao Văn Quân 高文军', total: 6, actual: 1, rate: 17, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Đông Nam 东南', name: 'Châu Sơn Tuyển 周山选', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Đông Nam 东南', name: 'Lê Đỗ Hoàng 黎杜黄', total: 5, actual: 5, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Đông Nam 东南', name: 'Nguyễn Văn Hùng 阮文雄', total: 14, actual: 9, rate: 64, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        { supervisor: 'VŨ HUY THÀNH', region: 'Hồ Chí Minh 胡志明', name: 'Đàm Xuân Trưởng 潭春长', total: 4, actual: 4, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Hồ Chí Minh 胡志明', name: 'Lê Tùng Đức 黎松德', total: 6, actual: 3, rate: 50, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Hồ Chí Minh 胡志明', name: 'Lưu Đức Tuấn 刘德俊', total: 5, actual: 4, rate: 80, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Hồ Chí Minh 胡志明', name: 'Trầm Hoàng Hớn 沉黄欣', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'VŨ HUY THÀNH', region: 'Hồ Chí Minh 胡志明', name: 'Nguyễn Thành Nam 阮成南', total: 18, actual: 14, rate: 78, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        // 4. GIÁM SÁT: NGUYỄN VĂN TIẾN (MIỀN NAM)
        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Tây Nam 西南', name: 'Đặng Đình Thục 邓庭属', total: 6, actual: 3, rate: 50, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Tây Nam 西南', name: 'Nguyễn Đức Tuấn 阮德俊', total: 5, actual: 2, rate: 40, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Tây Nam 西南', name: 'Trần Đức Cường 陈德强', total: 11, actual: 5, rate: 45, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Sông Cửu Long 九龙江', name: 'Phạm Bá Lâm 范柏林', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Sông Cửu Long 九龙江', name: 'Bùi Trung Tuấn 裴中俊', total: 2, actual: 2, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: 'NGUYỄN VĂN TIẾN', region: 'Sông Cửu Long 九龙江', name: 'Bùi Trung Tuấn 裴中俊', total: 5, actual: 5, rate: 100, rowType: 'SUBTOTAL', mien: 'SOUTH' },

        // TỔNG MIỀN NAM (Trần Phi Long) & TỔNG TOÀN QUỐC
        { supervisor: '', region: 'Trần Phi Long 陈飞龙 (Tổng Miền Nam)', name: 'Trần Phi Long 陈飞龙', total: 68, actual: 48, rate: 71, rowType: 'MIEN_TOTAL', mien: 'SOUTH' },
        { supervisor: 'TỔNG', region: 'TỔNG', name: 'TỔNG TOÀN QUỐC', total: 133, actual: 109, rate: 82, rowType: 'GRAND_TOTAL', mien: 'ALL' }
      ]
    },
    {
      id: 'KPI-DEFAULT-01',
      title: 'KPI KÍCH HOẠT CỬA HÀNG (已激活数量)',
      boardType: 'EXCEL_5COL',
      month: '2026-09',
      updatedAt: '27/10/2026 11:30',
      updatedBy: 'Admin',
      headers: [
        'Khu vực 区域',
        'Họ tên 姓名',
        'Tổng số cửa hàng 总数量',
        'Đã kích hoạt 已激活数量',
        'Tỷ lệ hoàn thành 完成率'
      ],
      rows: [
        { supervisor: '', region: 'Tây Bắc 西北', name: 'Bùi Văn Vang 裴文响', total: 3, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Tây Bắc 西北', name: 'Phạm Xuân Huy 范春辉', total: 4, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Tây Bắc 西北', name: 'Đào Xuân Cường 陶春强', total: 8, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Tây Bắc 西北', name: 'Khổng Văn Trọng 孔文重', total: 15, actual: 0, rate: 0, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Hà Nội 河内', name: 'Vũ Ngọc Tú 武玉秀', total: 3, actual: 1, rate: 33, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Hà Nội 河内', name: 'Đinh Đức Tiệp 丁德进', total: 5, actual: 1, rate: 20, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Hà Nội 河内', name: 'Ngô Đăng Tín 吴登信', total: 2, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Hà Nội 河内', name: 'Khuất Văn Đức 庆文德', total: 10, actual: 2, rate: 20, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Đông Bắc 东北', name: 'Bùi Tuấn Anh 裴俊英', total: 1, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Đông Bắc 东北', name: 'Chu Tiến Nhật 朱进日', total: 24, actual: 1, rate: 4, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Đông Bắc 东北', name: 'Cao Tất Toàn 高泌全', total: 9, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Đông Bắc 东北', name: 'Trịnh Trần Cường 郑陈强', total: 34, actual: 1, rate: 3, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Hồng Hà 红河', name: 'Đoàn Văn Quảng 团文广', total: 7, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Hồng Hà 红河', name: 'Nguyễn Tuấn Quân Vương 阮俊军王', total: 3, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Hồng Hà 红河', name: 'Đỗ Tuấn Minh 杜俊明', total: 10, actual: 0, rate: 0, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Bắc Trung Bộ 北中部', name: 'Nguyễn Việt Tùng 阮越松', total: 4, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Bắc Trung Bộ 北中部', name: 'Hoàng Kim Anh 黄金英', total: 5, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Bắc Trung Bộ 北中部', name: 'Nguyễn Thế Tuyến 阮世线', total: 3, actual: 2, rate: 67, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Bắc Trung Bộ 北中部', name: 'Nông Đức Long 农德龙', total: 12, actual: 2, rate: 17, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Trung Trung Bộ 中中部', name: 'Nguyễn Công Huy 阮公辉', total: 5, actual: 0, rate: 0, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Trung Trung Bộ 中中部', name: 'Lê Minh Đức 黎明德', total: 4, actual: 3, rate: 75, rowType: 'STAFF', mien: 'NORTH' },
        { supervisor: '', region: 'Trung Trung Bộ 中中部', name: 'Bùi Minh Trung 裴明中', total: 9, actual: 3, rate: 33, rowType: 'SUBTOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Miền Bắc 北部', name: 'Miền Bắc 北部', total: 90, actual: 8, rate: 9, rowType: 'MIEN_TOTAL', mien: 'NORTH' },
        { supervisor: '', region: 'Nam Trung Bộ 南中部', name: 'Võ Đức Nam 武德南', total: 3, actual: 1, rate: 33, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Nam Trung Bộ 南中部', name: 'Phạm Quang Vũ 范光武', total: 2, actual: 2, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Nam Trung Bộ 南中部', name: 'Cấn Đình Nguyên 詹定原', total: 5, actual: 3, rate: 60, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nguyên 西原', name: 'Nguyễn Nhật Trường 阮日长', total: 6, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nguyên 西原', name: 'Lê Công An 黎公安', total: 8, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nguyên 西原', name: 'Lê Thế Duy 黎世维', total: 14, actual: 0, rate: 0, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Đông Nam 东南', name: 'Cao Văn Quân 高文军', total: 3, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Đông Nam 东南', name: 'Châu Sơn Tuyền 周山选', total: 3, actual: 3, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Đông Nam 东南', name: 'Lê Đỗ Hoàng 黎杜黄', total: 6, actual: 6, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Đông Nam 东南', name: 'Nguyễn Văn Hùng 阮文雄', total: 12, actual: 9, rate: 75, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Hồ Chí Minh 胡志明', name: 'Đàm Xuân Trưởng 谭春长', total: 1, actual: 1, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Hồ Chí Minh 胡志明', name: 'Lê Tùng Đức 黎松德', total: 1, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Hồ Chí Minh 胡志明', name: 'Lưu Đức Tuấn 刘德俊', total: 8, actual: 5, rate: 63, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Hồ Chí Minh 胡志明', name: 'Trầm Hoàng Hơn 沉黄欣', total: 4, actual: 4, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Hồ Chí Minh 胡志明', name: 'Nguyễn Thành Nam 阮成南', total: 14, actual: 10, rate: 71, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nam 西南', name: 'Đặng Đình Thục 邓庭属', total: 2, actual: 1, rate: 50, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nam 西南', name: 'Nguyễn Đức Tuấn 阮德俊', total: 6, actual: 6, rate: 100, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Tây Nam 西南', name: 'Trần Đức Cường 陈德强', total: 8, actual: 7, rate: 88, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Sông Cửu Long 九龙江', name: 'Phạm Bá Lâm 范柏林', total: 3, actual: 2, rate: 67, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Sông Cửu Long 九龙江', name: 'Bùi Trung Tuấn 裴中俊', total: 0, actual: 0, rate: 0, rowType: 'STAFF', mien: 'SOUTH' },
        { supervisor: '', region: 'Sông Cửu Long 九龙江', name: 'Bùi Trung Tuấn 裴中俊', total: 3, actual: 2, rate: 67, rowType: 'SUBTOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'Miền Nam 南部', name: 'Miền Nam 南部', total: 56, actual: 31, rate: 55, rowType: 'MIEN_TOTAL', mien: 'SOUTH' },
        { supervisor: '', region: 'TỔNG', name: 'TỔNG', total: 146, actual: 39, rate: 27, rowType: 'GRAND_TOTAL', mien: 'ALL' }
      ]
    }
  ],

  isAdmin() {
    return window.AppState?.role === 'ADMIN';
  },

  // 1. Lấy danh sách các Bảng KPI (Tự động sửa các bảng bị lỗi 0 ở cột Sales do phiên bản cũ)
  getBoards() {
    const STORAGE_KEY = 'yadea_kpi_excel_boards_v3';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Lỗi đọc KPI boards:', e);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.defaultBoards));
    return this.defaultBoards;
  },

  saveBoards(boards) {
    localStorage.setItem('yadea_kpi_excel_boards_v3', JSON.stringify(boards));
    this.syncBoardsToSupabase(boards);
  },

  async syncBoardsToSupabase(boards) {
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;
    try {
      const payload = {
        id: 'KPI-BOARDS-CLOUD-V3',
        task_type: 'KPI_BOARDS_STORAGE',
        title: 'Dữ liệu Bảng Tiến Độ KPI V3',
        note: JSON.stringify(boards),
        region: 'ALL',
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      };
      await window.SupabaseService.client.from('tasks').upsert([payload], { onConflict: 'id' });
    } catch (e) {
      console.warn('[KpiModule] Lưu Cloud:', e);
    }
  },

  async fetchBoardsFromSupabase(force = false) {
    if (this.hasLoadedFromSupabase && !force) return;
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;
    this.hasLoadedFromSupabase = true;

    try {
      const { data, error } = await window.SupabaseService.client
        .from('tasks')
        .select('note, updated_at')
        .eq('id', 'KPI-BOARDS-CLOUD-V3')
        .maybeSingle();

      if (!error && data && data.note) {
        const cloudBoards = JSON.parse(data.note);
        if (Array.isArray(cloudBoards) && cloudBoards.length > 0) {
          localStorage.setItem('yadea_kpi_excel_boards_v3', JSON.stringify(cloudBoards));
          if (window.AppState?.activeModule === 'kpi') {
            window.App.renderCurrentModule();
          }
        }
      }
    } catch (e) {
      console.warn('[KpiModule] Tải Cloud:', e);
    }
  },

  getActiveBoard() {
    const boards = this.getBoards();
    if (!this.activeBoardId || !boards.some(b => b.id === this.activeBoardId)) {
      this.activeBoardId = boards[0]?.id || null;
    }
    return boards.find(b => b.id === this.activeBoardId) || boards[0];
  },

  selectBoard(boardId) {
    this.activeBoardId = boardId;
    this.supervisorFilter = 'ALL';
    this.subRegionFilter = 'ALL';
    this.isEditingInline = false;
    window.App.renderCurrentModule();
  },

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const inp = document.getElementById('kpi-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  },

  toggleZeroFilter() {
    this.onlyZeroFilter = !this.onlyZeroFilter;
    window.App.renderCurrentModule();
  },

  toggleInlineEdit() {
    this.isEditingInline = !this.isEditingInline;
    window.App.renderCurrentModule();
  },

  // 2. Chỉnh sửa trực tiếp trên bảng & Tự động tính lại Tổng Khu vực / Miền / Toàn quốc
  handleInlineCellChange(rowIndex, field, rawVal) {
    const boards = this.getBoards();
    const board = boards.find(b => b.id === this.activeBoardId);
    if (!board || !board.rows[rowIndex]) return;

    const numVal = Math.max(0, Number(rawVal) || 0);
    board.rows[rowIndex][field] = numVal;

    const r = board.rows[rowIndex];
    r.rate = r.total > 0 ? Math.round((r.actual / r.total) * 100) : 0;

    this.recalculateBoardTotals(board);
    board.updatedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    board.updatedBy = window.AppState?.userName || 'Admin';

    this.saveBoards(boards);
    window.App.renderCurrentModule();
  },

  recalculateBoardTotals(board) {
    if (!board || !Array.isArray(board.rows)) return;

    let groupTotal = 0;
    let groupActual = 0;
    let northTotal = 0, northActual = 0;
    let southTotal = 0, southActual = 0;

    board.rows.forEach(row => {
      if (row.rowType === 'STAFF') {
        const t = Number(row.total) || 0;
        const a = Number(row.actual) || 0;
        row.rate = t > 0 ? Math.round((a / t) * 100) : 0;
        groupTotal += t;
        groupActual += a;
        if (row.mien === 'SOUTH') {
          southTotal += t;
          southActual += a;
        } else {
          northTotal += t;
          northActual += a;
        }
      } else if (row.rowType === 'SUBTOTAL') {
        row.total = groupTotal;
        row.actual = groupActual;
        row.rate = groupTotal > 0 ? Math.round((groupActual / groupTotal) * 100) : 0;
        groupTotal = 0;
        groupActual = 0;
      } else if (row.rowType === 'MIEN_TOTAL') {
        if (row.mien === 'NORTH') {
          row.total = northTotal;
          row.actual = northActual;
          row.rate = northTotal > 0 ? Math.round((northActual / northTotal) * 100) : 0;
        } else {
          row.total = southTotal;
          row.actual = southActual;
          row.rate = southTotal > 0 ? Math.round((southActual / southTotal) * 100) : 0;
        }
      } else if (row.rowType === 'GRAND_TOTAL') {
        const grandT = northTotal + southTotal;
        const grandA = northActual + southActual;
        row.total = grandT;
        row.actual = grandA;
        row.rate = grandT > 0 ? Math.round((grandA / grandT) * 100) : 0;
      }
    });
  },

  // =========================================================================
  // 3. ĐỌC MỌI ĐỊNH DẠNG FILE EXCEL KPI (CẢ 5 CỘT LẪN 6 CỘT CÓ GIÁM SÁT)
  // =========================================================================
  openUploadKpiModal(mode = 'NEW') {
    if (!this.isAdmin()) return;
    const currentBoard = this.getActiveBoard();
    const isUpdate = mode === 'UPDATE' && currentBoard;

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-file-excel text-emerald-600"></i>
        <span>${isUpdate ? `Cập Nhật File Excel: ${currentBoard.title}` : 'Thêm Bảng KPI Mới (Từ File Excel)'}</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="KpiModule.handleExcelKpiSubmit(event, '${mode}')" class="space-y-4 text-xs">
        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Tên Bảng KPI (Hoặc để trống hệ thống sẽ tự lấy theo tên File / Sheet)
          </label>
          <input
            id="kpi-upload-title"
            type="text"
            value="${isUpdate ? currentBoard.title : ''}"
            placeholder="VD: QUẢN LÝ CỬA HÀNG THÁNG 10 - TIẾN ĐỘ 3824..."
            class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div class="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 text-[11px] text-emerald-900">
          <div class="font-extrabold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Tự động nhận diện thông minh:</div>
          <div>• <strong>Mẫu 6 cột</strong>: Giám sát (Cột A) | Khu vực (Cột B) | Sales (Cột C) | Chỉ tiêu (Cột D) | Hoàn thành (Cột E) | Tỷ lệ (Cột F).</div>
          <div>• <strong>Mẫu 5 cột</strong>: Khu vực (Cột A) | Họ tên (Cột B) | Tổng số (Cột C) | Đã kích hoạt (Cột D) | Tỷ lệ (Cột E).</div>
          <div>• Tự động xử lý ô gộp (Merge Cells), dòng tổng GĐKV, dòng Tổng Miền và tự động bỏ qua các dòng đang bị Ẩn (Hidden) trong Excel.</div>
        </div>

        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Chọn File Excel (.xlsx, .xls, .csv) *
          </label>
          <input
            id="kpi-excel-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            required
            class="w-full p-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/30 font-semibold cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50 cursor-pointer">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up mr-1"></i> ${isUpdate ? 'Cập Nhật Ngay' : 'Tải Lên & Hiển Thị'}
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  parseNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/,/g, '').replace(/%/g, '').trim();
    const n = Number(clean);
    return isNaN(n) ? 0 : n;
  },

  async handleExcelKpiSubmit(e, mode) {
    e.preventDefault();
    const rawTitleInput = document.getElementById('kpi-upload-title')?.value.trim();
    const fileInput = document.getElementById('kpi-excel-file-input');
    const file = fileInput?.files?.[0];
    if (!file) return;

    if (window.AdminShopsModule) {
      await window.AdminShopsModule.ensureXLSXLoaded();
    }
    if (!window.XLSX) {
      alert('Không thể tải thư viện đọc Excel (SheetJS)!');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array', cellStyles: true });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const rawRows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const rowMeta = ws['!rows'] || [];

      if (!rawRows || rawRows.length < 2) {
        alert('File Excel không có dữ liệu!');
        return;
      }

      // 1. Tìm dòng tiêu đề (Header)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const rowStr = (rawRows[i] || []).map(c => String(c || '')).join(' ').toUpperCase();
        if (rowStr.includes('KHU VỰC') || rowStr.includes('GIÁM SÁT') || rowStr.includes('区域') || rowStr.includes('督导')) {
          headerIdx = i;
          break;
        }
      }

      const hRow = (rawRows[headerIdx] || []).map(c => String(c || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim());

      // Kiểm tra xem đây là bảng 6 cột (Có cột Giám sát ở cột A và Sales ở cột C) hay bảng 5 cột
      const firstColHeader = (hRow[0] || '').toUpperCase();
      const thirdColHeader = (hRow[2] || '').toUpperCase();
      const is6ColLayout =
        firstColHeader.includes('GIÁM SÁT') ||
        firstColHeader.includes('督导') ||
        thirdColHeader.includes('SALE') ||
        thirdColHeader.includes('销售') ||
        thirdColHeader.includes('HỌ TÊN');

      const headers = is6ColLayout
        ? [
            hRow[0] || 'Giám sát 督导人员',
            hRow[1] || 'Khu vực 负责区域',
            hRow[2] || 'Sales 销售人员',
            hRow[3] || 'Chỉ tiêu 3824 3824目标',
            hRow[4] || 'Hoàn thành 已完成',
            hRow[5] || 'Tỷ lệ hoàn thành 完成率'
          ]
        : [
            hRow[0] || 'Khu vực 区域',
            hRow[1] || 'Họ tên 姓名',
            hRow[2] || 'Tổng số cửa hàng 总数量',
            hRow[3] || 'Đã kích hoạt 已激活数量',
            hRow[4] || 'Tỷ lệ hoàn thành 完成率'
          ];

      // 2. Duyệt từng dòng dữ liệu (Bỏ qua các dòng bị Hidden trong Excel như dòng 48)
      const tempRows = [];
      let lastSupervisor = '';
      let lastRegion = '';

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        if (rowMeta[r] && rowMeta[r].hidden) continue; // Bỏ qua dòng ẩn trong Excel

        const row = rawRows[r] || [];
        if (is6ColLayout) {
          const c0 = row[0] !== null && row[0] !== undefined ? String(row[0]).replace(/\r?\n/g, ' ').trim() : '';
          const c1 = row[1] !== null && row[1] !== undefined ? String(row[1]).replace(/\r?\n/g, ' ').trim() : '';
          const c2 = row[2] !== null && row[2] !== undefined ? String(row[2]).replace(/\r?\n/g, ' ').trim() : '';
          const rawTarget = row[3];
          const rawActual = row[4];

          if (!c0 && !c1 && !c2 && rawTarget === null && rawActual === null) continue;

          const upperAll = `${c0} ${c1} ${c2}`.toUpperCase();
          let rowType = 'STAFF';

          if (c0.toUpperCase().includes('TỔNG') || c1.toUpperCase() === 'TỔNG') {
            rowType = 'GRAND_TOTAL';
          } else if (c1 && !c2 && rawTarget !== null) {
            // Như dòng 24 (Khuất Văn Đức | None | 65 | 61) và dòng 46 (Trần Phi Long | None | 68 | 48) -> Dòng Tổng Miền
            rowType = 'MIEN_TOTAL';
          }

          if (c0 && rowType !== 'GRAND_TOTAL') lastSupervisor = c0;
          if (c1 && rowType === 'STAFF') lastRegion = c1;

          const totalNum = this.parseNum(rawTarget);
          const actualNum = this.parseNum(rawActual);
          const rateNum = totalNum > 0 ? Math.round((actualNum / totalNum) * 100) : 0;

          tempRows.push({
            supervisor: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? '' : lastSupervisor),
            region: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? c1 : (c1 || lastRegion)),
            name: rowType === 'GRAND_TOTAL' ? 'TỔNG TOÀN QUỐC' : (rowType === 'MIEN_TOTAL' ? c1 : c2),
            total: totalNum,
            actual: actualNum,
            rate: rateNum,
            rowType: rowType,
            mien: 'NORTH'
          });
        } else {
          // Bảng 5 cột
          const c0 = row[0] !== null && row[0] !== undefined ? String(row[0]).replace(/\r?\n/g, ' ').trim() : '';
          const c1 = row[1] !== null && row[1] !== undefined ? String(row[1]).replace(/\r?\n/g, ' ').trim() : '';
          const rawTarget = row[2];
          const rawActual = row[3];

          if (!c0 && !c1 && rawTarget === null && rawActual === null) continue;

          const upperAll = `${c0} ${c1}`.toUpperCase();
          let rowType = 'STAFF';
          if (upperAll === 'TỔNG' || upperAll.includes('TỔNG CỘNG')) {
            rowType = 'GRAND_TOTAL';
          } else if (upperAll.includes('MIỀN BẮC') || upperAll.includes('北部') || upperAll.includes('MIỀN NAM') || upperAll.includes('南部')) {
            rowType = 'MIEN_TOTAL';
          } else if (c0) {
            lastRegion = c0;
          }

          const totalNum = this.parseNum(rawTarget);
          const actualNum = this.parseNum(rawActual);
          const rateNum = totalNum > 0 ? Math.round((actualNum / totalNum) * 100) : 0;

          tempRows.push({
            supervisor: '',
            region: rowType === 'GRAND_TOTAL' ? 'TỔNG' : (rowType === 'MIEN_TOTAL' ? (c0 || c1) : (c0 || lastRegion)),
            name: c1 || c0 || '',
            total: totalNum,
            actual: actualNum,
            rate: rateNum,
            rowType: rowType,
            mien: 'NORTH'
          });
        }
      }

      // 3. Nếu có 2 dòng GRAND_TOTAL liên tiếp ở cuối (trường hợp file không đánh dấu hidden nhưng có dòng nháp), chỉ giữ dòng GRAND_TOTAL đầu tiên
      const cleanedRows = [];
      let seenGrandTotal = false;
      for (const item of tempRows) {
        if (item.rowType === 'GRAND_TOTAL') {
          if (seenGrandTotal) continue;
          seenGrandTotal = true;
        }
        cleanedRows.push(item);
      }

      // 4. Phân loại Miền Bắc (NORTH) / Miền Nam (SOUTH)
      let currentMien = 'NORTH';
      const southKeywords = ['NAM TRUNG BỘ', 'TÂY NGUYÊN', 'ĐÔNG NAM', 'HỒ CHÍ MINH', 'TÂY NAM', 'SÔNG CỬU LONG', 'MIỀN NAM', '南部', '胡志明', 'TRẦN PHI LONG'];

      for (let i = 0; i < cleanedRows.length; i++) {
        const item = cleanedRows[i];
        const checkStr = `${item.region} ${item.name}`.toUpperCase();
        if (southKeywords.some(k => checkStr.includes(k))) {
          currentMien = 'SOUTH';
        }
        item.mien = item.rowType === 'GRAND_TOTAL' ? 'ALL' : currentMien;
        if (item.rowType === 'MIEN_TOTAL' && currentMien === 'NORTH') {
          currentMien = 'SOUTH';
        }
      }

      // 5. Tự động nhận diện dòng SUBTOTAL (Dòng tổng của từng Khu vực như Khổng Văn Trọng, Khuất Văn Đức, Trịnh Trần Cường...)
      let startIdx = 0;
      while (startIdx < cleanedRows.length) {
        if (cleanedRows[startIdx].rowType !== 'STAFF') {
          startIdx++;
          continue;
        }
        const reg = cleanedRows[startIdx].region;
        let endIdx = startIdx;
        while (endIdx + 1 < cleanedRows.length && cleanedRows[endIdx + 1].rowType === 'STAFF' && cleanedRows[endIdx + 1].region === reg) {
          endIdx++;
        }
        const groupLen = endIdx - startIdx + 1;
        if (groupLen >= 2) {
          let sumBeforeLast = 0;
          for (let k = startIdx; k < endIdx; k++) {
            sumBeforeLast += cleanedRows[k].total;
          }
          const lastRow = cleanedRows[endIdx];
          if ((sumBeforeLast > 0 && lastRow.total === sumBeforeLast) || lastRow.name.toUpperCase().includes('TỔNG')) {
            lastRow.rowType = 'SUBTOTAL';
          }
        }
        startIdx = endIdx + 1;
      }

      const finalTitle = rawTitleInput || file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const boards = this.getBoards();
      const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
      const bType = is6ColLayout ? 'EXCEL_6COL' : 'EXCEL_5COL';

      if (mode === 'UPDATE' && this.activeBoardId) {
        const idx = boards.findIndex(b => b.id === this.activeBoardId);
        if (idx >= 0) {
          boards[idx] = {
            ...boards[idx],
            title: finalTitle,
            boardType: bType,
            headers: headers,
            rows: cleanedRows,
            updatedAt: nowStr,
            updatedBy: window.AppState?.userName || 'Admin'
          };
        }
      } else {
        const newId = 'KPI-' + Date.now().toString().slice(-6);
        boards.unshift({
          id: newId,
          title: finalTitle,
          boardType: bType,
          month: window.AppState?.month || '2026-10',
          updatedAt: nowStr,
          updatedBy: window.AppState?.userName || 'Admin',
          headers: headers,
          rows: cleanedRows
        });
        this.activeBoardId = newId;
      }

      this.saveBoards(boards);
      window.App.closeModal();
      window.App.renderCurrentModule();
    } catch (err) {
      alert('Lỗi đọc file Excel: ' + err.message);
    }
  },

  // =========================================================================
  // 4. TÍNH NĂNG MỚI: THÊM BẢNG KPI BẰNG HÌNH ẢNH (UPLOAD HOẶC CTRL+V DÁN ẢNH)
  // =========================================================================
  openImageKpiModal() {
    if (!this.isAdmin()) return;
    this._tempPastedImage = null;

    document.getElementById('modal-title').innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-image text-[#F26522]"></i>
        <span>Thêm / Dán Hình Ảnh Báo Cáo Tiến Độ KPI</span>
      </div>
    `;

    document.getElementById('modal-body').innerHTML = `
      <form onsubmit="KpiModule.handleSaveImageKpiBoard(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
            Tiêu Đề Bảng Tiến Độ KPI *
          </label>
          <input
            id="kpi-img-title"
            type="text"
            required
            placeholder="VD: Tiến độ KPI trưng bày ngày 27/10..."
            class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div
          id="kpi-paste-zone"
          tabindex="0"
          onpaste="KpiModule.handlePasteImageEvent(event)"
          class="p-6 rounded-2xl border-2 border-dashed border-[#F26522] bg-orange-50/40 text-center space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F26522]"
        >
          <i class="fa-solid fa-paste text-2xl text-[#F26522]"></i>
          <div class="font-extrabold text-slate-800 text-sm">
            Cách 1: Bấm vào khung này rồi nhấn tổ hợp phím <kbd class="px-2 py-0.5 rounded bg-slate-800 text-white font-mono">Ctrl + V</kbd> để dán trực tiếp ảnh chụp màn hình Excel / Zalo
          </div>
          <div class="text-slate-500">Hoặc Cách 2: Chọn file ảnh từ máy tính ở bên dưới</div>
          <input
            id="kpi-img-file-input"
            type="file"
            accept="image/*"
            onchange="KpiModule.handleImageFileSelect(this)"
            class="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#111625] file:text-white cursor-pointer"
          />
        </div>

        <div id="kpi-img-preview-box" class="hidden space-y-1">
          <div class="font-bold text-emerald-700"><i class="fa-solid fa-check-circle mr-1"></i> Đã nhận hình ảnh bảng KPI:</div>
          <img id="kpi-img-preview-el" src="" class="max-h-72 w-auto mx-auto rounded-xl border shadow-md" />
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50 cursor-pointer">Hủy</button>
          <button type="submit" class="btn-3d-orange px-5 py-2 rounded-xl font-extrabold cursor-pointer">
            <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Lưu Hình Ảnh KPI
          </button>
        </div>
      </form>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async compressKpiImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  async handlePasteImageEvent(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const dataUrl = await this.compressKpiImage(file);
          this._tempPastedImage = dataUrl;
          const box = document.getElementById('kpi-img-preview-box');
          const imgEl = document.getElementById('kpi-img-preview-el');
          if (box && imgEl) {
            imgEl.src = dataUrl;
            box.classList.remove('hidden');
          }
        }
        break;
      }
    }
  },

  async handleImageFileSelect(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;
    const dataUrl = await this.compressKpiImage(file);
    this._tempPastedImage = dataUrl;
    const box = document.getElementById('kpi-img-preview-box');
    const imgEl = document.getElementById('kpi-img-preview-el');
    if (box && imgEl) {
      imgEl.src = dataUrl;
      box.classList.remove('hidden');
    }
  },

  handleSaveImageKpiBoard(e) {
    e.preventDefault();
    const title = document.getElementById('kpi-img-title')?.value.trim() || 'Bảng Ảnh Tiến Độ KPI';
    if (!this._tempPastedImage) {
      alert('Vui lòng dán ảnh (Ctrl + V) hoặc chọn file ảnh bảng KPI trước khi lưu!');
      return;
    }

    const boards = this.getBoards();
    const newId = 'KPI-IMG-' + Date.now().toString().slice(-6);
    const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

    boards.unshift({
      id: newId,
      title: title.toUpperCase(),
      boardType: 'IMAGE_BOARD',
      imageUrl: this._tempPastedImage,
      updatedAt: nowStr,
      updatedBy: window.AppState?.userName || 'Admin',
      headers: [],
      rows: []
    });

    this.activeBoardId = newId;
    this._tempPastedImage = null;
    this.saveBoards(boards);
    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  deleteCurrentBoard() {
    if (!this.isAdmin()) return;
    const boards = this.getBoards();
    if (boards.length <= 1) {
      alert('Hệ thống cần giữ lại ít nhất 1 bảng KPI!');
      return;
    }
    const cur = this.getActiveBoard();
    if (!confirm(`Bạn có chắc chắn muốn xóa bảng "${cur.title}" không?`)) return;

    const remaining = boards.filter(b => b.id !== cur.id);
    this.activeBoardId = remaining[0].id;
    this.saveBoards(remaining);
    window.App.renderCurrentModule();
  },

  async downloadSampleExcel() {
    if (window.AdminShopsModule) {
      await window.AdminShopsModule.ensureXLSXLoaded();
    }
    if (!window.XLSX) return;

    const board = this.getActiveBoard();
    if (!board || board.boardType === 'IMAGE_BOARD') return;

    const is6Col = board.boardType === 'EXCEL_6COL';
    const aoa = [board.headers];

    board.rows.forEach(r => {
      if (is6Col) {
        aoa.push([r.supervisor || '', r.region, r.name, r.total, r.actual, `${r.rate}%`]);
      } else {
        aoa.push([r.region, r.name, r.total, r.actual, `${r.rate}%`]);
      }
    });

    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Tien_Do_KPI');
    const safeName = board.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9\s]/g, '').trim().replace(/\s+/g, '_');
    window.XLSX.writeFile(wb, `YADEA_${safeName}.xlsx`);
  },

  // Tính toán gộp ô (Rowspan) cho cả Cột Giám Sát (Cột 1) và Cột Khu Vực (Cột 2)
  buildTableRowsWithRowspan(rows) {
    const result = rows.map((r, idx) => ({
      ...r,
      _origIdx: idx,
      supRowspan: 1,
      hideSupCell: false,
      regRowspan: 1,
      hideRegCell: false
    }));

    // 1. Gộp ô cột Khu vực
    let i = 0;
    while (i < result.length) {
      const cur = result[i];
      if (cur.rowType === 'MIEN_TOTAL' || cur.rowType === 'GRAND_TOTAL') {
        i++;
        continue;
      }
      let span = 1;
      while (
        i + span < result.length &&
        result[i + span].rowType !== 'MIEN_TOTAL' &&
        result[i + span].rowType !== 'GRAND_TOTAL' &&
        result[i + span].region === cur.region
      ) {
        result[i + span].hideRegCell = true;
        span++;
      }
      cur.regRowspan = span;
      i += span;
    }

    // 2. Gộp ô cột Giám sát (cho bảng 6 cột)
    let j = 0;
    while (j < result.length) {
      const cur = result[j];
      if (cur.rowType === 'MIEN_TOTAL' || cur.rowType === 'GRAND_TOTAL' || !cur.supervisor) {
        j++;
        continue;
      }
      let span = 1;
      while (
        j + span < result.length &&
        result[j + span].rowType !== 'MIEN_TOTAL' &&
        result[j + span].rowType !== 'GRAND_TOTAL' &&
        result[j + span].supervisor === cur.supervisor
      ) {
        result[j + span].hideSupCell = true;
        span++;
      }
      cur.supRowspan = span;
      j += span;
    }

    return result;
  },

  render() {
    this.fetchBoardsFromSupabase(false);

    const boards = this.getBoards();
    const board = this.getActiveBoard();
    const isAdmin = this.isAdmin();
    const headerRegion = window.AppState?.region || 'ALL';

    if (!board) return '';

    // Nếu bảng hiện tại là Bảng Hình Ảnh (IMAGE_BOARD)
    if (board.boardType === 'IMAGE_BOARD') {
      return `
        <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-extrabold uppercase text-slate-400 mr-1">Danh mục KPI (${boards.length}):</span>
            ${boards.map((b, idx) => `
              <button
                onclick="KpiModule.selectBoard('${b.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                  b.id === board.id ? 'bg-[#111625] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:text-[#F26522]'
                }"
              >
                <span class="w-4 h-4 rounded-full ${b.id === board.id ? 'bg-[#F26522] text-white' : 'bg-slate-300 text-slate-700'} text-[10px] flex items-center justify-center font-mono">${idx + 1}</span>
                <span>${b.title}</span>
              </button>
            `).join('')}
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            ${isAdmin ? `
              <button onclick="KpiModule.openUploadKpiModal('NEW')" class="btn-3d-orange px-3.5 py-2 rounded-xl font-extrabold cursor-pointer">
                <i class="fa-solid fa-file-excel mr-1"></i> + Thêm Bảng Excel
              </button>
              <button onclick="KpiModule.openImageKpiModal()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer">
                <i class="fa-solid fa-image mr-1"></i> + Thêm / Dán Ảnh KPI
              </button>
              <button onclick="KpiModule.deleteCurrentBoard()" class="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="card-3d p-5 bg-white dark:bg-slate-900 space-y-3 text-center">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-extrabold text-base text-slate-900 dark:text-white uppercase">${board.title}</h3>
            <span class="text-xs font-bold text-emerald-600">Cập nhật: ${board.updatedAt}</span>
          </div>
          <div class="overflow-auto max-h-[75vh] p-2 bg-slate-50 rounded-2xl border">
            <img src="${board.imageUrl}" onclick="window.open(this.src)" class="max-w-full h-auto mx-auto rounded-lg shadow cursor-zoom-in" title="Bấm vào ảnh để phóng to" />
          </div>
        </div>
      `;
    }

    const is6Col = board.boardType === 'EXCEL_6COL';
    const headers = board.headers || [];

    // Lọc theo Miền trên thanh Header
    const regionFilteredRows = (board.rows || []).filter(r => {
      if (headerRegion === 'ALL') return true;
      if (r.rowType === 'GRAND_TOTAL') return false;
      return r.mien === headerRegion;
    });

    const supervisors = [...new Set(regionFilteredRows.map(r => r.supervisor).filter(s => s && s !== 'TỔNG'))];
    const subRegions = [...new Set(
      regionFilteredRows
        .filter(r => r.rowType === 'STAFF' || r.rowType === 'SUBTOTAL')
        .map(r => r.region)
    )];

    // Tính toán chuẩn xác từ các dòng STAFF cho 5 thẻ KPI trên cùng
    const staffRows = regionFilteredRows.filter(r => r.rowType === 'STAFF');
    const subtotalRows = regionFilteredRows.filter(r => r.rowType === 'SUBTOTAL');

    const sumTarget = staffRows.reduce((a, b) => a + (Number(b.total) || 0), 0);
    const sumActual = staffRows.reduce((a, b) => a + (Number(b.actual) || 0), 0);
    const overallRate = sumTarget > 0 ? Math.round((sumActual / sumTarget) * 100) : 0;

    const zeroZonesCount = subtotalRows.filter(r => Number(r.total) > 0 && Number(r.actual) === 0).length;
    const zeroStaffCount = staffRows.filter(r => Number(r.total) > 0 && Number(r.actual) === 0).length;
    const completedStaffCount = staffRows.filter(r => Number(r.rate) >= 100).length;

    const q = this.searchQuery.trim().toLowerCase();
    const isFiltering = q !== '' || this.supervisorFilter !== 'ALL' || this.subRegionFilter !== 'ALL' || this.onlyZeroFilter;

    const displayRowsRaw = regionFilteredRows.filter(r => {
      if (this.supervisorFilter !== 'ALL' && r.supervisor !== this.supervisorFilter) return false;
      if (this.subRegionFilter !== 'ALL' && r.region !== this.subRegionFilter) return false;
      if (this.onlyZeroFilter) {
        if (r.rowType === 'MIEN_TOTAL' || r.rowType === 'GRAND_TOTAL') return false;
        if (Number(r.rate) > 0) return false;
      }
      if (q) {
        const matchSup = String(r.supervisor || '').toLowerCase().includes(q);
        const matchReg = String(r.region || '').toLowerCase().includes(q);
        const matchName = String(r.name || '').toLowerCase().includes(q);
        return matchSup || matchReg || matchName;
      }
      return true;
    });

    const processedRows = this.buildTableRowsWithRowspan(displayRowsRaw);
    const targetHeaderLabel = is6Col ? (headers[3] || 'Chỉ tiêu 3824') : (headers[2] || 'Tổng số cửa hàng');
    const actualHeaderLabel = is6Col ? (headers[4] || 'Hoàn thành') : (headers[3] || 'Đã kích hoạt');

    return `
      <!-- 1. THANH CHUYỂN TAB NHIỀU BẢNG KPI & CÔNG CỤ ADMIN -->
      <div class="card-3d p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1.5">
            <i data-lucide="layers" class="w-4 h-4 text-[#F26522]"></i>
            DANH MỤC KPI (${boards.length}):
          </span>
          ${boards.map((b, idx) => {
            const isActive = b.id === board.id;
            return `
              <button
                onclick="KpiModule.selectBoard('${b.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#111625] text-white shadow-md ring-2 ring-[#F26522]/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:text-[#F26522]'
                }"
              >
                <span class="w-4 h-4 rounded-full ${isActive ? 'bg-[#F26522] text-white' : 'bg-slate-300 text-slate-700'} text-[10px] flex items-center justify-center font-mono">${idx + 1}</span>
                <span>${b.title}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          ${isAdmin ? `
            <button
              onclick="KpiModule.openUploadKpiModal('NEW')"
              class="btn-3d-orange px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-plus"></i>
              <span>Thêm Bảng KPI (Excel)</span>
            </button>

            <button
              onclick="KpiModule.openImageKpiModal()"
              class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Dán trực tiếp hình ảnh bảng Excel (Ctrl+V) hoặc tải ảnh lên"
            >
              <i class="fa-solid fa-image"></i>
              <span>Thêm Ảnh KPI (Ctrl+V)</span>
            </button>

            <button
              onclick="KpiModule.openUploadKpiModal('UPDATE')"
              class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <i class="fa-solid fa-file-arrow-up"></i>
              <span>Cập Nhật File Excel</span>
            </button>

            <button
              onclick="KpiModule.toggleInlineEdit()"
              class="px-3 py-2 rounded-xl border ${this.isEditingInline ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'} font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              <span>${this.isEditingInline ? 'Đóng Sửa Nhanh' : 'Sửa Số Trực Tiếp'}</span>
            </button>

            ${boards.length > 1 ? `
              <button
                onclick="KpiModule.deleteCurrentBoard()"
                class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                title="Xóa bảng KPI này"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          ` : `
            <button
              onclick="KpiModule.fetchBoardsFromSupabase(true)"
              class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid fa-rotate text-[#F26522]"></i>
              <span>Đồng Bộ Tiến Độ Mới Nhất</span>
            </button>
          `}

          <button
            onclick="KpiModule.downloadSampleExcel()"
            class="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <i class="fa-solid fa-file-excel"></i>
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      <!-- 2. 5 THẺ KPI TỔNG HỢP CHUẨN XÁC -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="card-3d tilt-card p-4 border-t-4 border-t-blue-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>${targetHeaderLabel}</span>
            <i data-lucide="target" class="w-4 h-4 text-blue-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-slate-900 dark:text-white">${sumTarget.toLocaleString()}</div>
          <div class="text-[11px] text-slate-400 font-medium">${staffRows.length} Sales phụ trách</div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-emerald-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>${actualHeaderLabel}</span>
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-emerald-600">${sumActual.toLocaleString()}</div>
          <div class="text-[11px] text-slate-400 font-medium">Còn lại: <strong class="text-slate-700">${Math.max(0, sumTarget - sumActual)}</strong></div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-[#F26522]">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>TỶ LỆ HOÀN THÀNH</span>
            <i data-lucide="trending-up" class="w-4 h-4 text-[#F26522]"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-[#F26522]">${overallRate}%</div>
          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
            <div class="h-full bg-emerald-500" style="width:${Math.min(100, overallRate)}%"></div>
          </div>
        </div>

        <div class="card-3d tilt-card p-4 border-t-4 border-t-teal-500">
          <div class="text-[11px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
            <span>ĐẠT & VƯỢT 100% CHỈ TIÊU</span>
            <i data-lucide="award" class="w-4 h-4 text-teal-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-teal-600">${completedStaffCount} <span class="text-xs font-normal text-slate-400">Sales</span></div>
          <div class="text-[11px] text-slate-400 font-medium">Hoàn thành xuất sắc</div>
        </div>

        <div
          onclick="KpiModule.toggleZeroFilter()"
          class="card-3d tilt-card p-4 border-t-4 border-t-rose-500 cursor-pointer hover:ring-2 hover:ring-rose-400 transition ${this.onlyZeroFilter ? 'ring-2 ring-rose-500 bg-rose-50/40' : ''}"
        >
          <div class="text-[11px] font-extrabold uppercase text-rose-600 flex items-center justify-between">
            <span>CHƯA PHÁT SINH (0%)</span>
            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
          </div>
          <div class="my-1.5 text-2xl font-black font-mono text-rose-600">
            ${zeroZonesCount} <span class="text-xs font-bold">vùng</span> / ${zeroStaffCount} <span class="text-xs font-bold">NV</span>
          </div>
          <div class="text-[10px] text-rose-500 font-bold">${this.onlyZeroFilter ? '✓ Đang lọc 0% (Bấm để bỏ)' : 'Bấm để lọc riêng vị trí 0%'}</div>
        </div>
      </div>

      <!-- 3. BẢNG TIẾN ĐỘ KPI CHI TIẾT -->
      <div class="card-3d overflow-hidden bg-white dark:bg-slate-900">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                ${board.title}
              </h3>
              <span class="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                Cập nhật: ${board.updatedAt || 'Mới nhất'}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Hiển thị đầy đủ Giám sát, Khu vực, Sales, Chỉ tiêu và Thanh tiến độ hoàn thành thực tế.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="kpi-search-input"
                type="text"
                value="${this.searchQuery}"
                oninput="KpiModule.setFilter('searchQuery', this.value)"
                placeholder="Tìm Giám sát, Khu vực, Sales..."
                class="pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-semibold w-56 focus:outline-none focus:border-[#F26522]"
              />
            </div>

            ${supervisors.length > 0 ? `
              <select
                onchange="KpiModule.setFilter('supervisorFilter', this.value)"
                class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-orange-600 focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="ALL">-- Tất cả Giám sát (${supervisors.length}) --</option>
                ${supervisors.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
              </select>
            ` : ''}

            <select
              onchange="KpiModule.setFilter('subRegionFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Khu vực (${subRegions.length}) --</option>
              ${subRegions.map(reg => `<option value="${reg}" ${this.subRegionFilter === reg ? 'selected' : ''}>${reg}</option>`).join('')}
            </select>

            ${isFiltering ? `
              <button
                onclick="KpiModule.setFilter('searchQuery', ''); KpiModule.setFilter('supervisorFilter', 'ALL'); KpiModule.setFilter('subRegionFilter', 'ALL'); KpiModule.onlyZeroFilter = false; window.App.renderCurrentModule();"
                class="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold cursor-pointer"
              >
                Xóa lọc
              </button>
            ` : ''}
          </div>
        </div>

        <div class="overflow-x-auto max-h-[68vh]">
          <table class="w-full border-collapse text-xs select-text">
            <thead class="sticky top-0 z-20">
              <tr class="bg-[#d9d9d9] dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border-b-2 border-slate-400">
                ${is6Col ? `<th class="py-3 px-3 border border-slate-400/80 text-center w-44">${headers[0]}</th>` : ''}
                <th class="py-3 px-3 border border-slate-400/80 text-center w-44">${is6Col ? headers[1] : headers[0]}</th>
                <th class="py-3 px-4 border border-slate-400/80 text-center min-w-[210px]">${is6Col ? headers[2] : headers[1]}</th>
                <th class="py-3 px-3 border border-slate-400/80 text-center w-36">${is6Col ? headers[3] : headers[2]}</th>
                <th class="py-3 px-3 border border-slate-400/80 text-center w-36">${is6Col ? headers[4] : headers[3]}</th>
                <th class="py-3 px-4 border border-slate-400/80 text-center w-48">${is6Col ? headers[5] : headers[4]}</th>
              </tr>
            </thead>
            <tbody>
              ${processedRows.map(row => {
                const isSubtotal = row.rowType === 'SUBTOTAL';
                const isMienTotal = row.rowType === 'MIEN_TOTAL';
                const isGrandTotal = row.rowType === 'GRAND_TOTAL';
                const isZeroSubtotalAlert = isSubtotal && Number(row.total) > 0 && Number(row.rate) === 0;

                let trClass = 'bg-white dark:bg-slate-900 hover:bg-orange-50/40';
                let textClass = 'font-medium text-slate-800 dark:text-slate-200';

                if (isZeroSubtotalAlert) {
                  trClass = 'bg-[#f8696b] text-slate-950 font-extrabold';
                  textClass = 'font-extrabold text-slate-950';
                } else if (isSubtotal) {
                  trClass = 'bg-[#d9d9d9] dark:bg-slate-800 font-extrabold';
                  textClass = 'font-extrabold text-slate-900 dark:text-white';
                } else if (isMienTotal) {
                  trClass = 'bg-[#aeaaaa] dark:bg-slate-700 font-black text-sm';
                  textClass = 'font-black text-slate-950 dark:text-white';
                } else if (isGrandTotal) {
                  trClass = 'bg-[#d9e1f2] dark:bg-indigo-950 font-black text-sm';
                  textClass = 'font-black text-slate-950 dark:text-white';
                }

                const barWidth = Math.min(100, Math.max(0, Number(row.rate) || 0));

                // Dòng Tổng Miền hoặc Tổng Toàn Quốc
                if (isMienTotal || isGrandTotal) {
                  const colSpanCount = is6Col ? 3 : 2;
                  return `
                    <tr class="${trClass} transition">
                      <td colspan="${colSpanCount}" class="py-2.5 px-4 border border-slate-400/80 text-center ${textClass}">
                        ${row.region || row.name}
                      </td>
                      <td class="py-2.5 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                        ${row.total}
                      </td>
                      <td class="py-2.5 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                        ${row.actual}
                      </td>
                      <td class="py-1.5 px-2 border border-slate-400/80 text-center relative overflow-hidden">
                        <div class="relative w-full h-6 flex items-center justify-center">
                          ${barWidth > 0 ? `
                            <div
                              class="absolute left-0 top-0 bottom-0 rounded-sm transition-all duration-500"
                              style="width: ${barWidth}%; background: linear-gradient(90deg, #63be7b 0%, #85d199 65%, #b6e6c3 100%);"
                            ></div>
                          ` : ''}
                          <span class="relative z-10 font-mono ${textClass}">${row.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }

                return `
                  <tr class="${trClass} transition">
                    <!-- Cột Giám sát (Nếu là bảng 6 cột) -->
                    ${is6Col && !row.hideSupCell ? `
                      <td
                        rowspan="${row.supRowspan}"
                        class="py-2.5 px-3 border border-slate-400/80 text-center align-middle bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white uppercase"
                      >
                        ${row.supervisor || ''}
                      </td>
                    ` : ''}

                    <!-- Cột Khu vực -->
                    ${!row.hideRegCell ? `
                      <td
                        rowspan="${row.regRowspan}"
                        class="py-2.5 px-3 border border-slate-400/80 text-center align-middle bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                      >
                        ${row.region}
                      </td>
                    ` : ''}

                    <!-- Cột Họ tên Sales / GĐKV -->
                    <td class="py-2 px-4 border border-slate-400/80 text-center ${textClass}">
                      ${row.name}
                    </td>

                    <!-- Cột Chỉ tiêu -->
                    <td class="py-2 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                      ${this.isEditingInline && row.rowType === 'STAFF' ? `
                        <input
                          type="number"
                          min="0"
                          value="${row.total}"
                          onchange="KpiModule.handleInlineCellChange(${row._origIdx}, 'total', this.value)"
                          class="w-20 px-2 py-1 text-center rounded border border-slate-400 bg-white font-mono font-bold text-slate-900"
                        />
                      ` : row.total}
                    </td>

                    <!-- Cột Thực đạt / Hoàn thành -->
                    <td class="py-2 px-3 border border-slate-400/80 text-center font-mono ${textClass}">
                      ${this.isEditingInline && row.rowType === 'STAFF' ? `
                        <input
                          type="number"
                          min="0"
                          value="${row.actual}"
                          onchange="KpiModule.handleInlineCellChange(${row._origIdx}, 'actual', this.value)"
                          class="w-20 px-2 py-1 text-center rounded border border-orange-400 bg-orange-50 font-mono font-extrabold text-[#F26522]"
                        />
                      ` : row.actual}
                    </td>

                    <!-- Cột Tỷ lệ hoàn thành kèm Thanh tiến độ xanh lá -->
                    <td class="py-1.5 px-2 border border-slate-400/80 text-center relative overflow-hidden">
                      <div class="relative w-full h-6 flex items-center justify-center">
                        ${barWidth > 0 && !isZeroSubtotalAlert ? `
                          <div
                            class="absolute left-0 top-0 bottom-0 rounded-sm transition-all duration-500"
                            style="width: ${barWidth}%; background: linear-gradient(90deg, #63be7b 0%, #8ad69e 70%, #c4ebd0 100%);"
                          ></div>
                        ` : ''}
                        <span class="relative z-10 font-mono ${textClass}">${row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};