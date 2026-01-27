// js/main.js
// IMPORT CÁC THƯ VIỆN FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where, serverTimestamp, addDoc, orderBy, updateDoc, increment, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// IMPORT CẤU HÌNH VÀ TIỆN ÍCH TỪ FILE CỦA BẠN
import { firebaseConfig, categoryConfig, prizes, listViews } from './config.js';
import { shuffleArray, showToast } from './utils.js';

// --- KHỞI TẠO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- BIẾN TOÀN CỤC (STATE) ---
let currentUser = null;
let allLessons = [];
let currentCategory = 'all';
let currentLesson = null;
let currentQuestions = [];
let userAnswers = {};
let currentQIdx = 0;
let quizStartTime = null;
let quizTimerInterval = null;
let studyInterval = null;
let studySeconds = 0;
let isUserActive = true;
let idleTimer = null;
let heroInterval = null;
let heroIndex = 0;
let featuredLessons = [];
let isChatOpen = false;
let currentSubFilter = null;
let isSpinningWheel = false;
let wheelRotation = 0;
let pendingPrizeLabel = "";

// --- PHẦN 1: CÁC HÀM ĐIỀU HƯỚNG & UI (Gán vào window để HTML gọi được) ---

function hideAllViews() {
    listViews.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    const quizBtn = document.getElementById('startQuizBtnContainer');
    if(quizBtn) quizBtn.classList.add('hidden');
    
    const timerBox = document.getElementById('studyTimerBox');
    if(timerBox) timerBox.classList.add('hidden');
    
    const mainScroll = document.getElementById('mainScroll');
    if(mainScroll) mainScroll.scrollTop = 0;
}

window.switchPage = (cat, btnElement) => {
    hideAllViews();
    
    // Xử lý active button sidebar
    if(btnElement) {
        document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.nav-mobile-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        
        // Xử lý submenu sản phẩm
        const btnProductParent = document.getElementById('btnProductParent');
        const subMenu = document.getElementById('product-submenu');
        if (btnElement.id !== 'btnProductParent') {
            if(subMenu) subMenu.classList.add('hidden');
            if(btnProductParent) {
                const arrow = btnProductParent.querySelector('.fa-chevron-down');
                if(arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
    }
    
    currentSubFilter = null;
    const filterBar = document.getElementById('mobileFilterBar');
    
    if (cat === 'results') { 
        loadUserResults();
        currentCategory = 'results'; 
        document.getElementById('resultView').classList.remove('hidden'); 
        if(filterBar) filterBar.classList.add('hidden');
    } else if (cat === 'mygifts') {
        loadMyGifts();
        currentCategory = 'mygifts';
        document.getElementById('myGiftsView').classList.remove('hidden');
        if(filterBar) filterBar.classList.add('hidden');
    } else { 
        document.getElementById('heroSection').classList.remove('hidden');
        document.getElementById('listView').classList.remove('hidden'); 
        
        // Hiển thị filter bar trên mobile nếu là mục Sản phẩm
        if (cat === 'product') { 
            if(filterBar) {
                filterBar.classList.remove('hidden'); 
                filterBar.classList.add('flex');
            }
        } else { 
            if(filterBar) {
                filterBar.classList.add('hidden'); 
                filterBar.classList.remove('flex');
            }
        }
        currentCategory = cat; 
        renderLessons();
    }
};

window.toggleSubMenu = (id, btn) => {
    const el = document.getElementById(id); if(!el) return;
    const arrow = btn.querySelector('.fa-chevron-down');
    const isHidden = el.classList.contains('hidden');
    if (isHidden) { 
        el.classList.remove('hidden'); 
        if(arrow) arrow.style.transform = 'rotate(180deg)'; 
    } else { 
        el.classList.add('hidden');
        if(arrow) arrow.style.transform = 'rotate(0deg)'; 
    }
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); 
    currentCategory = 'product';
    currentSubFilter = null; 
    renderLessons();
};

window.filterSubCategory = (parentCat, keyword) => {
    currentCategory = parentCat;
    currentSubFilter = keyword;
    const subMenu = document.getElementById('product-submenu');
    if(subMenu) {
        const buttons = subMenu.querySelectorAll('button');
        buttons.forEach(b => {
            b.classList.remove('text-white', 'bg-gray-700'); 
            b.classList.add('text-gray-400');
            const btnText = b.textContent.toLowerCase();
            const keyCheck = keyword.replace(/-/g, ' ').toLowerCase();
            if((keyword === '' && btnText.includes('tất cả')) || (keyword !== '' && btnText.includes(keyCheck))) {
                b.classList.remove('text-gray-400'); 
                b.classList.add('text-white', 'bg-gray-700');
            }
        });
    }
    renderLessons();
};

window.applyMobileSubFilter = (keyword, btn) => {
    const parent = document.getElementById('mobileFilterBar');
    parent.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); 
    window.filterSubCategory('product', keyword);
}

// --- PHẦN 2: XỬ LÝ AUTHENTICATION (Đăng nhập/Đăng ký) ---

onAuthStateChanged(auth, async (u) => { 
    currentUser = u; 
    if(u) { 
        const d = await getDoc(doc(db, "users", u.uid)); 
        if(d.exists()) { 
            const data = d.data(); 
            if(data.status === 'pending' || data.status === 'banned') { 
                await signOut(auth); 
                alert(data.status === 'pending' ? "Tài khoản của bạn đang chờ quản trị viên duyệt." : "Tài khoản của bạn đã bị khóa."); 
                return; 
            } 
            document.getElementById('authOverlay').classList.add('hidden'); 
            document.getElementById('userName').textContent = data.name; 
            document.getElementById('userDvn').textContent = data.dvnCode; 
            document.getElementById('chatBtn').classList.remove('hidden'); 
            
            // Tải dữ liệu chính
            loadLessons(); 
            listenToChat(); 
            updateSpinUI();
            checkSystemNotification();
        } 
    } else { 
        document.getElementById('authOverlay').classList.remove('hidden');
    } 
});

// Xử lý sự kiện Đăng nhập/Đăng ký/Đăng xuất
document.getElementById('loginBtn').onclick = async () => { 
    try { 
        await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    } catch(e) { 
        document.getElementById('loginError').textContent = "Lỗi đăng nhập! Kiểm tra email/pass."; 
    } 
};

document.getElementById('registerBtn').onclick = async () => {
    const e = document.getElementById('regEmail').value;
    const p = document.getElementById('regPassword').value;
    const n = document.getElementById('regName').value;
    const d = document.getElementById('regDvn').value;
    const role = document.getElementById('regRole').value;
    
    if(!e||!p||!n||!d||!role) return alert("Điền đủ thông tin!");
    
    try { 
        const c = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "users", c.user.uid), { 
            uid: c.user.uid, email: e, name: n, dvnCode: d, role: role, 
            status: 'pending', createdAt: serverTimestamp(), points: 0, stars: 0 
        });
        await signOut(auth); 
        alert("Đăng ký thành công! Vui lòng chờ quản trị viên duyệt tài khoản."); 
    } catch(err) { 
        alert(err.message);
    }
};

