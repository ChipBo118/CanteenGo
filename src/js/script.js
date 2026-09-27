const cart = [];
const REVIEWS_STORAGE_KEY = 'canteengo_reviews';

const cartItemsEl = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const cartPanelEl = document.getElementById('cartPanel');
const cartToggleHeader = document.getElementById('cartToggleHeader');
const cartCloseBtn = document.getElementById('cartCloseBtn');
const cartReopenBtn = document.getElementById('cartReopenBtn');
const cartReopenCountEl = document.getElementById('cartReopenCount');
const shippingFee = 3000;

const formatMoney = (value) => `${value.toLocaleString('vi-VN')}đ`;

function updateCartReopenButton(totalQuantity) {
  const shouldShow = cartPanelEl.classList.contains('cart-manually-closed') && totalQuantity > 0;
  cartReopenBtn.hidden = !shouldShow;
  cartReopenCountEl.textContent = String(totalQuantity);
}

function showToast(message) {
  const toast = document.getElementById('appToast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 1800);
}

function renderCart() {
  if (!cart.length) {
    cartPanelEl.classList.add('cart-panel-hidden');
    cartCountEl.textContent = '0';
    subtotalEl.textContent = '0đ';
    totalEl.textContent = formatMoney(shippingFee);
    updateCartReopenButton(0);
    return;
  }

  cartPanelEl.classList.remove('cart-panel-hidden');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartItemsEl.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <h4>${item.name}</h4>
            <small>${formatMoney(item.price)} / mỗi phần</small>
          </div>
          <div class="item-price">
            <strong>${formatMoney(item.price * item.quantity)}</strong>
            <div class="qty-control">
              <button type="button" data-action="decrease" data-name="${item.name}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" data-name="${item.name}">+</button>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = String(totalQuantity);
  subtotalEl.textContent = formatMoney(subtotal);
  totalEl.textContent = formatMoney(subtotal + shippingFee);
  updateCartReopenButton(totalQuantity);
}

function getDefaultWalletBalance(role) {
  if (role === 'student') return 180000;
  if (role === 'teacher') return 260000;
  return 0;
}

function getWalletBalance(user) {
  if (!user) return 0;
  const value = Number(user.walletBalance ?? getDefaultWalletBalance(user.role));
  return Number.isFinite(value) ? value : 0;
}

function updateWalletPaymentUI() {
  const walletBox = document.getElementById('walletPaymentBox');
  const walletBalanceHint = document.getElementById('walletBalanceHint');
  const walletPaymentInfo = document.getElementById('walletPaymentInfo');
  const walletRadio = document.querySelector('input[name="paymentMethod"][value="Ví CanteenGo"]');

  if (!walletBox || !walletBalanceHint || !walletPaymentInfo || !walletRadio) return;

  const hasWallet = !!currentUser && currentUser.role !== 'guest';
  const balance = hasWallet ? getWalletBalance(currentUser) : 0;

  walletRadio.disabled = !hasWallet;
  walletBox.hidden = !hasWallet;

  if (!hasWallet) {
    walletPaymentInfo.textContent = 'Bạn cần đăng nhập với vai trò sinh viên hoặc giảng viên để sử dụng ví.';
    walletBalanceHint.textContent = 'Số dư: 0đ';
    return;
  }

  walletBalanceHint.textContent = `Số dư: ${formatMoney(balance)}`;
  walletPaymentInfo.textContent = `Bạn có thể thanh toán tối đa ${formatMoney(balance)} bằng ví CanteenGo.`;
}

function getSelectedPaymentMethod(form) {
  const selected = form.querySelector('input[name="paymentMethod"]:checked');
  return selected ? selected.value : 'Thanh toán khi nhận hàng';
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

function getOrderHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveOrderHistory(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartTotal() {
  return getCartSubtotal() + shippingFee;
}

function openCheckoutModal() {
  const checkoutSummaryBox = document.querySelector('.checkout-summary-box');
  const checkoutAddress = document.querySelector('.checkout-form input[type="text"]');
  const checkoutTotal = document.getElementById('checkoutTotal');

  if (currentUser && !String(currentUser.address || '').trim()) {
    alert('Vui lòng cập nhật địa chỉ giao hàng trong thông tin tài khoản trước khi đặt hàng.');
    openProfileEditor();
    return;
  }

  if (!checkoutSummaryBox) return openModal('checkoutModal');

  if (!cart.length) {
    checkoutSummaryBox.innerHTML = `
      <div class="checkout-row">
        <span>Giỏ hàng đang trống</span>
        <strong>0đ</strong>
      </div>
    `;
    if (checkoutTotal) checkoutTotal.textContent = '0đ';
    if (checkoutAddress) checkoutAddress.value = currentUser?.address || '';
    return openModal('checkoutModal');
  }

  const summaryRows = cart
    .map(
      (item) => `
        <div class="checkout-row">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${formatMoney(item.price * item.quantity)}</strong>
        </div>
      `
    )
    .join('');

  checkoutSummaryBox.innerHTML = `
    ${summaryRows}
    <div class="checkout-row total-row">
      <span>Tạm tính</span>
      <strong>${formatMoney(getCartSubtotal())}</strong>
    </div>
    <div class="checkout-row total-row">
      <span>Phí giao</span>
      <strong>${formatMoney(shippingFee)}</strong>
    </div>
    <div class="checkout-row total-row highlight-row">
      <span>Tổng</span>
      <strong id="checkoutTotal">${formatMoney(getCartTotal())}</strong>
    </div>
  `;

  if (checkoutAddress) {
    checkoutAddress.value = currentUser?.address || '';
  }

  openModal('checkoutModal');
}

function addToCart(name, price) {
  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  renderCart();
  showToast(`Đã thêm ${name} vào giỏ hàng`);
}

function updateQuantity(name, change) {
  const item = cart.find((entry) => entry.name === name);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    const index = cart.findIndex((entry) => entry.name === name);
    cart.splice(index, 1);
  }

  renderCart();
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

cartToggleHeader?.addEventListener('click', () => {
  cartPanelEl.classList.toggle('collapsed');
});

// Nút "×" tắt hẳn giỏ hàng (khác với thu gọn): ẩn toàn bộ panel và hiện nút
// nổi để mở lại khi cần.
cartCloseBtn?.addEventListener('click', (event) => {
  event.stopPropagation(); // tránh trùng với sự kiện thu gọn/mở rộng của cart-header
  cartPanelEl.classList.add('cart-manually-closed');
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  updateCartReopenButton(totalQuantity);
});

cartReopenBtn?.addEventListener('click', () => {
  cartPanelEl.classList.remove('cart-manually-closed');
  cartReopenBtn.hidden = true;
});

// Một listener duy nhất cho toàn trang: xử lý cả nút "+ Thêm" (được sinh động
// từ danh sách món ăn) lẫn các nút tăng/giảm số lượng trong giỏ hàng.
document.addEventListener('click', (event) => {
  const detailBtn = event.target.closest('[data-detail-item-id]');
  if (detailBtn && !event.target.closest('.add-to-cart')) {
    openItemDetail(detailBtn.dataset.detailItemId);
    return;
  }

  const reviewBtn = event.target.closest('[data-review-order-id]');
  if (reviewBtn) {
    openReviewModal(reviewBtn.dataset.reviewOrderId);
    return;
  }

  const orderBtn = event.target.closest('[data-order-detail-id]');
  if (orderBtn) {
    openOrderDetail(orderBtn.dataset.orderDetailId);
    return;
  }

  const addBtn = event.target.closest('.add-to-cart');
  if (addBtn) {
    addToCart(addBtn.dataset.name, Number(addBtn.dataset.price));
    cartPanelEl.classList.remove('collapsed');
    cartPanelEl.classList.remove('cart-manually-closed');
    cartReopenBtn.hidden = true;
    return;
  }

  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const name = button.dataset.name;

  if (action === 'increase') updateQuantity(name, 1);
  if (action === 'decrease') updateQuantity(name, -1);
});

// ---------------------------------------------------------------------------
// Thực đơn: được sinh động từ dữ liệu dùng chung (data.js), để các thay đổi
// (thêm/sửa/xoá món) từ trang quản trị được phản ánh ngay trên trang khách.
// ---------------------------------------------------------------------------
const menuGridEl = document.getElementById('menuGrid');

function buildMenuCard(item) {
  const hasCustomImage = Boolean(item.imageUrl);
  const imageClasses = ['menu-image'];
  let fallbackContent = '';

  if (hasCustomImage) {
    imageClasses.push('menu-image-custom');
  } else if (item.image) {
    imageClasses.push(item.image);
  } else {
    imageClasses.push('menu-image-fallback');
    fallbackContent = `<span>${(item.name || '?').charAt(0).toUpperCase()}</span>`;
  }

  const imageStyle = hasCustomImage ? ` style="background-image:url('${item.imageUrl}')"` : '';

  return `
    <article class="menu-card" data-category="${item.category}">
      <div class="${imageClasses.join(' ')}"${imageStyle}>${fallbackContent}</div>
      <div class="menu-body">
        <div class="menu-topline">
          <span class="tag ${item.tagClass || ''}">${item.tagLabel || ''}</span>
          <span class="rating">★ ${item.rating ?? '4.8'}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description || ''}</p>
        <div class="menu-meta">
          <span>${item.kcal || 0} kcal</span>
          <span>${item.time || 0} phút</span>
        </div>
        <div class="menu-footer">
          <strong>${formatMoney(item.price)}</strong>
          <button class="add-to-cart" data-name="${item.name}" data-price="${item.price}">+ Thêm</button>
        </div>
      </div>
    </article>
  `;
}

function renderMenu() {
  if (!menuGridEl) return;
  const items = getMenuItems();
  menuGridEl.innerHTML = items.map((item) => `
    <article class="menu-card" data-category="${item.category}" data-detail-item-id="${item.id}">
      <div class="menu-image ${item.image || 'menu-image-fallback'}" ${item.imageUrl ? `style="background-image:url('${item.imageUrl}')"` : ''}>
        ${item.imageUrl ? '' : `<span>${(item.name || '?').charAt(0).toUpperCase()}</span>`}
      </div>
      <div class="menu-body">
        <div class="menu-topline">
          <span class="tag ${item.tagClass || ''}">${item.tagLabel || ''}</span>
          <span class="rating">★ ${item.rating ?? '4.8'}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description || ''}</p>
        <div class="menu-meta">
          <span>${item.kcal || 0} kcal</span>
          <span>${item.time || 0} phút</span>
        </div>
        <div class="menu-footer">
          <strong>${formatMoney(item.price)}</strong>
          <div class="menu-actions">
            <button class="ghost-btn" type="button" data-detail-item-id="${item.id}">Chi tiết</button>
            <button class="add-to-cart" data-name="${item.name}" data-price="${item.price}">+ Thêm</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const selected = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  document.querySelectorAll('.menu-card').forEach((card) => {
    const show = selected === 'all' || card.dataset.category === selected;
    card.style.display = show ? 'block' : 'none';
  });
}

function getStoredReviews() {
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    return [];
  }
}

function saveStoredReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function renderDefaultReviews() {
  const reviewGrid = document.querySelector('.review-grid');
  if (!reviewGrid) return;

  const reviews = getStoredReviews();
  const fallback = [
    { id: 'default-1', name: 'Nguyễn Thảo', role: 'Sinh viên', rating: 5, comment: 'Món ăn ngon, giao hàng đúng giờ và rất tiện cho buổi học.' },
    { id: 'default-2', name: 'Hà Minh', role: 'Giảng viên', rating: 5, comment: 'Combo bữa trưa tiết kiệm thời gian, phù hợp cho ngày làm việc bận.' },
    { id: 'default-3', name: 'Linh Anh', role: 'Khách hàng', rating: 4, comment: 'Menu đa dạng, dễ đặt và đổi món nhanh.' },
  ];

  const items = reviews.length ? reviews : fallback;
  reviewGrid.innerHTML = items
    .slice(0, 3)
    .map(
      (review) => `
        <article class="review-card">
          <div class="review-user">
            <div class="avatar avatar-${(review.name || 'N').charAt(0).toLowerCase() === 'h' ? 'two' : (review.name || 'N').charAt(0).toLowerCase() === 'l' ? 'three' : 'one'}">${(review.name || 'N').charAt(0).toUpperCase()}</div>
            <div>
              <strong>${review.name || 'Khách hàng'}</strong>
              <span>${review.role || 'Khách hàng'}</span>
            </div>
          </div>
          <p>"${review.comment || 'Món ăn ngon và phục vụ tốt.'}"</p>
          <div class="rating">${'★'.repeat(Number(review.rating || 5))}${'☆'.repeat(5 - Number(review.rating || 5))}</div>
        </article>
      `
    )
    .join('');
}

function openItemDetail(itemId) {
  const item = getMenuItems().find((entry) => Number(entry.id) === Number(itemId));
  const container = document.getElementById('itemDetailContent');
  if (!item || !container) return;

  container.innerHTML = `
    <div class="item-detail-layout">
      <div class="menu-image ${item.image || 'menu-image-fallback'}" ${item.imageUrl ? `style="background-image:url('${item.imageUrl}')"` : ''}>
        ${item.imageUrl ? '' : `<span>${(item.name || '?').charAt(0).toUpperCase()}</span>`}
      </div>
      <div class="item-detail-body">
        <div class="menu-topline">
          <span class="tag ${item.tagClass || ''}">${item.tagLabel || ''}</span>
          <span class="rating">★ ${item.rating ?? '4.8'}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description || 'Món ăn được yêu thích trong menu hôm nay.'}</p>
        <div class="menu-meta">
          <span>${item.kcal || 0} kcal</span>
          <span>${item.time || 0} phút</span>
        </div>
        <div class="detail-meta-row">
          <strong>${formatMoney(item.price)}</strong>
          <button class="add-to-cart" data-name="${item.name}" data-price="${item.price}">+ Thêm vào giỏ</button>
        </div>
      </div>
    </div>
  `;

  openModal('itemDetailModal');
}

function openOrderDetail(orderId) {
  const order = getOrderHistory().find((entry) => entry.id === orderId);
  const container = document.getElementById('orderDetailContent');
  if (!order || !container) return;

  const rows = (order.items || [])
    .map((item) => `<li>${item.name} × ${item.quantity} — ${formatMoney(item.price * item.quantity)}</li>`)
    .join('');

  container.innerHTML = `
    <div class="order-detail-wrap">
      <div class="order-detail-header">
        <strong>Mã đơn: ${order.id}</strong>
        <span class="status-badge ${getOrderStatusClass(order.status)}">${order.status}</span>
      </div>
      <div class="order-detail-grid">
        <p><strong>Khách hàng:</strong> ${order.customerName || 'Khách hàng'}</p>
        <p><strong>Email:</strong> ${order.customerEmail || 'guest@canteengo.local'}</p>
        <p><strong>Ngày:</strong> ${order.date || '—'}</p>
        <p><strong>Thanh toán:</strong> ${order.paymentMethod || 'Chưa xác định'}</p>
        <p><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus || 'Chưa thanh toán'}</p>
        <p><strong>Địa chỉ:</strong> ${order.address || 'Không có địa chỉ'}</p>
      </div>
      <div class="order-items-box">
        <h4>Món trong đơn</h4>
        <ul>${rows || '<li>Không có món nào.</li>'}</ul>
      </div>
      <div class="checkout-row total-row highlight-row">
        <span>Tổng tiền</span>
        <strong>${formatMoney(order.total || 0)}</strong>
      </div>
    </div>
  `;

  openModal('orderDetailModal');
}

function openReviewModal(orderId) {
  const form = document.getElementById('feedbackForm');
  if (!form) return;
  form.reviewOrderId.value = orderId;
  openModal('reviewModal');
}

function handleReviewSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const orderId = form.reviewOrderId.value;
  const rating = Number(form.reviewRating.value || 5);
  const comment = (form.reviewComment.value || '').trim();

  if (!orderId || !comment) {
    alert('Vui lòng nhập nhận xét trước khi gửi đánh giá.');
    return;
  }

  const order = getOrderHistory().find((entry) => entry.id === orderId);
  const review = {
    id: `review-${Date.now()}`,
    name: currentUser?.name || 'Khách hàng',
    role: currentUser ? ROLE_DISPLAY[currentUser.role] || 'Khách hàng' : 'Khách hàng',
    rating,
    comment,
    item: order && order.items && order.items.length ? order.items[0].name : 'Món ăn',
    date: new Date().toLocaleDateString('vi-VN'),
  };

  const reviews = getStoredReviews();
  reviews.unshift(review);
  saveStoredReviews(reviews.slice(0, 6));
  renderDefaultReviews();
  closeModal('reviewModal');
  form.reset();
  showToast('Cảm ơn bạn đã đánh giá món ăn.');
}

// Tự cập nhật thực đơn nếu dữ liệu món ăn thay đổi từ tab/trang quản trị khác
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.MENU) renderMenu();
});

document.querySelectorAll('.filter-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');

    const selected = button.dataset.filter;
    const cards = document.querySelectorAll('.menu-card');

    cards.forEach((card) => {
      const show = selected === 'all' || card.dataset.category === selected;
      card.style.display = show ? 'block' : 'none';
    });
  });
});

// ---------------------------------------------------------------------------
// Đăng nhập / đăng ký theo luồng đơn nhất: tab "Đăng nhập" / "Đăng ký"
// Hệ thống sẽ tự động xác định vai trò dựa trên đuôi email.
// ---------------------------------------------------------------------------
const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const guestPanel = document.getElementById('guestPanel');
const userDashboard = document.getElementById('userDashboard');
const profileForm = document.getElementById('profileForm');
const CURRENT_USER_STORAGE_KEY = 'canteengo_current_user';

let currentUser = null;

const ROLE_LABELS = {
  student: '🎓',
  teacher: '🧑‍🏫',
  guest: '👤',
  admin: '🛡️',
};

const ROLE_DISPLAY = {
  student: 'Sinh viên',
  teacher: 'Giảng viên',
  guest: 'Khách vãng lai',
  admin: 'Quản trị viên',
};

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function persistCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }
}

function syncCurrentUserToStoredAccounts(user) {
  if (!user || !user.email) return;

  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((account) => normalizeEmail(account.email) === normalizeEmail(user.email));

  if (index === -1) return;

  const updatedAccount = {
    ...accounts[index],
    name: user.name || accounts[index].name,
    email: user.email || accounts[index].email,
    phone: user.phone || accounts[index].phone || '',
    address: user.address || accounts[index].address || '',
  };

  accounts[index] = updatedAccount;
  saveRegisteredAccounts(accounts);
}

function showAuthMode(mode) {
  const tabs = document.querySelectorAll('.auth-mode-tab');
  const isLoginMode = mode === 'login';

  tabs.forEach((tab) => {
    const active = tab.dataset.authMode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  if (loginForm) loginForm.hidden = !isLoginMode;
  if (registerForm) registerForm.hidden = isLoginMode;
  if (guestPanel) guestPanel.hidden = !isLoginMode;
}

function showAuthError(role, message) {
  const errorEl = document.querySelector(`[data-error-for="${role}"]`);
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideAuthError(role) {
  const errorEl = document.querySelector(`[data-error-for="${role}"]`);
  if (errorEl) errorEl.hidden = true;
}

function getRoleBadge(role) {
  const label = ROLE_DISPLAY[role] || ROLE_DISPLAY.guest;
  return `${ROLE_LABELS[role] || ROLE_LABELS.guest} ${label}`;
}

function getUserOrderRows() {
  if (!currentUser) return [];

  const email = String(currentUser.email || '').toLowerCase();
  const userId = String(currentUser.identifier || '').toLowerCase();

  return getOrderHistory()
    .filter((order) => {
      const owner = String(order.customerEmail || '').toLowerCase();
      return !owner || owner === email || owner === userId;
    })
    .slice(0, 10)
    .map((order) => ({
      id: order.id,
      date: order.date,
      item: order.items && order.items.length ? order.items.map((item) => `${item.name} x${item.quantity}`).join(', ') : 'Món ăn',
      status: order.status,
      total: order.total || order.subtotal || 0,
      canCancel: order.status === 'Đang xử lý',
      canReview: order.status === 'Đã giao',
    }));
}

function renderUserDashboard() {
  if (!userDashboard) return;

  if (!currentUser || currentUser.role === 'guest') {
    userDashboard.hidden = true;
    return;
  }

  const fullName = currentUser.name || currentUser.identifier || 'Người dùng';
  const email = currentUser.email || '-';
  const phone = currentUser.phone || '-';
  const address = currentUser.address || '-';
  const status = currentUser.role === 'student' ? 'Đang học' : currentUser.role === 'teacher' ? 'Đang giảng dạy' : 'Hoạt động';
  const wallet = getWalletBalance(currentUser);

  const profileNameEl = document.getElementById('profileName');
  const profileEmailEl = document.getElementById('profileEmail');
  const profileRoleEl = document.getElementById('profileRole');
  const profileStatusEl = document.getElementById('profileStatus');
  const walletBalanceEl = document.getElementById('walletBalance');
  const userOrderTableBodyEl = document.getElementById('userOrderTableBody');

  if (profileNameEl) profileNameEl.textContent = fullName;
  if (profileEmailEl) profileEmailEl.textContent = email;
  if (profileRoleEl) profileRoleEl.textContent = getRoleBadge(currentUser.role);
  if (profileStatusEl) profileStatusEl.textContent = status;
  if (walletBalanceEl) walletBalanceEl.textContent = formatMoney(wallet);

  const profileTable = document.querySelector('.profile-table tbody');
  if (profileTable && profileTable.rows.length >= 4) {
    const rowName = profileTable.rows[0];
    const rowEmail = profileTable.rows[1];
    const rowRole = profileTable.rows[2];
    const rowStatus = profileTable.rows[3];
    if (rowName) rowName.cells[1].textContent = fullName;
    if (rowEmail) rowEmail.cells[1].textContent = email;
    if (rowRole) rowRole.cells[1].textContent = getRoleBadge(currentUser.role);
    if (rowStatus) rowStatus.cells[1].textContent = status;
  }

  const infoRowPhone = document.getElementById('profilePhone');
  const infoRowAddress = document.getElementById('profileAddress');
  if (infoRowPhone) infoRowPhone.textContent = phone;
  if (infoRowAddress) infoRowAddress.textContent = address;

  const rows = getUserOrderRows();

  if (userOrderTableBodyEl) {
    if (!rows.length) {
      userOrderTableBodyEl.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">Chưa có đơn hàng.</td>
        </tr>
      `;
    } else {
      userOrderTableBodyEl.innerHTML = rows
        .map(
          (order) => `
            <tr>
              <td>${order.id}</td>
              <td>${order.date}</td>
              <td>${order.item}</td>
              <td>${order.status}</td>
              <td>
                <div class="inline-order-actions">
                  <button type="button" class="ghost-btn small-btn" data-order-detail-id="${order.id}">Chi tiết</button>
                  ${order.canCancel ? `<button type="button" class="cancel-order-btn" data-cancel-order-id="${order.id}">Hủy đơn</button>` : ''}
                  ${order.canReview ? `<button type="button" class="secondary-btn small-btn" data-review-order-id="${order.id}">Đánh giá</button>` : ''}
                </div>
              </td>
            </tr>
          `
        )
        .join('');
    }
  }

  renderAccountOrdersTab();
  userDashboard.hidden = false;
}

