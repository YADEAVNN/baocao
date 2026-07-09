export const mediaHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1000px] mx-auto">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase" data-i18n="title_media">2. Báo Cáo Truyền Thông</h1>
        </div>
    </div>
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4 relative">
        <div id="editMediaBanner" class="hidden absolute -top-3 right-4 bg-[#F97316] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow">Đang chỉnh sửa</div>
        <input type="hidden" id="editMediaId" value="">

        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
                <label class="form-label text-blue-600" data-i18n="lbl_date_exec">Ngày Thực Hiện</label>
                <input type="date" id="media_date" class="form-input bg-blue-50 font-bold">
            </div>
            <div class="flex-1">
                <label class="form-label text-orange-600" data-i18n="lbl_shop">Cửa Hàng (Shop)</label>
                <div class="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-3">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0"><i class="fa-solid fa-store"></i></div>
                    <div class="flex-1 overflow-hidden">
                        <select id="select_shop_media" onchange="window.changeInputShop(this.value)" class="w-full bg-transparent font-black text-slate-800 text-sm outline-none cursor-pointer truncate">
                            <option value="">Vui lòng đợi...</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-4 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <h3 class="font-black text-blue-800 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-mobile-screen"></i> <span data-i18n="lbl_online">Online</span>
                </h3>

                 <div>
                    <label class="form-label text-blue-600" data-i18n="lbl_video_content">Nội Dung Video</label>
                    <select id="media_content" class="form-input bg-white font-bold text-sm">
                        <option value="">-- Chọn chủ đề --</option>
                        <option value="Review sản phẩm" data-i18n="opt_content_review">1. Review sản phẩm</option>
                        <option value="Ảnh xe + nhạc" data-i18n="opt_content_photo_music">2. Ảnh xe + nhạc</option>
                        <option value="Bảo dưỡng - hậu mãi" data-i18n="opt_content_maintenance">3. Bảo dưỡng - hậu mãi</option>
                        <option value="Gương mặt thương hiệu" data-i18n="opt_content_brand_face">4. Gương mặt thương hiệu</option>
                    </select>
                </div>

                <div>
                    <label class="form-label" data-i18n="lbl_tiktok_qty">Số lượng Video TikTok</label>
                    <input type="number" id="media_tiktok" class="form-input" data-i18n="ph_tiktok" placeholder="Nhập số lượng...">
                </div>
                <div>
                    <label class="form-label" data-i18n="lbl_views">Lượt View (Tích lũy)</label>
                    <input type="number" id="media_views" class="form-input" placeholder="0">
                </div>
                <div>
                    <label class="form-label" data-i18n="lbl_cost">Chi phí MKT (VNĐ)</label>
                    <input type="text" id="media_cost" class="form-input" oninput="window.formatCurrency(this)" placeholder="0đ">
                </div>
                <div>
                    <label class="form-label" data-i18n="lbl_livestream">Livestream (Số giờ)</label>
                    <input type="number" step="0.1" id="media_livestream" class="form-input" data-i18n="ph_live" placeholder="Ví dụ: 1.5">
                </div>
                <div>
                    <label class="form-label" data-i18n="lbl_tiktok_link">Link TikTok / Nguồn</label>
                    <div id="media_link_container" class="space-y-2">
                        <input type="text" class="media-link-input form-input" data-i18n="ph_link" placeholder="https://tiktok.com/...">
                    </div>
                    <button type="button" onclick="window.addMediaLink()" class="mt-2 text-[11px] font-black text-[#F97316] hover:text-orange-700 transition flex items-center gap-1 uppercase tracking-wide">
                        <i class="fa-solid fa-plus"></i> Thêm Link
                    </button>
                </div>
            </div>
            <div class="space-y-4 bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                <h3 class="font-black text-emerald-800 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-street-view"></i> <span data-i18n="lbl_offline">Offline</span>
                </h3>
                <div>
                    <label class="form-label" data-i18n="lbl_flyer">Phát tờ rơi (Số giờ)</label>
                    <input type="number" step="0.1" id="media_flyer" class="form-input" data-i18n="ph_flyer" placeholder="Ví dụ: 2.5">
                </div>
                <div>
                    <label class="form-label" data-i18n="lbl_event_note">Ghi chú sự kiện</label>
                    <textarea id="media_notes" class="form-input h-[116px]" data-i18n="ph_note" placeholder="Ghi chú chi tiết..."></textarea>
                </div>
            </div>
        </div>

        <div class="flex gap-2">
            <button type="button" onclick="submitMediaReport()" id="btnSubmitMedia" class="flex-1 py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-[#F97316] flex items-center justify-center gap-2 transition shadow-lg">
                <i class="fa-solid fa-paper-plane text-xl"></i> <span id="btnSubmitMediaText" data-i18n="btn_save_report">LƯU BÁO CÁO</span>
            </button>
            <button type="button" id="btnCancelEditMedia" onclick="cancelEditMedia()" class="hidden bg-gray-500 text-white px-6 py-4 rounded-xl font-black text-sm shadow-xl uppercase transition hover:bg-gray-600">
                Hủy
            </button>
        </div>
    </div>
</div>
`;