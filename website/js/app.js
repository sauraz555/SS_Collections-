'use strict';

// ===== CART =====
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('ss_cart') || '[]');
    this._updateBadge();
  }

  _save() {
    localStorage.setItem('ss_cart', JSON.stringify(this.items));
    this._updateBadge();
    this._renderDrawer();
  }

  add(productId, qty = 1) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    const existing = this.items.find(x => x.id === productId);
    if (existing) existing.qty += qty;
    else this.items.push({ id: productId, name: p.name, price: p.sellPrice, image: p.images[0], qty });
    this._save();
    showToast(`"${p.name}" added to cart!`, 'success');
  }

  remove(productId) {
    this.items = this.items.filter(x => x.id !== productId);
    this._save();
  }

  setQty(productId, qty) {
    if (qty <= 0) { this.remove(productId); return; }
    const item = this.items.find(x => x.id === productId);
    if (item) { item.qty = qty; this._save(); }
  }

  clear() { this.items = []; this._save(); }

  total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); }
  count() { return this.items.reduce((s, i) => s + i.qty, 0); }

  _updateBadge() {
    const c = this.count();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }

  _renderDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');
    if (!body) return;

    if (this.items.length === 0) {
      body.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p><a href="shop.html" class="btn btn-primary btn-sm">Shop Now</a></div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';
    body.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${IMG_BASE}${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'><rect width=\\'80\\' height=\\'80\\' fill=\\'%23f0e8d8\\'/>\\<text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'10\\'>No Image</text></svg>'">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">NPR ${item.price.toLocaleString('en-IN')}</p>
          <div class="qty-control">
            <button onclick="cart.setQty(${item.id}, ${item.qty - 1})"><i class="fas fa-minus"></i></button>
            <span>${item.qty}</span>
            <button onclick="cart.setQty(${item.id}, ${item.qty + 1})"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="cart.remove(${item.id})"><i class="fas fa-times"></i></button>
      </div>
    `).join('');

    const totalEl = document.getElementById('cartDrawerTotal');
    if (totalEl) totalEl.textContent = `NPR ${this.total().toLocaleString('en-IN')}`;
  }
}

// ===== WISHLIST =====
class Wishlist {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('ss_wishlist') || '[]');
    this._updateBadge();
  }

  toggle(id) {
    if (this.has(id)) this.items = this.items.filter(x => x !== id);
    else this.items.push(id);
    localStorage.setItem('ss_wishlist', JSON.stringify(this.items));
    this._updateBadge();
    this._updateButtons(id);
  }

  has(id) { return this.items.includes(id); }

  _updateBadge() {
    document.querySelectorAll('.wishlist-badge').forEach(el => {
      el.textContent = this.items.length;
      el.style.display = this.items.length > 0 ? 'flex' : 'none';
    });
  }

  _updateButtons(id) {
    document.querySelectorAll(`[data-wish="${id}"]`).forEach(btn => {
      btn.classList.toggle('active', this.has(id));
      const icon = btn.querySelector('i');
      if (icon) icon.className = this.has(id) ? 'fas fa-heart' : 'far fa-heart';
    });
  }
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    document.body.appendChild(el);
    return el;
  })();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i> ${msg}`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== MODAL =====
let currentModalProduct = null;
let currentImageIndex = 0;

function openModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  currentModalProduct = p;
  currentImageIndex = 0;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  const priceHTML = p.sellPriceMax
    ? `<span class="modal-price">NPR ${p.sellPrice.toLocaleString('en-IN')} – NPR ${p.sellPriceMax.toLocaleString('en-IN')}</span>`
    : `<span class="modal-price">NPR ${p.sellPrice.toLocaleString('en-IN')}</span>`;

  const thumbsHTML = p.images.length > 1
    ? `<div class="modal-thumbs">${p.images.map((img, i) => `<img src="${IMG_BASE}${img}" class="${i === 0 ? 'active' : ''}" onclick="setModalImage(${i})" onerror="this.style.display='none'">`).join('')}</div>`
    : '';

  const navHTML = p.images.length > 1
    ? `<button class="modal-img-prev" onclick="changeModalImage(-1)"><i class="fas fa-chevron-left"></i></button>
       <button class="modal-img-next" onclick="changeModalImage(1)"><i class="fas fa-chevron-right"></i></button>`
    : '';

  modal.querySelector('.modal-body').innerHTML = `
    <div class="modal-gallery">
      <div class="modal-img-wrap">
        <img id="modalMainImg" src="${IMG_BASE}${p.images[0]}" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'300\\'><rect width=\\'300\\' height=\\'300\\' fill=\\'%23f5efe6\\'/></svg>'">
        ${navHTML}
      </div>
      ${thumbsHTML}
    </div>
    <div class="modal-info">
      <span class="modal-brand">${p.brand}</span>
      <h2 class="modal-name">${p.name}</h2>
      <div class="modal-stars">${renderStars(p.rating)} <span>(${p.reviews} reviews)</span></div>
      ${priceHTML}
      <p class="modal-desc">${p.description}</p>
      <div class="modal-meta">
        <span class="badge badge-${p.category}">${p.category.charAt(0).toUpperCase() + p.category.slice(1)}</span>
        ${p.isNew ? '<span class="badge badge-new">New Arrival</span>' : ''}
        <span class="badge badge-stock ${p.inStock ? 'in' : 'out'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</span>
      </div>
      <div class="modal-qty-row">
        <div class="qty-control qty-lg">
          <button onclick="this.nextElementSibling.stepDown()"><i class="fas fa-minus"></i></button>
          <input type="number" id="modalQty" value="1" min="1" max="10">
          <button onclick="this.previousElementSibling.stepUp()"><i class="fas fa-plus"></i></button>
        </div>
        <button class="btn btn-primary btn-icon" onclick="addFromModal(${p.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
      <button class="btn btn-outline btn-icon btn-wish ${wishlist.has(p.id) ? 'active' : ''}" data-wish="${p.id}" onclick="wishlist.toggle(${p.id}); this.classList.toggle('active'); this.querySelector('i').className = wishlist.has(${p.id}) ? 'fas fa-heart' : 'far fa-heart'">
        <i class="${wishlist.has(p.id) ? 'fas' : 'far'} fa-heart"></i> ${wishlist.has(p.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
      </button>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function setModalImage(index) {
  if (!currentModalProduct) return;
  currentImageIndex = index;
  const img = document.getElementById('modalMainImg');
  if (img) img.src = IMG_BASE + currentModalProduct.images[index];
  document.querySelectorAll('.modal-thumbs img').forEach((el, i) => el.classList.toggle('active', i === index));
}

function changeModalImage(dir) {
  if (!currentModalProduct) return;
  const len = currentModalProduct.images.length;
  currentImageIndex = (currentImageIndex + dir + len) % len;
  setModalImage(currentImageIndex);
}

function addFromModal(productId) {
  const qty = parseInt(document.getElementById('modalQty')?.value || 1);
  cart.add(productId, qty);
  closeModal();
}

// ===== CART DRAWER =====
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  cart._renderDrawer();
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== PRODUCT CARD =====
function createProductCard(p) {
  const priceStr = getPriceDisplay(p);
  const imgSrc = IMG_BASE + p.images[0];
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="card-img-wrap" onclick="openModal(${p.id})">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'img-placeholder\\'><i class=\\'fas fa-clock\\'></i></div>'">
        <div class="card-overlay">
          <button class="btn-quickview"><i class="fas fa-eye"></i> Quick View</button>
        </div>
        ${p.isNew ? '<span class="card-badge new">New</span>' : ''}
        ${p.images.length > 1 ? `<span class="card-variants">${p.images.length} variants</span>` : ''}
      </div>
      <div class="card-body">
        <span class="card-brand">${p.brand}</span>
        <h3 class="card-name" onclick="openModal(${p.id})">${p.name}</h3>
        <div class="card-stars">${renderStars(p.rating)} <small>(${p.reviews})</small></div>
        <div class="card-footer">
          <span class="card-price">${priceStr}</span>
          <div class="card-actions">
            <button class="btn-wish ${wishlist.has(p.id) ? 'active' : ''}" data-wish="${p.id}" onclick="event.stopPropagation(); wishlist.toggle(${p.id})">
              <i class="${wishlist.has(p.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <button class="btn-cart" onclick="event.stopPropagation(); cart.add(${p.id})">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== HEADER / NAV =====
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });

  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('open');
    });
  }

  // Search toggle
  const searchToggle = document.querySelector('.search-toggle');
  const searchBar = document.querySelector('.search-bar');
  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('open');
      if (searchBar.classList.contains('open')) searchBar.querySelector('input')?.focus();
    });
  }

  // Global search
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
      }
    });
  }
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== INIT =====
const cart = new Cart();
const wishlist = new Wishlist();

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initBackToTop();

  // Close modal on overlay click
  document.getElementById('productModal')?.addEventListener('click', e => {
    if (e.target.id === 'productModal') closeModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });
});


// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close all others
    document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('active'));
    
    // Toggle current
    if (!isActive) item.classList.add('active');
  });
});