function updateAuthUI() {
  if (!loginBtn) return;

  if (currentUser && currentUser.role !== 'guest') {
    const displayName = currentUser.name || currentUser.email || currentUser.identifier || 'Tài khoản';
    loginBtn.textContent = `${ROLE_LABELS[currentUser.role]} ${displayName}`;
    loginBtn.dataset.mode = 'logout';
    renderUserDashboard();
  } else if (currentUser && currentUser.role === 'guest') {
    loginBtn.textContent = 'Khách vãng lai';
    loginBtn.dataset.mode = 'logout';
    userDashboard.hidden = true;
  } else {
    loginBtn.textContent = 'Đăng nhập';
    loginBtn.dataset.mode = 'login';
    if (userDashboard) userDashboard.hidden = true;
  }
}

function populateProfileForm() {
  if (!profileForm || !currentUser) return;
  profileForm.profileName.value = currentUser.name || '';
  profileForm.profileRole.value = ROLE_DISPLAY[currentUser.role] || ROLE_DISPLAY.guest;
  profileForm.profilePhone.value = currentUser.phone || '';
  profileForm.profileAddress.value = currentUser.address || '';
}

function switchAccountEditorTab(tabName) {
  const buttons = document.querySelectorAll('.account-editor-tab');
  const panels = document.querySelectorAll('.account-editor-panel');

  buttons.forEach((button) => {
    const active = button.dataset.accountTab === tabName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  panels.forEach((panel) => {
    const active = panel.id === (tabName === 'orders' ? 'accountOrdersPanel' : 'accountInfoPanel');
    panel.classList.toggle('active', active);
  });
}

function renderAccountOrdersTab() {
  const tableBody = document.getElementById('profileOrdersTableBody');
  if (!tableBody) return;

  const rows = getUserOrderRows();

  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Chưa có đơn hàng nào.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.date}</td>
          <td>${order.status}</td>
          <td>${formatMoney(order.total)}</td>
          <td>
            <div class="inline-order-actions">
              <button type="button" class="ghost-btn small-btn" data-order-detail-id="${order.id}">Chi tiết</button>
              ${order.canCancel ? `<button type="button" class="cancel-order-btn" data-cancel-order-id="${order.id}">Hủy đơn</button>` : '<span class="order-action-disabled">Không thể</span>'}
              ${order.canReview ? `<button type="button" class="secondary-btn small-btn" data-review-order-id="${order.id}">Đánh giá</button>` : ''}
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function cancelOrder(orderId) {
  const orders = getOrderHistory();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return;

  const order = orders[index];
  if (order.status !== 'Đang xử lý') {
    alert('Chỉ đơn hàng đang ở trạng thái “Đang xử lý” mới được hủy.');
    return;
  }

  order.status = 'Đã hủy';
  order.paymentStatus = 'Đã hủy';

  if (order.paymentMethod === 'Ví CanteenGo' && currentUser && currentUser.role !== 'guest') {
    const refundedAmount = Number(order.total || order.subtotal || 0);
    currentUser.walletBalance = getWalletBalance(currentUser) + refundedAmount;
    persistCurrentUser(currentUser);
  }

  orders[index] = order;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

  renderUserDashboard();
  renderAccountOrdersTab();
  showToast(`Đơn hàng ${orderId} đã được hủy.`);
}

function openProfileEditor() {
  if (!currentUser) return;
  populateProfileForm();
  renderAccountOrdersTab();
  switchAccountEditorTab('info');
  openModal('profileModal');
}

function handleLogout() {
  currentUser = null;
  persistCurrentUser(null);
  closeModal('profileModal');
  updateAuthUI();
}

loginBtn?.addEventListener('click', () => {
  if (loginBtn.dataset.mode === 'logout') {
    openProfileEditor();
    return;
  }
  openModal('authModal');
});

document.getElementById('orderBtn')?.addEventListener('click', () => openCheckoutModal());
document.getElementById('checkoutBtn')?.addEventListener('click', () => openCheckoutModal());

document.querySelectorAll('.auth-mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    showAuthMode(tab.dataset.authMode);
  });
});

