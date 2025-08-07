// --- Firebase 초기화 및 SDK import ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAhqHmLOSES-9ftzNAeVPbcnNve0mpWulc",
  authDomain: "hj-memory.firebaseapp.com",
  projectId: "hj-memory",
  storageBucket: "hj-memory.firebasestorage.app",
  messagingSenderId: "143143920252",
  appId: "1:143143920252:web:cff78f7f582a6bc5181ff9",
  measurementId: "G-SJR8MFBW69"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 유틸리티: 날짜 포맷 (한국 기준) ---
function getTodayStr() {
  const now = new Date();
  now.setHours(now.getHours() + 9 - now.getTimezoneOffset() / 60); // KST
  return now.toISOString().slice(0, 10);
}

// --- Firebase 데이터 관리 함수들 ---
async function getCurrentUser() {
  return auth.currentUser?.email;
}

async function createUserAccount(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 사용자 문서 생성
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date()
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getRecords() {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    
    const recordsRef = collection(db, "records");
    const q = query(recordsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    const records = [];
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });
    
    return records;
  } catch (error) {
    console.error("Error getting records:", error);
    return [];
  }
}

async function addRecord(record) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "User not authenticated" };
    
    const recordData = {
      ...record,
      userId: user.uid,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, "records"), recordData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding record:", error);
    return { success: false, error: error.message };
  }
}

async function updateRecord(recordId, recordData) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "User not authenticated" };
    
    const recordRef = doc(db, "records", recordId);
    await updateDoc(recordRef, {
      ...recordData,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating record:", error);
    return { success: false, error: error.message };
  }
}

async function deleteRecord(recordId) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "User not authenticated" };
    
    await deleteDoc(doc(db, "records", recordId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting record:", error);
    return { success: false, error: error.message };
  }
}

// --- 로그인/회원가입 로직 ---
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const mainSection = document.getElementById('main-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');

showRegister.onclick = (e) => {
  e.preventDefault();
  loginSection.style.display = 'none';
  registerSection.style.display = 'flex';
};
showLogin.onclick = (e) => {
  e.preventDefault();
  registerSection.style.display = 'none';
  loginSection.style.display = 'flex';
};

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!email.includes('@')) {
    loginError.textContent = '이메일 형식으로 입력해주세요.';
    return;
  }
  
  const result = await signInUser(email, password);
  if (result.success) {
    loginError.textContent = '';
    showMain();
  } else {
    loginError.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
};

registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  
  if (!email.includes('@')) {
    registerError.textContent = '이메일 형식으로 입력해주세요.';
    return;
  }
  
  if (password.length < 6) {
    registerError.textContent = '비밀번호는 6자 이상이어야 합니다.';
    return;
  }
  
  const result = await createUserAccount(email, password);
  if (result.success) {
    registerError.textContent = '';
    alert('회원가입이 완료되었습니다! 로그인 해주세요.');
    registerSection.style.display = 'none';
    loginSection.style.display = 'flex';
  } else {
    if (result.error.includes('email-already-in-use')) {
      registerError.textContent = '이미 존재하는 이메일입니다.';
    } else {
      registerError.textContent = '회원가입 중 오류가 발생했습니다.';
    }
  }
};

logoutBtn.onclick = async () => {
  await signOutUser();
  showLoginSection();
};

function showLoginSection() {
  mainSection.style.display = 'none';
  loginSection.style.display = 'flex';
  registerSection.style.display = 'none';
}

async function showMain() {
  loginSection.style.display = 'none';
  registerSection.style.display = 'none';
  mainSection.style.display = 'block';
  await renderRecords();
  await renderCalendar();
  setView('list');
}

// --- 기록 CRUD 및 뷰 전환 ---
const recordForm = document.getElementById('record-form');
const recordTitle = document.getElementById('record-title');
const recordContent = document.getElementById('record-content');
const recordDate = document.getElementById('record-date');
const recordList = document.getElementById('record-list');
const listSection = document.getElementById('list-section');
const calendarSection = document.getElementById('calendar-section');
const viewListBtn = document.getElementById('view-list');
const viewCalendarBtn = document.getElementById('view-calendar');
const cancelEditBtn = document.getElementById('cancel-edit');
let editId = null;

