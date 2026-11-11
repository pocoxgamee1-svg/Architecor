// ========== Telegram WebApp ==========
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#1a0a2e');
  tg.setBackgroundColor('#1a0a2e');
}

// ========== State ==========
let currentProduct = null;
let products = [];
let isOwner = localStorage.getItem('isOwner') === 'true';

const DEFAULT_PRODUCTS = [];

// ========== Init ==========
function init() {
  // Версия каталога — при смене сбрасываем старые демо-товары
  const CATALOG_VERSION = '2';
  const savedVersion = localStorage.getItem('catalogVersion');

  if (savedVersion !== CATALOG_VERSION) {
    products = [];
    localStorage.setItem('products', '[]');
    localStorage.setItem('catalogVersion', CATALOG_VERSION);
  } else {
    const saved = localStorage.getItem('products');
    products = saved ? JSON.parse(saved) : [];
  }

  updateOwnerUI();
  renderProducts();
  updateTime();
  setInterval(updateTime, 30000);

  // Show home
  showPage('home');
}

function updateTime() {
  const now = new Date();
  const el = document.getElementById('current-time');
  if (el) {
    el.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
}

function saveProducts() {
  localStorage.setItem('products', JSON.stringify(products));
}

// ========== Pages ==========
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  // Nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-page="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'home') renderProducts();
  if (name === 'sell') {
    const form = document.getElementById('sell-form');
    const locked = document.getElementById('sell-locked');
    if (isOwner) {
      form.style.display = 'flex';
      locked.style.display = 'none';
    } else {
      form.style.display = 'none';
      locked.style.display = 'block';
    }
  }
  if (name === 'profile') updateOwnerUI();
  if (name === 'search') {
    document.getElementById('search-input').value = '';
    renderSearchResults(products);
  }
}

// ========== Render Products ==========
function renderProducts(list = products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#9ca3af;">
        <div style="font-size:48px;margin-bottom:12px;">🛒</div>
        <div style="font-size:16px;margin-bottom:6px;">Пока нет товаров</div>
        <div style="font-size:13px;">Владелец ещё не добавил ничего</div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x150/2a1a4a/a855f7?text=Product'" />
      </div>
      <div class="info">
        <div class="price-row">
          <span class="price">$${p.price.toFixed(2)}</span>
          ${p.oldPrice ? `<span class="old-price">$${p.oldPrice.toFixed(2)}</span>` : ''}
          ${p.discount ? `<span class="discount">${p.discount}</span>` : ''}
        </div>
        <div class="title">${p.title}</div>
      </div>
    </div>
  `).join('');
}

function renderSearchResults(list) {
  const grid = document.getElementById('search-results');
  if (!grid) return;
  if (list.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9ca3af;padding:40px 0;">Ничего не найдено</p>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x150/2a1a4a/a855f7?text=Product'" />
      </div>
      <div class="info">
        <div class="price-row">
          <span class="price">$${p.price.toFixed(2)}</span>
          ${p.oldPrice ? `<span class="old-price">$${p.oldPrice.toFixed(2)}</span>` : ''}
          ${p.discount ? `<span class="discount">${p.discount}</span>` : ''}
        </div>
        <div class="title">${p.title}</div>
      </div>
    </div>
  `).join('');
}

function filterProducts() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  if (!q) {
    renderSearchResults(products);
    return;
  }
  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    (p.tags && p.tags.toLowerCase().includes(q))
  );
  renderSearchResults(filtered);
}

// ========== Product Detail ==========
function openProduct(id) {
  currentProduct = products.find(p => p.id === id);
  if (!currentProduct) return;

  document.getElementById('detail-brand-name').textContent = currentProduct.brand;
  document.getElementById('detail-brand-sub').textContent = 'Товар';
  document.getElementById('detail-brand-icon').src = currentProduct.brandIcon || '';
  document.getElementById('detail-image').src = currentProduct.image;
  document.getElementById('detail-title').textContent = currentProduct.title;
  document.getElementById('detail-tags').textContent = currentProduct.tags || '';
  document.getElementById('detail-price').textContent = `$${currentProduct.price.toFixed(2)}`;
  document.getElementById('detail-old-price').textContent = currentProduct.oldPrice ? `$${currentProduct.oldPrice.toFixed(2)}` : '';
  document.getElementById('detail-discount').textContent = currentProduct.discount || '';
  document.getElementById('detail-discount').style.display = currentProduct.discount ? 'inline' : 'none';
  document.getElementById('detail-desc').textContent = currentProduct.desc || '';

  showPage('detail');
}

