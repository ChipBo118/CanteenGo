// data.js
// Lớp dữ liệu dùng chung giữa trang khách hàng (index.html) và trang quản trị (admin.html).
// LƯU Ý: đây là bản mô phỏng (demo) — dữ liệu được lưu bằng localStorage/sessionStorage
// của trình duyệt, CHƯA kết nối tới server/database thật. Vì vậy hai trang cần được mở
// từ cùng một nguồn (cùng thư mục, tốt nhất là qua một local server) để chia sẻ dữ liệu.

const STORAGE_KEYS = {
  MENU: 'canteengo_menu_items',
  SALES_SEED: 'canteengo_sales_seed',
  ADMIN_SESSION: 'canteengo_admin_session',
};

const ADMIN_EMAIL_SUFFIX = '@vwa.edu.vn';

const DEFAULT_MENU_ITEMS = [
  { id: 1, name: 'Phở bò đặc biệt', price: 45000, category: 'popular', tagLabel: 'Phổ biến', tagClass: '', rating: 4.9, kcal: 650, time: 20, image: 'image-one', imageUrl: '', description: 'Phở bò thơm, nước dùng đậm vị, hành ngò tươi.' },
  { id: 2, name: 'Combo cơm gà xối mỡ', price: 65000, category: 'combo', tagLabel: 'Combo', tagClass: 'orange', rating: 4.8, kcal: 780, time: 18, image: 'image-two', imageUrl: '', description: 'Cơm trắng, gà xối mỡ, salad và nước chấm đậm vị.' },
  { id: 3, name: 'Bún chay sườn non', price: 40000, category: 'veg', tagLabel: 'Chay', tagClass: 'green', rating: 4.7, kcal: 540, time: 15, image: 'image-three', imageUrl: '', description: 'Bún chay thanh đạm, rau tươi, nước dùng từ nấm.' },
  { id: 4, name: 'Mỳ cay', price: 40000, category: 'popular', tagLabel: 'Phổ biến', tagClass: '', rating: 4.9, kcal: 500, time: 12, image: 'image-four', imageUrl: '', description: 'Mỳ cay 7 cấp độ.' },
  { id: 5, name: 'Cơm rang dưa bò', price: 35000, category: 'combo', tagLabel: 'Combo', tagClass: 'orange', rating: 4.8, kcal: 920, time: 25, image: 'image-five', imageUrl: '', description: 'Đồ ăn nhanh gọn, tiết kiệm thời gian cho buổi làm việc.' },
  { id: 6, name: 'Canh chua rau ngót', price: 20000, category: 'veg', tagLabel: 'Chay', tagClass: 'green', rating: 4.9, kcal: 350, time: 10, image: 'image-six', imageUrl: '', description: 'Ngon mát, bổ dưỡng, phù hợp cho bữa tối nhẹ.' },
];

function getMenuItems() {
  const raw = localStorage.getItem(STORAGE_KEYS.MENU);
  if (!raw) {
    saveMenuItems(DEFAULT_MENU_ITEMS);
    return [...DEFAULT_MENU_ITEMS];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (err) {
    /* dữ liệu lỗi -> dùng mặc định */
  }
  return [...DEFAULT_MENU_ITEMS];
}

function saveMenuItems(items) {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
}

function getNextMenuId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// ---------------------------------------------------------------------------
// PRNG có seed để dữ liệu doanh thu "mô phỏng" giữ nguyên giữa các lần tải lại
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSalesSeed() {
  let seed = localStorage.getItem(STORAGE_KEYS.SALES_SEED);
  if (!seed) {
    seed = String(Date.now());
    localStorage.setItem(STORAGE_KEYS.SALES_SEED, seed);
  }
  return Number(seed);
}

function resetSalesSeed() {
  localStorage.setItem(STORAGE_KEYS.SALES_SEED, String(Date.now()));
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_COUNT = 6;

// Sinh báo cáo doanh thu/số lượng bán ra mô phỏng, dựa trên danh sách món ăn hiện có.
function generateSalesReport() {
  const items = getMenuItems();
  const rand = mulberry32(getSalesSeed());
  const today = new Date();

  const daily = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const orders = 35 + Math.floor(rand() * 40);
    const revenue = Math.round((orders * (32000 + rand() * 25000)) / 1000) * 1000;
    daily.push({ label: WEEKDAY_LABELS[d.getDay()], date: d.toLocaleDateString('vi-VN'), orders, revenue });
  }

  const monthly = [];
  for (let i = MONTH_COUNT - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const orders = 900 + Math.floor(rand() * 700);
    const revenue = Math.round((orders * (33000 + rand() * 22000)) / 1000) * 1000;
    monthly.push({ label: `Th.${d.getMonth() + 1}`, orders, revenue });
  }

  const itemSales = items
    .map((item) => {
      const quantity = 20 + Math.floor(rand() * 180);
      return { id: item.id, name: item.name, category: item.category, quantity, revenue: quantity * item.price };
    })
    .sort((a, b) => b.quantity - a.quantity);

  return {
    daily,
    monthly,
    itemSales,
    totalOrders: daily.reduce((sum, d) => sum + d.orders, 0),
    totalUnitsSold: itemSales.reduce((sum, i) => sum + i.quantity, 0),
    totalRevenue7d: daily.reduce((sum, d) => sum + d.revenue, 0),
    totalRevenue6m: monthly.reduce((sum, m) => sum + m.revenue, 0),
    topItem: itemSales[0] || null,
  };
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

// ---------------------------------------------------------------------------
// Tài khoản demo — dùng để đăng nhập thử trên trang khách (sinh viên/giảng
// viên) và trang quản trị (admin). Đây là danh sách CỐ ĐỊNH, mô phỏng, chưa
// kết nối tới hệ thống xác thực thật.
// ---------------------------------------------------------------------------
const DEMO_ACCOUNTS = {
  student: [
    { mssv: 'SV2024001', email: 'thao.nguyen@student.edu.vn', password: 'sv123456', name: 'Nguyễn Thảo' },
    { mssv: 'SV2024002', email: 'linh.anh@student.edu.vn', password: 'sv123456', name: 'Linh Anh' },
  ],
  teacher: [
    { email: 'ha.minh@edu.vn', password: 'gv123456', name: 'Hà Minh' },
  ],
  admin: [
    { email: 'admin@vwa.edu.vn', password: 'Admin@123', name: 'Quản trị viên VWA' },
  ],
};

function findStudentAccount(identifier, password) {
  const norm = String(identifier || '').trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.student.find(
      (acc) => (acc.mssv.toLowerCase() === norm || acc.email.toLowerCase() === norm) && acc.password === password
    ) || null
  );
}

function findTeacherAccount(identifier, password) {
  const norm = String(identifier || '').trim().toLowerCase();
  return DEMO_ACCOUNTS.teacher.find((acc) => acc.email.toLowerCase() === norm && acc.password === password) || null;
}

function findAdminAccount(identifier, password) {
  const norm = String(identifier || '').trim().toLowerCase();
  return DEMO_ACCOUNTS.admin.find((acc) => acc.email.toLowerCase() === norm && acc.password === password) || null;
}

// ---------------------------------------------------------------------------
// Đăng nhập quản trị — chỉ chấp nhận email đuôi @vwa.edu.vn (mô phỏng, không có backend thật)
// ---------------------------------------------------------------------------
function isValidAdminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith(ADMIN_EMAIL_SUFFIX) && normalized.length > ADMIN_EMAIL_SUFFIX.length;
}

function getAdminSession() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function setAdminSession(email) {
  sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify({ email, loginAt: Date.now() }));
}

function clearAdminSession() {
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}