viewListBtn.onclick = () => setView('list');
viewCalendarBtn.onclick = () => setView('calendar');

function setView(view) {
  document.body.classList.remove('list-view', 'calendar-view');
  if (view === 'list') {
    listSection.style.display = 'block';
    calendarSection.style.display = 'none';
    viewListBtn.classList.add('active');
    viewCalendarBtn.classList.remove('active');
    document.body.classList.add('list-view');
  } else {
    listSection.style.display = 'none';
    calendarSection.style.display = 'flex';
    viewListBtn.classList.remove('active');
    viewCalendarBtn.classList.add('active');
    document.body.classList.add('calendar-view');
    renderCalendar();
  }
}

recordForm.onsubmit = async (e) => {
  e.preventDefault();
  const title = recordTitle.value.trim();
  const content = recordContent.value.trim();
  const date = recordDate.value;
  if (!title || !content || !date) return;
  
  if (editId) {
    const result = await updateRecord(editId, { title, content, date });
    if (result.success) {
      editId = null;
      cancelEditBtn.style.display = 'none';
      recordForm.reset();
      await renderRecords();
      await renderCalendar();
    }
  } else {
    const result = await addRecord({ title, content, date });
    if (result.success) {
      recordForm.reset();
      await renderRecords();
      await renderCalendar();
    }
  }
};

cancelEditBtn.onclick = () => {
  editId = null;
  recordForm.reset();
  cancelEditBtn.style.display = 'none';
};

const searchInput = document.getElementById('search-records');
let searchKeyword = '';
if (searchInput) {
  searchInput.addEventListener('input', function() {
    searchKeyword = this.value.trim().toLowerCase();
    renderRecords();
  });
}

function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<span class="highlight">$1</span>');
}

// --- 기록 리스트 페이지네이션 ---
let recordPage = 1;
const RECORDS_PER_PAGE = 20;
const recordPagination = document.getElementById('record-pagination');

async function renderRecords(page) {
  const records = await getRecords();
  let filteredRecords = records.sort((a, b) => b.date.localeCompare(a.date));
  
  if (searchKeyword) {
    filteredRecords = filteredRecords.filter(record =>
      record.title.toLowerCase().includes(searchKeyword) ||
      record.content.toLowerCase().includes(searchKeyword)
    );
  }
  
  // 페이지네이션
  const total = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(total / RECORDS_PER_PAGE));
  recordPage = page || recordPage || 1;
  if (recordPage > totalPages) recordPage = totalPages;
  const startIdx = (recordPage - 1) * RECORDS_PER_PAGE;
  const endIdx = startIdx + RECORDS_PER_PAGE;
  const pageRecords = filteredRecords.slice(startIdx, endIdx);

  recordList.innerHTML = '';
  if (pageRecords.length === 0) {
    recordList.innerHTML = '<li>기록이 없습니다.</li>';
  } else {
    pageRecords.forEach(record => {
      const titleHtml = highlightKeyword(record.title, searchKeyword);
      const contentHtml = highlightKeyword(record.content.replace(/\n/g, '<br>'), searchKeyword);
      const li = document.createElement('li');
      li.innerHTML = `
        <div><strong>${titleHtml}</strong> <span style="color:#a3bffa;font-size:0.95rem;">(${record.date})</span></div>
        <div>${contentHtml}</div>
        <div class="record-actions">
          <button class="edit">수정</button>
          <button class="delete">삭제</button>
        </div>
      `;
      li.querySelector('.edit').onclick = () => {
        recordTitle.value = record.title;
        recordContent.value = record.content;
        recordDate.value = record.date;
        editId = record.id;
        cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      li.querySelector('.delete').onclick = async () => {
        if (confirm('정말 삭제하시겠습니까?')) {
          const result = await deleteRecord(record.id);
          if (result.success) {
            await renderRecords(1);
            await renderCalendar();
          }
        }
      };
      recordList.appendChild(li);
    });
  }
  
  // 페이지네이션 UI
  if (recordPagination) {
    recordPagination.innerHTML = '';
    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '이전';
      prevBtn.disabled = recordPage === 1;
      prevBtn.onclick = () => { renderRecords(recordPage - 1); };
      recordPagination.appendChild(prevBtn);
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === recordPage) pageBtn.style.background = '#a3bffa', pageBtn.style.color = '#fff';
        pageBtn.onclick = () => { renderRecords(i); };
        recordPagination.appendChild(pageBtn);
      }
      const nextBtn = document.createElement('button');
      nextBtn.textContent = '다음';
      nextBtn.disabled = recordPage === totalPages;
      nextBtn.onclick = () => { renderRecords(recordPage + 1); };
      recordPagination.appendChild(nextBtn);
    }
  }
}