// ========== Payment ==========
function goToPayment() {
  if (!currentProduct) return;

  const price = currentProduct.price;
  // Approximate RUB (rough rate ~90)
  const rub = Math.round(price * 90);

  document.getElementById('pay-amount').textContent = `$${price.toFixed(2)}`;
  document.getElementById('pay-approx').textContent = `≈ ${rub.toLocaleString('ru-RU')} ₽`;
  document.getElementById('pay-usdt').textContent = `${price.toFixed(2)} USDT`;

  showPage('payment');
}

function copyAddress() {
  const addr = document.getElementById('wallet-address').textContent.trim();
  navigator.clipboard.writeText(addr).then(() => {
    showToast('Адрес скопирован!');
  }).catch(() => {
    showToast('Скопируйте адрес вручную');
  });
}

function confirmPayment() {
  showToast('Оплата отправлена на проверку. Ожидайте выдачи!');
  setTimeout(() => showPage('home'), 1500);
}

// ========== Owner ==========
function updateOwnerUI() {
  const status = document.getElementById('profile-status');
  if (status) {
    status.textContent = isOwner ? '✅ Владелец сайта' : 'Обычный пользователь';
    status.style.color = isOwner ? '#22c55e' : '#e9d5ff';
  }
}

function toggleCodeInput() {
  const box = document.getElementById('code-box');
  box.style.display = box.style.display === 'none' ? 'flex' : 'none';
}

function activateOwner() {
  const code = document.getElementById('owner-code').value.trim();
  if (code === 'OWNERSSITE1') {
    isOwner = true;
    localStorage.setItem('isOwner', 'true');
    updateOwnerUI();
    document.getElementById('code-box').style.display = 'none';
    document.getElementById('owner-code').value = '';
    showToast('Права владельца активированы!');
  } else {
    showToast('Неверный код');
  }
}

function addProduct() {
  if (!isOwner) {
    showToast('Только владелец может добавлять товары');
    return;
  }

  const title = document.getElementById('sell-title').value.trim();
  const brand = document.getElementById('sell-brand').value.trim() || 'Товар';
  const image = document.getElementById('sell-image').value.trim() || 'https://via.placeholder.com/400x300/2a1a4a/a855f7?text=Product';
  const price = parseFloat(document.getElementById('sell-price').value);
  const oldPrice = parseFloat(document.getElementById('sell-old-price').value) || null;
  const desc = document.getElementById('sell-desc').value.trim();
  const tags = document.getElementById('sell-tags').value.trim();

  if (!title || isNaN(price) || price <= 0) {
    showToast('Заполните название и цену');
    return;
  }

  let discount = null;
  if (oldPrice && oldPrice > price) {
    const pct = Math.round((1 - price / oldPrice) * 100);
    discount = `-${pct}%`;
  }

  const newProduct = {
    id: Date.now(),
    title,
    brand,
    brandIcon: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
    image,
    price,
    oldPrice: oldPrice || null,
    discount,
    tags,
    desc
  };

  products.unshift(newProduct);
  saveProducts();

  // Clear form
  document.getElementById('sell-title').value = '';
  document.getElementById('sell-brand').value = '';
  document.getElementById('sell-image').value = '';
  document.getElementById('sell-price').value = '';
  document.getElementById('sell-old-price').value = '';
  document.getElementById('sell-desc').value = '';
  document.getElementById('sell-tags').value = '';

  showToast('Товар опубликован!');
  setTimeout(() => showPage('home'), 800);
}

function clearAll() {
  if (!isOwner) {
    showToast('Только владелец');
    return;
  }
  if (confirm('Удалить все товары?')) {
    products = [];
    saveProducts();
    showToast('Все товары удалены');
    renderProducts();
  }
}

// ========== Utils ==========
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// Start
init();