document.getElementById('logoutBtn').onclick = () => signOut(auth); 
document.getElementById('logoutBtnDesktop').onclick = () => signOut(auth);
document.getElementById('openRegister').onclick = () => document.getElementById('registerBox').classList.toggle('hidden');

// --- PHẦN 3: LOGIC BÀI HỌC & HIỂN THỊ ---

async function loadLessons() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const userRole = userData.role || 'learner';
        
        checkLoginBonus(userData); 
        updateUserStatsUI(userData);
        
        const snap = await getDocs(collection(db, "lessons"));
        let rawLessons = snap.docs.map(d => ({id: d.id, ...d.data()}));
        
        // Sắp xếp bài học
        rawLessons.sort((a, b) => {
            const orderA = (a.displayOrder !== undefined && a.displayOrder !== null) ? Number(a.displayOrder) : 9999;
            const orderB = (b.displayOrder !== undefined && b.displayOrder !== null) ? Number(b.displayOrder) : 9999;
            return orderA - orderB;
        });
        
        // Lọc theo quyền hạn (Role)
        allLessons = rawLessons.filter(lesson => {
            const allowedRoles = lesson.targetRoles || ['learner']; 
            if (userRole === 'director') return true;
            if (userRole === 'sale') return allowedRoles.includes('sale') || allowedRoles.includes('learner');
            return allowedRoles.includes('learner');
        });
        
        renderLessons();
        
        // Slide Banner "Nổi bật"
        if(allLessons.length) { 
            featuredLessons = allLessons.slice(0, 5); 
            initHeroCarousel(); 
        }
    } catch (e) { 
        console.error("Lỗi tải bài học:", e); 
    }
}

function renderLessons() { 
    const k = document.getElementById('searchInput').value.toLowerCase();
    const list = document.getElementById('lessonList'); 
    if(currentCategory === 'results') return; 
    
    const filtered = allLessons.filter(l => {
        const matchesSearch = l.title.toLowerCase().includes(k);
        let matchesCategory = false; 
        if (currentCategory === 'all') matchesCategory = true; 
        else if (currentCategory === 'video') matchesCategory = l.contentUrl && (l.contentUrl.includes('youtu') || l.contentUrl.includes('.mp4')); 
        else matchesCategory = l.category === currentCategory;
        
        let matchesSub = true; 
        if (currentSubFilter) { 
            const contentToCheck = (l.title + " " + (l.description||"")).toLowerCase(); 
            matchesSub = contentToCheck.includes(currentSubFilter.toLowerCase()); 
        }
        return matchesSearch && matchesCategory && matchesSub;
    });
    
    document.getElementById('lessonCount').textContent = filtered.length; 
    list.innerHTML = ''; 
    
    filtered.forEach(l => { 
        const card = document.createElement('div'); 
        card.className = "lesson-card bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full"; 
        const catConf = categoryConfig[l.category] || categoryConfig['default'];
        
        card.innerHTML = `
            <div class="h-40 relative group">
                <img src="${l.bannerUrl||l.image}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                <div class="absolute top-3 left-3 ${catConf.color} border text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wide backdrop-blur-sm">${catConf.label}</div>
            </div>
            <div class="p-4 flex-1 flex flex-col">
                <h3 class="font-bold text-sm mb-2 line-clamp-2 text-gray-800">${l.title}</h3>
                <div class="mt-auto text-xs text-gray-400 pt-3 border-t flex justify-between">
                    <span><i class="fa-regular fa-clock"></i> ${l.duration}p</span>
                    <span class="text-orange-600 font-bold">Học ngay <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </div>`;
        card.onclick = () => openLesson(l); 
        list.appendChild(card); 
    }); 
}