// --- 달력 렌더링 (확대/팝업 기능 추가) ---
// --- 달력 월 상태 전역 변수 선언 ---
let calendarYear, calendarMonth;
// --- 대한민국 공휴일 자동 계산 함수 ---
function getKoreanHolidays(year) {
  // 양력 고정 공휴일
  const holidays = {
    [`${year}-01-01`]: '신정',
    [`${year}-03-01`]: '삼일절',
    [`${year}-05-05`]: '어린이날',
    [`${year}-06-06`]: '현충일',
    [`${year}-08-15`]: '광복절',
    [`${year}-10-03`]: '개천절',
    [`${year}-10-09`]: '한글날',
    [`${year}-12-25`]: '성탄절',
  };
  
  // 음력 명절/석가탄신일/대체공휴일 (2020~2050년)
  const lunarHolidays = {
    2024: {
      '02-09': '설날 연휴', '02-10': '설날', '02-11': '설날 연휴', '02-12': '설날 대체',
      '05-15': '석가탄신일',
      '09-16': '추석', '09-17': '추석', '09-18': '추석', '09-19': '추석 대체',
    },
    2025: {
      '01-28': '설날 연휴', '01-29': '설날', '01-30': '설날 연휴', '03-31': '석가탄신일',
      '10-05': '추석', '10-06': '추석', '10-07': '추석', '10-08': '추석 대체',
    },
    2026: {
      '02-16': '설날 연휴', '02-17': '설날', '02-18': '설날 연휴', '05-20': '석가탄신일',
      '09-25': '추석', '09-26': '추석', '09-27': '추석', '09-28': '추석 대체',
    },
    2027: {
      '02-05': '설날 연휴', '02-06': '설날', '02-07': '설날 연휴', '05-09': '석가탄신일',
      '10-14': '추석', '10-15': '추석', '10-16': '추석', '10-17': '추석 대체',
    },
    2028: {
      '01-25': '설날 연휴', '01-26': '설날', '01-27': '설날 연휴', '04-27': '석가탄신일',
      '10-02': '추석', '10-03': '추석', '10-04': '추석', '10-05': '추석 대체',
    },
    2029: {
      '02-12': '설날 연휴', '02-13': '설날', '02-14': '설날 연휴', '05-16': '석가탄신일',
      '09-21': '추석', '09-22': '추석', '09-23': '추석', '09-24': '추석 대체',
    },
    2030: {
      '02-02': '설날 연휴', '02-03': '설날', '02-04': '설날 연휴', '05-05': '석가탄신일',
      '10-10': '추석', '10-11': '추석', '10-12': '추석', '10-13': '추석 대체',
    },
    2031: {
      '01-22': '설날 연휴', '01-23': '설날', '01-24': '설날 연휴', '04-24': '석가탄신일',
      '09-29': '추석', '09-30': '추석', '10-01': '추석', '10-02': '추석 대체',
    },
    2032: {
      '02-10': '설날 연휴', '02-11': '설날', '02-12': '설날 연휴', '05-12': '석가탄신일',
      '09-17': '추석', '09-18': '추석', '09-19': '추석', '09-20': '추석 대체',
    },
    2033: {
      '01-30': '설날 연휴', '01-31': '설날', '02-01': '설날 연휴', '05-01': '석가탄신일',
      '10-06': '추석', '10-07': '추석', '10-08': '추석', '10-09': '추석 대체',
    },
    2034: {
      '02-18': '설날 연휴', '02-19': '설날', '02-20': '설날 연휴', '05-20': '석가탄신일',
      '09-26': '추석', '09-27': '추석', '09-28': '추석', '09-29': '추석 대체',
    },
    2035: {
      '02-07': '설날 연휴', '02-08': '설날', '02-09': '설날 연휴', '05-09': '석가탄신일',
      '10-15': '추석', '10-16': '추석', '10-17': '추석', '10-18': '추석 대체',
    },
    2036: {
      '01-27': '설날 연휴', '01-28': '설날', '01-29': '설날 연휴', '04-27': '석가탄신일',
      '10-03': '추석', '10-04': '추석', '10-05': '추석', '10-06': '추석 대체',
    },
    2037: {
      '02-14': '설날 연휴', '02-15': '설날', '02-16': '설날 연휴', '05-16': '석가탄신일',
      '09-22': '추석', '09-23': '추석', '09-24': '추석', '09-25': '추석 대체',
    },
    2038: {
      '02-03': '설날 연휴', '02-04': '설날', '02-05': '설날 연휴', '05-05': '석가탄신일',
      '10-11': '추석', '10-12': '추석', '10-13': '추석', '10-14': '추석 대체',
    },
    2039: {
      '01-24': '설날 연휴', '01-25': '설날', '01-26': '설날 연휴', '04-25': '석가탄신일',
      '10-01': '추석', '10-02': '추석', '10-03': '추석', '10-04': '추석 대체',
    },
    2040: {
      '02-12': '설날 연휴', '02-13': '설날', '02-14': '설날 연휴', '05-13': '석가탄신일',
      '09-19': '추석', '09-20': '추석', '09-21': '추석', '09-22': '추석 대체',
    },
    2041: {
      '02-01': '설날 연휴', '02-02': '설날', '02-03': '설날 연휴', '05-02': '석가탄신일',
      '10-08': '추석', '10-09': '추석', '10-10': '추석', '10-11': '추석 대체',
    },
    2042: {
      '02-20': '설날 연휴', '02-21': '설날', '02-22': '설날 연휴', '05-21': '석가탄신일',
      '09-27': '추석', '09-28': '추석', '09-29': '추석', '09-30': '추석 대체',
    },
    2043: {
      '02-09': '설날 연휴', '02-10': '설날', '02-11': '설날 연휴', '05-10': '석가탄신일',
      '10-16': '추석', '10-17': '추석', '10-18': '추석', '10-19': '추석 대체',
    },
    2044: {
      '01-29': '설날 연휴', '01-30': '설날', '01-31': '설날 연휴', '04-29': '석가탄신일',
      '10-04': '추석', '10-05': '추석', '10-06': '추석', '10-07': '추석 대체',
    },
    2045: {
      '02-16': '설날 연휴', '02-17': '설날', '02-18': '설날 연휴', '05-18': '석가탄신일',
      '09-23': '추석', '09-24': '추석', '09-25': '추석', '09-26': '추석 대체',
    },
    2046: {
      '02-05': '설날 연휴', '02-06': '설날', '02-07': '설날 연휴', '05-07': '석가탄신일',
      '10-12': '추석', '10-13': '추석', '10-14': '추석', '10-15': '추석 대체',
    },
    2047: {
      '01-26': '설날 연휴', '01-27': '설날', '01-28': '설날 연휴', '04-26': '석가탄신일',
      '10-02': '추석', '10-03': '추석', '10-04': '추석', '10-05': '추석 대체',
    },
    2048: {
      '02-14': '설날 연휴', '02-15': '설날', '02-16': '설날 연휴', '05-14': '석가탄신일',
      '09-20': '추석', '09-21': '추석', '09-22': '추석', '09-23': '추석 대체',
    },
    2049: {
      '02-02': '설날 연휴', '02-03': '설날', '02-04': '설날 연휴', '05-03': '석가탄신일',
      '10-09': '추석', '10-10': '추석', '10-11': '추석', '10-12': '추석 대체',
    },
    2050: {
      '02-21': '설날 연휴', '02-22': '설날', '02-23': '설날 연휴', '05-22': '석가탄신일',
      '09-28': '추석', '09-29': '추석', '09-30': '추석', '10-01': '추석 대체',
    }
  };
  
  if (lunarHolidays[year]) {
    for (const md in lunarHolidays[year]) {
      holidays[`${year}-${md}`] = lunarHolidays[year][md];
    }
  }
  
  // 어린이날 대체공휴일(일요일/다른 공휴일과 겹칠 때)
  const childrensDay = new Date(`${year}-05-05`);
  if (childrensDay.getDay() === 0 || holidays[`${year}-05-05`] && holidays[`${year}-05-05`].includes('대체')) {
    holidays[`${year}-05-06`] = '어린이날 대체';
  }
  
  // 기타 대체공휴일(음력 명절 등은 위에서 미리 반영)
  return holidays;
}

