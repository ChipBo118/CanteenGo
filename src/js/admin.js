// admin.js — Trang quản trị CanteenGo.
// Toàn bộ xác thực và số liệu doanh thu ở đây là MÔ PHỎNG, chạy hoàn toàn phía trình
// duyệt (localStorage/sessionStorage) — chưa kết nối tới server/database thật.
// Đăng nhập quản trị chỉ thực hiện ở trang chính (index.html, tab "Quản trị");
// trang này chỉ kiểm tra phiên và hiển thị dashboard nếu hợp lệ.

const adminDashboard = document.getElementById('adminDashboard');
const adminUserChip = document.getElementById('adminUserChip');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const refreshSalesBtn = document.getElementById('refreshSalesBtn');

let editingItemId = null;
let pendingDeleteId = null;

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
  });
});

// ---------------------------------------------------------------------------
// Kiểm tra quyền truy cập — chỉ vào được nếu đã đăng nhập quản trị hợp lệ ở
// trang chính. Không có phiên hợp lệ -> chuyển hướng ngay về index.html kèm
// cờ báo để trang chính tự mở modal đăng nhập ở tab "Quản trị"; dashboard
// (mặc định "hidden" trong HTML) sẽ không kịp hiển thị.
// ---------------------------------------------------------------------------
const adminSession = getAdminSession();

if (!adminSession || !isValidAdminEmail(adminSession.email)) {
  window.location.href = 'index.html?admin=required';
} else {
  adminDashboard.hidden = false;
  adminUserChip.textContent = `👤 ${adminSession.email}`;
  renderDashboard();
}

adminLogoutBtn.addEventListener('click', () => {
  clearAdminSession();
  window.location.href = 'index.html';
});

// ---------------------------------------------------------------------------
// Dashboard: tổng quan + doanh thu mô phỏng theo ngày/tháng
// ---------------------------------------------------------------------------
function categoryLabel(category) {
  return { popular: 'Phổ biến', veg: 'Chay', combo: 'Combo' }[category] || category;
}

function renderDashboard() {
  const report = generateSalesReport();
  renderStatCards(report);
  renderBarChart('dailyChart', report.daily, (d) => d.label);
  renderDailyTable(report.daily);
  renderBarChart('monthlyChart', report.monthly, (m) => m.label);
  renderMonthlyTable(report.monthly);
  renderItemSalesTable(report.itemSales);
  renderOrderManagementTable();
  renderMenuTable();
}

function renderStatCards(report) {
  const grid = document.getElementById('adminStatGrid');
  const cards = [
    { label: 'Tổng số suất đã bán', value: report.totalUnitsSold.toLocaleString('vi-VN'), hint: 'Mô phỏng theo menu hiện tại' },
    { label: 'Tổng đơn hàng', value: report.totalOrders.toLocaleString('vi-VN'), hint: '7 ngày gần nhất' },
    { label: 'Doanh thu 7 ngày', value: formatCurrency(report.totalRevenue7d), hint: 'Mô phỏng' },
    { label: 'Doanh thu 6 tháng', value: formatCurrency(report.totalRevenue6m), hint: 'Mô phỏng' },
    {
      label: 'Món bán chạy nhất',
      value: report.topItem ? report.topItem.name : '—',
      hint: report.topItem ? `${report.topItem.quantity} suất đã bán` : '',
    },
  ];

  grid.innerHTML = cards
    .map(
      (card) => `
        <div class="admin-stat-card">
          <span class="admin-stat-label">${card.label}</span>
          <strong class="admin-stat-value">${card.value}</strong>
          <span class="admin-stat-hint">${card.hint}</span>
        </div>
      `
    )
    .join('');
}

function renderBarChart(containerId, data, labelFn) {
  const container = document.getElementById(containerId);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  container.innerHTML = data
    .map((d) => {
      const heightPct = Math.max(6, Math.round((d.revenue / max) * 100));
      return `
        <div class="chart-bar-col">
          <div class="chart-bar" style="height:${heightPct}%" title="${formatCurrency(d.revenue)}"></div>
          <span class="chart-bar-label">${labelFn(d)}</span>
        </div>
      `;
    })
    .join('');
}