// Tìm kiếm bài học
document.getElementById('searchInput').addEventListener('keyup', renderLessons);

// Hàm mở bài học chi tiết
async function openLesson(lesson) { 
    currentLesson = lesson;
    hideAllViews();
    document.getElementById('detailView').classList.remove('hidden'); 
    window.scrollTo({top:0, behavior:'smooth'}); 
    
    document.getElementById('detailTitle').textContent = lesson.title; 
    document.getElementById('detailDesc').innerHTML = lesson.description ? lesson.description.replace(/\n/g, '<br>') : '';
    document.getElementById('detailInfo').textContent = `${lesson.category} • ${lesson.duration} phút`; 
    
    const viewer = document.getElementById('lessonViewer'); 
    const url = lesson.contentUrl;
    
    if(url && url.includes('.pdf')) { 
        viewer.innerHTML = `<iframe src="${url}" class="w-full h-[650px] border-none bg-white"></iframe>`; 
        viewer.classList.remove('aspect-video');
    } else if (url) { 
        let embed = url;
        if(url.includes("watch?v=")) embed = "https://www.youtube.com/embed/" + url.split("watch?v=")[1].split("&")[0]; 
        else if(url.includes("youtu.be/")) embed = "https://www.youtube.com/embed/" + url.split("youtu.be/")[1].split("?")[0]; 
        viewer.classList.add('aspect-video');
        viewer.innerHTML = `<iframe src="${embed}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>`; 
    } else { 
        viewer.innerHTML = '<p class="text-white">Không có nội dung</p>';
    } 
    
    document.getElementById('quizSectionContainer').classList.add('hidden'); 
    document.getElementById('startQuizBtnContainer').classList.add('hidden'); 
    document.getElementById('studyTimerBox').classList.remove('hidden');
    
    const targetSec = lesson.minStudyTime || 300; 
    initStudyTimer(lesson.id, targetSec);
}

document.getElementById('backToListBtn').onclick = () => { 
    hideAllViews(); 
    document.getElementById('heroSection').classList.remove('hidden'); 
    document.getElementById('listView').classList.remove('hidden'); 
    clearInterval(studyInterval); 
    document.getElementById('studyTimerBox').classList.add('hidden'); 
};

// --- PHẦN 4: BANNER SLIDER (QUAN TRỌNG ĐỂ KHÔNG BỊ LOADING...) ---

function initHeroCarousel() { 
    if(featuredLessons.length === 0) return; 
    const c = document.getElementById('heroDots'); 
    c.innerHTML = '';
    featuredLessons.forEach((_, i) => { 
        const d = document.createElement('div'); 
        d.className = `w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${i===0 ? 'bg-orange-500 w-6' : 'bg-white/50 hover:bg-white'}`; 
        d.onclick = () => { heroIndex = i; updateHeroSlide(); resetHeroInterval(); }; 
        c.appendChild(d); 
    });
    updateHeroSlide(); 
    resetHeroInterval(); 
}

function resetHeroInterval() { 
    clearInterval(heroInterval);
    heroInterval = setInterval(() => { 
        heroIndex = (heroIndex + 1) % featuredLessons.length; 
        updateHeroSlide(); 
    }, 5000);
}

function updateHeroSlide() { 
    const l = featuredLessons[heroIndex]; 
    const img = document.getElementById('heroImage'); 
    const t = document.getElementById('heroTitle');
    const d = document.getElementById('heroDesc'); 
    const b = document.getElementById('heroBadge'); 
    
    img.style.opacity = '0'; t.style.opacity = '0'; d.style.opacity = '0'; b.style.opacity = '0';
    
    setTimeout(() => { 
        img.src = l.bannerUrl || l.image; 
        t.textContent = l.title; 
        d.textContent = l.description || ''; 
        b.textContent = l.category; 
        document.getElementById('heroStartBtn').onclick = () => openLesson(l); 
        
        const dots = document.getElementById('heroDots').children; 
        for(let i=0; i<dots.length; i++) 
            dots[i].className = `w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${i===heroIndex ? 'bg-orange-500 w-6' : 'bg-white/50 hover:bg-white'}`; 
            
        img.style.opacity = '0.6'; t.style.opacity = '1'; d.style.opacity = '1'; b.style.opacity = '1'; 
    }, 300);
}

