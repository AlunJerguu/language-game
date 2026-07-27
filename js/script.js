// js/script.js

let gameSets = JSON.parse(localStorage.getItem('gameSets')) || [
    {
        id: 1,
        title: '🇨🇳 คำศัพท์จีน หมวดทักทาย',
        language: 'chinese',
        words: [
            { chinese: '你好', pinyin: 'nǐ hǎo', thaiRead: 'หนีห่าว', meaning: 'สวัสดี' },
            { chinese: '谢谢', pinyin: 'xièxie', thaiRead: 'เซี่ยเซีย', meaning: 'ขอบคุณ' },
            { chinese: '再见', pinyin: 'zàijiàn', thaiRead: 'ไจ้เจี้ยน', meaning: 'ลาก่อน' },
            { chinese: '对不起', pinyin: 'duìbuqǐ', thaiRead: 'ตุ้ยปู้ฉี่', meaning: 'ขอโทษ' }
        ]
    },
    {
        id: 2,
        title: '🇺🇸 คำศัพท์อังกฤษ หมวดพื้นฐาน',
        language: 'english',
        words: [
            { chinese: 'Apple', pinyin: 'แอพเพิล', thaiRead: 'แอพเพิล', meaning: 'แอปเปิ้ล' },
            { chinese: 'Cat', pinyin: 'แคท', thaiRead: 'แคท', meaning: 'แมว' },
            { chinese: 'Book', pinyin: 'บุ๊ค', thaiRead: 'บุ๊ค', meaning: 'หนังสือ' }
        ]
    },
    {
        id: 3,
        title: '🇻🇳 คำศัพท์เวียดนาม หมวดพื้นฐาน',
        language: 'vietnamese',
        words: [
            { chinese: 'Xin chào', pinyin: 'ซินจ่าว', thaiRead: 'ซินจ่าว', meaning: 'สวัสดี' },
            { chinese: 'Cảm ơn', pinyin: 'คัมเอิน', thaiRead: 'คัมเอิน', meaning: 'ขอบคุณ' },
            { chinese: 'Tạm biệt', pinyin: 'ต๋ามเบี๋ยต', thaiRead: 'ต๋ามเบี๋ยต', meaning: 'ลาก่อน' }
        ]
    }
];

let playHistory = JSON.parse(localStorage.getItem('playHistory')) || [];

let currentEditingSetId = null;
let currentLanguage = '';
let tempWords = [];
let activeGameSet = null;

// ตัวแปรกรองสำหรับหน้า Library
let currentLibraryFilter = 'all';
let currentLibraryTopic = 'all';

// ตัวแปรกรองสำหรับหน้า Vocab Library
let currentVocabFilter = 'all';
let currentVocabTopic = 'all';

let quizQuestions = [];
let quizCurrentIndex = 0;
let quizScore = 0;

let matchCards = [];
let firstSelectedCard = null;
let matchMatchedCount = 0;
let matchTotalPairs = 0;

let scrambleQuestions = [];
let scrambleCurrentIndex = 0;
let scrambleScore = 0;
let currentScrambleLetters = [];
let userSelectedLetters = [];

let speedQuestions = [];
let speedCurrentIndex = 0;
let speedScore = 0;
let speedTimer = null;
let timeLeft = 5;
const maxTimePerQuestion = 5;

// ⏱️ ตัวแปรควบคุมเวลา 30 วินาที
let globalTimer = null;
let globalTimeLeft = 30;
const totalGameTime = 30;

// Web Audio API เสียงเอฟเฟกต์
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const oscWin = audioCtx.createOscillator();
            const gainWin = audioCtx.createGain();
            oscWin.connect(gainWin);
            gainWin.connect(audioCtx.destination);
            oscWin.type = 'sine';
            oscWin.frequency.setValueAtTime(freq, now + index * 0.12);
            gainWin.gain.setValueAtTime(0.3, now + index * 0.12);
            gainWin.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.3);
            oscWin.start(now + index * 0.12);
            oscWin.stop(now + index * 0.12 + 0.3);
        });
    }
}

function triggerConfetti() {
    playSound('win');
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

document.addEventListener('DOMContentLoaded', () => {
    showSection('homeSection');
    renderLibrary();
    renderHomeHistory();

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        playSound('click');
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill text-warning';
        } else {
            themeIcon.className = 'bi bi-moon-fill';
        }
    }

    document.getElementById('navHome').addEventListener('click', (e) => {
        e.preventDefault();
        playSound('click');
        stopGlobalTimer();
        stopSpeedTimer();
        showSection('homeSection');
        renderHomeHistory();
    });

    document.getElementById('navLibrary').addEventListener('click', (e) => {
        e.preventDefault();
        playSound('click');
        stopGlobalTimer();
        stopSpeedTimer();
        showSection('librarySection');
        currentLibraryFilter = 'all';
        currentLibraryTopic = 'all';
        document.getElementById('libraryLangDropdownBtn').innerHTML = `<span><i class="bi bi-translate text-primary"></i> ทั้งหมดทุกภาษา</span>`;
        document.getElementById('libraryTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-warning"></i> เลือกหัวข้อทั้งหมด</span>`;
        renderLibraryTopicDropdown();
        renderLibrary();
    });

    const navVocabList = document.getElementById('navVocabList');
    if (navVocabList) {
        navVocabList.addEventListener('click', (e) => {
            e.preventDefault();
            playSound('click');
            stopGlobalTimer();
            stopSpeedTimer();
            showSection('vocabListSection');
            currentVocabFilter = 'all';
            currentVocabTopic = 'all';
            document.getElementById('vocabLangDropdownBtn').innerHTML = `<span><i class="bi bi-translate text-primary"></i> ทั้งหมดทุกภาษา</span>`;
            document.getElementById('vocabTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-info"></i> เลือกหัวข้อทั้งหมด</span>`;
            renderVocabTopicDropdown();
            renderAllVocabLibrary();
        });
    }

    document.getElementById('navLogo').addEventListener('click', (e) => {
        e.preventDefault();
        playSound('click');
        stopGlobalTimer();
        stopSpeedTimer();
        showSection('homeSection');
        renderHomeHistory();
    });

    document.getElementById('addWordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('click');
        const chinese = document.getElementById('inputChinese').value.trim();
        const pinyin = document.getElementById('inputPinyin').value.trim();
        const thaiRead = document.getElementById('inputThaiRead').value.trim();
        const meaning = document.getElementById('inputMeaning').value.trim();

        if (!chinese || !pinyin || !thaiRead || !meaning) return;

        tempWords.push({ chinese, pinyin, thaiRead, meaning });
        renderTempWords();
        e.target.reset();
        document.getElementById('inputChinese').focus();
    });

    document.getElementById('addEnglishWordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('click');
        const word = document.getElementById('inputEnglishWord').value.trim();
        const thaiRead = document.getElementById('inputEnglishThaiRead').value.trim();
        const meaning = document.getElementById('inputEnglishMeaning').value.trim();

        if (!word || !thaiRead || !meaning) return;

        tempWords.push({ chinese: word, pinyin: thaiRead, thaiRead: thaiRead, meaning: meaning });
        renderEnglishTempWords();
        e.target.reset();
        document.getElementById('inputEnglishWord').focus();
    });

    document.getElementById('addVietnameseWordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('click');
        const word = document.getElementById('inputVietnameseWord').value.trim();
        const thaiRead = document.getElementById('inputVietnameseThaiRead').value.trim();
        const meaning = document.getElementById('inputVietnameseMeaning').value.trim();

        if (!word || !thaiRead || !meaning) return;

        tempWords.push({ chinese: word, pinyin: thaiRead, thaiRead: thaiRead, meaning: meaning });
        renderVietnameseTempWords();
        e.target.reset();
        document.getElementById('inputVietnameseWord').focus();
    });

    document.getElementById('saveGameSetBtn').addEventListener('click', () => {
        playSound('click');
        saveGameSetData('chinese');
    });

    document.getElementById('saveEnglishGameSetBtn').addEventListener('click', () => {
        playSound('click');
        saveGameSetData('english');
    });

    document.getElementById('saveVietnameseGameSetBtn').addEventListener('click', () => {
        playSound('click');
        saveGameSetData('vietnamese');
    });
});

