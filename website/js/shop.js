'use strict';

let filtered = [...PRODUCTS];
let activeFilters = { categories: [], brands: [], minPrice: 0, maxPrice: 99999, search: '' };
let currentSort = 'featured';
let viewMode = 'grid';

function applyFilters() {
  const { categories, brands, minPrice, maxPrice, search } = activeFilters;
  filtered = PRODUCTS.filter(p => {
    if (categories.length && !categories.includes(p.category)) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    if (p.sellPrice < minPrice || p.sellPrice > maxPrice) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  sortProducts();
  renderProducts();
  updateResultCount();
}

function sortProducts() {
  switch (currentSort) {
    case 'price-asc':  filtered.sort((a,b) => a.sellPrice - b.sellPrice); break;
    case 'price-desc': filtered.sort((a,b) => b.sellPrice - a.sellPrice); break;
    case 'name-asc':   filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
    case 'name-desc':  filtered.sort((a,b) => b.name.localeCompare(a.name)); break;
    case 'newest':     filtered.sort((a,b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    case 'rating':     filtered.sort((a,b) => b.rating - a.rating); break;
    default:           filtered.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><h3>No products found</h3><p>Try adjusting your filters or search terms.</p><button class="btn btn-primary" onclick="clearAllFilters()">Clear Filters</button></div>`;
    return;
  }
  grid.className = `products-grid ${viewMode === 'list' ? 'list-view' : ''}`;
  grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
}

function updateResultCount() {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = `Showing ${filtered.length} of ${PRODUCTS.length} products`;
}

function clearAllFilters() {
  activeFilters = { categories: [], brands: [], minPrice: 0, maxPrice: 99999, search: '' };
  document.querySelectorAll('.filter-cb').forEach(cb => cb.checked = false);
  const minEl = document.getElementById('priceMin');
  const maxEl = document.getElementById('priceMax');
  if (minEl) minEl.value = 0;
  if (maxEl) maxEl.value = 5200;
  updatePriceDisplay();
  const searchEl = document.getElementById('shopSearch');
  if (searchEl) searchEl.value = '';
  currentSort = 'featured';
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = 'featured';
  applyFilters();
}

function updatePriceDisplay() {
  const min = parseInt(document.getElementById('priceMin')?.value || 0);
  const max = parseInt(document.getElementById('priceMax')?.value || 5200);
  const disp = document.getElementById('priceDisplay');
  if (disp) disp.textContent = `NPR ${min.toLocaleString('en-IN')} – NPR ${max.toLocaleString('en-IN')}`;
}

function buildFilters() {
  // Categories
  const catContainer = document.getElementById('categoryFilters');
  if (catContainer) {
    const counts = {};
    PRODUCTS.forEach(p => counts[p.category] = (counts[p.category] || 0) + 1);
    catContainer.innerHTML = CATEGORIES.map(c => `
      <label class="filter-label">
        <input type="checkbox" class="filter-cb" data-type="category" value="${c.id}" onchange="onFilterChange(this)">
        <span>${c.name}</span>
        <span class="filter-count">${counts[c.id] || 0}</span>
      </label>
    `).join('');
  }

  // Brands
  const brandContainer = document.getElementById('brandFilters');
  if (brandContainer) {
    const counts = {};
    PRODUCTS.forEach(p => counts[p.brand] = (counts[p.brand] || 0) + 1);
    brandContainer.innerHTML = BRANDS.map(b => `
      <label class="filter-label">
        <input type="checkbox" class="filter-cb" data-type="brand" value="${b}" onchange="onFilterChange(this)">
        <span>${b}</span>
        <span class="filter-count">${counts[b] || 0}</span>
      </label>
    `).join('');
  }

  // Price range
  document.getElementById('priceMin')?.addEventListener('input', () => {
    const min = parseInt(document.getElementById('priceMin').value);
    const max = parseInt(document.getElementById('priceMax').value);
    activeFilters.minPrice = Math.min(min, max);
    updatePriceDisplay();
    applyFilters();
  });
  document.getElementById('priceMax')?.addEventListener('input', () => {
    const min = parseInt(document.getElementById('priceMin').value);
    const max = parseInt(document.getElementById('priceMax').value);
    activeFilters.maxPrice = Math.max(min, max);
    updatePriceDisplay();
    applyFilters();
  });
  updatePriceDisplay();
}

function onFilterChange(cb) {
  const type = cb.dataset.type;
  const val = cb.value;
  if (type === 'category') {
    if (cb.checked) activeFilters.categories.push(val);
    else activeFilters.categories = activeFilters.categories.filter(x => x !== val);
  } else if (type === 'brand') {
    if (cb.checked) activeFilters.brands.push(val);
    else activeFilters.brands = activeFilters.brands.filter(x => x !== val);
  }
  applyFilters();
}

function initShop() {
  buildFilters();

  // Read URL params
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search') || '';
  const category = params.get('category') || '';

  const brand = params.get('brand') || '';
  const sort = params.get('sort') || '';

  if (search) {
    activeFilters.search = search;
    const searchEl = document.getElementById('shopSearch');
    if (searchEl) searchEl.value = search;
  }
  if (category) {
    activeFilters.categories = [category];
    const cb = document.querySelector(`.filter-cb[data-type="category"][value="${category}"]`);
    if (cb) cb.checked = true;
  }
  if (brand) {
    activeFilters.brands = [brand];
    const cb = document.querySelector(`.filter-cb[data-type="brand"][value="${brand}"]`);
    if (cb) cb.checked = true;
  }
  if (sort) {
    currentSort = sort;
    const sortEl = document.getElementById('sortSelect');
    if (sortEl) sortEl.value = sort;
  }

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    currentSort = e.target.value;
    applyFilters();
  });

  // View toggle
  document.getElementById('gridView')?.addEventListener('click', () => {
    viewMode = 'grid';
    document.getElementById('gridView').classList.add('active');
    document.getElementById('listView').classList.remove('active');
    renderProducts();
  });
  document.getElementById('listView')?.addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('listView').classList.add('active');
    document.getElementById('gridView').classList.remove('active');
    renderProducts();
  });

  // Shop search
  document.getElementById('shopSearch')?.addEventListener('input', e => {
    activeFilters.search = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  // Mobile filter toggle
  document.getElementById('filterToggle')?.addEventListener('click', () => {
    document.querySelector('.shop-sidebar')?.classList.toggle('open');
    document.getElementById('filterOverlay')?.classList.toggle('show');
  });
  document.getElementById('filterOverlay')?.addEventListener('click', () => {
    document.querySelector('.shop-sidebar')?.classList.remove('open');
    document.getElementById('filterOverlay')?.classList.remove('show');
  });
  document.getElementById('closeFilters')?.addEventListener('click', () => {
    document.querySelector('.shop-sidebar')?.classList.remove('open');
    document.getElementById('filterOverlay')?.classList.remove('show');
  });

  applyFilters();
}

document.addEventListener('DOMContentLoaded', initShop);