// --- PHẦN 5: BỘ ĐẾM THỜI GIAN HỌC ---

function initStudyTimer(lessonId, targetSeconds) {
    clearInterval(studyInterval);
    studySeconds = 0; 
    isUserActive = true;
    const timerDisplay = document.getElementById('studyTimeDisplay'); 
    const targetDisplay = document.getElementById('studyTargetDisplay');
    
    timerDisplay.textContent = "00:00";
    timerDisplay.className = "font-mono font-bold text-gray-800";
    
    const userRef = doc(db, "users", currentUser.uid);
    getDoc(userRef).then(snap => {
        const history = snap.data().completedActivities || {};
        if(history[`study_${lessonId}`]) { 
            timerDisplay.textContent = "ĐÃ HOÀN THÀNH"; 
            timerDisplay.classList.add('text-green-600');
            targetDisplay.textContent = ""; 
            document.getElementById('startQuizBtnContainer').classList.remove('hidden'); 
            return; 
        }
        
        targetDisplay.textContent = `${Math.floor(targetSeconds/60).toString().padStart(2,'0')}:${(targetSeconds%60).toString().padStart(2,'0')}`;
        
        const resetIdle = () => { 
            isUserActive = true; 
            clearTimeout(idleTimer); 
            idleTimer = setTimeout(() => isUserActive = false, 30000); 
        };
        ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => window.addEventListener(evt, resetIdle)); 
        resetIdle();
        
        studyInterval = setInterval(() => {
            if (isUserActive && !document.hidden) { 
                studySeconds++; 
                const m = Math.floor(studySeconds/60).toString().padStart(2,'0');
                const s = (studySeconds%60).toString().padStart(2,'0'); 
                timerDisplay.textContent = `${m}:${s}`; 
                timerDisplay.classList.add('text-green-600'); 
                
                if (studySeconds >= targetSeconds) { 
                    clearInterval(studyInterval);
                    timerDisplay.textContent = "ĐÃ HOÀN THÀNH"; 
                    targetDisplay.textContent = "";
                    addPoints(10, 'Hoàn thành bài học', 'study', lessonId); 
                    document.getElementById('startQuizBtnContainer').classList.remove('hidden');
                    showToast("Bạn đã hoàn thành bài học!");
                } 
            } else { 
                timerDisplay.classList.remove('text-green-600');
                timerDisplay.classList.add('text-gray-400'); 
            }
        }, 1000);
    });
}

// --- PHẦN 6: LOGIC THI TRẮC NGHIỆM (QUIZ) ---

window.startQuiz = async () => { 
    document.getElementById('startQuizBtnContainer').classList.add('hidden'); 
    document.getElementById('quizSectionContainer').classList.remove('hidden'); 
    document.getElementById('quizSectionContainer').scrollIntoView({behavior:'smooth'}); 
    await initQuiz(currentLesson.id); 
}

async function initQuiz(lid) { 
    const content = document.getElementById('quizContent');
    const pag = document.getElementById('quizPagination'); 
    const result = document.getElementById('quizResult'); 
    const btn = document.getElementById('submitQuizBtn'); 
    
    userAnswers = {}; 
    currentQIdx = 0;
    quizStartTime = new Date(); 
    clearInterval(quizTimerInterval); 
    quizTimerInterval = setInterval(updateTimer, 1000); 
    updateTimer(); 
    
    result.innerHTML = ''; 
    result.classList.add('hidden'); 
    btn.disabled = false;
    btn.innerHTML = '<span>NỘP BÀI</span> <i class="fa-solid fa-paper-plane"></i>'; 
    content.innerHTML = '<p class="text-center text-gray-500 py-10"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải câu hỏi...</p>';
    pag.innerHTML = ''; 
    
    const snap = await getDocs(query(collection(db, "questions"), where("lessonId", "==", lid))); 
    currentQuestions = snap.docs.map(d => ({id: d.id, ...d.data()})); 
    shuffleArray(currentQuestions);
    
    if(!currentQuestions.length) { 
        content.innerHTML = '<p class="text-center italic text-gray-400 py-10">Chưa có câu hỏi.</p>'; 
        btn.disabled = true; 
        clearInterval(quizTimerInterval); 
        return;
    } 
    
    renderPagination(); 
    renderCurrentQuestion();
}

function updateTimer() { 
    const diff = Math.floor((new Date() - quizStartTime) / 1000); 
    document.getElementById('quizTimerDisplay').textContent = `${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`; 
}

function renderPagination() { 
    const pag = document.getElementById('quizPagination');
    pag.innerHTML = ''; 
    currentQuestions.forEach((q, idx) => { 
        const isAnswered = userAnswers[q.id] !== undefined; 
        const isActive = idx === currentQIdx; 
        const btn = document.createElement('button'); 
        let className = 'quiz-nav-btn'; 
        if (isActive) className += ' active'; 
        if (isAnswered) className += ' answered';
        btn.className = className; 
        btn.textContent = idx + 1; 
        btn.onclick = () => { 
            currentQIdx = idx; 
            renderPagination(); 
            renderCurrentQuestion(); 
        }; 
        pag.appendChild(btn); 
    });
}