// --- 달력 기록 입력 모달 관련 ---
const calendarAddModal = document.getElementById('calendar-add-modal');
const calendarAddModalDate = document.getElementById('calendar-add-modal-date');
const calendarAddForm = document.getElementById('calendar-add-form');
const calendarAddTitle = document.getElementById('calendar-add-title');
const calendarAddContent = document.getElementById('calendar-add-content');
const calendarAddCancel = document.getElementById('calendar-add-cancel');
let calendarAddTargetDate = null;

function showCalendarAddModal(dateStr) {
  calendarAddTargetDate = dateStr;
  calendarAddModalDate.textContent = dateStr + ' 기록 추가';
  calendarAddTitle.value = '';
  calendarAddContent.value = '';
  calendarAddModal.style.display = 'flex';
  document.body.classList.add('calendar-modal-open');
  setTimeout(() => calendarAddTitle.focus(), 100);
}
function closeCalendarAddModal() {
  calendarAddModal.style.display = 'none';
  document.body.classList.remove('calendar-modal-open');
}
document.getElementById('close-calendar-add-modal').onclick = closeCalendarAddModal;
calendarAddCancel.onclick = closeCalendarAddModal;
calendarAddForm.onsubmit = async function(e) {
  e.preventDefault();
  const title = calendarAddTitle.value.trim();
  const content = calendarAddContent.value.trim();
  if (!title || !calendarAddTargetDate) return;
  
  const result = await addRecord({ title, content, date: calendarAddTargetDate });
  if (result.success) {
    closeCalendarAddModal();
    await renderCalendar(calendarYear, calendarMonth);
    await renderRecords();
  }
};
// 모달 바깥 클릭 시 닫기
window.addEventListener('click', function(e) {
  if (e.target === calendarAddModal) closeCalendarAddModal();
});