function renderDailyTable(daily) {
  document.getElementById('dailyTable').innerHTML = `
    <thead><tr><th>Ngày</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
    <tbody>
      ${daily.map((d) => `<tr><td>${d.date}</td><td>${d.orders}</td><td>${formatCurrency(d.revenue)}</td></tr>`).join('')}
    </tbody>
  `;
}

function renderMonthlyTable(monthly) {
  document.getElementById('monthlyTable').innerHTML = `
    <thead><tr><th>Tháng</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
    <tbody>
      ${monthly
        .map((m) => `<tr><td>${m.label}</td><td>${m.orders.toLocaleString('vi-VN')}</td><td>${formatCurrency(m.revenue)}</td></tr>`)
        .join('')}
    </tbody>
  `;
}

function renderItemSalesTable(itemSales) {
  document.getElementById('itemSalesTable').innerHTML = `
    <thead><tr><th>Món ăn</th><th>Danh mục</th><th>Số lượng bán</th><th>Doanh thu</th></tr></thead>
    <tbody>
      ${itemSales
        .map(
          (i) =>
            `<tr><td>${i.name}</td><td>${categoryLabel(i.category)}</td><td>${i.quantity}</td><td>${formatCurrency(i.revenue)}</td></tr>`
        )
        .join('')}
    </tbody>
  `;
}

refreshSalesBtn.addEventListener('click', () => {
  resetSalesSeed();
  renderDashboard();
});

function getAllOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function getOrderStatusClass(status) {
  switch (status) {
    case 'Đang xử lý':
      return 'status-processing';
    case 'Đang chuẩn bị':
      return 'status-preparing';
    case 'Đang giao':
      return 'status-delivering';
    case 'Đã giao':
      return 'status-delivered';
    case 'Đã hủy':
      return 'status-cancelled';
    default:
      return 'status-processing';
  }
}

function renderOrderManagementTable() {
  const orders = getAllOrders().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const table = document.getElementById('orderManagementTable');
  if (!table) return;

  if (!orders.length) {
    table.innerHTML = `
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Món</th><th>Tổng tiền</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
      <tbody>
        <tr><td colspan="7" class="empty-state">Chưa có đơn hàng nào.</td></tr>
      </tbody>
    `;
    return;
  }

  table.innerHTML = `
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Món</th><th>Tổng tiền</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>
      ${orders
        .map((order) => {
          const itemSummary = order.items && order.items.length ? order.items.map((item) => `${item.name} x${item.quantity}`).join(', ') : 'Không có món';
          const selectOptions = ORDER_STATUS_FLOW.map(
            (status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`
          ).join('');

          return `
            <tr>
              <td>${order.id}</td>
              <td>
                <strong>${order.customerName || 'Khách hàng'}</strong><br>
                <small>${order.customerEmail || 'guest@canteengo.local'}</small>
              </td>
              <td>${itemSummary}</td>
              <td>${formatCurrency(order.total || 0)}</td>
              <td>${order.date}</td>
              <td><span class="status-badge ${getOrderStatusClass(order.status)}">${order.status}</span></td>
              <td>
                <select class="status-select" data-order-id="${order.id}">
                  ${selectOptions}
                </select>
              </td>
            </tr>
          `;
        })
        .join('')}
    </tbody>
  `;

  table.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', (event) => {
      const orderId = event.target.dataset.orderId;
      const nextStatus = event.target.value;
      updateOrderStatus(orderId, nextStatus);
    });
  });
}

function updateOrderStatus(orderId, nextStatus) {
  const orders = getAllOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return;

  orders[index].status = nextStatus;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  renderDashboard();
}

// ---------------------------------------------------------------------------
// Quản lý món ăn: thêm / sửa / xoá
// ---------------------------------------------------------------------------
const itemForm = document.getElementById('itemForm');
const itemFormError = document.getElementById('itemFormError');
const addItemBtn = document.getElementById('addItemBtn');

function renderMenuTable() {
  const items = getMenuItems();
  const table = document.getElementById('menuTable');
  table.innerHTML = `
    <thead><tr><th>Món ăn</th><th>Danh mục</th><th>Giá</th><th>Calories</th><th>Thời gian</th><th></th></tr></thead>
    <tbody>
      ${items
        .map(
          (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${categoryLabel(item.category)}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${item.kcal || 0} kcal</td>
              <td>${item.time || 0} phút</td>
              <td class="admin-table-actions">
                <button type="button" class="admin-icon-btn" data-edit="${item.id}">Sửa</button>
                <button type="button" class="admin-icon-btn admin-danger" data-delete="${item.id}">Xoá</button>
              </td>
            </tr>
          `
        )
        .join('')}
    </tbody>
  `;

  table.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openItemModal(Number(btn.dataset.edit)));
  });
  table.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => confirmDeleteItem(Number(btn.dataset.delete)));
  });
}

