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
    // 1. Ẩn tất cả các nội dung tab
    document.getElementById('erp-tab-market')?.classList.add('hidden');
    document.getElementById('erp-tab-region')?.classList.add('hidden');
    document.getElementById('erp-tab-sale')?.classList.add('hidden');

    // 2. Reset style của tất cả các nút tab
    const btns = document.querySelectorAll('.erp-tab-btn');
    btns.forEach(btn => {
        btn.classList.remove('text-[#F97316]', 'border-[#F97316]');
        btn.classList.add('text-gray-500', 'border-transparent');
    });

    // 3. Hiển thị nội dung tab được chọn
    const activeTab = document.getElementById(`erp-tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }

    // 4. Đổi màu nút tab được chọn (Active state)
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-[#F97316]', 'border-[#F97316]');
    }

    // 5. Kích hoạt render dữ liệu tương ứng cho từng tab
    if (tabName === 'market' && window.initErpMarket) {
        window.initErpMarket();
    } else if (tabName === 'region' && window.initErpRegion) {
        window.initErpRegion();
    } else if (tabName === 'sale' && window.initErpSale) {
        window.initErpSale();
    }
};