// --- 년도/월 선택 모달 관련 ---
const yearMonthPickerModal = document.getElementById('year-month-picker-modal');
const yearPicker = document.getElementById('year-picker');
const monthPicker = document.getElementById('month-picker');
const yearMonthApply = document.getElementById('year-month-apply');
const yearMonthCancel = document.getElementById('year-month-cancel');

function showYearMonthPicker() {
  // 년도 옵션 생성 (현재 년도 기준 ±10년)
  const currentYear = new Date().getFullYear();
  yearPicker.innerHTML = '';
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year + '년';
    if (year === (calendarYear || currentYear)) option.selected = true;
    yearPicker.appendChild(option);
  }
  // 월 옵션 생성
  monthPicker.innerHTML = '';
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement('option');
    option.value = month - 1; // JS Date는 0부터 시작
    option.textContent = month + '월';
    if (month - 1 === (calendarMonth !== undefined ? calendarMonth : new Date().getMonth())) option.selected = true;
    monthPicker.appendChild(option);
  }
  yearMonthPickerModal.style.display = 'flex';
  document.body.classList.add('calendar-modal-open');
}
function closeYearMonthPicker() {
  yearMonthPickerModal.style.display = 'none';
  document.body.classList.remove('calendar-modal-open');
}
document.getElementById('close-year-month-picker').onclick = closeYearMonthPicker;
yearMonthCancel.onclick = closeYearMonthPicker;
yearMonthApply.onclick = function() {
  const selectedYear = parseInt(yearPicker.value);
  const selectedMonth = parseInt(monthPicker.value);
  calendarYear = selectedYear;
  calendarMonth = selectedMonth;
  renderCalendar(selectedYear, selectedMonth);
  closeYearMonthPicker();
};
// 모달 바깥 클릭 시 닫기
window.addEventListener('click', function(e) {
  if (e.target === yearMonthPickerModal) closeYearMonthPicker();
});

