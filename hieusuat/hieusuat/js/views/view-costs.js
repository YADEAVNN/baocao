export const costsHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto">
    <div class="flex justify-between items-center mb-6 gap-2">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase" data-i18n="title_crm">3. Thông Tin Khách Hàng (CRM)</h1>
        </div>
    </div>
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-20 space-y-6 relative">
        <div id="editCRMBanner" class="hidden absolute -top-3 right-4 bg-[#F97316] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow">Đang chỉnh sửa</div>
        <input type="hidden" id="editCRMId" value="">

        <div class="mb-4">
            <label class="form-label text-orange-600" data-i18n="lbl_shop">Cửa Hàng (Shop)</label>
            <div class="flex flex-col md:flex-row gap-2 w-full md:w-1/2">
                <div class="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0"><i class="fa-solid fa-store"></i></div>
                    <div class="flex-1 overflow-hidden">
                        <select id="select_shop_crm" onchange="window.changeInputShop(this.value)" class="w-full bg-transparent font-black text-slate-800 text-sm outline-none cursor-pointer truncate">
                            <option value="">Vui lòng đợi...</option>
                        </select>
                    </div>
                </div>
                <button type="button" onclick="window.generateCustomerQR()" class="bg-[#F97316] text-white px-5 rounded-lg font-black shadow-lg hover:bg-orange-600 transition flex flex-col items-center justify-center gap-1 shrink-0 h-[50px] uppercase">
                    <i class="fa-solid fa-qrcode text-lg"></i>
                    <span class="text-[9px] tracking-wider">Tạo Mã QR</span>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="form-label text-blue-600" data-i18n="lbl_cus_name">Tên Khách Hàng</label>
                <input type="text" id="crm_name" class="form-input bg-blue-50" data-i18n="ph_cus_name" placeholder="Ví dụ: Nguyễn Văn A">
            </div>
            <div>
                <label class="form-label text-blue-600" data-i18n="lbl_phone">Số Điện Thoại</label>
                <input type="tel" id="crm_phone" class="form-input bg-blue-50" data-i18n="ph_phone" placeholder="Ví dụ: 09xxxxxxxxx">
            </div>
            <div class="md:col-span-2">
                <label class="form-label" data-i18n="lbl_address">Địa Chỉ</label>
                <input type="text" id="crm_address" class="form-input" data-i18n="ph_address" placeholder="Xã/Phường, Quận/Huyện, Tỉnh">
            </div>
            <div>
                <div class="flex justify-between items-end mb-1.5">
                    <label class="form-label" style="margin-bottom: 0;" data-i18n="lbl_model">Mẫu Xe</label>
                </div>
                <select id="crm_model" class="form-input bg-white model-select">
                    <option value="">-- Chọn xe --</option>
                </select>
            </div>
            <div>
                <label class="form-label" data-i18n="lbl_source">Nguồn Khách</label>
                <select id="crm_source" class="form-input bg-white">
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Vãng lai">Vãng lai</option>
                    <option value="Người quen">Người quen</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            <div>
                <label class="form-label text-purple-600" data-i18n="lbl_vin">Số Khung / Biển Số</label>
                <div class="relative">
                    <input type="text" id="crm_vin" class="form-input" data-i18n="ph_vin" placeholder="Nhập mã khung/biển...">
                    <button onclick="startQrScan('crm_vin')" class="hidden absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition">
                        <i class="fa-solid fa-qrcode"></i>
                    </button>
                </div>
            </div>
            <div>
                <label class="form-label text-orange-600" data-i18n="lbl_status">Trạng Thái</label>
                <select id="crm_status" class="form-input bg-white font-bold">
                    <option value="Đã mua xe">✅ Đã chốt (Mua xe)</option>
                    <option value="Đang phân vân">🤔 Chưa chốt (Phân vân)</option>
                    <option value="Không mua">❌ Không mua</option>
                </select>
            </div>
            <div class="md:col-span-2">
                <label class="form-label" data-i18n="lbl_note">Ghi Chú</label>
                <textarea id="crm_notes" class="form-input h-20" data-i18n="ph_crm_note" placeholder="Ví dụ: Khách hẹn chốt ngày..."></textarea>
            </div>
        </div>
        <div class="flex gap-2">
            <button type="button" id="btnSubmitCRM" onclick="submitCRM()" class="flex-1 py-4 bg-[#F97316] text-white font-black rounded-xl hover:bg-orange-600 transition shadow-xl uppercase flex items-center justify-center gap-2">
                <i class="fa-solid fa-save text-xl"></i> <span id="btnSubmitCRMText" data-i18n="btn_save_crm">LƯU THÔNG TIN KHÁCH HÀNG</span>
            </button>
            <button type="button" id="btnCancelEditCRM" onclick="cancelEditCRM()" class="hidden bg-gray-500 text-white px-6 py-4 rounded-xl font-black text-sm shadow-xl uppercase transition hover:bg-gray-600">
                Hủy
            </button>
        </div>
    </div>
</div>
`;