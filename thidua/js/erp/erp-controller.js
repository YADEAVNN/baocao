// File: js/erp/erp-controller.js

window.initErpModule = async function() {
    const erpContainer = document.getElementById('erp-view');

    // 1. Kiểm tra xem giao diện ERP đã được tải vào chưa (Lazy load)
    if (erpContainer.innerHTML.trim() === '') {
        console.log("Đang tải layout HTML của ERP...");
        try {
            // ĐÃ FIX ĐƯỜNG DẪN: Kéo file từ thư mục js/views/
            const response = await fetch('./js/views/erp-layout.html');
            if (!response.ok) throw new Error("Không tìm thấy file giao diện ERP");
            
            const htmlContent = await response.text();
            
            // Bơm toàn bộ code HTML đó vào thẻ div rỗng
            erpContainer.innerHTML = htmlContent;
        } catch (error) {
            console.error("Lỗi khi tải giao diện:", error);
            erpContainer.innerHTML = `<div class="p-6 text-red-500 font-bold">Lỗi tải giao diện: ${error.message}. Hãy chắc chắn bạn đang chạy bằng Live Server và đúng đường dẫn thư mục js/views/erp-layout.html.</div>`;
            return;
        }
    }

    // 2. Kích hoạt mặc định mở tab Tổng quan thị trường
    if (typeof window.switchErpTab === 'function') {
        window.switchErpTab('market');
    }
};

window.switchErpTab = function(tabName) {
    // 1. Ẩn tất cả Tab
    ['market', 'region', 'sale'].forEach(tab => {
        const el = document.getElementById(`erp-tab-${tab}`);
        if (el) el.classList.add('hidden');
    });

    // 2. Reset style tất cả nút Tab
    const btns = document.querySelectorAll('.erp-tab-btn');
    btns.forEach(btn => {
        btn.classList.remove('text-[#F97316]', 'border-[#F97316]', 'font-black');
        btn.classList.add('text-gray-400', 'border-transparent', 'font-bold');
    });

    // 3. Hiển thị nội dung Tab được chọn
    const activeTab = document.getElementById(`erp-tab-${tabName}`);
    if (activeTab) activeTab.classList.remove('hidden');

    // 4. Highlight nút Tab được chọn
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'border-transparent', 'font-bold');
        activeBtn.classList.add('text-[#F97316]', 'border-[#F97316]', 'font-black');
    }

    // 5. Gọi hàm khởi tạo riêng cho từng Tab
    if (tabName === 'market' && typeof window.initErpMarket === 'function') {
        window.initErpMarket();
    } else if (tabName === 'region' && typeof window.initErpRegion === 'function') {
        window.initErpRegion();
    } else if (tabName === 'sale' && typeof window.initErpSale === 'function') {
        window.initErpSale();
    }
};