document.querySelectorAll('.account-editor-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    switchAccountEditorTab(tab.dataset.accountTab);
  });
});

function handleLoginFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const identifier = form.identifier.value.trim();
  const password = form.password.value.trim();

  if (!identifier || !password) {
    showAuthError('login', 'Vui lòng nhập đầy đủ email/MSSV và mật khẩu.');
    return;
  }

  const normalizedIdentifier = normalizeEmail(identifier);
  const inferredRole = classifyEmailRole(normalizedIdentifier);
  const adminMatch = findAdminAccount(identifier, password);

  if (adminMatch) {
    hideAuthError('login');
    setAdminSession(adminMatch.email);
    form.reset();
    closeModal('authModal');
    window.location.href = 'admin.html';
    return;
  }

  let role = inferredRole === 'teacher' ? 'teacher' : inferredRole === 'student' ? 'student' : 'guest';
  let account = null;

  if (role === 'student') {
    account = findStudentAccount(identifier, password);
  }

  if (role === 'teacher') {
    account = findTeacherAccount(identifier, password);
  }

  if (role === 'guest') {
    account = findGuestAccount(identifier, password);
  }

  if (!account) {
    showAuthError('login', 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng dùng tài khoản demo hoặc email đã đăng ký hợp lệ.');
    return;
  }

  hideAuthError('login');
  currentUser = {
    role,
    name: account.name,
    email: account.email || normalizedIdentifier,
    identifier: account.email || account.mssv || identifier,
    phone: account.phone || '',
    address: account.address || '',
    walletBalance: Number(account.walletBalance ?? getDefaultWalletBalance(role)),
  };
  persistCurrentUser(currentUser);
  updateAuthUI();
  form.reset();
  closeModal('authModal');
}

function handleRegisterFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.fullName.value.trim();
  const email = form.registerEmail.value.trim();
  const password = form.registerPassword.value.trim();
  const errorEl = form.querySelector('[data-error-for="register"]');

  if (!name || !email || !password) {
    if (errorEl) {
      errorEl.textContent = 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.';
      errorEl.hidden = false;
    }
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const inferredRole = classifyEmailRole(normalizedEmail);

  if (inferredRole === 'admin') {
    if (errorEl) {
      errorEl.textContent = 'Admin không được tự đăng ký. Vui lòng dùng email khác.';
      errorEl.hidden = false;
    }
    return;
  }

  const roleToRegister = inferredRole === 'student' || inferredRole === 'teacher' ? inferredRole : 'guest';
  const result = registerDemoAccount({ name, email, password, role: roleToRegister });
  if (!result.ok) {
    if (errorEl) {
      errorEl.textContent = result.message;
      errorEl.hidden = false;
    }
    return;
  }

  if (errorEl) errorEl.hidden = true;
  form.reset();
  if (loginForm && loginForm.identifier) loginForm.identifier.value = result.account.email;
  showAuthMode('login');
  alert('Tài khoản đã được tạo thành công. Bạn có thể đăng nhập ngay bằng email vừa đăng ký.');
}