// ⏱️ ระบบจับเวลาภาพรวม 30 วินาที
function startGlobalTimer(callbackWhenTimesUp, progressBarId) {
    stopGlobalTimer();
    globalTimeLeft = totalGameTime;
    updateGlobalProgressBar(progressBarId);

    globalTimer = setInterval(() => {
        globalTimeLeft -= 0.1;
        updateGlobalProgressBar(progressBarId);

        if (globalTimeLeft <= 0) {
            stopGlobalTimer();
            playSound('wrong');
            if (callbackWhenTimesUp) callbackWhenTimesUp();
        }
    }, 100);
}

function stopGlobalTimer() {
    if (globalTimer) {
        clearInterval(globalTimer);
        globalTimer = null;
    }
}

function updateGlobalProgressBar(barId) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    let percentage = (globalTimeLeft / totalGameTime) * 100;
    bar.style.width = `${percentage}%`;

    if (percentage > 50) {
        bar.className = "progress-bar bg-primary progress-bar-striped progress-bar-animated";
    } else if (percentage > 25) {
        bar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated";
    } else {
        bar.className = "progress-bar bg-danger progress-bar-striped progress-bar-animated";
    }
}

// 🔽 ฟังก์ชันกรองหน้า Library
function filterLibraryLanguage(lang, langTitle, itemElement) {
    playSound('click');
    currentLibraryFilter = lang;
    currentLibraryTopic = 'all';

    document.getElementById('libraryLangDropdownBtn').innerHTML = `<span><i class="bi bi-translate text-primary"></i> ${langTitle}</span>`;
    document.getElementById('libraryTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-warning"></i> เลือกหัวข้อทั้งหมด</span>`;

    document.querySelectorAll('#libraryLangDropdownList .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    itemElement.classList.add('active');

    renderLibraryTopicDropdown();
    renderLibrary();
}

function filterLibraryTopic(topicId, topicTitle, itemElement) {
    playSound('click');
    currentLibraryTopic = topicId;

    document.getElementById('libraryTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-warning"></i> ${topicTitle}</span>`;

    document.querySelectorAll('#libraryTopicDropdownList .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    itemElement.classList.add('active');

    renderLibrary();
}

function renderLibraryTopicDropdown() {
    const dropdownList = document.getElementById('libraryTopicDropdownList');
    if (!dropdownList) return;

    let filteredSets = gameSets;
    if (currentLibraryFilter !== 'all') {
        filteredSets = gameSets.filter(set => set.language === currentLibraryFilter);
    }

    let html = `<li><a class="dropdown-item rounded-3 py-2 px-3 fw-semibold ${currentLibraryTopic === 'all' ? 'active' : ''}" href="#" onclick="filterLibraryTopic('all', 'เลือกหัวข้อทั้งหมด', this)">เลือกหัวข้อทั้งหมด</a></li>`;

    filteredSets.forEach(set => {
        let activeClass = (currentLibraryTopic === set.id) ? 'active' : '';
        html += `<li><a class="dropdown-item rounded-3 py-2 px-3 fw-semibold ${activeClass}" href="#" onclick="filterLibraryTopic(${set.id}, '${set.title}', this)">${set.title}</a></li>`;
    });

    dropdownList.innerHTML = html;
}

// 🔽 ฟังก์ชันกรองหน้า Vocab Library
function filterVocabLanguage(lang, langTitle, itemElement) {
    playSound('click');
    currentVocabFilter = lang;
    currentVocabTopic = 'all';

    document.getElementById('vocabLangDropdownBtn').innerHTML = `<span><i class="bi bi-translate text-primary"></i> ${langTitle}</span>`;
    document.getElementById('vocabTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-info"></i> เลือกหัวข้อทั้งหมด</span>`;

    document.querySelectorAll('#vocabLangDropdownList .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    itemElement.classList.add('active');

    renderVocabTopicDropdown();
    renderAllVocabLibrary();
}

function filterVocabTopic(topicId, topicTitle, itemElement) {
    playSound('click');
    currentVocabTopic = topicId;

    document.getElementById('vocabTopicDropdownBtn').innerHTML = `<span><i class="bi bi-filter-left text-info"></i> ${topicTitle}</span>`;

    document.querySelectorAll('#vocabTopicDropdownList .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    itemElement.classList.add('active');

    renderAllVocabLibrary();
}

function renderVocabTopicDropdown() {
    const dropdownList = document.getElementById('vocabTopicDropdownList');
    if (!dropdownList) return;

    let filteredSets = gameSets;
    if (currentVocabFilter !== 'all') {
        filteredSets = gameSets.filter(set => set.language === currentVocabFilter);
    }

    let html = `<li><a class="dropdown-item rounded-3 py-2 px-3 fw-semibold ${currentVocabTopic === 'all' ? 'active' : ''}" href="#" onclick="filterVocabTopic('all', 'เลือกหัวข้อทั้งหมด', this)">เลือกหัวข้อทั้งหมด</a></li>`;

    filteredSets.forEach(set => {
        let activeClass = (currentVocabTopic === set.id) ? 'active' : '';
        html += `<li><a class="dropdown-item rounded-3 py-2 px-3 fw-semibold ${activeClass}" href="#" onclick="filterVocabTopic(${set.id}, '${set.title}', this)">${set.title}</a></li>`;
    });

    dropdownList.innerHTML = html;
}

function renderLibrary() {
    const container = document.getElementById('libraryListContainer');
    if (!container) return;

    renderLibraryTopicDropdown();

    let filteredSets = gameSets;
    if (currentLibraryFilter !== 'all') {
        filteredSets = filteredSets.filter(set => set.language === currentLibraryFilter);
    }
    if (currentLibraryTopic !== 'all') {
        filteredSets = filteredSets.filter(set => set.id === currentLibraryTopic);
    }

    if (filteredSets.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>ยังไม่มีชุดเกมในคลัง</p></div>`;
        return;
    }

    container.innerHTML = filteredSets.map(set => {
        let badgeClass = 'bg-danger-subtle text-danger';
        let langText = '🇨🇳 ภาษาจีน';
        if (set.language === 'english') {
            badgeClass = 'bg-primary-subtle text-primary';
            langText = '🇺🇸 ภาษาอังกฤษ';
        } else if (set.language === 'vietnamese') {
            badgeClass = 'bg-secondary-subtle text-dark';
            langText = '🇻🇳 ภาษาเวียดนาม';
        }

        return `
            <div class="col-12 col-md-6">
                <div class="card shadow-sm border-0 rounded-4 h-100">
                    <div class="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge ${badgeClass} px-3 py-2">${langText}</span>
                                <span class="text-muted small fw-semibold"><i class="bi bi-collection"></i> ${set.words.length} คำ</span>
                            </div>
                            <h4 class="fw-bold mb-3">${set.title}</h4>
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-primary flex-grow-1 rounded-pill fw-bold py-2 shadow-sm" onclick="playSound('click'); openPlayModeModal(${set.id})">
                                <i class="bi bi-play-fill"></i> เล่นเกม
                            </button>
                            <button class="btn btn-outline-secondary rounded-circle" onclick="playSound('click'); viewDetails(${set.id})" title="ดูคำศัพท์" style="width: 40px; height: 40px;"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-outline-secondary rounded-circle" onclick="playSound('click'); editGameSet(${set.id})" title="แก้ไข" style="width: 40px; height: 40px;"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-outline-danger rounded-circle" onclick="playSound('click'); deleteGameSet(${set.id})" title="ลบ" style="width: 40px; height: 40px;"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAllVocabLibrary() {
    const container = document.getElementById('allVocabContainer');
    if (!container) return;

    renderVocabTopicDropdown();

    let filteredSets = gameSets;
    if (currentVocabFilter !== 'all') {
        filteredSets = filteredSets.filter(set => set.language === currentVocabFilter);
    }
    if (currentVocabTopic !== 'all') {
        filteredSets = filteredSets.filter(set => set.id === currentVocabTopic);
    }

    if (filteredSets.length === 0) {
        container.innerHTML = `<div class="card shadow-sm border-0 rounded-4 p-4 text-center text-muted"><p class="m-0">ยังไม่มีคำศัพท์ในหมวดหมู่นี้</p></div>`;
        return;
    }

    let html = '';
    filteredSets.forEach(set => {
        let badgeClass = 'bg-danger-subtle text-danger';
        let langText = '🇨🇳 ภาษาจีน';
        if (set.language === 'english') {
            badgeClass = 'bg-primary-subtle text-primary';
            langText = '🇺🇸 ภาษาอังกฤษ';
        } else if (set.language === 'vietnamese') {
            badgeClass = 'bg-secondary-subtle text-dark';
            langText = '🇻🇳 ภาษาเวียดนาม';
        }

        html += `
            <div class="card shadow-sm border-0 rounded-4 overflow-hidden mb-3">
                <div class="card-header bg-body-tertiary px-4 py-3 d-flex justify-content-between align-items-center border-0">
                    <h5 class="fw-bold m-0">${set.title}</h5>
                    <span class="badge ${badgeClass} px-3 py-2">${langText} (${set.words.length} คำ)</span>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-4 text-secondary small fw-bold">คำศัพท์</th>
                                <th class="text-secondary small fw-bold">คำอ่าน / พินอิน</th>
                                <th class="pe-4 text-secondary small fw-bold">ความหมาย</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${set.words.map(w => `
                                <tr>
                                    <td class="ps-4 fw-bold text-primary fs-5">${w.chinese}</td>
                                    <td><span class="text-secondary fw-semibold">${w.thaiRead}</span> ${w.pinyin && w.pinyin !== w.thaiRead ? `<small class="text-muted">(${w.pinyin})</small>` : ''}</td>
                                    <td class="pe-4 fw-bold text-success">${w.meaning}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function saveGameSetData(lang) {
    let titleId = 'gameTitleInput';
    if (lang === 'english') titleId = 'gameEnglishTitleInput';
    if (lang === 'vietnamese') titleId = 'gameVietnameseTitleInput';

    const title = document.getElementById(titleId).value.trim();

    if (!title) { alert('กรุณาตั้งชื่อชุดเกมก่อนบันทึกครับ'); return; }
    if (tempWords.length === 0) { alert('กรุณาเพิ่มคำศัพท์อย่างน้อย 1 คำครับ'); return; }

    if (currentEditingSetId) {
        const setIndex = gameSets.findIndex(s => s.id === currentEditingSetId);
        if (setIndex !== -1) {
            gameSets[setIndex].title = title;
            gameSets[setIndex].words = [...tempWords];
        }
    } else {
        gameSets.push({
            id: Date.now(),
            title: title,
            language: lang,
            words: [...tempWords]
        });
    }

    localStorage.setItem('gameSets', JSON.stringify(gameSets));
    renderLibrary();
    showSection('librarySection');
    alert('บันทึกชุดคำศัพท์สำเร็จ!');
}

function showSection(sectionId) {
    const sections = [
        'homeSection', 'createChineseSection', 'createEnglishSection', 'createVietnameseSection', 
        'librarySection', 'vocabListSection', 'importChineseSection', 'importEnglishSection', 'importVietnameseSection', 
        'quizSection', 'matchSection', 'scrambleSection', 'speedSection'
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === sectionId) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        }
    });

    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => link.classList.remove('active'));
    if (sectionId === 'homeSection') document.getElementById('navHome').classList.add('active');
    if (sectionId === 'librarySection') document.getElementById('navLibrary').classList.add('active');
    if (sectionId === 'vocabListSection') document.getElementById('navVocabList').classList.add('active');
}

function openImportSection(lang) {
    playSound('click');
    if (lang === 'chinese') {
        document.getElementById('importChineseDeckName').value = '';
        document.getElementById('importChineseTextArea').value = '';
        showSection('importChineseSection');
    } else if (lang === 'english') {
        document.getElementById('importEnglishDeckName').value = '';
        document.getElementById('importEnglishTextArea').value = '';
        showSection('importEnglishSection');
    } else if (lang === 'vietnamese') {
        document.getElementById('importVietnameseDeckName').value = '';
        document.getElementById('importVietnameseTextArea').value = '';
        showSection('importVietnameseSection');
    }
}

function processImportChineseData() {
    playSound('click');
    const deckName = document.getElementById('importChineseDeckName').value.trim();
    const rawText = document.getElementById('importChineseTextArea').value.trim();

    if (!deckName || !rawText) { alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ!'); return; }

    const lines = rawText.split('\n');
    let importedWords = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length >= 4) {
            importedWords.push({
                chinese: parts[0].trim(),
                pinyin: parts[1].trim(),
                thaiRead: parts[2].trim(),
                meaning: parts[3].trim()
            });
        }
    }

    if (importedWords.length === 0) { alert('รูปแบบข้อมูลไม่ถูกต้อง!'); return; }

    gameSets.push({ id: Date.now(), title: deckName, language: 'chinese', words: importedWords });
    localStorage.setItem('gameSets', JSON.stringify(gameSets));
    alert(`Import ภาษาจีนสำเร็จ (${importedWords.length} คำ)!`);
    showSection('librarySection');
    renderLibrary();
}

function processImportEnglishData() {
    playSound('click');
    const deckName = document.getElementById('importEnglishDeckName').value.trim();
    const rawText = document.getElementById('importEnglishTextArea').value.trim();

    if (!deckName || !rawText) { alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ!'); return; }

    const lines = rawText.split('\n');
    let importedWords = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length >= 3) {
            importedWords.push({
                chinese: parts[0].trim(),
                pinyin: parts[1].trim(),
                thaiRead: parts[1].trim(),
                meaning: parts[2].trim()
            });
        }
    }

    if (importedWords.length === 0) { alert('รูปแบบข้อมูลภาษาอังกฤษไม่ถูกต้อง!'); return; }

    gameSets.push({ id: Date.now(), title: deckName, language: 'english', words: importedWords });
    localStorage.setItem('gameSets', JSON.stringify(gameSets));
    alert(`Import ภาษาอังกฤษสำเร็จ (${importedWords.length} คำ)!`);
    showSection('librarySection');
    renderLibrary();
}

function processImportVietnameseData() {
    playSound('click');
    const deckName = document.getElementById('importVietnameseDeckName').value.trim();
    const rawText = document.getElementById('importVietnameseTextArea').value.trim();

    if (!deckName || !rawText) { alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ!'); return; }

    const lines = rawText.split('\n');
    let importedWords = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length >= 3) {
            importedWords.push({
                chinese: parts[0].trim(),
                pinyin: parts[1].trim(),
                thaiRead: parts[1].trim(),
                meaning: parts[2].trim()
            });
        }
    }

    if (importedWords.length === 0) { alert('รูปแบบข้อมูลไม่ถูกต้อง!'); return; }

    gameSets.push({ id: Date.now(), title: deckName, language: 'vietnamese', words: importedWords });
    localStorage.setItem('gameSets', JSON.stringify(gameSets));
    alert(`Import ภาษาเวียดนามสำเร็จ (${importedWords.length} คำ)!`);
    showSection('librarySection');
    renderLibrary();
}

function startCreateGame(lang) {
    playSound('click');
    currentLanguage = lang;
    currentEditingSetId = null;
    tempWords = [];

    if (lang === 'chinese') {
        document.getElementById('gameTitleInput').value = '';
        document.getElementById('createSectionTitle').innerText = 'สร้างชุดคำศัพท์ใหม่';
        document.getElementById('saveBtnText').innerText = 'บันทึกชุดเกม';
        renderTempWords();
        showSection('createChineseSection');
    } else if (lang === 'english') {
        document.getElementById('gameEnglishTitleInput').value = '';
        document.getElementById('createEnglishSectionTitle').innerText = 'สร้างชุดคำศัพท์ภาษาอังกฤษ';
        document.getElementById('saveEnglishBtnText').innerText = 'บันทึกชุดเกม';
        renderEnglishTempWords();
        showSection('createEnglishSection');
    } else if (lang === 'vietnamese') {
        document.getElementById('gameVietnameseTitleInput').value = '';
        document.getElementById('createVietnameseSectionTitle').innerText = 'สร้างชุดคำศัพท์ภาษาเวียดนาม';
        document.getElementById('saveVietnameseBtnText').innerText = 'บันทึกชุดเกม';
        renderVietnameseTempWords();
        showSection('createVietnameseSection');
    }
}

function renderTempWords() {
    const container = document.getElementById('wordListContainer');
    document.getElementById('wordCount').innerText = tempWords.length;
    const saveBtn = document.getElementById('saveGameSetBtn');
    if (tempWords.length > 0) saveBtn.removeAttribute('disabled');
    else saveBtn.setAttribute('disabled', 'true');

    if (tempWords.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-3 m-0">ยังไม่มีคำศัพท์</p>`;
        return;
    }

    container.innerHTML = tempWords.map((item, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent">
            <div>
                <h5 class="fw-bold mb-1 text-danger">${item.chinese} <span class="fs-6 text-muted fw-normal">(${item.pinyin} / ${item.thaiRead})</span></h5>
                <p class="mb-0 text-success small fw-bold">ความหมาย: ${item.meaning}</p>
            </div>
            <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="playSound('click'); removeTempWord(${index})" style="width: 35px; height: 35px;"><i class="bi bi-trash"></i></button>
        </div>
    `).join('');
}

function renderEnglishTempWords() {
    const container = document.getElementById('englishWordListContainer');
    document.getElementById('englishWordCount').innerText = tempWords.length;
    const saveBtn = document.getElementById('saveEnglishGameSetBtn');
    if (tempWords.length > 0) saveBtn.removeAttribute('disabled');
    else saveBtn.setAttribute('disabled', 'true');

    if (tempWords.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-3 m-0">ยังไม่มีคำศัพท์</p>`;
        return;
    }

    container.innerHTML = tempWords.map((item, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent">
            <div>
                <h5 class="fw-bold mb-1 text-primary">${item.chinese} <span class="fs-6 text-muted fw-normal">(${item.thaiRead})</span></h5>
                <p class="mb-0 text-success small fw-bold">ความหมาย: ${item.meaning}</p>
            </div>
            <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="playSound('click'); removeTempWord(${index})" style="width: 35px; height: 35px;"><i class="bi bi-trash"></i></button>
        </div>
    `).join('');
}

function renderVietnameseTempWords() {
    const container = document.getElementById('vietnameseWordListContainer');
    document.getElementById('vietnameseWordCount').innerText = tempWords.length;
    const saveBtn = document.getElementById('saveVietnameseGameSetBtn');
    if (tempWords.length > 0) saveBtn.removeAttribute('disabled');
    else saveBtn.setAttribute('disabled', 'true');

    if (tempWords.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-3 m-0">ยังไม่มีคำศัพท์</p>`;
        return;
    }

    container.innerHTML = tempWords.map((item, index) => `
        <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent">
            <div>
                <h5 class="fw-bold mb-1 text-secondary">${item.chinese} <span class="fs-6 text-muted fw-normal">(${item.thaiRead})</span></h5>
                <p class="mb-0 text-success small fw-bold">ความหมาย: ${item.meaning}</p>
            </div>
            <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="playSound('click'); removeTempWord(${index})" style="width: 35px; height: 35px;"><i class="bi bi-trash"></i></button>
        </div>
    `).join('');
}

function removeTempWord(index) {
    tempWords.splice(index, 1);
    if (currentLanguage === 'chinese') renderTempWords();
    else if (currentLanguage === 'english') renderEnglishTempWords();
    else if (currentLanguage === 'vietnamese') renderVietnameseTempWords();
}

function openPlayModeModal(setId) {
    playSound('click');
    activeGameSet = gameSets.find(s => s.id === setId);
    if (!activeGameSet || activeGameSet.words.length === 0) {
        alert('ชุดเกมนี้ยังไม่มีคำศัพท์');
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('playModeSelectModal'));
    modal.show();
}

function viewDetails(setId) {
    const set = gameSets.find(s => s.id === setId);
    if (!set) return;
    document.getElementById('viewDetailsTitle').innerText = set.title;
    const list = document.getElementById('viewDetailsList');
    list.innerHTML = set.words.map(w => `
        <li class="list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent">
            <div>
                <h5 class="fw-bold mb-1 text-primary">${w.chinese} <span class="fs-6 text-muted fw-normal">(${w.thaiRead})</span></h5>
            </div>
            <span class="badge bg-success-subtle text-success fs-6 px-3 py-2">${w.meaning}</span>
        </li>
    `).join('');
    new bootstrap.Modal(document.getElementById('viewDetailsModal')).show();
}

function editGameSet(setId) {
    const set = gameSets.find(s => s.id === setId);
    if (!set) return;
    currentEditingSetId = set.id;
    currentLanguage = set.language || 'chinese';
    tempWords = [...set.words];

    if (currentLanguage === 'english') {
        document.getElementById('gameEnglishTitleInput').value = set.title;
        document.getElementById('createEnglishSectionTitle').innerText = 'แก้ไขชุดคำศัพท์ภาษาอังกฤษ';
        document.getElementById('saveEnglishBtnText').innerText = 'บันทึกการแก้ไข';
        renderEnglishTempWords();
        showSection('createEnglishSection');
    } else if (currentLanguage === 'vietnamese') {
        document.getElementById('gameVietnameseTitleInput').value = set.title;
        document.getElementById('createVietnameseSectionTitle').innerText = 'แก้ไขชุดคำศัพท์ภาษาเวียดนาม';
        document.getElementById('saveVietnameseBtnText').innerText = 'บันทึกการแก้ไข';
        renderVietnameseTempWords();
        showSection('createVietnameseSection');
    } else {
        document.getElementById('gameTitleInput').value = set.title;
        document.getElementById('createSectionTitle').innerText = 'แก้ไขชุดคำศัพท์';
        document.getElementById('saveBtnText').innerText = 'บันทึกการแก้ไข';
        renderTempWords();
        showSection('createChineseSection');
    }
}

function deleteGameSet(setId) {
    if (confirm('คุณต้องการลบชุดเกมนี้ใช่หรือไม่?')) {
        gameSets = gameSets.filter(s => s.id !== setId);
        localStorage.setItem('gameSets', JSON.stringify(gameSets));
        renderLibrary();
    }
}

// 🎯 Quiz Game Engine
function initQuizGame() {
    playSound('click');
    if (!activeGameSet) return;
    quizQuestions = shuffleArray([...activeGameSet.words]);
    quizCurrentIndex = 0;
    quizScore = 0;
    document.getElementById('quizTitle').innerText = activeGameSet.title;
    document.getElementById('quizTotalQ').innerText = quizQuestions.length;
    showSection('quizSection');
    loadQuizQuestion();

    startGlobalTimer(() => {
        endQuizGame();
    }, 'quizProgressBar');
}

function loadQuizQuestion() {
    if (quizCurrentIndex >= quizQuestions.length) {
        stopGlobalTimer();
        endQuizGame();
        return;
    }

    document.getElementById('quizCurrentQ').innerText = quizCurrentIndex + 1;
    document.getElementById('quizScoreDisplay').innerText = `คะแนน: ${quizScore}`;

    const currentWord = quizQuestions[quizCurrentIndex];
    document.getElementById('quizQuestionWord').innerText = currentWord.chinese;
    
    if (activeGameSet.language === 'english' || activeGameSet.language === 'vietnamese') {
        document.getElementById('quizQuestionSub').innerText = `คำอ่าน: ${currentWord.thaiRead}`;
    } else {
        document.getElementById('quizQuestionSub').innerText = `${currentWord.pinyin} (${currentWord.thaiRead})`;
    }

    let wrongChoicesOptions = activeGameSet.words.filter(w => w.chinese !== currentWord.chinese);
    let wrongChoices = shuffleArray(wrongChoicesOptions).slice(0, 3);
    let allChoices = shuffleArray([currentWord, ...wrongChoices]);

    const container = document.getElementById('quizChoices');
    container.innerHTML = allChoices.map(choice => `
        <button class="btn btn-outline-primary btn-lg rounded-pill fw-bold py-3 shadow-sm choice-btn" onclick="checkQuizAnswer('${choice.chinese}', '${currentWord.chinese}', this)">
            ${choice.meaning}
        </button>
    `).join('');
}

function checkQuizAnswer(selected, correct, btnElement) {
    const allButtons = document.querySelectorAll('.choice-btn');
    allButtons.forEach(btn => btn.disabled = true);

    if (selected === correct) {
        playSound('correct');
        btnElement.classList.remove('btn-outline-primary');
        btnElement.classList.add('btn-success', 'text-white');
        quizScore++;
    } else {
        playSound('wrong');
        btnElement.classList.remove('btn-outline-primary');
        btnElement.classList.add('btn-danger', 'text-white');
        allButtons.forEach(btn => {
            if (btn.innerText.trim() === activeGameSet.words.find(w => w.chinese === correct).meaning) {
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-success', 'text-white');
            }
        });
    }

    setTimeout(() => {
        quizCurrentIndex++;
        loadQuizQuestion();
    }, 800);
}

function endQuizGame() {
    stopGlobalTimer();
    const total = quizQuestions.length;
    document.getElementById('finalScoreText').innerText = `${quizScore} / ${total}`;
    savePlayHistory(activeGameSet.title, 'โหมดตอบคำถาม', `${quizScore}/${total}`);

    const modal = new bootstrap.Modal(document.getElementById('quizResultModal'));
    modal.show();
    triggerConfetti();
}

function restartQuizGame() {
    initQuizGame();
}

// 🧩 Matching Game Engine
function initMatchGame() {
    playSound('click');
    if (!activeGameSet) return;
    matchMatchedCount = 0;
    document.getElementById('matchTitle').innerText = activeGameSet.title;
    showSection('matchSection');

    matchTotalPairs = activeGameSet.words.length;
    let selectedWords = shuffleArray([...activeGameSet.words]);

    matchCards = [];
    document.getElementById('matchProgress').innerText = `0 / ${matchTotalPairs} คู่`;

    selectedWords.forEach((word, idx) => {
        const subText = (activeGameSet.language === 'english' || activeGameSet.language === 'vietnamese') ? word.thaiRead : `${word.pinyin} (${word.thaiRead})`;
        matchCards.push({ 
            uniqueKey: 'w_' + idx,
            id: idx, 
            displayHtml: `<span class="fw-bold fs-5 text-primary">${word.chinese}</span><br><small class="text-secondary">${subText}</small>`, 
            type: 'word' 
        });
        matchCards.push({ 
            uniqueKey: 'm_' + idx,
            id: idx, 
            displayHtml: `<span class="fw-bold text-success fs-6">ความหมาย:<br>${word.meaning}</span>`, 
            type: 'meaning' 
        });
    });

    matchCards = shuffleArray(matchCards);
    renderMatchGrid();
    firstSelectedCard = null;

    startGlobalTimer(() => {
        endMatchGameOnTimeout();
    }, 'matchProgressBar');
}

function renderMatchGrid() {
    const grid = document.getElementById('matchGridContainer');
    const activeCards = matchCards.filter(card => !card.matched);

    grid.innerHTML = activeCards.map((card) => `
        <div class="match-card p-3 rounded-4 shadow-sm text-center d-flex flex-column align-items-center justify-content-center fw-bold bg-body-tertiary border" 
             id="card_${card.uniqueKey}"
             onclick="selectMatchCard(this, '${card.uniqueKey}', ${card.id}, '${card.type}')">
            ${card.displayHtml}
        </div>
    `).join('');
}

function selectMatchCard(element, uniqueKey, id, type) {
    if (element.classList.contains('selected') || element.classList.contains('matched-animation')) return;

    if (!firstSelectedCard) {
        playSound('click');
        firstSelectedCard = { element, uniqueKey, id, type };
        element.classList.add('selected', 'border-primary', 'border-3');
    } else {
        if (firstSelectedCard.uniqueKey === uniqueKey) return;

        if (firstSelectedCard.id === id && firstSelectedCard.type !== type) {
            playSound('correct');
            
            firstSelectedCard.element.classList.remove('selected', 'border-primary', 'border-3');
            firstSelectedCard.element.classList.add('matched-animation');
            element.classList.add('matched-animation');

            let card1Key = firstSelectedCard.uniqueKey;
            let card2Key = uniqueKey;
            firstSelectedCard = null;

            setTimeout(() => {
                matchCards.forEach(c => {
                    if (c.uniqueKey === card1Key || c.uniqueKey === card2Key) {
                        c.matched = true;
                    }
                });

                matchMatchedCount++;
                document.getElementById('matchProgress').innerText = `${matchMatchedCount} / ${matchTotalPairs} คู่`;
                renderMatchGrid();

                if (matchMatchedCount === matchTotalPairs) {
                    stopGlobalTimer();
                    setTimeout(() => {
                        document.getElementById('finalMatchScoreText').innerText = `${matchTotalPairs} / ${matchTotalPairs} คู่`;
                        savePlayHistory(activeGameSet.title, 'โหมดจับคู่', `${matchTotalPairs}/${matchTotalPairs}`);

                        const modal = new bootstrap.Modal(document.getElementById('matchResultModal'));
                        modal.show();
                        triggerConfetti();
                    }, 400);
                }
            }, 350);

        } else {
            playSound('wrong');
            firstSelectedCard.element.classList.add('border-danger');
            element.classList.add('border-danger');
            let prevCard = firstSelectedCard.element;

            setTimeout(() => {
                prevCard.classList.remove('selected', 'border-primary', 'border-3', 'border-danger');
                element.classList.remove('border-danger');
                firstSelectedCard = null;
            }, 600);
        }
    }
}

function endMatchGameOnTimeout() {
    document.getElementById('finalMatchScoreText').innerText = `${matchMatchedCount} / ${matchTotalPairs} คู่`;
    savePlayHistory(activeGameSet.title, 'โหมดจับคู่', `${matchMatchedCount}/${matchTotalPairs}`);

    const modal = new bootstrap.Modal(document.getElementById('matchResultModal'));
    modal.show();
    triggerConfetti();
}

// 🔤 Scramble Game Engine
function initScrambleGame() {
    playSound('click');
    if (!activeGameSet) return;
    scrambleQuestions = shuffleArray([...activeGameSet.words]);
    scrambleCurrentIndex = 0;
    scrambleScore = 0;
    document.getElementById('scrambleTitle').innerText = activeGameSet.title;
    showSection('scrambleSection');
    loadScrambleQuestion();

    startGlobalTimer(() => {
        endScrambleGame();
    }, 'scrambleProgressBar');
}

function loadScrambleQuestion() {
    if (scrambleCurrentIndex >= scrambleQuestions.length) {
        stopGlobalTimer();
        endScrambleGame();
        return;
    }

    document.getElementById('scrambleProgress').innerText = `ข้อ ${scrambleCurrentIndex + 1} / ${scrambleQuestions.length}`;
    const currentWordObj = scrambleQuestions[scrambleCurrentIndex];
    document.getElementById('scrambleMeaning').innerText = currentWordObj.meaning;

    let readingBox = document.getElementById('scrambleReadingGuide');
    if (!readingBox) {
        const meaningEl = document.getElementById('scrambleMeaning');
        readingBox = document.createElement('div');
        readingBox.id = 'scrambleReadingGuide';
        readingBox.className = 'text-primary fw-bold fs-5 mb-2';
        meaningEl.parentNode.insertBefore(readingBox, meaningEl.nextSibling);
    }
    readingBox.innerHTML = `🔊 คำอ่าน: ${currentWordObj.thaiRead} ${currentWordObj.pinyin ? `(${currentWordObj.pinyin})` : ''}`;

    userSelectedLetters = [];
    
    let targetWord = currentWordObj.chinese.trim();
    let parts = [];

    if (activeGameSet.language === 'chinese' || !targetWord.includes(' ')) {
        parts = targetWord.split('');
    } else {
        parts = targetWord.split(' ');
    }

    currentScrambleLetters = shuffleArray(parts.map(p => ({ char: p, used: false })));
    renderScrambleBoxes();
}

function renderScrambleBoxes() {
    const answerBox = document.getElementById('scrambleAnswerBox');
    const lettersBox = document.getElementById('scrambleLettersBox');

    answerBox.className = "p-3 bg-body-tertiary rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-center gap-2 border border-2 border-dashed";

    if (userSelectedLetters.length === 0) {
        answerBox.innerHTML = `<span class="text-muted small">แตะคำ/ตัวอักษรด้านล่างเพื่อมาเรียงที่นี่</span>`;
    } else {
        answerBox.innerHTML = userSelectedLetters.map((item, idx) => `
            <button class="btn btn-warning fw-bold px-3 py-2 rounded-3 shadow-sm text-dark" onclick="removeScrambleLetter(${idx})">
                ${item.char}
            </button>
        `).join('');
    }

    lettersBox.innerHTML = currentScrambleLetters.map((item, idx) => `
        <button class="btn btn-outline-primary fw-bold px-3 py-2 rounded-3 shadow-sm ${item.used ? 'd-none' : ''}" onclick="selectScrambleLetter(${idx})">
            ${item.char}
        </button>
    `).join('');
}

function selectScrambleLetter(index) {
    playSound('click');
    if (currentScrambleLetters[index].used) return;

    currentScrambleLetters[index].used = true;
    userSelectedLetters.push({
        id: index,
        char: currentScrambleLetters[index].char
    });

    renderScrambleBoxes();
}

function removeScrambleLetter(answerIndex) {
    playSound('click');
    let removed = userSelectedLetters.splice(answerIndex, 1)[0];
    currentScrambleLetters[removed.id].used = false;

    renderScrambleBoxes();
}

function resetScrambleCurrent() {
    playSound('click');
    currentScrambleLetters.forEach(item => item.used = false);
    userSelectedLetters = [];
    renderScrambleBoxes();
}

function checkScrambleAnswer() {
    const currentWordObj = scrambleQuestions[scrambleCurrentIndex];
    let separator = (activeGameSet.language === 'chinese' || !currentWordObj.chinese.includes(' ')) ? '' : ' ';
    const userWord = userSelectedLetters.map(i => i.char).join(separator);
    const answerBox = document.getElementById('scrambleAnswerBox');

    if (userWord === currentWordObj.chinese.trim()) {
        playSound('correct');
        scrambleScore++;
        
        answerBox.classList.remove('border-dashed');
        answerBox.classList.add('border-success', 'bg-success-subtle');

        setTimeout(() => {
            scrambleCurrentIndex++;
            loadScrambleQuestion();
        }, 800);
    } else {
        playSound('wrong');
        
        answerBox.classList.add('border-danger', 'bg-danger-subtle');
        setTimeout(() => {
            answerBox.classList.remove('border-danger', 'bg-danger-subtle');
        }, 500);
    }
}

function endScrambleGame() {
    stopGlobalTimer();
    const total = scrambleQuestions.length;
    document.getElementById('finalScrambleScoreText').innerText = `${scrambleScore} / ${total}`;
    savePlayHistory(activeGameSet.title, 'เกมเรียงประโยค', `${scrambleScore}/${total}`);

    const modal = new bootstrap.Modal(document.getElementById('scrambleResultModal'));
    modal.show();
    triggerConfetti();
}

// Speed Attack Game Engine
function initSpeedGame() {
    playSound('click');
    if (!activeGameSet) return;
    speedQuestions = shuffleArray([...activeGameSet.words]);
    speedCurrentIndex = 0;
    speedScore = 0;
    
    document.getElementById('speedTitle').innerText = activeGameSet.title;
    document.getElementById('speedTotalQ').innerText = speedQuestions.length;
    showSection('speedSection');
    loadSpeedQuestion();
}

function loadSpeedQuestion() {
    stopSpeedTimer();

    if (speedCurrentIndex >= speedQuestions.length) {
        endSpeedGame();
        return;
    }

    document.getElementById('speedCurrentQ').innerText = speedCurrentIndex + 1;
    document.getElementById('speedScoreDisplay').innerText = `คะแนน: ${speedScore}`;

    const currentWord = speedQuestions[speedCurrentIndex];
    document.getElementById('speedQuestionWord').innerText = currentWord.chinese;
    
    if (activeGameSet.language === 'english' || activeGameSet.language === 'vietnamese') {
        document.getElementById('speedQuestionSub').innerText = `คำอ่าน: ${currentWord.thaiRead}`;
    } else {
        document.getElementById('speedQuestionSub').innerText = `${currentWord.pinyin} (${currentWord.thaiRead})`;
    }

    let wrongChoicesOptions = activeGameSet.words.filter(w => w.chinese !== currentWord.chinese);
    let wrongChoices = shuffleArray(wrongChoicesOptions).slice(0, 3);
    let allChoices = shuffleArray([currentWord, ...wrongChoices]);

    const container = document.getElementById('speedChoices');
    container.innerHTML = allChoices.map(choice => `
        <button class="btn btn-outline-danger btn-lg rounded-pill fw-bold py-3 shadow-sm speed-choice-btn" onclick="checkSpeedAnswer('${choice.chinese}', '${currentWord.chinese}', this)">
            ${choice.meaning}
        </button>
    `).join('');

    timeLeft = maxTimePerQuestion;
    updateSpeedProgressBar();
    
    speedTimer = setInterval(() => {
        timeLeft -= 0.1;
        updateSpeedProgressBar();

        if (timeLeft <= 0) {
            stopSpeedTimer();
            playSound('wrong');
            highlightCorrectSpeedAnswer(currentWord.chinese);
            setTimeout(() => {
                speedCurrentIndex++;
                loadSpeedQuestion();
            }, 800);
        }
    }, 100);
}

function updateSpeedProgressBar() {
    const bar = document.getElementById('speedProgressBar');
    if (!bar) return;
    let percentage = (timeLeft / maxTimePerQuestion) * 100;
    bar.style.width = `${percentage}%`;

    if (percentage > 50) {
        bar.className = "progress-bar bg-success progress-bar-striped progress-bar-animated";
    } else if (percentage > 25) {
        bar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated";
    } else {
        bar.className = "progress-bar bg-danger progress-bar-striped progress-bar-animated";
    }
}

function stopSpeedTimer() {
    if (speedTimer) {
        clearInterval(speedTimer);
        speedTimer = null;
    }
}

function checkSpeedAnswer(selected, correct, btnElement) {
    stopSpeedTimer();
    document.querySelectorAll('.speed-choice-btn').forEach(btn => btn.disabled = true);

    if (selected === correct) {
        playSound('correct');
        btnElement.classList.remove('btn-outline-danger');
        btnElement.classList.add('btn-success', 'text-white');
        let bonus = Math.ceil(timeLeft);
        speedScore += (1 + bonus); 
    } else {
        playSound('wrong');
        btnElement.classList.remove('btn-outline-danger');
        btnElement.classList.add('btn-danger', 'text-white');
        highlightCorrectSpeedAnswer(correct);
    }

    setTimeout(() => {
        speedCurrentIndex++;
        loadSpeedQuestion();
    }, 800);
}

function highlightCorrectSpeedAnswer(correct) {
    const allButtons = document.querySelectorAll('.speed-choice-btn');
    allButtons.forEach(btn => {
        if (btn.innerText.trim() === activeGameSet.words.find(w => w.chinese === correct).meaning) {
            btn.classList.remove('btn-outline-danger');
            btn.classList.add('btn-success', 'text-white');
        }
    });
}

function endSpeedGame() {
    stopSpeedTimer();
    document.getElementById('finalSpeedScoreText').innerText = speedScore;
    savePlayHistory(activeGameSet.title, 'เกมสายฟ้าแลบ', `${speedScore} แต้ม`);

    const modal = new bootstrap.Modal(document.getElementById('speedResultModal'));
    modal.show();
    triggerConfetti();
}

// History System
function savePlayHistory(gameTitle, mode, score) {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    playHistory.unshift({ title: gameTitle, mode, score, date: dateStr });
    if (playHistory.length > 10) playHistory.pop();
    localStorage.setItem('playHistory', JSON.stringify(playHistory));
}

function renderHomeHistory() {
    const container = document.getElementById('homeSection');
    let historyHtml = '';
    
    if (playHistory.length === 0) {
        historyHtml = `
            <div class="card shadow-sm border-0 rounded-4 mb-3">
                <div class="card-body p-4 text-center text-muted">
                    <p class="m-0">ยังไม่มีประวัติการเล่น ลองไปเลือกชุดคำศัพท์ใน Library แล้วเริ่มเล่นเกมได้เลยครับ!</p>
                </div>
            </div>
        `;
    } else {
        historyHtml = playHistory.map(h => `
            <div class="card shadow-sm border-0 rounded-4 mb-3">
                <div class="card-body p-3 d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-primary-subtle text-primary mb-1 px-2 py-1">${h.mode}</span>
                        <h5 class="fw-bold mb-1">${h.title}</h5>
                        <small class="text-muted"><i class="bi bi-clock"></i> ${h.date}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success fs-6 px-3 py-2 rounded-pill">คะแนน ${h.score}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 mt-3">
            <h3 class="fw-bold m-0"><i class="bi bi-clock-history text-primary"></i> ประวัติการเล่น</h3>
            ${playHistory.length > 0 ? `<button class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1" onclick="clearHistory()">ล้างประวัติ</button>` : ''}
        </div>
        ${historyHtml}
    `;
}

function clearHistory() {
    playSound('click');
    if (confirm('คุณต้องการลบประวัติการเล่นทั้งหมดใช่หรือไม่?')) {
        playHistory = [];
        localStorage.removeItem('playHistory');
        renderHomeHistory();
    }
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