function renderCurrentQuestion() { 
    const q = currentQuestions[currentQIdx]; 
    let ops = '';
    q.options.forEach((opt, idx) => { 
        const chk = userAnswers[q.id] === idx ? 'checked' : ''; 
        ops += `<label class="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition bg-white shadow-sm mb-2"><input type="radio" name="currentQ" value="${idx}" ${chk} class="mt-1 w-5 h-5 text-orange-600 focus:ring-orange-500 accent-orange-600" onchange="window.selectAnswer('${q.id}', ${idx})"><span class="text-sm text-gray-700 font-medium">${opt}</span></label>`; 
    });
    document.getElementById('quizContent').innerHTML = `<div class="animate-fade-in"><h3 class="text-lg font-bold text-gray-800 mb-6"><span class="text-orange-600">Câu ${currentQIdx + 1}:</span> ${q.text}</h3><div class="flex flex-col">${ops}</div></div>`;
}

window.selectAnswer = (qId, idx) => { userAnswers[qId] = idx; renderPagination(); };

document.getElementById('submitQuizBtn').onclick = async function() { 
    if(!currentUser) return alert("Vui lòng đăng nhập!");
    const ansC = Object.keys(userAnswers).length; 
    if(ansC < currentQuestions.length && !confirm(`Mới làm ${ansC}/${currentQuestions.length} câu. Nộp bài?`)) return; 
    
    let correct = 0;
    currentQuestions.forEach(q => { if(userAnswers[q.id] === q.correctIndex) correct++; }); 
    const totalQ = currentQuestions.length; 
    const score100 = Math.round((correct / totalQ) * 100);
    const isPass = score100 === 100; 
    
    const res = document.getElementById('quizResult');
    res.innerHTML = `<div class="p-6 rounded-xl border-2 ${isPass ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-300 text-red-800'} shadow-sm"><div class="text-4xl font-bold mb-2">${score100} / 100</div><p class="font-medium">${isPass ? '🎉 XUẤT SẮC!' : '😓 THỬ LẠI.'}</p></div>`; 
    res.classList.remove('hidden'); 
    res.scrollIntoView({behavior:'smooth'}); 
    this.disabled = true; 
    this.innerHTML = '...'; 
    clearInterval(quizTimerInterval);
    
    const dur = Math.floor((new Date() - quizStartTime)/1000); 
    try { 
        if (isPass) { 
            await addPoints(50, 'Đạt 100 điểm', 'quiz', currentLesson.id);
            await updateDoc(doc(db, "users", currentUser.uid), { spinsAvailable: increment(1) }); 
        } 
        await addDoc(collection(db, "exam_results"), { 
            uid: currentUser.uid, email: currentUser.email, name: document.getElementById('userName').textContent, 
            dvn: document.getElementById('userDvn').textContent, lessonId: currentLesson.id, lessonTitle: currentLesson.title, 
            score: score100, total: 100, correctCount: correct, questionCount: totalQ, duration: dur, timestamp: serverTimestamp() 
        });
        this.textContent = "Xong"; 
    } catch(e) { console.error(e); } 
};

async function loadUserResults() { 
    hideAllViews(); 
    document.getElementById('resultView').classList.remove('hidden'); 
    const tbody = document.getElementById('myResultTable');
    tbody.innerHTML = '...'; 
    
    const snap = await getDocs(query(collection(db, "exam_results"), where("uid", "==", currentUser.uid))); 
    const results = []; 
    snap.forEach(d => results.push(d.data()));
    results.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); 
    
    tbody.innerHTML = ''; 
    if(results.length === 0) { 
        document.getElementById('emptyResult').classList.remove('hidden');
    } else { 
        document.getElementById('emptyResult').classList.add('hidden'); 
    } 
    
    results.forEach(r => { 
        const date = r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleDateString('vi-VN') : '--/--'; 
        const isPass = r.score === 100; 
        tbody.innerHTML += `<tr class="hover:bg-gray-50 border-b"><td class="p-4 font-medium text-gray-900">${r.lessonTitle}</td><td class="p-4 text-center font-bold text-gray-800">${r.score}/100</td><td class="p-4 text-center text-gray-500">${Math.floor(r.duration/60)}p</td><td class="p-4 text-center text-gray-500">${date}</td><td class="p-4 text-center"><span class="px-2 py-1 rounded text-xs font-bold ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${isPass ? 'Pass' : 'Fail'}</span></td></tr>`; 
    }); 
}

// --- PHẦN 7: TÍCH ĐIỂM & THÔNG TIN USER ---