function openItemModal(id) {
  editingItemId = id || null;
  itemFormError.hidden = true;
  document.getElementById('itemModalTitle').textContent = id ? 'Sửa món ăn' : 'Thêm món mới';
  document.getElementById('itemFormSubmit').textContent = id ? 'Lưu thay đổi' : 'Thêm món ăn';

  if (id) {
    const item = getMenuItems().find((i) => i.id === id);
    if (!item) return;
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemKcal').value = item.kcal || '';
    document.getElementById('itemTime').value = item.time || '';
    document.getElementById('itemImageUrl').value = item.imageUrl || '';
  } else {
    itemForm.reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemCategory').value = 'popular';
  }

  openModal('itemModal');
}

addItemBtn.addEventListener('click', () => openItemModal(null));

itemForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('itemName').value.trim();
  const price = Number(document.getElementById('itemPrice').value);
  const category = document.getElementById('itemCategory').value;
  const description = document.getElementById('itemDescription').value.trim();
  const kcal = Number(document.getElementById('itemKcal').value) || 0;
  const time = Number(document.getElementById('itemTime').value) || 0;
  const imageUrl = document.getElementById('itemImageUrl').value.trim();

  if (!name || !price || price <= 0) {
    itemFormError.textContent = 'Vui lòng nhập tên món và giá bán hợp lệ.';
    itemFormError.hidden = false;
    return;
  }

  const items = getMenuItems();
  const tagMap = {
    popular: { tagLabel: 'Phổ biến', tagClass: '' },
    veg: { tagLabel: 'Chay', tagClass: 'green' },
    combo: { tagLabel: 'Combo', tagClass: 'orange' },
  };

  if (editingItemId) {
    const idx = items.findIndex((i) => i.id === editingItemId);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        name,
        price,
        category,
        description,
        kcal,
        time,
        imageUrl,
        ...tagMap[category],
      };
    }
  } else {
    items.push({
      id: getNextMenuId(items),
      name,
      price,
      category,
      description,
      kcal,
      time,
      imageUrl,
      rating: 4.8,
      ...tagMap[category],
    });
  }

  saveMenuItems(items);
  closeModal('itemModal');
  renderDashboard();
});

function confirmDeleteItem(id) {
  const item = getMenuItems().find((i) => i.id === id);
  if (!item) return;
  pendingDeleteId = id;
  document.getElementById('deleteConfirmText').textContent =
    `Bạn có chắc muốn xoá "${item.name}" khỏi menu? Món ăn này sẽ không còn hiển thị trên trang đặt món.`;
  openModal('deleteConfirmModal');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (!pendingDeleteId) return;
  const items = getMenuItems().filter((i) => i.id !== pendingDeleteId);
  saveMenuItems(items);
  pendingDeleteId = null;
  closeModal('deleteConfirmModal');
  renderDashboard();
});