/**
 * MISSAV-J — UI State Helper (Secured & Optimized)
 * Mengelola elemen UI visual seperti loading skeleton, toast alert,
 * tema warna in-memory, serta tampilan error dan empty states yang aman dari XSS.
 */

// State Tema global (In-memory, tidak disimpan ke localStorage/sessionStorage)
let currentTheme = 'dark';

const ui = {
  /**
   * Mengamankan teks dari serangan XSS dengan melakukan encoding pada karakter HTML
   * @param {string} str - Teks input mentah dari API atau input user
   * @returns {string} Teks tersanitasi aman dimasukkan ke innerHTML
   */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Mengubah URL thumbnail eksternal agar dimuat melalui Cloudflare Worker Proxy
   * jika diakses dari situs produksi (menghindari blokir ISP/Internet Positif & AdBlocker)
   * @param {string} url - URL thumbnail asli
   * @returns {string} URL proxy atau URL asli
   */
  getProxiedThumbnail(url) {
    if (!url) return '';
    // Gunakan wsrv.nl untuk resize otomatis ke 320x180 & WebP
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=320&h=180&output=webp&fit=cover`;
  },

  /**
   * Menampilkan skeleton loader dengan efek shimmer di area konten utama
   * @param {number} count - Jumlah kartu skeleton yang ingin dirender
   */
  showSkeletons(count = 8) {
    const mainApp = document.getElementById('app-content');
    if (!mainApp) return;

    mainApp.innerHTML = `
      <div class="video-grid" id="video-grid">
        ${Array(count).fill(0).map(() => `
          <div class="video-card skeleton-card">
            <div class="skeleton skeleton-image"></div>
            <div class="card-info">
              <div class="skeleton skeleton-text" style="width:90%"></div>
              <div class="skeleton skeleton-text" style="width:65%"></div>
              <div class="skeleton skeleton-text" style="width:40%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Menyisipkan skeleton loader ke dalam elemen grid tertentu
   * (Misalnya sidebar video terkait)
   * @param {HTMLElement} element - Target element penampung
   * @param {number} count - Jumlah skeleton
   */
  showSkeletonsInElement(element, count = 4) {
    if (!element) return;
    element.innerHTML = Array(count).fill(0).map(() => `
      <div class="video-card skeleton-card-row">
        <div class="skeleton skeleton-image-row"></div>
        <div class="card-info-row">
          <div class="skeleton skeleton-text" style="width:85%"></div>
          <div class="skeleton skeleton-text" style="width:50%"></div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Menampilkan pesan toast melayang di bagian bawah layar
   * @param {string} message - Pesan toast
   * @param {number} duration - Durasi tampil (ms)
   */
  showToast(message, duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message; // textContent aman secara default
    container.appendChild(toast);

    // Animasi masuk
    setTimeout(() => toast.classList.add('show'), 50);

    // Animasi keluar & hapus
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Menampilkan halaman error dengan tombol "Coba Lagi" (Aman XSS)
   * @param {string} message - Deskripsi kesalahan
   * @param {HTMLElement} [container] - Container opsional
   */
  showError(message, container = null) {
    const target = container || document.getElementById('app-content');
    if (!target) return;

    const safeMessage = this.escapeHTML(message);
    const i18n = window.i18n;
    const maintTitle = i18n ? i18n.t('maintenance_title') : 'Server Maintenance';
    const maintDesc = i18n ? i18n.t('maintenance_desc') : 'We are currently upgrading our core video servers to provide you with a faster and better experience.<br>Please check back again in a few hours.';
    const maintBtn = i18n ? i18n.t('maintenance_btn') : 'Refresh Page';
    const maintAltBtn = i18n ? i18n.t('maintenance_alt_btn') : 'Watch on Alternative Site';

    target.innerHTML = `
      <div class="empty-state" style="padding: 4rem 1rem; text-align: center;">
        <img src="/assets/logo_maintenance.webp" alt="Maintenance" style="max-width: 150px; margin-bottom: 1.5rem; opacity: 0.9;">
        <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 600;">${maintTitle}</h3>
        <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
          ${maintDesc}
        </p>
        <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <button id="error-retry-btn" class="btn-primary" style="padding: 0.75rem 2rem; border-radius: 8px; background: var(--accent); color: white; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px; transition: opacity 0.2s;">🔄 ${maintBtn}</button>
          <a href="https://nicevx.com/" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 0.75rem 2rem; border-radius: 8px; background: #2A2A2A; color: white; border: 1px solid #444; cursor: pointer; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px; text-decoration: none; transition: background 0.2s;">🎥 ${maintAltBtn}</a>
        </div>
      </div>
    `;

    const retryBtn = document.getElementById('error-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  },

  /**
   * Menampilkan halaman kosong jika pencarian tidak ditemukan (Aman XSS)
   * @param {string} query - Kata kunci pencarian yang gagal
   * @param {HTMLElement} [container] - Container opsional
   */
  showEmpty(query, container = null) {
    const target = container || document.getElementById('app-content');
    if (!target) return;

    const safeQuery = this.escapeHTML(query);
    const i18n = window.i18n;
    const titleText = i18n ? i18n.t('no_results_for', { query: safeQuery }) : `Tidak ada hasil untuk "${safeQuery}"`;
    const descText = i18n ? i18n.t('no_results_desc') : 'Coba kata kunci yang berbeda, periksa ejaan, atau hapus filter aktif.';
    const btnText = i18n ? i18n.t('empty_clear_btn') : 'Kembali ke Beranda';

    target.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>${titleText}</h3>
        <p>${descText}</p>
        <button id="empty-clear-btn" class="btn-primary">${btnText}</button>
      </div>
    `;

    const clearBtn = document.getElementById('empty-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        window.missavJNavigate('/');
      });
    }
  },

  /**
   * Inisialisasi tema in-memory pertama kali (Dark theme default)
   */
  initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeButtonIcon();
  },

  /**
   * Toggle tema (Dark <=> Light)
   */
  toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeButtonIcon();
    this.showToast(`Beralih ke Mode ${currentTheme === 'dark' ? 'Gelap' : 'Terang'}`);
  },

  /**
   * Mengubah ikon tombol tema sesuai tema aktif saat ini
   */
  updateThemeButtonIcon() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    if (currentTheme === 'dark') {
      themeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
      themeBtn.setAttribute('title', 'Ganti ke Mode Terang');
    } else {
      themeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
      themeBtn.setAttribute('title', 'Ganti ke Mode Gelap');
    }
  },

  /**
   * Render dynamic breadcrumbs based on the current path and active language
   */
  renderBreadcrumbs(routePath, title = '') {
    const breadcrumbNav = document.getElementById('breadcrumb-nav');
    if (!breadcrumbNav) return;
    breadcrumbNav.classList.add('hidden');
    breadcrumbNav.innerHTML = '';
  }
};

export default ui;