async function checkLoginBonus(userData) {
    const today = new Date().toISOString().slice(0,10);
    if (userData.lastLoginDate !== today) { 
        await addPoints(5, 'Đăng nhập hàng ngày', 'login'); 
        await updateDoc(doc(db, "users", currentUser.uid), { lastLoginDate: today });
    }
}

async function addPoints(amount, reason, type, relatedId = null) {
    const userRef = doc(db, "users", currentUser.uid);
    const uData = (await getDoc(userRef)).data();
    if (type === 'study' || type === 'quiz') { 
        const h = uData.completedActivities || {};
        if (h[`${type}_${relatedId}`]) return; 
        await updateDoc(userRef, { [`completedActivities.${type}_${relatedId}`]: true, points: increment(amount) }); 
    } else { 
        await updateDoc(userRef, { points: increment(amount) });
    }
    
    const newPoints = (uData.points || 0) + amount; 
    let stars = 0;
    if (newPoints >= 2000) stars = 5; 
    else if (newPoints >= 1600) stars = 4;
    else if (newPoints >= 1200) stars = 3; 
    else if (newPoints >= 800) stars = 2;
    else if (newPoints >= 500) stars = 1;
    
    if (stars !== uData.stars) await updateDoc(userRef, { stars: stars });
    updateUserStatsUI({ ...uData, points: newPoints, stars: stars }); 
    showToast(`🎉 +${amount} Điểm: ${reason}`);
}

function updateUserStatsUI(userData) {
    const pts = userData.points || 0;
    document.getElementById('userPoints').textContent = pts; 
    document.getElementById('userPointsMobile').textContent = pts + ' pts';
    
    const stars = userData.stars || 0; 
    let starStr = '';
    for(let i=0; i<5; i++) starStr += i < stars ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star text-gray-300"></i>';
    let label = stars===1?'Tích cực':(stars===2?'Học khá':(stars===3?'Chăm chỉ':(stars===4?'Nòng cốt':(stars===5?'Xuất sắc':'Cố gắng lên'))));
    document.getElementById('userStars').innerHTML = `${starStr} <span class="ml-1 text-[9px] text-gray-500 font-normal">(${label})</span>`;
    
    const avtUrl = userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
    document.getElementById('headerAvatar').src = avtUrl; 
    document.getElementById('headerAvatarMobile').src = avtUrl;
}

