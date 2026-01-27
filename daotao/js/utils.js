// js/utils.js

// Hàm xáo trộn mảng (Dùng cho câu hỏi trắc nghiệm)
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Hàm hiển thị thông báo (Toast)
export function showToast(msg) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = "toast show bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce";
    t.innerHTML = `<i class="fa-solid fa-gift text-yellow-400 text-xl"></i> <span class="font-bold text-sm">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 4000);
}