loginForm?.addEventListener('submit', handleLoginFormSubmit);
registerForm?.addEventListener('submit', handleRegisterFormSubmit);

document.getElementById('continueAsGuestBtn')?.addEventListener('click', () => {
  currentUser = { role: 'guest', name: 'Khách vãng lai', email: null, identifier: null, phone: '', address: '', walletBalance: 0 };
  persistCurrentUser(currentUser);
  updateAuthUI();
  closeModal('authModal');
});

profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const form = event.target;
  const name = form.profileName.value.trim();
  const phone = form.profilePhone.value.trim();
  const address = form.profileAddress.value.trim();

  if (!name) {
    alert('Vui lòng nhập họ và tên.');
    return;
  }

  if (!address) {
    alert('Vui lòng cập nhật địa chỉ giao hàng trước khi đặt món.');
    return;
  }

  currentUser = {
    ...currentUser,
    name,
    phone,
    address,
  };

  syncCurrentUserToStoredAccounts(currentUser);
  persistCurrentUser(currentUser);
  updateAuthUI();
  renderUserDashboard();
  closeModal('profileModal');
  showToast('Cập nhật thông tin tài khoản thành công!');
});

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

document.addEventListener('click', (event) => {
  const cancelBtn = event.target.closest('[data-cancel-order-id]');
  if (cancelBtn) {
    cancelOrder(cancelBtn.dataset.cancelOrderId);
  }
});