window.openProfileModal = async () => {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const d = userDoc.data();
    document.getElementById('profileNameDisplay').textContent = d.name;
    document.getElementById('profileDvnDisplay').textContent = d.dvnCode;
    document.getElementById('profName').value = d.name || '';
    document.getElementById('profDob').value = d.dob || '';
    document.getElementById('profPhone').value = d.phone || '';
    document.getElementById('profInterest').value = d.interests || '';
    const avtUrl = d.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random`;
    document.getElementById('profileAvatarPreview').src = avtUrl;
    document.getElementById('profileModal').classList.remove('hidden');
}

window.saveProfile = async () => {
    const updates = { 
        name: document.getElementById('profName').value, 
        dob: document.getElementById('profDob').value, 
        phone: document.getElementById('profPhone').value, 
        interests: document.getElementById('profInterest').value 
    };
    await updateDoc(doc(db, "users", currentUser.uid), updates);
    document.getElementById('userName').textContent = updates.name;
    document.getElementById('profileModal').classList.add('hidden');
    showToast("Đã cập nhật hồ sơ!");
}

window.handleImageUpload = (input) => {
    if(!input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 300; let w = img.width, h = img.height;
            if(w > h) { if(w > maxSize){ h*=maxSize/w; w=maxSize; } } else { if(h > maxSize){ w*=maxSize/h; h=maxSize; } }
            canvas.width = w;
            canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            updateDoc(doc(db, "users", currentUser.uid), { avatarUrl: base64 }).then(()=>{
                document.getElementById('profileAvatarPreview').src = base64;
                document.getElementById('headerAvatar').src = base64;
                document.getElementById('headerAvatarMobile').src = base64;
                showToast("Đã thay đổi ảnh đại diện!");
            });
        }
    };
    reader.readAsDataURL(file);
}

// --- PHẦN 8: CHAT & THÔNG BÁO ---

window.toggleChat = () => { 
    isChatOpen = !isChatOpen; 
    const box = document.getElementById('chatBox');
    if (isChatOpen) { 
        box.classList.add('open'); 
        document.getElementById('chatUnreadDot').classList.add('hidden'); 
        if(currentUser) listenToChat(); 
    } else { 
        box.classList.remove('open');
    } 
}

function listenToChat() { 
    onSnapshot(doc(db, "conversations", currentUser.uid), (docSnap) => { 
        if (docSnap.exists()) { renderChatUI(docSnap.data().messages); } 
    });
}

function renderChatUI(messages) { 
    const div = document.getElementById('chatMessages'); 
    div.innerHTML = ''; 
    if(!messages) return;
    messages.forEach(msg => { 
        const isMe = msg.sender === 'student'; 
        div.innerHTML += `<div class="msg-bubble ${isMe ? 'msg-sent' : 'msg-received'}">${msg.text}</div>`; 
    });
    div.scrollTop = div.scrollHeight; 
}

window.sendChatMsg = async () => { 
    const input = document.getElementById('chatInput');
    const txt = input.value.trim(); 
    if(!txt || !currentUser) return; 
    input.value = ''; 
    const chatRef = doc(db, "conversations", currentUser.uid);
    const docSnap = await getDoc(chatRef); 
    
    if (docSnap.exists()) { 
        await updateDoc(chatRef, { messages: arrayUnion({ sender: 'student', text: txt, time: Date.now() }), lastMessage: txt, updatedAt: serverTimestamp(), isReadByAdmin: false });
    } else { 
        await setDoc(chatRef, { uid: currentUser.uid, studentName: document.getElementById('userName').textContent, dvn: document.getElementById('userDvn').textContent, messages: [{ sender: 'student', text: txt, time: Date.now() }], lastMessage: txt, updatedAt: serverTimestamp(), isReadByAdmin: false, isReadByStudent: true });
    } 
}

async function checkSystemNotification() { 
    const d = await getDoc(doc(db, "settings", "global"));
    if (d.exists() && d.data().showNotification) { 
        const mq = document.getElementById('systemMarquee'); 
        const txt = document.getElementById('marqueeText'); 
        mq.classList.remove('hidden'); 
        txt.textContent = d.data().notification;
    } 
}

// --- PHẦN 9: VÒNG QUAY MAY MẮN (Lucky Wheel) ---

window.switchLuckyWheelView = () => { 
    hideAllViews(); 
    document.getElementById('luckyWheelView').classList.remove('hidden'); 
    updateSpinUI(); 
    initWheelUI();
    document.querySelectorAll('.sidebar-item, .nav-mobile-btn').forEach(b => b.classList.remove('active')); 
    const btn = document.querySelector('[data-category="luckywheel"]'); 
    if(btn) btn.classList.add('active'); 
    const mb = document.querySelector('.nav-mobile-btn[onclick="switchLuckyWheelView()"]'); 
    if(mb) mb.classList.add('active'); 
};

function initWheelUI() {
    const wheel = document.getElementById('wheel');
    const labelsContainer = document.getElementById('wheelLabels'); 
    const dotsContainer = document.getElementById('goldDotsContainer');
    
    if(dotsContainer.children.length === 0) { 
        for(let i=0; i<24; i++) { 
            const dot = document.createElement('div'); 
            dot.className = 'gold-dot';
            const angle = (i * (360/24)) * (Math.PI / 180);
            const r = window.innerWidth < 768 ? 165 : 232;
            dot.style.left = `calc(50% + ${Math.cos(angle) * r}px - 7px)`; 
            dot.style.top = `calc(50% + ${Math.sin(angle) * r}px - 7px)`; 
            dotsContainer.appendChild(dot);
        } 
    }
    
    let gradientStr = ""; 
    labelsContainer.innerHTML = '';
    const segAngle = 360 / prizes.length; 
    
    prizes.forEach((p, i) => { 
        gradientStr += `${p.color} ${i * segAngle}deg ${(i + 1) * segAngle}deg,`; 
        const label = document.createElement('div'); 
        label.className = 'wheel-label'; 
        label.innerHTML = `<i class="fa-solid ${p.icon}"></i><span>${p.label.replace(/\n/g, '<br/>')}</span>`; 
        label.style.color = p.text; 
        const dist = window.innerWidth < 768 ? -70 : -110;
        label.style.transform = `rotate(${i * segAngle + segAngle / 2}deg) translateY(${dist}px)`; 
        labelsContainer.appendChild(label); 
    });
    
    wheel.style.background = `conic-gradient(${gradientStr.slice(0, -1)})`;
}

async function updateSpinUI() { 
    if(!currentUser) return;
    const d = await getDoc(doc(db, "users", currentUser.uid)); 
    const s = d.data().spinsAvailable || 0; 
    document.getElementById('availableSpinsText').textContent = s; 
    document.getElementById('spinBadge').textContent = s;
    document.getElementById('spinBadge').classList.toggle('hidden', s === 0); 
    if(document.getElementById('spinBadgeMobile')) { 
        document.getElementById('spinBadgeMobile').textContent = s;
        document.getElementById('spinBadgeMobile').classList.toggle('hidden', s === 0); 
    } 
}

window.spinNow = async () => {
    if (isSpinningWheel) return;
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const spins = userSnap.data().spinsAvailable || 0;
    
    if (spins <= 0) return showToast("😓 Hết lượt quay! Hãy đạt 100đ bài thi.");
    
    const randomVal = Math.random() * 100;
    let cumulative = 0, winIdx = 0;
    for (let i = 0; i < prizes.length; i++) { 
        cumulative += prizes[i].chance;
        if (randomVal < cumulative) { winIdx = i; break; } 
    }
    
    pendingPrizeLabel = prizes[winIdx].label.replace(/\n/g, ' ');
    
    try {
        isSpinningWheel = true;
        document.getElementById('spinBtn').disabled = true;
        await updateDoc(userRef, { spinsAvailable: increment(-1) });
        
        const prizeDoc = await addDoc(collection(db, "spin_history"), {
            uid: currentUser.uid, name: document.getElementById('userName').textContent, 
            dvn: document.getElementById('userDvn').textContent, prize: pendingPrizeLabel, 
            timestamp: serverTimestamp(), status: 'pending', shippingName: "", shippingPhone: "", shippingAddress: ""
        });
        
        window.currentPrizeDocId = prizeDoc.id;
        updateSpinUI();
        
        const segmentDeg = 360 / prizes.length;
        const stopDeg = (8 * 360) + (360 - (winIdx * segmentDeg)) - (segmentDeg / 2);
        wheelRotation = stopDeg;
        
        const wheel = document.getElementById('wheel');
        wheel.style.transform = `rotate(${wheelRotation}deg)`;
        
        let tS = document.getElementById('tickSound');
        let tInt = setInterval(() => { tS.currentTime = 0; tS.play(); }, 300);
        setTimeout(() => clearInterval(tInt), 4000);
        
        setTimeout(() => {
            document.getElementById('winSound').play();
            isSpinningWheel = false;
            document.getElementById('winPrizeName').textContent = pendingPrizeLabel;
            document.getElementById('shipName').value = document.getElementById('userName').textContent;
            document.getElementById('winnerInfoModal').classList.remove('hidden');
        }, 6200);
    } catch (e) { 
        isSpinningWheel = false; 
        document.getElementById('spinBtn').disabled = false;
        alert("Lỗi mạng! Lượt quay chưa bị trừ. Vui lòng thử lại."); 
    }
};

window.submitPrizeInfo = async () => {
    const n = document.getElementById('shipName').value.trim();
    const p = document.getElementById('shipPhone').value.trim();
    const a = document.getElementById('shipAddress').value.trim();
    
    if(!n || !p || !a) return alert("Vui lòng nhập đầy đủ thông tin nhận quà!");
    
    const btn = document.querySelector('#winnerInfoModal button');
    btn.textContent = "Đang xử lý..."; 
    btn.disabled = true;
    
    try {
        await updateDoc(doc(db, "spin_history", window.currentPrizeDocId), { shippingName: n, shippingPhone: p, shippingAddress: a });
        document.getElementById('winnerInfoModal').classList.add('hidden');
        alert("✅ Đã ghi nhận thông tin nhận quà!");
        if (currentCategory === 'mygifts') loadMyGifts();
    } catch(e) { 
        alert("Lỗi kết nối, vui lòng thử lại!"); 
    } finally { 
        btn.textContent = "XÁC NHẬN NHẬN QUÀ";
        btn.disabled = false; 
    }
};

// Hàm tải lịch sử quà tặng
async function loadMyGifts() {
    if (!currentUser) return;
    const tbody = document.getElementById('myGiftsTable');
    const empty = document.getElementById('emptyGifts');
    tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400">Đang tải lịch sử quà tặng...</td></tr>';
    
    try {
        const q = query(collection(db, "spin_history"), where("uid", "==", currentUser.uid), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        tbody.innerHTML = '';
        
        if (snap.empty) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        
        snap.forEach(d => {
            const data = d.data();
            const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('vi-VN') : '--/--';
            const isSent = data.status === 'sent';
            const hasInfo = data.shippingName && data.shippingPhone && data.shippingAddress;
            
            let statusHtml = isSent 
                ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Đã trao</span>'
                : '<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold uppercase">Chờ trao</span>';
            
            const actionBtn = !isSent 
                ? `<button onclick="updateOldGiftInfo('${d.id}', '${data.prize}')" class="text-blue-600 font-bold hover:underline text-xs flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> ${hasInfo ? 'Sửa' : 'Cập nhật'}</button>` 
                : '<span class="text-gray-300 text-xs italic">Hoàn tất</span>';
                
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="p-4 text-xs text-gray-500">${date}</td>
                    <td class="p-4 font-bold text-gray-800">${data.prize}</td>
                    <td class="p-4 text-center">${statusHtml}</td>
                    <td class="p-4 text-right">${actionBtn}</td>
                </tr>`;
        });
    } catch(e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500 text-xs">Lỗi tải dữ liệu. Hãy tạo Index trên Firebase.</td></tr>'; 
    }
}

window.updateOldGiftInfo = async (docId, prizeName) => {
    window.currentPrizeDocId = docId;
    document.getElementById('winPrizeName').textContent = prizeName;
    
    const docSnap = await getDoc(doc(db, "spin_history", docId));
    if(docSnap.exists()) {
        const d = docSnap.data();
        document.getElementById('shipName').value = d.shippingName || document.getElementById('userName').textContent;
        document.getElementById('shipPhone').value = d.shippingPhone || '';
        document.getElementById('shipAddress').value = d.shippingAddress || '';
    }
    document.getElementById('winnerInfoModal').classList.remove('hidden');
};