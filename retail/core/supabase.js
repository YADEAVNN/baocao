// core/supabase.js
window.SupabaseConfig = {
  // Đã điền chính xác Project URL từ ảnh chụp Supabase của bạn:
  url: 'https://rfxjeyabxdmmskaeditd.supabase.co', 
  anonKey: 'sb_publishable_zQWQfgfhsLgFLXJW1ofoWA_L0u4AcY-'
};

window.SupabaseService = {
  client: null,
  isConnected: false,

  // Tài khoản Admin mặc định luôn hoạt động
  defaultAdmin: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Quản Trị Viên (Admin)',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'ADMIN',
    assignedRegion: 'ALL',
    status: 'ACTIVE',
    shopName: ''
  },

  init() {
    try {
      const { url, anonKey } = window.SupabaseConfig;
      if (window.supabase && url) {
        this.client = window.supabase.createClient(url, anonKey);
        this.isConnected = true;
      }
      this.ensureDefaultAdminLocal();
    } catch (err) {
      console.error('[YADEA API] Lỗi khởi tạo Supabase:', err);
    }
  },

  getLocalProfiles() {
    const list = JSON.parse(localStorage.getItem('yadea_profiles_db') || '[]');
    if (!list.some(u => u.email.toLowerCase() === 'admin@gmail.com')) {
      list.unshift(this.defaultAdmin);
      localStorage.setItem('yadea_profiles_db', JSON.stringify(list));
    }
    return list;
  },

  saveLocalProfiles(list) {
    localStorage.setItem('yadea_profiles_db', JSON.stringify(list));
  },

  ensureDefaultAdminLocal() {
    this.getLocalProfiles();
  },

  // 1. ĐĂNG KÝ TÀI KHOẢN MỚI -> GHI THẲNG VÀO BẢNG `profiles` TRÊN SUPABASE VỚI TRẠNG THÁI 'PENDING' (CHỜ DUYỆT)
  async signUp({ fullName, email, password, role, assignedRegion, shopName = '' }) {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@gmail.com') {
      throw new Error('Tài khoản admin@gmail.com đã tồn tại sẵn trong hệ thống!');
    }

    const finalRegion = role === 'ADMIN' ? 'ALL' : assignedRegion;
    const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const newProfile = {
      id: newId,
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password,
      role: role,
      assignedRegion: finalRegion,
      status: 'PENDING', // Bắt buộc chờ Admin duyệt
      shopName: shopName || '',
      createdAt: new Date().toISOString()
    };

    // Ghi trực tiếp vào bảng `profiles` trên Supabase của bạn
    if (this.isConnected) {
      // Kiểm tra trùng email trên bảng profiles
      const { data: existing } = await this.client
        .from('profiles')
        .select('email')
        .eq('email', cleanEmail);

      if (existing && existing.length > 0) {
        throw new Error('Email này đã đăng ký và đang trong danh sách! Vui lòng chờ Admin duyệt.');
      }

      const payload = {
        id: newId,
        full_name: newProfile.fullName,
        email: cleanEmail,
        role: role,
        region: finalRegion,
        status: 'PENDING',
        password: password
      };

      const { error: insertErr } = await this.client.from('profiles').insert([payload]);
      if (insertErr) {
        // Nếu người dùng chưa kịp chạy lệnh SQL thêm cột status/password thì vẫn insert 5 cột cơ bản hiện có trên ảnh 2
        const fallbackPayload = {
          id: newId,
          full_name: newProfile.fullName,
          email: cleanEmail,
          role: role,
          region: `${finalRegion}|PENDING|${password}`
        };
        const { error: fallbackErr } = await this.client.from('profiles').insert([fallbackPayload]);
        if (fallbackErr) {
          console.error('Lỗi ghi bảng profiles Supabase:', fallbackErr);
          throw new Error('Không thể ghi vào bảng profiles trên Supabase: ' + fallbackErr.message);
        }
      }
    }

    // Lưu đồng bộ vào Local để phản hồi tức thì
    const localList = this.getLocalProfiles();
    const idx = localList.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) localList[idx] = newProfile;
    else localList.push(newProfile);
    this.saveLocalProfiles(localList);

    return newProfile;
  },

  // 2. ĐĂNG NHẬP (KIỂM TRA TÀI KHOẢN ADMIN GỐC & KIỂM TRA TRẠNG THÁI ĐÃ DUYỆT HAY CHƯA)
  async signIn(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    // Ưu tiên 1: Tài khoản Admin tối cao theo yêu cầu của bạn
    if (cleanEmail === 'admin@gmail.com') {
      if (password !== '123456') {
        throw new Error('Mật khẩu Admin không chính xác!');
      }
      return this.defaultAdmin;
    }

    // Ưu tiên 2: Kiểm tra trực tiếp từ bảng `profiles` trên Supabase
    const allProfiles = await this.fetchAllProfiles();
    const user = allProfiles.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Tài khoản không tồn tại! Vui lòng bấm "Đăng ký ngay" bên dưới.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Mật khẩu không chính xác!');
    }

    // CHẶN ĐĂNG NHẬP NẾU CHƯA ĐƯỢC ADMIN DUYỆT
    if (user.status === 'PENDING') {
      throw new Error('Tài khoản của bạn đã đăng ký thành công nhưng ĐANG CHỜ ADMIN PHÊ DUYỆT!');
    }

    if (user.status === 'LOCKED') {
      throw new Error('Tài khoản của bạn đã bị khóa bởi Admin!');
    }

    return user;
  },

  // 3. LẤY DANH SÁCH TÀI KHOẢN TỪ BẢNG `profiles` SUPABASE CHO MÀN HÌNH DUYỆT CỦA ADMIN
  async fetchAllProfiles() {
    const localList = this.getLocalProfiles();

    if (!this.isConnected) return localList;

    try {
      const { data, error } = await this.client.from('profiles').select('*');
      if (error || !data) return localList;

      const mapped = data.map(row => {
        // Giải mã trường hợp bảng chưa thêm cột status riêng
        let regionVal = row.region || 'SOUTH';
        let statusVal = row.status || 'ACTIVE';
        let passVal = row.password || '123456';

        if (regionVal.includes('|')) {
          const parts = regionVal.split('|');
          regionVal = parts[0];
          statusVal = parts[1] || 'PENDING';
          passVal = parts[2] || '123456';
        } else if (!row.status) {
          // Nếu dòng trên Supabase chưa có cột status, đối chiếu với trạng thái lưu tạm
          const localMatch = localList.find(l => l.email.toLowerCase() === (row.email || '').toLowerCase());
          statusVal = localMatch ? localMatch.status : 'PENDING';
          passVal = localMatch?.password || '123456';
        }

        return {
          id: row.id,
          fullName: row.full_name || 'Chưa đặt tên',
          email: (row.email || '').toLowerCase(),
          role: row.role || 'SALE',
          assignedRegion: regionVal,
          status: row.email === 'admin@gmail.com' ? 'ACTIVE' : statusVal,
          password: passVal,
          shopName: row.shop_name || ''
        };
      });

      // Luôn đảm bảo có tài khoản admin@gmail.com
      if (!mapped.some(u => u.email === 'admin@gmail.com')) {
        mapped.unshift(this.defaultAdmin);
      }

      this.saveLocalProfiles(mapped);
      return mapped;
    } catch (e) {
      return localList;
    }
  },

  // 4. ADMIN DUYỆT / KHÓA / SỬA TÀI KHOẢN TRÊN SUPABASE
  async updateProfileOnSupabase(email, updates) {
    const cleanEmail = email.toLowerCase();
    const localList = this.getLocalProfiles();
    const idx = localList.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...updates };
      this.saveLocalProfiles(localList);
    }

    if (!this.isConnected) return true;

    const target = localList.find(u => u.email.toLowerCase() === cleanEmail);
    if (!target) return false;

    // Cập nhật lên bảng `profiles` của Supabase
    const { error } = await this.client
      .from('profiles')
      .update({
        full_name: target.fullName,
        role: target.role,
        region: target.assignedRegion,
        status: target.status,
        password: target.password
      })
      .eq('email', cleanEmail);

    if (error) {
      // Dự phòng nếu bảng chưa chạy lệnh ALTER TABLE thêm cột status
      await this.client
        .from('profiles')
        .update({
          full_name: target.fullName,
          role: target.role,
          region: `${target.assignedRegion}|${target.status}|${target.password}`
        })
        .eq('email', cleanEmail);
    }
    return true;
  },

  // 5. ADMIN XÓA TÀI KHOẢN KHỎI SUPABASE
  async deleteProfileOnSupabase(email) {
    const cleanEmail = email.toLowerCase();
    if (cleanEmail === 'admin@gmail.com') {
      throw new Error('Không thể xóa tài khoản Admin gốc!');
    }

    const localList = this.getLocalProfiles().filter(u => u.email.toLowerCase() !== cleanEmail);
    this.saveLocalProfiles(localList);

    if (this.isConnected) {
      await this.client.from('profiles').delete().eq('email', cleanEmail);
    }
    return true;
  },

  async syncAllData() {
    await this.fetchAllProfiles();
    return true;
  }
};