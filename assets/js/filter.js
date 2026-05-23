/**
 * MISSAV-J — Filter Bar System
 * Mengelola komponen sticky horizontal filter bar yang berisi kategori chips,
 * pengurutan dropdown (sort), dan filter tanggal (date range dengan ISO 8601).
 */

// List kategori terkurasi untuk chip filter horizontal
const POPULAR_CATEGORIES = [
  { label: 'Uncensored', value: 'Uncensored' },
  { label: 'Amateur', value: 'Amateur' },
  { label: 'Subtitled', value: 'Subtitled' },
  { label: 'Creampie', value: 'Creampie' },
  { label: 'Cosplay', value: 'Cosplay' },
  { label: 'Mosaic', value: 'Mosaic' },
  { label: 'POV', value: 'POV' }
];

/**
 * Inisialisasi Filter Bar
 * @param {HTMLElement} container - Tempat menyisipkan filter bar markup
 * @param {Object} currentFilters - State filter aktif saat ini untuk sinkronisasi UI
 * @param {Function} onFilterChange - Callback saat filter berubah (mengirimkan filter baru)
 */
export function init(container, currentFilters, onFilterChange) {
  if (!container) return;

  // 1. Deduce the active label and state value based on currentFilters
  let activeLabel = 'Tanggal rilis';
  let activeValue = 'date|DESC|';
  
  if (currentFilters.orderby === 'modified') {
    activeLabel = 'Recent update';
    activeValue = 'modified|DESC|';
  } else if (currentFilters.orderby === 'likes') {
    activeLabel = 'Diselamatkan';
    activeValue = 'likes|DESC|';
  } else if (currentFilters.orderby === 'views') {
    if (currentFilters.after) {
      const afterDate = new Date(currentFilters.after);
      const diffDays = Math.round((Date.now() - afterDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays <= 2) {
        activeLabel = 'Tampilan hari ini';
        activeValue = 'views|DESC|day';
      } else if (diffDays <= 8) {
        activeLabel = 'Tampilan mingguan';
        activeValue = 'views|DESC|week';
      } else {
        activeLabel = 'Tampilan bulanan';
        activeValue = 'views|DESC|month';
      }
    } else {
      activeLabel = 'Jumlah penayangan';
      activeValue = 'views|DESC|';
    }
  }

  // 2. Render komponen HTML Filter Bar dengan Custom Dropdown
  container.innerHTML = `
    <div class="filter-bar">
      <!-- Custom Unified Sorting Dropdown Popover -->
      <div class="custom-dropdown" id="sort-dropdown">
        <button class="dropdown-trigger" id="sort-dropdown-trigger" title="Urutkan Video" aria-haspopup="true" aria-expanded="false">
          <span>Sortir dengan: <strong id="sort-current-label">${activeLabel}</strong></span>
          <span class="dropdown-caret">▲</span>
        </button>
        <div class="dropdown-menu hidden" id="sort-dropdown-menu">
          <button class="dropdown-item ${activeValue === 'date|DESC|' ? 'active' : ''}" data-value="date|DESC|">Tanggal rilis</button>
          <button class="dropdown-item ${activeValue === 'modified|DESC|' ? 'active' : ''}" data-value="modified|DESC|">Recent update</button>
          <button class="dropdown-item ${activeValue === 'likes|DESC|' ? 'active' : ''}" data-value="likes|DESC|">Diselamatkan</button>
          <button class="dropdown-item ${activeValue === 'views|DESC|day' ? 'active' : ''}" data-value="views|DESC|day">Tampilan hari ini</button>
          <button class="dropdown-item ${activeValue === 'views|DESC|week' ? 'active' : ''}" data-value="views|DESC|week">Tampilan mingguan</button>
          <button class="dropdown-item ${activeValue === 'views|DESC|month' ? 'active' : ''}" data-value="views|DESC|month">Tampilan bulanan</button>
          <button class="dropdown-item ${activeValue === 'views|DESC|' ? 'active' : ''}" data-value="views|DESC|">Jumlah penayangan</button>
        </div>
      </div>

      <!-- Scrollable Category Chips -->
      <div class="filter-chips-scroll" id="filter-chips-scroll">
        <button class="filter-chip ${!currentFilters.category ? 'active' : ''}" data-category="">Semua</button>
        ${POPULAR_CATEGORIES.map(cat => {
          const isActive = currentFilters.category === cat.value;
          return `<button class="filter-chip ${isActive ? 'active' : ''}" data-category="${cat.value}">${cat.label}</button>`;
        }).join('')}
      </div>
    </div>
  `;

  // 3. Pasang Event Listeners
  const dropdownTrigger = document.getElementById('sort-dropdown-trigger');
  const dropdownMenu = document.getElementById('sort-dropdown-menu');
  const dropdownWrapper = document.getElementById('sort-dropdown');
  const chipsScroll = document.getElementById('filter-chips-scroll');

  // Toggle dropdown menu popover
  if (dropdownTrigger && dropdownMenu && dropdownWrapper) {
    const toggleDropdown = (e) => {
      e.stopPropagation();
      const isOpen = dropdownWrapper.classList.toggle('open');
      dropdownMenu.classList.toggle('hidden');
      dropdownTrigger.setAttribute('aria-expanded', isOpen);
    };

    dropdownTrigger.addEventListener('click', toggleDropdown);

    // Event handler klik item dropdown custom
    dropdownMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;

      e.stopPropagation();
      dropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const [orderby, order, timeRange] = item.dataset.value.split('|');
      let after = '';

      // Tentukan offset range waktu secara dinamis
      if (timeRange === 'day') {
        after = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      } else if (timeRange === 'week') {
        after = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeRange === 'month') {
        after = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Tutup menu dropdown
      dropdownWrapper.classList.remove('open');
      dropdownMenu.classList.add('hidden');
      dropdownTrigger.setAttribute('aria-expanded', 'false');

      // Update visual teks button trigger
      const labelEl = document.getElementById('sort-current-label');
      if (labelEl) labelEl.textContent = item.textContent;

      // Jalankan callback pemutakhiran filter SPA
      onFilterChange({ orderby, order, after });
    });

    // Tutup otomatis jika pengguna mengklik di luar area dropdown (Outside Click Dismiss)
    const handleOutsideClick = (e) => {
      if (dropdownWrapper.classList.contains('open') && !dropdownWrapper.contains(e.target)) {
        dropdownWrapper.classList.remove('open');
        dropdownMenu.classList.add('hidden');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    };

    window.addEventListener('click', handleOutsideClick);
  }

  // Event handler untuk Kategori Chips
  if (chipsScroll) {
    chipsScroll.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      // Hapus status active pada chip lain
      chipsScroll.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      // Aktifkan chip yang diklik
      chip.classList.add('active');

      const selectedCategory = chip.dataset.category;
      
      // Kirim filter baru ke callback
      onFilterChange({ category: selectedCategory });
    });
  }
}

export default { init };

