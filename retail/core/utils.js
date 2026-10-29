// core/utils.js
window.AppUtils = {
  // 1. Tự động nạp thư viện SheetJS (XLSX) dùng chung cho AdminShops, KPI, Sellout
  async ensureXLSXLoaded() {
    if (window.XLSX) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  },

  // 2. Chuẩn hóa Miền thống nhất toàn hệ thống (Chỉ chia Miền Bắc NORTH & Miền Nam SOUTH)
  resolveMienCode(mienStr, khuVucStr = '') {
    const text = `${mienStr || ''} ${khuVucStr || ''}`.toUpperCase();
    const southKeywords = [
      'NAM', '南部', 'SOUTH', 'TÂY NGUYÊN', 'ĐÔNG NAM',
      'HỒ CHÍ MINH', '胡志明', 'SÔNG CỬU LONG', 'TRẦN PHI LONG'
    ];
    if (southKeywords.some(k => text.includes(k))) return 'SOUTH';
    return 'NORTH';
  },

  // 3. Chuẩn hóa tên nhân sự (Bỏ chữ Hán, bỏ dấu tiếng Việt để so khớp chính xác)
  normalizePersonName(str) {
    if (!str) return '';
    return String(str)
      .replace(/[\u4e00-\u9fa5]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  },

  // 4. Nén 1 ảnh bất kỳ bằng HTML5 Canvas (Tránh tràn bộ nhớ LocalStorage)
  async compressImage(file, maxWidth = 960, maxHeight = 960, quality = 0.65) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(null);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  // 5. Đọc và nén danh sách nhiều ảnh (Tối đa 6 ảnh/lần)
  async readFilesAsDataUrls(fileList, maxWidth = 960, maxHeight = 960, quality = 0.65) {
    if (!fileList || fileList.length === 0) return [];
    const results = [];
    for (let i = 0; i < Math.min(6, fileList.length); i++) {
      const compressed = await this.compressImage(fileList[i], maxWidth, maxHeight, quality);
      if (compressed) results.push(compressed);
    }
    return results;
  },

  // 6. Lấy khoảng ngày Thứ Hai -> Chủ Nhật của tuần hiện tại
  getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10)
    };
  },

  // 7. Chuẩn hóa giá trị S.O (Quy tắc 3: Không biến null/rỗng thành 0)
  parseSOVal(val) {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (str === '' || str.toUpperCase() === 'NAN' || str.toUpperCase() === 'NULL') return null;
    const num = Number(str.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }
};