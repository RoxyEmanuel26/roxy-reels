/**
 * Roxy Reels — Filter Bar System
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

  // 1. Hitung opsi aktif saat ini untuk ditampilkan di select dropdown
  const currentSortValue = `${currentFilters.orderby || 'date'}|${currentFilters.order || 'DESC'}`;
  
  // Deteksi filter tanggal aktif saat ini (jika ada parameter 'after')
  let currentDateValue = '';
  if (currentFilters.after) {
    const afterDate = new Date(currentFilters.after);
    const diffDays = Math.round((Date.now() - afterDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays <= 8) currentDateValue = 'week';
    else if (diffDays <= 31) currentDateValue = 'month';
    else if (diffDays <= 366) currentDateValue = 'year';
  }

  // 2. Render komponen HTML Filter Bar
  container.innerHTML = `
    <div class="filter-bar">
      <!-- Pengurutan Dropdown -->
      <div class="filter-select-wrapper">
        <select id="sort-select" class="filter-select">
          <option value="date|DESC" ${currentSortValue === 'date|DESC' ? 'selected' : ''}>🕐 Terbaru</option>
          <option value="views|DESC" ${currentSortValue === 'views|DESC' ? 'selected' : ''}>🔥 Terpopuler</option>
          <option value="title|ASC" ${currentSortValue === 'title|ASC' ? 'selected' : ''}>🔤 A-Z</option>
          <option value="date|ASC" ${currentSortValue === 'date|ASC' ? 'selected' : ''}>📅 Terlama</option>
        </select>
      </div>

      <!-- Scrollable Category Chips -->
      <div class="filter-chips-scroll" id="filter-chips-scroll">
        <button class="filter-chip ${!currentFilters.category ? 'active' : ''}" data-category="">Semua</button>
        ${POPULAR_CATEGORIES.map(cat => {
          const isActive = currentFilters.category === cat.value;
          return `<button class="filter-chip ${isActive ? 'active' : ''}" data-category="${cat.value}">${cat.label}</button>`;
        }).join('')}
      </div>

      <!-- Filter Tanggal Dropdown -->
      <div class="filter-select-wrapper">
        <select id="date-filter" class="filter-select">
          <option value="" ${currentDateValue === '' ? 'selected' : ''}>Semua Waktu</option>
          <option value="week" ${currentDateValue === 'week' ? 'selected' : ''}>Minggu Ini</option>
          <option value="month" ${currentDateValue === 'month' ? 'selected' : ''}>Bulan Ini</option>
          <option value="year" ${currentDateValue === 'year' ? 'selected' : ''}>Tahun Ini</option>
        </select>
      </div>
    </div>
  `;

  // 3. Pasang Event Listeners
  const sortSelect = document.getElementById('sort-select');
  const dateFilter = document.getElementById('date-filter');
  const chipsScroll = document.getElementById('filter-chips-scroll');

  // Event handler untuk select sort dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const [orderby, order] = e.target.value.split('|');
      onFilterChange({ orderby, order });
    });
  }

  // Event handler untuk select date filter dropdown (menghasilkan string ISO 8601 setelah tanggal tertentu)
  if (dateFilter) {
    dateFilter.addEventListener('change', (e) => {
      const durationType = e.target.value;
      let afterIsoString = '';

      if (durationType === 'week') {
        // 7 hari yang lalu
        afterIsoString = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (durationType === 'month') {
        // 30 hari yang lalu
        afterIsoString = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (durationType === 'year') {
        // 365 hari yang lalu
        afterIsoString = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      onFilterChange({ after: afterIsoString });
    });
  }

  // Event handler untuk Category Chips
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
