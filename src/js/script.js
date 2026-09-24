const cart = [];

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

function addToCart(name, price) {
  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  renderCart();
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
  menuGridEl.innerHTML = items.map(buildMenuCard).join('');

  // Áp dụng lại bộ lọc danh mục đang được chọn (nếu khác "Tất cả")
  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const selected = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  document.querySelectorAll('.menu-card').forEach((card) => {
    const show = selected === 'all' || card.dataset.category === selected;
    card.style.display = show ? 'block' : 'none';
  });
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
// Đăng nhập theo 3 vai trò: Sinh viên / Giảng viên / Khách vãng lai
// ---------------------------------------------------------------------------
const loginBtn = document.getElementById('loginBtn');
let currentUser = null; // { role: 'student' | 'teacher' | 'guest', identifier }

const ROLE_LABELS = {
  student: '🎓',
  teacher: '🧑‍🏫',
};

function updateAuthUI() {
  if (!loginBtn) return;

  if (currentUser && currentUser.role !== 'guest') {
    loginBtn.textContent = `${ROLE_LABELS[currentUser.role]} ${currentUser.identifier}`;
    loginBtn.dataset.mode = 'logout';
  } else {
    loginBtn.textContent = 'Đăng nhập';
    loginBtn.dataset.mode = 'login';
  }
}

loginBtn?.addEventListener('click', () => {
  if (loginBtn.dataset.mode === 'logout') {
    currentUser = null;
    updateAuthUI();
    return;
  }
  openModal('authModal');
});

document.getElementById('orderBtn')?.addEventListener('click', () => openModal('checkoutModal'));
document.getElementById('checkoutBtn')?.addEventListener('click', () => openModal('checkoutModal'));

// Chuyển tab vai trò trong modal đăng nhập
document.querySelectorAll('.role-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const role = tab.dataset.role;

    document.querySelectorAll('.role-tab').forEach((btn) => {
      btn.classList.toggle('active', btn === tab);
      btn.setAttribute('aria-selected', btn === tab ? 'true' : 'false');
    });

    document.querySelectorAll('[data-role-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.rolePanel !== role;
    });
  });
});

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

function handleRoleFormSubmit(event, role) {
  event.preventDefault();

  const form = event.target;
  const identifier = form.identifier.value.trim();
  const password = form.password.value.trim();

  if (!identifier || !password) {
    showAuthError(role, 'Vui lòng nhập đầy đủ thông tin đăng nhập.');
    return;
  }

  if (role === 'teacher' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
    showAuthError(role, 'Email giảng viên không hợp lệ.');
    return;
  }

  if (password.length < 6) {
    showAuthError(role, 'Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  const account = role === 'teacher' ? findTeacherAccount(identifier, password) : findStudentAccount(identifier, password);

  if (!account) {
    showAuthError(role, 'Tài khoản hoặc mật khẩu không chính xác. Xem tài khoản demo bên dưới.');
    return;
  }

  hideAuthError(role);
  currentUser = { role, identifier: account.name };
  updateAuthUI();
  form.reset();
  closeModal('authModal');
}

document
  .querySelector('form[data-role-panel="student"]')
  ?.addEventListener('submit', (event) => handleRoleFormSubmit(event, 'student'));

document
  .querySelector('form[data-role-panel="teacher"]')
  ?.addEventListener('submit', (event) => handleRoleFormSubmit(event, 'teacher'));

document.getElementById('continueAsGuestBtn')?.addEventListener('click', () => {
  currentUser = { role: 'guest', identifier: null };
  updateAuthUI();
  closeModal('authModal');
});

// ---------------------------------------------------------------------------
// Đăng nhập quản trị ngay trong modal của trang chính. Đăng nhập thành công sẽ
// mở phiên quản trị rồi chuyển hẳn sang trang dashboard riêng (admin.html) —
// trang đó chỉ hiển thị cho ai có phiên quản trị hợp lệ.
// ---------------------------------------------------------------------------
function handleAdminFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const identifier = form.identifier.value.trim();
  const password = form.password.value.trim();

  if (!identifier || !password) {
    showAuthError('admin', 'Vui lòng nhập đầy đủ email và mật khẩu quản trị.');
    return;
  }

  if (!isValidAdminEmail(identifier)) {
    showAuthError('admin', 'Chỉ tài khoản có đuôi @vwa.edu.vn mới được truy cập trang quản trị.');
    return;
  }

  const account = findAdminAccount(identifier, password);
  if (!account) {
    showAuthError('admin', 'Email hoặc mật khẩu không chính xác. Xem tài khoản demo bên dưới.');
    return;
  }

  hideAuthError('admin');
  setAdminSession(account.email);
  form.reset();
  window.location.href = 'admin.html';
}

document
  .querySelector('form[data-role-panel="admin"]')
  ?.addEventListener('submit', handleAdminFormSubmit);

// Nếu bị admin.html chuyển ngược lại (chưa đăng nhập quản trị), tự mở modal
// sẵn ở tab "Quản trị" kèm thông báo, thay vì để người dùng phải tự tìm nút.
(function handleAdminRedirectNotice() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') !== 'required') return;

  openModal('authModal');
  document.querySelector('.role-tab[data-role="admin"]')?.click();
  showAuthError('admin', 'Vui lòng đăng nhập bằng tài khoản quản trị để tiếp tục.');

  params.delete('admin');
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', newUrl);
})();

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
  });
});

document.querySelector('.checkout-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  closeModal('checkoutModal');
  alert('Đặt hàng thành công! Chúng tôi sẽ giao hàng sớm nhất.');
});

renderMenu();
renderCart();