// --- 달력 렌더링 함수 ---
async function renderCalendar(year, month) {
  const records = await getRecords();
  const calendar = document.getElementById('calendar');
  const today = new Date();
  today.setHours(today.getHours() + 9 - today.getTimezoneOffset() / 60); // KST
  year = year !== undefined ? year : (calendarYear !== undefined ? calendarYear : today.getFullYear());
  month = month !== undefined ? month : (calendarMonth !== undefined ? calendarMonth : today.getMonth());
  const KOREAN_HOLIDAYS = getKoreanHolidays(year);
  // 이번 달 1일, 마지막 날짜
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // 달력 그리드
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <button id="prev-month">◀</button>
    <span style="font-size:1.2rem;font-weight:bold;cursor:pointer;" id="calendar-title">${year}년 ${month+1}월</span>
    <button id="next-month">▶</button>
  </div>`;
  html += '<div class="calendar-grid">';
  const weekDays = ['일','월','화','수','목','금','토'];
  weekDays.forEach((d, i) => html += `<div style="text-align:center;font-weight:bold;color:${i===0?'#ff6f91':'#a3bffa'};">${d}</div>`);
  let dayCells = [];
  // 빈칸 (1일 전)
  for (let i = 0; i < firstDay.getDay(); i++) dayCells.push('<div class="calendar-day"></div>');
  // 날짜
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayRecords = records.filter(r => r.date === dateStr);
    const isToday = dateStr === getTodayStr();
    const dayOfWeek = new Date(year, month, d).getDay();
    const isHoliday = dayOfWeek === 0 || KOREAN_HOLIDAYS[dateStr];
    dayCells.push(`<div class="calendar-day${isToday ? ' today' : ''}${isHoliday ? ' holiday' : ''}" data-date="${dateStr}">
      <span class="day-number">${d}</span>
      ${dayRecords.map(r => `<div class="record-title" data-id="${r.id}" data-title="${r.title}" data-content="${encodeURIComponent(r.content)}">${r.title}</div>`).join('')}
      ${KOREAN_HOLIDAYS[dateStr] ? `<div style='color:#ff6f91;font-size:0.9em;margin-top:0.2em;'>${KOREAN_HOLIDAYS[dateStr]}</div>` : ''}
    </div>`);
  }
  // 빈칸 (마지막날 이후, 6주 42칸 맞추기)
  while (dayCells.length < 42) dayCells.push('<div class="calendar-day"></div>');
  html += dayCells.join('');
  html += '</div>';
  calendar.innerHTML = html;
  // 월 이동
  document.getElementById('prev-month').onclick = () => changeMonth(-1);
  document.getElementById('next-month').onclick = () => changeMonth(1);
  // 달력 제목 클릭 시 년도/월 선택 모달
  document.getElementById('calendar-title').onclick = function() {
    showYearMonthPicker();
  };
  // 달력 날짜 클릭 이벤트 (입력 팝업)
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.onclick = function(e) {
      if (e.target.classList.contains('record-title')) return;
      const date = this.getAttribute('data-date');
      if (date) showCalendarAddModal(date);
    };
  });
  // 기록 제목 클릭 시 팝업(내용)
  document.querySelectorAll('.record-title').forEach(titleEl => {
    titleEl.onclick = function(e) {
      e.stopPropagation();
      const title = this.getAttribute('data-title');
      const content = decodeURIComponent(this.getAttribute('data-content'));
      showRecordModal(title, content);
    };
  });
  calendarYear = year;
  calendarMonth = month;
}

// changeMonth 함수는 renderCalendar만 호출하도록 수정
function changeMonth(diff) {
  let baseDate = new Date();
  baseDate.setHours(baseDate.getHours() + 9 - baseDate.getTimezoneOffset() / 60); // KST
  if (calendarYear !== undefined && calendarMonth !== undefined) {
    baseDate = new Date(calendarYear, calendarMonth, 1);
  }
  baseDate.setMonth(baseDate.getMonth() + diff);
  calendarYear = baseDate.getFullYear();
  calendarMonth = baseDate.getMonth();
  renderCalendar(calendarYear, calendarMonth);
}

// --- 달력 확대 모달 ---
async function showCalendarModal(date, year, month) {
  const modal = document.getElementById('calendar-modal');
  const modalDate = document.getElementById('calendar-modal-date');
  const modalRecords = document.getElementById('calendar-modal-records');
  const records = await getRecords();
  let title = '';
  let filteredRecords = [];
  
  if (date) {
    filteredRecords = records.filter(r => r.date === date);
    title = date + ' 기록';
  } else if (year !== undefined && month !== undefined) {
    // 월 전체
    const y = year;
    const m = month + 1;
    filteredRecords = records.filter(r => r.date.startsWith(`${y}-${String(m).padStart(2,'0')}`));
    title = `${y}년 ${m}월 기록`;
  }
  modalDate.textContent = title;
  modalRecords.innerHTML = '';
  if (filteredRecords.length === 0) {
    modalRecords.innerHTML = '<li>기록이 없습니다.</li>';
  } else {
    filteredRecords.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r.title;
      li.onclick = () => showRecordModal(r.title, r.content);
      modalRecords.appendChild(li);
    });
  }
  modal.style.display = 'flex';
  document.body.classList.add('calendar-modal-open');
}
document.getElementById('close-calendar-modal').onclick = function() {
  document.getElementById('calendar-modal').style.display = 'none';
  document.body.classList.remove('calendar-modal-open');
};
// --- 기록 내용 팝업(모달) ---
function showRecordModal(title, content) {
  const modal = document.getElementById('record-modal');
  document.getElementById('record-modal-title').textContent = title;
  document.getElementById('record-modal-content').textContent = content;
  modal.style.display = 'flex';
}
document.getElementById('close-record-modal').onclick = function() {
  document.getElementById('record-modal').style.display = 'none';
};
// 모달 바깥 클릭 시 닫기
window.addEventListener('click', function(e) {
  const calendarModal = document.getElementById('calendar-modal');
  const recordModal = document.getElementById('record-modal');
  if (e.target === calendarModal) {
    calendarModal.style.display = 'none';
    document.body.classList.remove('calendar-modal-open');
  }
  if (e.target === recordModal) recordModal.style.display = 'none';
});

// --- Firebase 인증 상태 감지 ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인된 상태
    showMain();
  } else {
    // 로그아웃된 상태
    showLoginSection();
  }
});

// --- 초기 진입 시 로그인 상태 확인 ---
window.onload = () => {
  recordDate.value = getTodayStr();
};

// 리스트 뷰 빠른 기록 추가 폼 이벤트
const listQuickAddForm = document.getElementById('list-quick-add-form');
if (listQuickAddForm) {
  const listQuickTitle = document.getElementById('list-quick-title');
  const listQuickContent = document.getElementById('list-quick-content');
  const listQuickDate = document.getElementById('list-quick-date');
  // 오늘 날짜 기본값
  listQuickDate.value = getTodayStr();
  listQuickAddForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = listQuickTitle.value.trim();
    const content = listQuickContent.value.trim();
    const date = listQuickDate.value;
    if (!title || !date) return;
    
    const result = await addRecord({ title, content, date });
    if (result.success) {
      listQuickAddForm.reset();
      listQuickDate.value = getTodayStr();
      await renderRecords();
      await renderCalendar();
    }
  };
}