function handleAdminRedirectNotice() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') !== 'required') return;

  openModal('authModal');
  showAuthMode('login');
  showAuthError('login', 'Vui lòng đăng nhập bằng tài khoản quản trị để tiếp tục.');

  params.delete('admin');
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', newUrl);
}

currentUser = loadCurrentUser();
showAuthMode('login');
updateAuthUI();
handleAdminRedirectNotice();

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
  });
});

document.getElementById('feedbackForm')?.addEventListener('submit', handleReviewSubmit);

document.querySelector('.checkout-form')?.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!cart.length) {
    alert('Giỏ hàng đang trống. Vui lòng chọn món trước khi đặt hàng.');
    return;
  }

  const form = event.target;
  const address = (form.querySelector('input[type="text"]')?.value || '').trim();

  if (!address) {
    alert('Vui lòng cập nhật địa chỉ giao hàng trong thông tin tài khoản trước khi đặt hàng.');
    openProfileEditor();
    return;
  }

  const paymentMethod = getSelectedPaymentMethod(form);
  const subtotal = getCartSubtotal();
  const total = getCartTotal();

  if (paymentMethod === 'Ví CanteenGo') {
    if (!currentUser || currentUser.role === 'guest') {
      alert('Khách vãng lai không thể sử dụng ví CanteenGo. Vui lòng chọn phương thức khác.');
      return;
    }

    const available = getWalletBalance(currentUser);
    if (available < total) {
      alert(`Số dư ví không đủ. Bạn đang có ${formatMoney(available)} nhưng tổng đơn là ${formatMoney(total)}.`);
      return;
    }

    currentUser.walletBalance = available - total;
    persistCurrentUser(currentUser);
  }

  const userEmail = currentUser?.email || currentUser?.identifier || 'guest@canteengo.local';
  const userName = currentUser?.name || 'Khách vãng lai';

  const newOrder = {
    id: `CN-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('vi-VN'),
    customerName: userName,
    customerEmail: userEmail,
    address,
    paymentMethod,
    paymentStatus: paymentMethod === 'Ví CanteenGo' ? 'Đã thanh toán' : 'Chưa thanh toán',
    items: cart.map((item) => ({ ...item })),
    subtotal,
    shippingFee,
    total,
    status: 'Đang xử lý',
  };

  const orders = getOrderHistory();
  orders.unshift(newOrder);
  saveOrderHistory(orders);

  cart.length = 0;
  renderCart();
  if (currentUser) renderUserDashboard();
  updateWalletPaymentUI();
  closeModal('checkoutModal');
  showToast(`Đặt hàng thành công! Mã đơn ${newOrder.id}.`);
  form.reset();
});

renderMenu();
renderCart();