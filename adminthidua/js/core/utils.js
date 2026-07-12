export const $ = id => document.getElementById(id);

export const fmn = n => new Intl.NumberFormat('vi-VN').format(Math.round(n));

export const safeVal = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseInt(v.replace(/[\.,]/g, '')) || 0;
    return 0;
};

export function removeVietnameseTones(str) {
    if(!str) return "";
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/-/g, " "); 
    str = str.replace(/[^a-zA-Z0-9 ]/g, ""); 
    return str;
}

export function formatMonth(raw) { 
    if(!raw) return ""; 
    if (!isNaN(raw) || (typeof raw === 'string' && raw.length <= 2)) { 
        let m = parseInt(raw);
        if (m > 0 && m <= 12) { 
            const y = new Date().getFullYear(); 
            return `${y}-${String(m).padStart(2, '0')}`;
        } 
    } 
    if(typeof raw === 'string') return raw.trim(); 
    return raw;
}

export const toggleModal = (modalId) => { 
    const body = document.querySelector('body');
    const modal = document.getElementById(modalId); 
    modal.classList.toggle('opacity-0'); 
    modal.classList.toggle('pointer-events-none'); 
    body.classList.toggle('modal-active'); 
}