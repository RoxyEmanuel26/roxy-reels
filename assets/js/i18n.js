/**
 * MISSAV-J — Multi-Language Internationalization (i18n) Engine
 * Mengelola kamus terjemahan modular untuk 13 bahasa, preferensi localStorage,
 * serta fungsi lokalisasi statik & dinamis untuk seluruh antarmuka SPA.
 */

import ui from './ui.js?v=2.8.46';

// 13-language configuration with circular flag icons from /assets/pics
export const LANGS = [
  { code: 'zh-TW', label: '繁體中文', flag: '/assets/pics/hong-kong.webp' },
  { code: 'zh-CN', label: '简体中文', flag: '/assets/pics/china.webp' },
  { code: 'en', label: 'English', flag: '/assets/pics/united-kingdom.webp' },
  { code: 'ja', label: '日本語', flag: '/assets/pics/japan.webp' },
  { code: 'ko', label: '한국의', flag: '/assets/pics/south-korea.webp' },
  { code: 'ms', label: 'Melayu', flag: '/assets/pics/malaysia.webp' },
  { code: 'th', label: 'ไทย', flag: '/assets/pics/thailand.webp' },
  { code: 'de', label: 'Deutsch', flag: '/assets/pics/germany.webp' },
  { code: 'fr', label: 'Français', flag: '/assets/pics/france.webp' },
  { code: 'vi', label: 'Tiếng Việt', flag: '/assets/pics/vietnam.webp' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '/assets/pics/indonesia.webp' },
  { code: 'fil', label: 'Filipino', flag: '/assets/pics/philippines.webp' },
  { code: 'pt', label: 'Português', flag: '/assets/pics/brazil.webp' }
];

// Map internal language keys to valid ISO 639-1 hreflang codes.
// Only 'fil' (ISO 639-2) needs remapping to 'tl' (ISO 639-1 for Tagalog/Filipino);
// every other key is already a valid ISO 639-1 (or language-region) code.
// Internal routing and /fil/ URL paths keep using the 'fil' key unchanged.
export const HREFLANG_CODE_MAP = { fil: 'tl' };

export function hreflangCode(langKey) {
  return HREFLANG_CODE_MAP[langKey] || langKey;
}

// Kamus Terjemahan Komprehensif
const DICTIONARY = {
  // Sidebar Navigasi
  nav_home: {
    en: 'Home', id: 'Beranda', 'zh-TW': '首頁', 'zh-CN': '首页', ja: 'ホーム', ko: '홈', ms: 'Utama', th: 'หน้าแรก', de: 'Startseite', fr: 'Accueil', vi: 'Trang chủ', fil: 'Tahanan', pt: 'Início'
  },
  nav_trending: {
    en: 'Trending', id: 'Populer (Trending)', 'zh-TW': '熱門排行', 'zh-CN': '热门排行', ja: '急上昇', ko: '인기', ms: 'Sering Ditonton', th: 'ยอดนิยม', de: 'Angesagt', fr: 'Tendances', vi: 'Xu hướng', fil: 'Trending', pt: 'Tendências'
  },
  nav_recent: {
    en: 'Recent', id: 'Terbaru', 'zh-TW': '最新發佈', 'zh-CN': '最新发布', ja: '新着', ko: '최신', ms: 'Baru', th: 'ล่าสุด', de: 'Neueste', fr: 'Récents', vi: 'Gần đây', fil: 'Kamakailan', pt: 'Recentes'
  },
  nav_watch_later: {
    en: 'Watch Later', id: 'Tonton Nanti', 'zh-TW': '稍後觀看', 'zh-CN': '稍后观看', ja: '後で見る', ko: '나중에 보기', ms: 'Tonton Nanti', th: 'ดูภายหลัง', de: 'Später ansehen', fr: 'À regarder plus tard', vi: 'Xem sau', fil: 'Panoorin Mamaya', pt: 'Assistir Mais Tarde'
  },
  nav_history: {
    en: 'Session History', id: 'Riwayat Sesi', 'zh-TW': '播放紀錄', 'zh-CN': '播放纪录', ja: '履歴', ko: '시청 기록', ms: 'Sejarah Sesi', th: 'ประวัติการรับชม', de: 'Verlauf', fr: 'Historique', vi: 'Lịch sử', fil: 'Kasaysayan', pt: 'Histórico'
  },
  nav_actors: {
    en: 'Popular Actors', id: 'Aktor Populer', 'zh-TW': '熱門演員', 'zh-CN': '热门演员', ja: '人気女優', ko: '인기 배우', ms: 'Pelakon Populer', th: 'นักแสดงยอดนิยม', de: 'Beliebte Schauspieler', fr: 'Acteurs Populaires', vi: 'Diễn viên nổi tiếng', fil: 'Sikat na Aktor', pt: 'Atores Populares'
  },
  nav_studios: {
    en: 'Popular Studios', id: 'Studio Populer', 'zh-TW': '熱門片商', 'zh-CN': '热门片商', ja: '人気メーカー', ko: '인기 스튜디오', ms: 'Studio Populer', th: 'สตูดิโอยอดนิยม', de: 'Beliebte Studios', fr: 'Studios Populaires', vi: 'Studio nổi tiếng', fil: 'Sikat na Studio', pt: 'Estúdios Populares'
  },
  
  // Maintenance UI
  maintenance_title: {
    en: 'Server Maintenance', id: 'Pemeliharaan Server', 'zh-TW': '伺服器維護', 'zh-CN': '服务器维护', ja: 'サーバーメンテナンス', ko: '서버 유지보수', ms: 'Penyelenggaraan Pelayan', th: 'การบำรุงรักษาเซิร์ฟเวอร์', de: 'Wartungsarbeiten', fr: 'Maintenance du Serveur', vi: 'Bảo trì máy chủ', fil: 'Pagpapanatili ng Server', pt: 'Manutenção do Servidor'
  },
  maintenance_desc: {
    en: 'We are currently upgrading our core video servers to provide you with a faster and better experience.<br>Please check back again in a few hours.',
    id: 'Kami sedang melakukan peningkatan server video utama kami untuk memberikan pengalaman yang lebih cepat dan baik.<br>Silakan kembali lagi dalam beberapa jam.',
    'zh-TW': '我們目前正在升級核心視訊伺服器，以提供您更快速、更佳的體驗。<br>請在幾個小時後再回來查看。',
    'zh-CN': '我们目前正在升级核心视频服务器，以提供您更快速、更佳的体验。<br>请在几个小时后再回来查看。',
    ja: 'より快適にご利用いただくため、現在コアビデオサーバーのアップグレードを行っています。<br>数時間後に再度ご確認ください。',
    ko: '더 빠르고 나은 경험을 제공하기 위해 현재 핵심 비디오 서버를 업그레이드 중입니다.<br>몇 시간 후에 다시 확인해 주세요.',
    ms: 'Kami sedang menaik taraf pelayan video utama kami untuk memberikan pengalaman yang lebih pantas dan baik.<br>Sila semak semula dalam beberapa jam.',
    th: 'ขณะนี้เรากำลังอัปเกรดเซิร์ฟเวอร์วิดีโอหลักของเราเพื่อให้คุณได้รับประสบการณ์ที่รวดเร็วและดียิ่งขึ้น<br>โปรดกลับมาตรวจสอบอีกครั้งในอีกไม่กี่ชั่วโมงข้างหน้า',
    de: 'Wir aktualisieren derzeit unsere Kern-Videoserver, um Ihnen ein schnelleres und besseres Erlebnis zu bieten.<br>Bitte schauen Sie in ein paar Stunden noch einmal vorbei.',
    fr: 'Nous mettons actuellement à niveau nos serveurs vidéo principaux pour vous offrir une expérience plus rapide et meilleure.<br>Veuillez revenir dans quelques heures.',
    vi: 'Chúng tôi hiện đang nâng cấp các máy chủ video cốt lõi của mình để cung cấp cho bạn trải nghiệm nhanh hơn và tốt hơn.<br>Vui lòng kiểm tra lại sau vài giờ.',
    fil: 'Kasalukuyan naming ina-upgrade ang aming mga pangunahing video server upang mabigyan ka ng mas mabilis at mas mahusay na karanasan.<br>Mangyaring bumalik muli pagkatapos ng ilang oras.',
    pt: 'No momento, estamos atualizando nossos servidores de vídeo principais para oferecer a você uma experiência mais rápida e melhor.<br>Volte novamente em algumas horas.'
  },
  maintenance_btn: {
    en: 'Refresh Page', id: 'Muat Ulang Halaman', 'zh-TW': '重新整理', 'zh-CN': '刷新页面', ja: 'ページを更新', ko: '페이지 새로고침', ms: 'Muat Semula Halaman', th: 'รีเฟรชหน้า', de: 'Seite aktualisieren', fr: 'Actualiser la page', vi: 'Làm mới trang', fil: 'I-refresh ang Pahina', pt: 'Atualizar Página'
  },
  maintenance_alt_btn: {
    en: 'Watch on Alternative Site', id: 'Nonton di Web Alternatif', 'zh-TW': '在替代網站上觀看', 'zh-CN': '在替代网站上观看', ja: '代替サイトで見る', ko: '대체 사이트에서 보기', ms: 'Tonton di Laman Alternatif', th: 'ดูบนเว็บไซต์สำรอง', de: 'Auf alternativer Seite ansehen', fr: 'Regarder sur le site alternatif', vi: 'Xem trên trang web thay thế', fil: 'Manood sa Alternatibong Site', pt: 'Assistir no Site Alternativo'
  },

  // Judul Pembagi / Section Titles
  sidebar_main_categories: {
    en: 'Main Categories', id: 'Kategori Utama', 'zh-TW': '主分類', 'zh-CN': '主分类', ja: 'カテゴリー', ko: '주요 카테고리', ms: 'Kategori Utama', th: 'หมวดหมู่หลัก', de: 'Hauptkategorien', fr: 'Catégories Principales', vi: 'Danh mục chính', fil: 'Pangunahing Kategorya', pt: 'Categorias Principais'
  },
  sidebar_explore: {
    en: 'Explore', id: 'Jelajahi', 'zh-TW': '探索', 'zh-CN': '探索', ja: '探索', ko: '탐색', ms: 'Jelajahi', th: 'สำรวจ', de: 'Erkunden', fr: 'Explorer', vi: 'Khám phá', fil: 'Galugarin', pt: 'Explorar'
  },
  nav_all_actors: {
    en: 'All Actors', id: 'Semua Aktor', 'zh-TW': '所有演員', 'zh-CN': '所有演员', ja: 'すべての女優', ko: '모든 배우', ms: 'Semua Pelakon', th: 'นักแสดงทั้งหมด', de: 'Alle Schauspieler', fr: 'Tous les acteurs', vi: 'Tất cả diễn viên', fil: 'Lahat ng Aktor', pt: 'Todos os atores'
  },
  nav_all_categories: {
    en: 'All Categories', id: 'Semua Kategori', 'zh-TW': '所有分類', 'zh-CN': '所有分类', ja: 'すべてのカテゴリー', ko: '모든 카테고리', ms: 'Semua Kategori', th: 'หมวดหมู่ทั้งหมด', de: 'Alle Kategorien', fr: 'Toutes les catégories', vi: 'Tất cả danh mục', fil: 'Lahat ng Kategorya', pt: 'Todas as categorias'
  },
  category_watch_jav: {
    en: 'Watch JAV', id: 'Tonton JAV', 'zh-TW': '觀看 JAV', 'zh-CN': '观看 JAV', ja: 'JAVを見る', ko: 'JAV 보기', ms: 'Tonton JAV', th: 'ดู JAV', de: 'JAV ansehen', fr: 'Regarder JAV', vi: 'Xem JAV', fil: 'Panoorin ang JAV', pt: 'Assistir JAV'
  },
  category_asia_av: {
    en: 'Asia AV', id: 'Asia AV', 'zh-TW': '亞洲 AV', 'zh-CN': '亚洲 AV', ja: 'アジア AV', ko: '아시아 AV', ms: 'AV Asia', th: 'เอเชีย AV', de: 'Asiatische AV', fr: 'AV Asiatique', vi: 'AV Châu Á', fil: 'Asia AV', pt: 'AV Asiático'
  },
  sub_new_releases: {
    en: 'New Releases', id: 'Rilis Baru', 'zh-TW': '最新發佈', 'zh-CN': '最新发布', ja: '最新リリース', ko: '최신 출시', ms: 'Keluaran Baru', th: 'เปิดตัวใหม่', de: 'Neue Veröffentlichungen', fr: 'Nouvelles sorties', vi: 'Bản phát hành mới', fil: 'Mga Bagong Releases', pt: 'Novos Lançamentos'
  },
  sub_uncensored_leak: {
    en: 'Uncensored leak', id: 'Bocoran Tanpa Sensor', 'zh-TW': '無碼流出', 'zh-CN': '无码流出', ja: '無修正流出', ko: '무삭제 유출', ms: 'Bocoran Tanpa Sensor', th: 'หลุดไม่มีเซ็นเซอร์', de: 'Zensurlose Leaks', fr: 'Fuites sans censure', vi: 'Rò rỉ không che', fil: 'Katas ng Walang Sensor', pt: 'Vazamentos sem censura'
  },
  sub_actress_list: {
    en: 'Actress list', id: 'Daftar Aktris', 'zh-TW': '女優列表', 'zh-CN': '女优列表', ja: '女優一覧', ko: '여배우 목록', ms: 'Senarai Aktris', th: 'รายชื่อนักแสดงหญิง', de: 'Schauspielerinnenliste', fr: 'Liste des actrices', vi: 'Danh sách diễn viên', fil: 'Listahan ng Aktris', pt: 'Lista de atrizes'
  },
  sub_actress_ranking: {
    en: 'Actress ranking MAY 2026', id: 'Peringkat Aktris MEI 2026', 'zh-TW': '女優排行 2026年5月', 'zh-CN': '女优排行 2026年5月', ja: '女優ランキング 2026年5月', ko: '여배우 순위 2026년 5월', ms: 'Kedudukan Aktris MEI 2026', th: 'จัดอันดับนักแสดงหญิง พ.ค. 2026', de: 'Schauspielerinnen-Ranking MAI 2026', fr: 'Classement des actrices MAI 2026', vi: 'Bảng xếp hạng diễn viên 05/2026', fil: 'Ranking ng Aktris MAY 2026', pt: 'Ranking de atrizes MAIO 2026'
  },
  sub_genre: {
    en: 'Genre', id: 'Genre', 'zh-TW': '類型', 'zh-CN': '类型', ja: 'ジャンル', ko: '장르', ms: 'Genre', th: 'ประเภท', de: 'Genre', fr: 'Genre', vi: 'Thể loại', fil: 'Genre', pt: 'Gênero'
  },
  sub_maker: {
    en: 'Maker', id: 'Pembuat / Maker', 'zh-TW': '片商', 'zh-CN': '片商', ja: 'メーカー', ko: '메이ker', ms: 'Pembuat', th: 'ผู้ผลิต', de: 'Hersteller', fr: 'Producteur', vi: 'Nhà sản xuất', fil: 'Maker', pt: 'Produtor'
  },
  sub_vr: {
    en: 'VR', id: 'VR', 'zh-TW': 'VR', 'zh-CN': 'VR', ja: 'VR', ko: 'VR', ms: 'VR', th: 'VR', de: 'VR', fr: 'VR', vi: 'VR', fil: 'VR', pt: 'VR'
  },
  sub_married_slash: {
    en: 'Married Slash', id: 'Pernikahan / Selingkuh', 'zh-TW': '人妻 / 外遇', 'zh-CN': '人妻 / 外遇', ja: '人妻・不倫', ko: '유부녀 / 불륜', ms: 'Kahwin / Curang', th: 'ภรรยา / นอกใจ', de: 'Verheiratet / Affäre', fr: 'Marié / Liaison', vi: 'Nhân thê / Ngoại tình', fil: 'May Asawa / Pagtataksil', pt: 'Casada / Caso'
  },
  sub_korean_live: {
    en: 'Korean Live', id: 'Siaran Langsung Korea', 'zh-TW': '韓國直播', 'zh-CN': '韩国直播', ja: '韓国ライブ', ko: '한국 라이브', ms: 'Siaran Langsung Korea', th: 'ไลฟ์สดเกาหลี', de: 'Koreanisch Live', fr: 'Live Coréen', vi: 'Trực tiếp Hàn Quốc', fil: 'Korean Live', pt: 'Live Coreano'
  },
  sub_chinese_live: {
    en: 'Chinese Live', id: 'Siaran Langsung China', 'zh-TW': '華語直播', 'zh-CN': '华语直播', ja: '中華ライブ', ko: '중국 라이브', ms: 'Siaran Langsung China', th: 'ไลฟ์สดจีน', de: 'Chinesisch Live', fr: 'Live Chinois', vi: 'Trực tiếp Trung Quốc', fil: 'Chinese Live', pt: 'Live Chinês'
  },
  sidebar_my_collections: {
    en: 'My Collection', id: 'Koleksi Saya', 'zh-TW': '我的收藏', 'zh-CN': '我的收藏', ja: 'マイコレクション', ko: '내 보관함', ms: 'Koleksi Saya', th: 'คอลเลกชันของฉัน', de: 'Meine Sammlung', fr: 'Ma Collection', vi: 'Bộ sưu tập', fil: 'Aking Koleksyon', pt: 'Minha Coleção'
  },
  sidebar_other_info: {
    en: 'Other Info', id: 'Informasi Lain', 'zh-TW': '其他資訊', 'zh-CN': '其他资讯', ja: 'その他', ko: '기타 정보', ms: 'Info Lain', th: 'ข้อมูลอื่น ๆ', de: 'Andere Info', fr: 'Autres Infos', vi: 'Thông tin khác', fil: 'Iba pang Impormasyon', pt: 'Outras Informações'
  },

  // Placeholders Pencarian
  search_placeholder: {
    en: 'Search videos, actors, studios, codes...', id: 'Cari video, aktor, studio, kode...', 'zh-TW': '搜尋影片、演員、片商、番號...', 'zh-CN': '搜索影片、演员、片商、番号...', ja: '動画、女優、メーカー、品番で検索...', ko: '비디오, 배우, 스튜디오, 코드 검색...', ms: 'Cari video, pelakon, studio, kod...', th: 'ค้นหาวิดีโอ นักแสดง สตูดิโอ รหัส...', de: 'Videos, Schauspieler, Codes suchen...', fr: 'Rechercher des vidéos, acteurs, codes...', vi: 'Tìm video, diễn viên, studio, mã...', fil: 'Maghanap ng video, aktor, studio...', pt: 'Pesquisar vídeos, atores, códigos...'
  },

  // Metadata Card / Player
  meta_actors: {
    en: 'Actors / Stars:', id: 'Aktor / Bintang:', 'zh-TW': '演員 / 女優:', 'zh-CN': '演员 / 女优:', ja: '出演女優:', ko: '출연 배우:', ms: 'Pelakon:', th: 'นักแสดง:', de: 'Schauspieler:', fr: 'Acteurs:', vi: 'Diễn viên:', fil: 'Mga Aktor:', pt: 'Atores:'
  },
  meta_categories: {
    en: 'Categories:', id: 'Kategori:', 'zh-TW': '分類:', 'zh-CN': '分类:', ja: 'カテゴリー:', ko: '카테고리:', ms: 'Kategori:', th: 'หมวดหมู่:', de: 'Kategorien:', fr: 'Catégories:', vi: 'Danh mục:', fil: 'Mga Kategorya:', pt: 'Categorias:'
  },
  meta_tags: {
    en: 'Tags / Labels:', id: 'Tags / Label:', 'zh-TW': '標籤 / 標記:', 'zh-CN': '标签 / 标记:', ja: 'タグ:', ko: '태그:', ms: 'Tag:', th: 'แท็ก:', de: 'Tags:', fr: 'Tags:', vi: 'Thẻ:', fil: 'Mga Tag:', pt: 'Tags:'
  },

  // Tombol Aksi Player
  btn_watch_later: {
    en: 'Watch Later', id: 'Tonton Nanti', 'zh-TW': '稍後觀看', 'zh-CN': '稍后观看', ja: '後で見る', ko: '나중에 보기', ms: 'Tonton Nanti', th: 'ดูภายหลัง', de: 'Später ansehen', fr: 'À regarder plus tard', vi: 'Xem sau', fil: 'Panoorin Mamaya', pt: 'Assistir'
  },
  btn_saved: {
    en: 'Saved', id: 'Tersimpan', 'zh-TW': '已保存', 'zh-CN': '已保存', ja: '保存済み', ko: '저장됨', ms: 'Tersimpan', th: 'บันทึกแล้ว', de: 'Gespeichert', fr: 'Enregistré', vi: 'Đã lưu', fil: 'Naka-save', pt: 'Salvo'
  },
  btn_share: {
    en: 'Share', id: 'Bagikan', 'zh-TW': '分享', 'zh-CN': '分享', ja: '共有', ko: '공유', ms: 'Kongsi', th: 'แชร์', de: 'Teilen', fr: 'Partager', vi: 'Chia sẻ', fil: 'Ibahagi', pt: 'Compartilhar'
  },
  toast_share_success: {
    en: 'Link successfully copied to clipboard! 📋', id: 'Tautan berhasil disalin ke clipboard! 📋', 'zh-TW': '連結已成功複製到剪貼簿！ 📋', 'zh-CN': '链接已成功复制到剪贴簿！ 📋', ja: 'リンクがクリップボードにコピーされました！ 📋', ko: '링크가 클립보드에 성공적으로 복사되었습니다! 📋', ms: 'Pautan berjaya disalin ke papan klip! 📋', th: 'คัดลอกลิงก์ไปยังคลิปบอร์ดเรียบร้อยแล้ว! 📋', de: 'Link erfolgreich in die Zwischenablage kopiert! 📋', fr: 'Lien copié avec succès dans le presse-papiers ! 📋', vi: 'Đã sao chép liên kết vào bộ nhớ tạm thành công! 📋', fil: 'Matagumpay na nakopya ang link sa clipboard! 📋', pt: 'Link copiado com sucesso para a área de transferência! 📋'
  },

  // Keadaan Kosong & Eror
  empty_state_title: {
    en: 'Empty List', id: 'Daftar Kosong', 'zh-TW': '清單為空', 'zh-CN': '清单为空', ja: 'リストは空です', ko: '목록이 비어 있음', ms: 'Senarai Kosong', th: 'รายการว่างเปล่า', de: 'Leere Liste', fr: 'Liste Vide', vi: 'Danh sách trống', fil: 'Walang Laman', pt: 'Lista Vazia'
  },
  error_retry: {
    en: 'Retry', id: 'Coba Lagi', 'zh-TW': '重試', 'zh-CN': '重试', ja: '再試行', ko: '다시 시도', ms: 'Cuba Lagi', th: 'ลองใหม่', de: 'Wiederholen', fr: 'Réessayer', vi: 'Thử lại', fil: 'Subukan Muli', pt: 'Tentar Novamente'
  },
  empty_clear_btn: {
    en: 'Back to Home', id: 'Kembali ke Beranda', 'zh-TW': '返回首頁', 'zh-CN': '返回首页', ja: 'ホームに戻る', ko: '홈으로 돌아가기', ms: 'Kembali ke Utama', th: 'กลับหน้าแรก', de: 'Zurück zur Startseite', fr: 'Retour à l\'accueil', vi: 'Về trang chủ', fil: 'Bumalik sa Tahanan', pt: 'Voltar ao Início'
  },
  watch_later_empty_desc: {
    en: 'Your watch later list is empty. Add videos from the player page!', id: 'Daftar tonton nanti Anda masih kosong. Simpan video dari halaman pemutaran!', 'zh-TW': '您的稍後觀看清單是空的。從播放器頁面添加影片！', 'zh-CN': '您的稍后观看清单是空的。从播放器页面添加影片！', ja: '「後で見る」リストは空です。プレイヤーページから動画を追加してください！', ko: '나중에 보기 목록이 비어 있습니다. 플레이어 페이지에서 비디오를 추가해 보세요!', ms: 'Senarai tonton nanti anda kosong. Tambah video dari halaman pemain!', th: 'รายการดูภายหลังของคุณว่างเปล่า เพิ่มวิดีโอจากหน้าเล่นวิดีโอ!', de: 'Ihre Merkliste ist leer. Fügen Sie Videos von der Player-Seite hinzu!', fr: 'Votre liste à regarder plus tard est vide. Ajoutez des vidéos depuis la page de lecture !', vi: 'Danh sách xem sau của bạn đang trống. Thêm video từ trang phát!', fil: 'Walang laman ang iyong panoorin mamaya. Magdagdag ng mga video mula sa page ng player!', pt: 'Sua lista de assistir mais tarde está vazia. Adicione vídeos da página de reprodução!'
  },
  history_empty_desc: {
    en: 'Your session play history is empty. Start playing some videos!', id: 'Riwayat tontonan sesi Anda kosong. Silakan putar video terlebih dahulu!', 'zh-TW': '您的播放紀錄是空的。開始播放一些影片吧！', 'zh-CN': '您的播放纪录是空的。开始播放一些影片吧！', ja: '視聴履歴は空です。動画の再生を開始してください！', ko: '시청 기록이 비어 있습니다. 비디오 재생을 시작해 보세요!', ms: 'Sejarah mainan sesi anda kosong. Mula memainkan beberapa video!', th: 'ประวัติการรับชมของคุณว่างเปล่า เริ่มเล่นวิดีโอกันเลย!', de: 'Ihr Wiedergabeverlauf ist leer. Spielen Sie einige Videos ab!', fr: 'Votre historique de lecture est vide. Lancez la lecture de quelques vidéos !', vi: 'Lịch sử phát của bạn đang trống. Bắt đầu phát một số video!', fil: 'Walang laman ang iyong kasaysayan ng pag-play. Mag-play ng ilang video!', pt: 'Seu histórico de reprodução está vazio. Comece a assistir a alguns vídeos!'
  },

  // Halaman Browse Aktor & Studio
  actors_browse_title: {
    en: '🎭 Popular JAV Actresses', id: '🎭 Aktris JAV Populer', 'zh-TW': '🎭 熱門 JAV 女優', 'zh-CN': '🎭 热门 JAV 女优', ja: '🎭 人気 JAV 女優', ko: '🎭 인기 JAV 여배우', ms: '🎭 Aktris JAV Populer', th: '🎭 นักแสดงหญิง JAV ยอดนิยม', de: '🎭 Beliebte JAV-Schauspielerinnen', fr: '🎭 Actrices de JAV populaires', vi: '🎭 Diễn viên JAV nổi tiếng', fil: '🎭 Sikat na mga Aktris ng JAV', pt: '🎭 Atores Populares de JAV'
  },
  actors_browse_desc: {
    en: 'Discover exclusive video collections based on your favorite actress', id: 'Temukan koleksi video eksklusif berdasarkan bintang aktris favorit Anda', 'zh-TW': '根據您喜愛的演員發現專屬影片系列', 'zh-CN': '根据您喜爱的演员发现专属影片系列', ja: 'お気に入りの女優から限定動画コレクションを見つける', ko: '좋아하는 배우의 독점 비디오 컬렉션을 찾아보세요', ms: 'Cari koleksi video eksklusif berdasarkan pelakon kegemaran anda', th: 'ค้นพบคอลเลกชันวิดีโอพิเศษตามนักแสดงหญิงที่คุณชื่นชอบ', de: 'Entdecken Sie exklusive Videosammlungen basierend auf Ihrer Lieblingsschauspielerin', fr: 'Découvrez des collections de vidéos exclusives basées sur votre actrice préférée', vi: 'Khám phá bộ sưu tập video độc quyền theo diễn viên yêu thích của bạn', fil: 'Tuklasin ang mga eksklusibong koleksyon ng video batay sa inyong aktris', pt: 'Descubra coleções de vídeos exclusivas baseadas na sua atriz favorita'
  },
  actors_browse_title_all: {
    en: '🎭 All JAV Actresses', id: '🎭 Semua Aktris JAV', 'zh-TW': '🎭 所有 JAV 女優', 'zh-CN': '🎭 所有 JAV 女优', ja: '🎭 すべて door JAV 女優', ko: '🎭 모든 JAV 여배우', ms: '🎭 Semua Aktris JAV', th: '🎭 นักแสดงหญิง JAV ทั้งหมด', de: '🎭 Alle JAV-Schauspielerinnen', fr: '🎭 Toutes les actrices de JAV', vi: '🎭 Tất cả diễn viên JAV', fil: '🎭 Lahat ng JAV Actresses', pt: '🎭 Todas as atrizes de JAV'
  },
  actors_browse_desc_all: {
    en: 'Browse and search all available actresses alphabetically', id: 'Telusuri dan cari semua aktris yang tersedia berdasarkan urutan abjad', 'zh-TW': '按字母順序瀏覽並搜尋所有可用演員', 'zh-CN': '按字母顺序浏览并搜寻所有可用演员', ja: 'すべての女優をアルファベット順に閲覧・検索', ko: '알파벳순으로 모든 배우 찾기', ms: 'Teroka dan cari semua pelakon yang tersedia mengikut abjad', th: 'เรียกดูและค้นหานักแสดงหญิงทั้งหมดตามตัวอักษร', de: 'Alle verfügbaren Schauspielerinnen alphabetisch durchsuchen', fr: 'Parcourir et rechercher toutes les actrices disponibles par ordre alphabétique', vi: 'Duyệt và tìm kiếm tất cả diễn viên theo thứ tự bảng chữ cái', fil: 'I-browse at maghanap ng lahat ng magagamit na aktres', pt: 'Navegue e pesquise por todas as atrizes disponíveis em ordem alfabética'
  },
  actor_search_placeholder: {
    en: 'Search actress name...', id: 'Cari nama aktris...', 'zh-TW': '搜尋演員姓名...', 'zh-CN': '搜索演员姓名...', ja: '女優名で検索...', ko: '여배우 이름 검색...', ms: 'Cari nama pelakon...', th: 'ค้นหาชื่อนักแสดง...', de: 'Schauspielerinnen suchen...', fr: 'Rechercher un nom d\'actrice...', vi: 'Tìm tên diễn viên...', fil: 'Maghanap ng aktris...', pt: 'Pesquisar atriz...'
  },
  studios_browse_title: {
    en: '🎬 Popular JAV Studios', id: '🎬 Studio JAV Terpopuler', 'zh-TW': '🎬 熱門 JAV 片商', 'zh-CN': '🎬 热门 JAV 片商', ja: '🎬 人気 JAV メーカー', ko: '🎬 인기 JAV 스튜디오', ms: '🎬 Studio JAV Terpopuler', th: '🎬 สตูดิโอ JAV ยอดนิยม', de: '🎬 Beliebte JAV-Studios', fr: '🎬 Studios de JAV populaires', vi: '🎬 Studio JAV nổi tiếng', fil: '🎬 Sikat na mga Studio ng JAV', pt: '🎬 Estúdios Populares de JAV'
  },
  studios_browse_desc: {
    en: 'Browse exclusive video releases based on your favorite production studio', id: 'Telusuri daftar rilis video eksklusif berdasarkan studio produksi favorit Anda', 'zh-TW': '根據您喜愛的製作片商瀏覽專屬影片發佈', 'zh-CN': '根据您喜爱的制作片商浏览专属影片发布', ja: 'お気に入りのメーカーから限定リリース動画を閲覧する', ko: '좋아하는 제작 스튜디오의 독점 비디오 출시를 찾아보세요', ms: 'Teroka pelepasan video eksklusif berdasarkan studio kegemaran anda', th: 'เรียกดูวิดีโอพิเศษตามสตูดิโอผู้ผลิตที่คุณชื่นชอบ', de: 'Durchsuchen Sie exklusive Video-Releases basierend auf Ihrem Lieblings-Studio', fr: 'Parcourez les sorties de vidéos exclusives basées sur votre studio de production préféré', vi: 'Duyệt các video độc quyền theo studio sản xuất yêu thích của bạn', fil: 'Mag-browse ng mga eksklusibong release ng video batay sa iyong studio', pt: 'Navegue por lançamentos de vídeos exclusivos baseados no seu estúdio'
  },
  studio_search_placeholder: {
    en: 'Search studio name...', id: 'Cari nama studio...', 'zh-TW': '搜尋片商名稱...', 'zh-CN': '搜索片商名称...', ja: 'メーカー名で検索...', ko: '스튜디오 이름 검색...', ms: 'Cari nama studio...', th: 'ค้นหาชื่อสตูดิโอ...', de: 'Studios suchen...', fr: 'Rechercher un nom de studio...', vi: 'Tìm tên studio...', fil: 'Maghanap ng studio...', pt: 'Pesquisar estúdio...'
  },

  // Teks Dinamis Format
  search_results: {
    en: 'Results for "{query}" ({total} videos found)', id: 'Hasil untuk "{query}" ({total} video ditemukan)', 'zh-TW': '"{query}" 的結果（找到 {total} 部影片）', 'zh-CN': '"{query}" 的结果（找到 {total} 部影片）', ja: '「{query}」の検索結果（{total}個の動画が見つかりました）', ko: '"{query}" 검색 결과 ({total}개의 비디오 찾음)', ms: 'Hasil untuk "{query}" (menemui {total} video)', th: 'ผลลัพธ์สำหรับ "{query}" (พบ {total} วิดีโอ)', de: 'Ergebnisse für "{query}" ({total} Videos gefunden)', fr: 'Résultats pour "{query}" ({total} vidéos trouvées)', vi: 'Kết quả cho "{query}" (tìm thấy {total} video)', fil: 'Mga resulta para sa "{query}" ({total} video nahanap)', pt: 'Resultados para "{query}" ({total} vídeos encontrados)'
  },
  video_available: {
    en: '{total} videos available', id: '{total} video tersedia', 'zh-TW': '有 {total} 部影片可用', 'zh-CN': '有 {total} 部影片可用', ja: '{total}個の動画が利用可能', ko: '{total}개의 비디오 이용 가능', ms: '{total} video tersedia', th: 'มีวิดีโอที่พร้อมใช้งาน {total} รายการ', de: '{total} Videos verfügbar', fr: '{total} vidéos disponibles', vi: '{total} video có sẵn', fil: '{total} video ang available', pt: '{total} vídeos disponíveis'
  },
  page_format: {
    en: 'Page {current} of {total}', id: 'Halaman {current} dari {total}', 'zh-TW': '第 {current} 頁，共 {total} 頁', 'zh-CN': '第 {current} 页，共 {total} 页', ja: '{current} / {total} ページ', ko: '{current} / {total} 페이지', ms: 'Halaman {current} daripada {total}', th: 'หน้า {current} จาก {total}', de: 'Seite {current} von {total}', fr: 'Page {current} sur {total}', vi: 'Trang {current} trên {total}', fil: 'Pahina {current} ng {total}', pt: 'Página {current} de {total}'
  },

  // Banner Taksonomi Dinamis
  banner_actor_label: {
    en: 'JAV Actress', id: 'Aktris JAV', 'zh-TW': 'JAV 女優', 'zh-CN': 'JAV 女优', ja: 'JAV 女優', ko: 'JAV 여배우', ms: 'Aktris JAV', th: 'นักแสดงหญิง JAV', de: 'JAV-Schauspielerin', fr: 'Actrice de JAV', vi: 'Diễn viên JAV', fil: 'Aktris ng JAV', pt: 'Atriz de JAV'
  },
  banner_actor_desc: {
    en: 'Showing the best video streaming collections starring actress {name}', id: 'Menampilkan koleksi video streaming terbaik yang diperankan oleh aktris {name}', 'zh-TW': '顯示由女優 {name} 主演的最佳串流影片集', 'zh-CN': '显示由女优 {name} 主演的最佳串流影片集', ja: '女優「{name}」が出演する最高のストリーミング動画コレクションを表示中', ko: '여배우 {name}이(가) 출연하는 최고의 스트리밍 비디오 컬렉션 표시 중', ms: 'Menunjukkan koleksi video terbaik yang dibintangi oleh aktris {name}', th: 'แสดงคอลเลกชันวิดีโอสตรีมมิ่งที่ดีที่สุดที่นำแสดงโดยนักแสดงหญิง {name}', de: 'Zeigt die besten Videosammlungen mit der Schauspielerin {name}', fr: 'Affiche les meilleures collections de vidéos mettant en vedette l\'actrice {name}', vi: 'Hiển thị bộ sưu tập video phát trực tuyến hay nhất có sự tham gia của diễn viên {name}', fil: 'Ipinapakita ang pinakamahusay na koleksyon ng video na pinagbibidahan ni {name}', pt: 'Mostrando as melhores coleções de vídeos estreladas pela atriz {name}'
  },
  banner_studio_label: {
    en: 'Production Studio', id: 'Studio Produksi', 'zh-TW': '製作片商', 'zh-CN': '制作片商', ja: 'メーカー', ko: '제작 스튜디오', ms: 'Studio Pengeluaran', th: 'สตูดิโอผู้ผลิต', de: 'Produktionsstudio', fr: 'Studio de Production', vi: 'Studio sản xuất', fil: 'Studio ng Produksyon', pt: 'Estúdio de Produção'
  },
  banner_studio_desc: {
    en: 'Showing all exclusive video releases from studio {name}', id: 'Menampilkan semua video rilis eksklusif dari studio {name}', 'zh-TW': '顯示片商 {name} 的所有專屬影片發佈', 'zh-CN': '显示片商 {name} 的所有专属影片发布', ja: 'メーカー「{name}」のすべての限定リリース動画を表示中', ko: '스튜디오 {name}의 모든 독점 비디오 출시 표시 중', ms: 'Menunjukkan semua pelepasan video eksklusif daripada studio {name}', th: 'แสดงวิดีโอพิเศษทั้งหมดจากสตูดิโอ {name}', de: 'Zeigt alle exklusiven Video-Releases vom Studio {name}', fr: 'Affiche toutes les sorties de vidéos exclusives du studio {name}', vi: 'Hiển thị tất cả video phát hành độc quyền từ studio {name}', fil: 'Ipinapakita ang lahat ng eksklusibong release ng video mula sa studio {name}', pt: 'Mostrando todos os lançamentos exclusivos do estúdio {name}'
  },
  banner_tag_label: {
    en: 'Tag / Label', id: 'Tag / Label', 'zh-TW': '標籤 / 標記', 'zh-CN': '标签 / 标记', ja: 'タグ', ko: '태그', ms: 'Tag', th: 'แท็ก', de: 'Tag', fr: 'Tag', vi: 'Thẻ', fil: 'Tag', pt: 'Tag'
  },
  banner_tag_desc: {
    en: 'Showing all videos tagged with {name}', id: 'Menampilkan semua video dengan tag/label {name}', 'zh-TW': '顯示所有標有 {name} 的影片', 'zh-CN': '显示所有标有 {name} 的影片', ja: '「{name}」タグの付いたすべての動画を表示中', ko: '태그 {name}(으)로 지정된 모든 비디오 표시 중', ms: 'Menunjukkan semua video dengan tag {name}', th: 'แสดงวิดีโอทั้งหมดที่แท็กด้วย {name}', de: 'Zeigt alle Videos mit dem Tag {name}', fr: 'Affiche toutes les vidéos marquées avec {name}', vi: 'Hiển thị tất cả video được gắn thẻ {name}', fil: 'Ipinapakita ang lahat ng video na may tag na {name}', pt: 'Mostrando todos os vídeos com a tag {name}'
  },
  banner_category_label: {
    en: 'Category', id: 'Kategori', 'zh-TW': '主分類', 'zh-CN': '主分类', ja: 'カテゴリー', ko: '카테고리', ms: 'Kategori', th: 'หมวดหมู่', de: 'Kategorie', fr: 'Catégorie', vi: 'Danh mục', fil: 'Kategorya', pt: 'Categoria'
  },
  badge_uncensored: {
    en: 'Uncensored', id: 'Tanpa sensor', 'zh-TW': '無修正', 'zh-CN': '无修正', ja: '無修正', ko: '무삭제', ms: 'Tanpa sensor', th: 'ไม่มีเซ็นเซอร์', de: 'Zensurfrei', fr: 'Non censuré', vi: 'Không che', fil: 'Walang sensor', pt: 'Sem censura'
  },
  unknown_studio: {
    en: 'Unknown Studio', id: 'Studio Tidak Diketahui', 'zh-TW': '未知片商', 'zh-CN': '未知片商', ja: '不明なメーカー', ko: '알 수 없는 스튜디오', ms: 'Studio Tidak Diketahui', th: 'สตูดิโอที่ไม่รู้จัก', de: 'Unbekanntes Studio', fr: 'Studio Inconnu', vi: 'Studio không xác định', fil: 'Hindi Kilalang Studio', pt: 'Estúdio Desconhecido'
  },
  loading_videos_count: {
    en: 'Loading video count...', id: 'Memuat jumlah video...', 'zh-TW': '正在載入影片數量...', 'zh-CN': '正在载入影片数量...', ja: '動画数を読み込み中...', ko: '비디오 수 로딩 중...', ms: 'Memuatkan jumlah video...', th: 'กำลังโหลดจำนวนวิดีโอ...', de: 'Videoanzahl wird geladen...', fr: 'Chargement du nombre de vidéos...', vi: 'Đang tải số lượng video...', fil: 'Naglo-load ng bilang ng video...', pt: 'Carregando contagem de vídeos...'
  },
  loading_more_videos: {
    en: 'Loading more videos...', id: 'Memuat video lainnya...', 'zh-TW': '正在載入更多影片...', 'zh-CN': '正在载入更多影片...', ja: 'さらに動画を読み込み中...', ko: '더 많은 비디오 로딩 중...', ms: 'Memuatkan lebih banyak video...', th: 'กำลังโหลดวิดีโอเพิ่มเติม...', de: 'Weitere Videos werden geladen...', fr: 'Chargement de plus de vidéos...', vi: 'Đang tải thêm video...', fil: 'Naglo-load ng higit pang mga video...', pt: 'Carregando mais vídeos...'
  },
  error_load_more: {
    en: 'Failed to load additional videos.', id: 'Gagal memuat video tambahan.', 'zh-TW': '無法載入更多影片。', 'zh-CN': '无法载入更多影片。', ja: '追加の動画を読み込めませんでした。', ko: '추가 비디오를 로드하지 못했습니다.', ms: 'Gagal memuatkan video tambahan.', th: 'โหลดวิดีโอเพิ่มเติมล้มเหลว', de: 'Zusätzliche Videos konnten nicht geladen werden.', fr: 'Échec du chargement des vidéos supplémentaires.', vi: 'Không tải được video bổ sung.', fil: 'Bigo na i-load ang karagdagang mga video.', pt: 'Falha ao carregar vídeos adicionais.'
  },
  play_video: {
    en: 'Play Video', id: 'Putar Video', 'zh-TW': '播放影片', 'zh-CN': '播放影片', ja: '動画を再生', ko: '동영상 재생', ms: 'Mainkan Video', th: 'เล่นวิดีโอ', de: 'Video abspielen', fr: 'Lire la vidéo', vi: 'Phát video', fil: 'I-play ang Video', pt: 'Reproduzir Vídeo'
  },
  views: {
    en: 'views', id: 'tontonan', 'zh-TW': '次觀看', 'zh-CN': '次观看', ja: '回視聴', ko: '회 조회', ms: 'tontonan', th: 'ครั้ง', de: 'Aufrufe', fr: 'vues', vi: 'lượt xem', fil: 'mga panonood', pt: 'visualizações'
  },
  searching_videos: {
    en: 'Searching videos...', id: 'Mencari video...', 'zh-TW': '正在搜尋影片...', 'zh-CN': '正在搜索影片...', ja: '動画を検索中...', ko: '비디오 검색 중...', ms: 'Mencari video...', th: 'กำลังค้นหาวิดีโอ...', de: 'Videos werden gesucht...', fr: 'Recherche de vidéos...', vi: 'Đang tìm video...', fil: 'Naghahanap ng mga video...', pt: 'Pesquisando vídeos...'
  },
  loading_more_search: {
    en: 'Loading more search results...', id: 'Memuat hasil pencarian lainnya...', 'zh-TW': '正在載入更多搜尋結果...', 'zh-CN': '正在载入更多搜索结果...', ja: 'さらに検索結果を読み込み中...', ko: '더 많은 검색 결과 로딩 중...', ms: 'Memuatkan lebih banyak hasil carian...', th: 'กำลังโหลดผลการค้นหาเพิ่มเติม...', de: 'Weitere Suchergebnisse werden geladen...', fr: 'Chargement de plus de résultats de recherche...', vi: 'Đang tải thêm kết quả tìm kiếm...', fil: 'Naglo-load ng higit pang mga resulta ng paghahanap...', pt: 'Carregando mais resultados de pesquisa...'
  },
  player_not_available: {
    en: 'Player is not available.', id: 'Pemutar tidak tersedia.', ja: 'プレイヤーは利用できません。', ko: '플레이어를 사용할 수 없습니다.', 'zh-TW': '播放器不可用。', 'zh-CN': '播放器不可用。'
  },
  player_format_not_supported: {
    en: 'Player format not supported.', id: 'Format player tidak didukung.', ja: 'プレイヤー形式はサポートされていません。', ko: '지원되지 않는 플레이어 형식입니다.', 'zh-TW': '不支持的播放器格式。', 'zh-CN': '不支持的播放器格式。'
  },
  invalid_video_id: {
    en: 'Invalid Video ID', id: 'ID Video tidak valid', ja: '無効な動画ID', ko: '유효하지 않은 비디오 ID', 'zh-TW': '無效的影片ID', 'zh-CN': '无效的影片ID'
  },
  loading_player_embed: {
    en: 'Loading Player Embed...', id: 'Memuat Player Embed...', ja: 'プレイヤーを読み込み中...', ko: '플레이어 로딩 중...', 'zh-TW': '正在載入播放器...', 'zh-CN': '正在载入播放器...'
  },
  loading_video_title: {
    en: 'Loading video title...', id: 'Memuat judul video...', ja: '動画タイトルを読み込み中...', ko: '비디오 제목 로딩 중...', 'zh-TW': '正在載入影片標題...', 'zh-CN': '正在载入影片标题...'
  },
  loading_actors: {
    en: 'Loading actors...', id: 'Memuat aktor...', ja: '女優を読み込み中...', ko: '배우 로딩 중...', 'zh-TW': '正在載入演員...', 'zh-CN': '正在载入演员...'
  },
  loading_categories: {
    en: 'Loading categories...', id: 'Memuat kategori...', ja: 'カテゴリーを読み込み中...', ko: '카테고리 로딩 중...', 'zh-TW': '正在載入分類...', 'zh-CN': '正在载入分类...'
  },
  loading_tags: {
    en: 'Loading tags...', id: 'Memuat tags...', ja: 'タグを読み込み中...', ko: '태그 로딩 중...', 'zh-TW': '正在載入標籤...', 'zh-CN': '正在载入标签...'
  },
  related_videos: {
    en: 'Related Videos', id: 'Video Terkait', 'zh-TW': '推薦影片', 'zh-CN': '推荐影片', ja: '関連動画', ko: '관련 비디오', ms: 'Video Berkaitan', th: 'วิดีโอที่เกี่ยวข้อง', de: 'Ähnliche Videos', fr: 'Vidéos Connexes', vi: 'Video liên quan', fil: 'Mga Kaugnay na Video', pt: 'Vídeos Relacionados'
  },
  maximize_player_toast: {
    en: 'Maximizing full player 🖥️', id: 'Memaksimalkan pemutar penuh 🖥️', 'zh-TW': '最大化全螢幕播放器 🖥️', 'zh-CN': '最大化全屏幕播放器 🖥️', ja: 'フルプレイヤーを最大化 🖥️', ko: '전체 플레이어 최대화 🖥️', ms: 'Maksimumkan pemain penuh 🖥️', th: 'ขยายเครื่องเล่นเต็มหน้าจอ 🖥️', de: 'Vollbild-Player maximieren 🖥️', fr: 'Agrandissement du lecteur 🖥️', vi: 'Phóng to trình phát đầy đủ 🖥️', fil: 'Pag-maximize ng buong player 🖥️', pt: 'Maximizando o player completo 🖥️'
  },
  error_load_watch_page: {
    en: 'Failed to load watch page: {message}', id: 'Gagal memuat halaman watch: {message}', ja: 'ウォッチページの読み込みに失敗しました: {message}', ko: '시청 페이지를 로드하지 못했습니다: {message}', 'zh-TW': '無法載入觀看頁面：{message}', 'zh-CN': '无法载入观看页面：{message}'
  },
  error_load_page: {
    en: 'Failed to load page: {message}', id: 'Gagal memuat halaman: {message}', ja: 'ページの読み込みに失敗しました: {message}', ko: '페이지를 로드하지 못했습니다: {message}', 'zh-TW': '無法載入頁面：{message}', 'zh-CN': '无法载入页面：{message}', ms: 'Gagal memuatkan halaman: {message}', th: 'โหลดหน้าเว็บล้มเหลว: {message}', de: 'Seite konnte nicht geladen werden: {message}', fr: 'Échec du chargement de la page : {message}', vi: 'Không tải được trang: {message}', fil: 'Bigo na i-load ang pahina: {message}', pt: 'Falha ao carregar a página: {message}'
  },
  error_failed_fetch_video_player: {
    en: 'Failed to load video data or player from server API.', id: 'Gagal memuat data video maupun player dari server API.', 'zh-TW': '無法從伺服器 API 載入影片數據或播放器。', 'zh-CN': '无法从服务器 API 载入影片数据或播放器。', ja: 'サーバーAPIから動画データまたはプレイヤーを読み込めませんでした。', ko: '서버 API에서 비디오 데이터 또는 플레이어를 로드하지 못했습니다.', ms: 'Gagal memuatkan data video atau pemain daripada API pelayan.', th: 'โหลดข้อมูลวิดีโอหรือเครื่องเล่นจาก API เซิร์ฟเวอร์ล้มเหลว', de: 'Videodaten oder Player konnten nicht von der Server-API geladen werden.', fr: 'Échec du chargement des données vidéo ou du lecteur à partir de l\'API du serveur.', vi: 'Không tải được dữ liệu video hoặc trình phát từ API máy chủ.', fil: 'Bigo na i-load ang data ng video o player mula sa server API.', pt: 'Falha ao carregar dados do vídeo ou player da API do servidor.'
  },
  toast_share_failed: {
    en: 'Failed to copy link.', id: 'Gagal menyalin tautan.', ja: 'リンクのコピーに失敗しました。', ko: '링크 복사 실패.', 'zh-TW': '複製連結失敗。', 'zh-CN': '复制链接失败。'
  },
  toast_removed_watch_later: {
    en: 'Removed from Watch Later 📁', id: 'Dihapus dari Tonton Nanti 📁', ja: '「後で見る」から削除されました 📁', ko: '나중에 보기에서 제거됨 📁', 'zh-TW': '已從稍後觀看中移除 📁', 'zh-CN': '已从稍后观看中移除 📁'
  },
  toast_saved_watch_later: {
    en: 'Saved to Watch Later 📁', id: 'Disimpan ke Tonton Nanti 📁', ja: '「後で見る」に保存されました 📁', ko: '나중에 보기에 저장됨 📁', 'zh-TW': '已儲存至稍後觀看 📁', 'zh-CN': '已保存至稍后观看 📁'
  },
  actor_not_found: {
    en: 'Actress Not Found', id: 'Aktris Tidak Ditemukan', ja: '女優が見つかりません', ko: '배우를 찾을 수 없음', 'zh-TW': '找不到演員', 'zh-CN': '找不到演员'
  },
  actor_not_found_desc: {
    en: 'Actress "{query}" was not found in our curated list. Would you like to search videos with this name directly on the server database?', id: 'Aktris "{query}" tidak ada di daftar lokal kami. Apakah Anda ingin mencari video dengan nama ini langsung di database server?', ja: '女優「{query}」は厳選リストに見つかりませんでした。サーバーのデータベースでこの名前の動画を直接検索しますか？', ko: '배우 "{query}"을(를) 추천 목록에서 찾을 수 없습니다. 서버 데이터베이스에서 이 이름으로 직접 비디오를 검색하시겠습니까?', 'zh-TW': '在我們的精選清單中找不到演員「{query}」。您想直接在伺服器資料庫中搜尋此名稱的影片嗎？', 'zh-CN': '在我们的精选清单中找不到演员“{query}”。您想直接在服务器数据库中搜索此名称的视频吗？'
  },
  search_actor_on_server: {
    en: 'Search Actor: "{query}" on Server', id: 'Cari Aktor: "{query}" di Server', ja: 'サーバーで女優「{query}」を検索', ko: '서버에서 배우 "{query}" 검색', 'zh-TW': '在伺服器搜尋演員：「{query}」', 'zh-CN': '在服务器搜索演员：“{query}”'
  },
  studio_not_found: {
    en: 'Studio Not Found', id: 'Studio Tidak Ditemukan', ja: 'メーカーが見つかりません', ko: '스튜디오를 찾을 수 없음', 'zh-TW': '找不到片商', 'zh-CN': '找不到片商'
  },
    studio_not_found_desc: {
    en: 'Studio "{query}" was not found in our curated list. Would you like to search videos from this studio directly on the server database?', id: 'Studio "{query}" tidak ada di daftar lokal kami. Apakah Anda ingin mencari video dengan studio ini langsung di database server?', ja: 'メーカー「{query}」は厳選リストに見つかりませんでした。サーバーのデータベースでこのメーカーの動画を直接検索しますか？', ko: '스튜디오 "{query}"을(를) 추천 목록에서 찾을 수 없습니다. 서버 데이터베이스에서 이 스튜디오의 비디오를 직접 검색하시겠습니까?', 'zh-TW': '在我們的精選清單中找不到片商「{query}」。您想直接在伺服器資料庫中搜尋此片商的影片嗎？', 'zh-CN': '在我们的精选清单中找不到片商“{query}”。您想直接在服务器数据库中搜索此片商的视频吗？'
  },
  search_studio_on_server: {
    en: 'Search Studio: "{query}" on Server', id: 'Cari Studio: "{query}" di Server', ja: 'サーバーでメーカー「{query}」を検索', ko: '서버에서 스튜디오 "{query}" 검색', 'zh-TW': '在伺服器搜尋片商：「{query}」', 'zh-CN': '在服务器搜索片商：“{query}”'
  },
  sort_videos_title: {
    en: 'Sort Videos', id: 'Urutkan Video', 'zh-TW': '排序影片', 'zh-CN': '排序影片', ja: '動画を並べ替え', ko: '동영상 정렬', ms: 'Isih Video', th: 'จัดเรียงวิดีโอ', de: 'Videos sortieren', fr: 'Trier les vidéos', vi: 'Sắp xếp video', fil: 'I-sort ang mga Video', pt: 'Ordenar Vídeos'
  },
  sort_by: {
    en: 'Sort by:', id: 'Sortir dengan:', 'zh-TW': '排序方式：', 'zh-CN': '排序方式：', ja: '並べ替え：', ko: '정렬 기준:', ms: 'Isih mengikut:', th: 'จัดเรียงตาม:', de: 'Sortieren nach:', fr: 'Trier par :', vi: 'Sắp xếp theo:', fil: 'I-sort ayon sa:', pt: 'Ordenar por:'
  },
  sort_date_release: {
    en: 'Release date', id: 'Tanggal rilis', 'zh-TW': '發佈日期', 'zh-CN': '发布日期', ja: '公開日', ko: '출시일', ms: 'Tarikh keluaran', th: 'วันที่เปิดตัว', de: 'Veröffentlichungsdatum', fr: 'Date de sortie', vi: 'Ngày phát hành', fil: 'Petsa ng paglabas', pt: 'Data de lançamento'
  },
  sort_recent_update: {
    en: 'Recent update', id: 'Recent update', 'zh-TW': '最近更新', 'zh-CN': '最近更新', ja: '最近の更新', ko: '최근 업데이트', ms: 'Kemas kini terkini', th: 'อัปเดตล่าสุด', de: 'Kürzliches Update', fr: 'Mise à jour récente', vi: 'Cập nhật gần đây', fil: 'Kamakailang update', pt: 'Atualização recente'
  },
  sort_likes: {
    en: 'Saved', id: 'Diselamatkan', 'zh-TW': '已保存', 'zh-CN': '已保存', ja: '保存済み', ko: '저장됨', ms: 'Diselamatkan', th: 'บันทึกแล้ว', de: 'Gespeichert', fr: 'Enregistré', vi: 'Đã lưu', fil: 'Nailigtas', pt: 'Salvo'
  },
  sort_views_today: {
    en: 'Views today', id: 'Tampilan hari ini', 'zh-TW': '今日觀看', 'zh-CN': '今日观看', ja: '今日の視聴回数', ko: '오늘의 조회수', ms: 'Tontonan hari ini', th: 'ยอดดูวันนี้', de: 'Aufrufe heute', fr: 'Vues aujourd\'hui', vi: 'Xem hôm nay', fil: 'Mga panonood ngayon', pt: 'Visualizações hoje'
  },
  sort_views_weekly: {
    en: 'Weekly views', id: 'Tampilan mingguan', 'zh-TW': '本週觀看', 'zh-CN': '本周观看', ja: '今週 of 視聴回数', ko: '이번 주 조회수', ms: 'Tontonan mingguan', th: 'ยอดดูรายสัปดาห์', de: 'Wöchentliche Aufrufe', fr: 'Vues de la semaine', vi: 'Xem hàng tuần', fil: 'Lingguhang panonood', pt: 'Visualizações semanais'
  },
  sort_views_monthly: {
    en: 'Monthly views', id: 'Tampilan bulanan', 'zh-TW': '本月觀看', 'zh-CN': '本月观看', ja: '今月の視聴回数', ko: '이번 달 조회수', ms: 'Tontonan bulanan', th: 'ยอดดูรายเดือน', de: 'Monatliche Aufrufe', fr: 'Vues du mois', vi: 'Xem hàng tháng', fil: 'Buwanang panonood', pt: 'Visualizações mensais'
  },
  sort_views_total: {
    en: 'Total views', id: 'Jumlah penayangan', 'zh-TW': '總觀看次數', 'zh-CN': '总观看次数', ja: '総視聴回数', ko: '총 조회수', ms: 'Jumlah tontonan', th: 'ยอดดูทั้งหมด', de: 'Gesamte Aufrufe', fr: 'Vues totales', vi: 'Tổng lượt xem', fil: 'Kabuuang panonood', pt: 'Visualizações totais'
  },
  category_all: {
    en: 'All', id: 'Semua', 'zh-TW': '全部', 'zh-CN': '全部', ja: 'すべて', ko: '전체', ms: 'Semua', th: 'ทั้งหมด', de: 'Alle', fr: 'Tout', vi: 'Tất cả', fil: 'Lahat', pt: 'Tudo'
  },
  published: {
    en: 'Published', id: 'Dipublikasikan', 'zh-TW': '發佈於', 'zh-CN': '发布于', ja: '公開日', ko: '게시일', ms: 'Diterbitkan', th: 'เผยแพร่เมื่อ', de: 'Veröffentlicht', fr: 'Publié', vi: 'Đã xuất bản', fil: 'Inilathala', pt: 'Publicado'
  },
  error_load_related: {
    en: 'Failed to load related videos.', id: 'Gagal memuat video terkait.', 'zh-TW': '無法載入推薦影片。', 'zh-CN': '无法载入推荐视频。', ja: '関連動画の読み込みに失敗しました。', ko: '관련 비디오를 로드하지 못했습니다.', ms: 'Gagal memuatkan video berkaitan.', th: 'โหลดวิดีโอที่เกี่ยวข้องล้มเหลว', de: 'Ähnliche Videos konnten nicht geladen werden.', fr: 'Échec du chargement des vidéos connexes.', vi: 'Không tải được video liên quan.', fil: 'Bigo na i-load ang mga kaugnay na video.', pt: 'Falha ao carregar vídeos relacionados.'
  },
  now_playing: {
    en: 'Now Playing...', id: 'Sedang Memutar...', 'zh-TW': '正在播放...', 'zh-CN': '正在播放...', ja: '再生中...', ko: '지금 재생 중...', ms: 'Sedang Memainkan...', th: 'กำลังเล่น...', de: 'Wird jetzt abgespielt...', fr: 'Lecture en cours...', vi: 'Đang phát...', fil: 'Kasalukuyang nagpe-play...', pt: 'Reproduzindo Agora...'
  },
  restore_full_screen: {
    en: 'Restore to Full Screen', id: 'Kembali ke Layar Penuh', 'zh-TW': '還原至全螢幕', 'zh-CN': '还原至全屏幕', ja: 'フルスクリーンに戻す', ko: '전체 화면으로 복원', ms: 'Kembali ke Skrin Penuh', th: 'กลับสู่หน้าจอเต็ม', de: 'Vollbildmodus wiederherstellen', fr: 'Restaurer le plein écran', vi: 'Khôi phục toàn màn hình', fil: 'Ibalik sa Full Screen', pt: 'Restaurar para Tela Cheia'
  },
  close_player: {
    en: 'Close Player', id: 'Tutup Pemutar', 'zh-TW': '關閉播放器', 'zh-CN': '关闭播放器', ja: 'プレイヤーを閉じる', ko: '플레이어 닫기', ms: 'Tutup Pemain', th: 'ปิดเครื่องเล่น', de: 'Player schließen', fr: 'Fermer le lecteur', vi: 'Đóng trình phát', fil: 'Isara ang Player', pt: 'Fechar Player'
  },
  playing_floating_player: {
    en: 'Playing in floating player 📱', id: 'Memutar dalam pemutar melayang 📱', 'zh-TW': '正在浮動播放器中播放 📱', 'zh-CN': '正在浮动播放器中播放 📱', ja: 'フローティングプレイヤーで再生中 📱', ko: '플로팅 플레이어에서 재생 중 📱', ms: 'Memutar dalam pemain terapung 📱', th: 'กำลังเล่นในเครื่องเล่นลอย 📱', de: 'Abspielen im schwebenden Player 📱', fr: 'Lecture dans le lecteur flottant 📱', vi: 'Đang phát trong trình phát nổi 📱', fil: 'Nagpe-play sa floating player 📱', pt: 'Reproduzindo no player flutuante 📱'
  },
  ad_blocker_active: {
    en: 'AD BLOCKER ACTIVE',
    id: 'AD BLOCKER AKTIF',
    'zh-TW': '偵測到廣告攔截器',
    'zh-CN': '检测到广告拦截器',
    ja: '広告ブロッカー有効',
    ko: '광고 차단기 활성화됨',
    ms: 'PENGHADANG IKLAN AKTIF',
    th: 'ตรวจพบตัวบล็อกโฆษณา',
    de: 'ADBLOCKER AKTIV',
    fr: 'ADBLOCKER ACTIF',
    vi: 'TRÌNH CHẶN QUẢNG CÁO HOẠT ĐỘNG',
    fil: 'AKTIBO ANG AD BLOCKER',
    pt: 'BLOQUEADOR DE ANÚNCIOS ATIVO'
  },
  ad_blocker_hint: {
    en: 'Please disable your ad blocker to support us',
    id: 'Harap matikan adblocker Anda untuk mendukung kami',
    'zh-TW': '請關閉您的廣告攔截器以支持我們',
    'zh-CN': '请关闭您的广告拦截器以支持我们',
    ja: '活動を支援するため、広告ブロッカーを無効にしてください',
    ko: '저희를 지원하기 위해 광고 차단기를 비활성화해 주세요',
    ms: 'Sila matikan penghadang iklan anda untuk menyokong kami',
    th: 'โปรดปิดเครื่องมือบล็อกโฆษณาของคุณเพื่อสนับสนุนเรา',
    de: 'Bitte deaktivieren Sie Ihren Adblocker, um uns zu unterstützen',
    fr: 'Veuillez désactiver votre bloqueur de publicités pour nous soutenir',
    vi: 'Vui lòng tắt trình chặn quảng cáo để hỗ trợ chúng tôi',
    fil: 'Mangyaring i-disable ang iyong ad blocker upang suportahan kami',
    pt: 'Por favor, desative o seu bloqueador de anúncios para nos apoiar'
  },
  no_related_videos: {
    en: 'No related videos', id: 'Tidak ada video terkait', 'zh-TW': '沒有推薦影片', 'zh-CN': '没有推荐视频', ja: '関連動画はありません', ko: '관련 비디오가 없습니다', ms: 'Tiada video berkaitan', th: 'ไม่มีวิดีโอที่เกี่ยวข้อง', de: 'Keine ähnlichen Videos', fr: 'Aucune vidéo connexe', vi: 'Không có video liên quan', fil: 'Walang kaugnay na video', pt: 'Nenhum vídeo relacionado'
  },
  match_same_actor: {
    en: 'Same Actor', id: 'Aktris Sama', ja: '同じ女優', ko: '같은 배우', 'zh-TW': '同演員', 'zh-CN': '同演员', ms: 'Pelakon Sama', th: 'นักแสดงเดียวกัน', de: 'Gleicher Darsteller', fr: 'Même Acteur', vi: 'Cùng diễn viên', fil: 'Parehong Artista', pt: 'Mesmo Ator'
  },
  match_same_series: {
    en: 'Same Series', id: 'Seri Sama', ja: '同じシリーズ', ko: '같은 시리즈', 'zh-TW': '同系列', 'zh-CN': '同系列', ms: 'Siri Sama', th: 'ซีรีส์เดียวกัน', de: 'Gleiche Serie', fr: 'Même Série', vi: 'Cùng series', fil: 'Parehong Serye', pt: 'Mesma Série'
  },
  match_similar_tag: {
    en: 'Similar Tag', id: 'Tag Serupa', ja: '類似タグ', ko: '유사한 태그', 'zh-TW': '相似標籤', 'zh-CN': '相似标签', ms: 'Tag Serupa', th: 'แท็กที่คล้ายกัน', de: 'Ähnliches Tag', fr: 'Tag Similaire', vi: 'Tag tương tự', fil: 'Katulad na Tag', pt: 'Tag Similar'
  },
  match_same_category: {
    en: 'Same Category', id: 'Kategori Sama', ja: '同じカテゴリ', ko: '같은 카테고리', 'zh-TW': '同分類', 'zh-CN': '同分类', ms: 'Kategori Sama', th: 'หมวดหมู่เดียวกัน', de: 'Gleiche Kategorie', fr: 'Même Catégorie', vi: 'Cùng danh mục', fil: 'Parehong Kategorya', pt: 'Mesma Categoria'
  },
  no_results_for: {
    en: 'No results for "{query}"', id: 'Tidak ada hasil untuk "{query}"', 'zh-TW': '找不到 "{query}" 的結果', 'zh-CN': '找不到 "{query}" 的结果', ja: '「{query}」の検索結果はありません', ko: '"{query}"에 대한 결과가 없습니다', ms: 'Tiada hasil untuk "{query}"', th: 'ไม่มีผลลัพธ์สำหรับ "{query}"', de: 'Keine Ergebnisse für "{query}"', fr: 'Aucun résultat pour "{query}"', vi: 'Không có kết quả cho "{query}"', fil: 'Walang resulta para sa "{query}"', pt: 'Nenhum resultado para "{query}"'
  },
  no_results_desc: {
    en: 'Try different keywords, check spelling, or clear active filters.', id: 'Coba kata kunci yang berbeda, periksa ejaan, atau hapus filter aktif.', 'zh-TW': '請嘗試不同的關鍵字、檢查拼字，或清除啟用的篩選條件。', 'zh-CN': '请尝试不同的关键字、检查拼写，或清除启用的筛选条件。', ja: '別のキーワードを試すか、スペルを確認するか、有効なフィルターをクリアしてください。', ko: '다른 키워드를 시도하거나, 철자를 확인하거나, 활성 필터를 지워보세요.', ms: 'Cuba kata kunci yang berbeza, periksa ejaan, atau padamkan penapis aktif.', th: 'ลองใช้คำค้นหาอื่น ตรวจสอบการสะกดคำ หรือล้างตัวกรองที่ใช้งานอยู่', de: 'Versuchen Sie andere Schlüsselwörter, überprüfen Sie die Rechtschreibung oder löschen Sie aktive Filter.', fr: 'Essayez d\'autres mots-clés, verifiez l\'orthographe ou effacez les filtres actifs.', vi: 'Thử từ khóa khác, kiểm tra chính tả hoặc xóa bộ lọc đang hoạt động.', fil: 'Subukan ang iba pang mga keyword, suriin ang spelling, o i-clear ang mga aktibong filter.', pt: 'Tente palavras-chave diferentes, verifique a ortografia ou limpe os filtros ativos.'
  },
  error_title: {
    en: 'Oops! Something went wrong', id: 'Oops! Terjadi kesalahan', 'zh-TW': 'Oops! 發生錯誤', 'zh-CN': 'Oops! 发生错误', ja: 'おっと！エラーが発生しました', ko: '앗! 오류가 발생했습니다', ms: 'Oops! Berlaku ralat', th: 'อุ๊ย! เกิดข้อผิดพลาด', de: 'Oops! Etwas ist schief gelaufen', fr: 'Oops! Quelque chose s\'est mal passé', vi: 'Rất tiếc! Đã xảy ra lỗi', fil: 'Oops! May nagkamali', pt: 'Oops! Algo deu errado'
  },
  category_uncensored: {
    en: 'Uncensored', id: 'Tanpa Sensor', 'zh-TW': '無修正', 'zh-CN': '无修正', ja: '無修正', ko: '무삭제', ms: 'Tanpa Sensor', th: 'ไม่มีเซ็นเซอร์', de: 'Zensurfrei', fr: 'Non censuré', vi: 'Không che', fil: 'Walang sensor', pt: 'Sem censura'
  },
  category_amateur: {
    en: 'Amateur', id: 'Amatir', 'zh-TW': '素人', 'zh-CN': '素人', ja: '素人', ko: '아마추어', ms: 'Amatir', th: 'มือสมัครเล่น', de: 'Amateur', fr: 'Amateur', vi: 'Nghiệp dư', fil: 'Amateur', pt: 'Amador'
  },
  category_subtitled: {
    en: 'Subtitled', id: 'Dengan Subtitle', 'zh-TW': '中文字幕', 'zh-CN': '中文字幕', ja: '字幕付き', ko: '자막', ms: 'Sari Kata', th: 'มีซับไตเติล', de: 'Untertitelt', fr: 'Sous-titré', vi: 'Phụ đề', fil: 'May subtitle', pt: 'Legendado'
  },
  category_creampie: {
    en: 'Creampie', id: 'Creampie', 'zh-TW': '中出', 'zh-CN': '中出', ja: '中出し', ko: '질내사정', ms: 'Creampie', th: 'ครีมพาย', de: 'Creampie', fr: 'Creampie', vi: 'Xuất trong', fil: 'Creampie', pt: 'Creampie'
  },
  category_cosplay: {
    en: 'Cosplay', id: 'Cosplay', 'zh-TW': '角色扮演', 'zh-CN': '角色扮演', ja: 'コスプレ', ko: '코스프레', ms: 'Kosplay', th: 'คอสเพลย์', de: 'Cosplay', fr: 'Cosplay', vi: 'Cosplay', fil: 'Cosplay', pt: 'Cosplay'
  },
  category_mosaic: {
    en: 'Mosaic', id: 'Sensor Mosaik', 'zh-TW': '有修正', 'zh-CN': '有修正', ja: 'モザイク', ko: '모자イク', ms: 'Mosaik', th: 'โมเสก', de: 'Mosaik', fr: 'Mosaïque', vi: 'Mờ che', fil: 'Mosaiko', pt: 'Mosaico'
  },
  sidebar_more_categories: {
    en: 'More...', id: 'Lainnya...', 'zh-TW': '更多...', 'zh-CN': '更多...', ja: 'もっと見る...', ko: '더 보기...', ms: 'Lagi...', th: 'เพิ่มเติม...', de: 'Mehr...', fr: 'Plus...', vi: 'Thêm...', fil: 'Pa-dagdag...', pt: 'Mais...'
  },

  // Extended category translations
  category_leaked: {
    en: 'Leaked', id: 'Bocoran', 'zh-TW': '流出', 'zh-CN': '流出', ja: '流出', ko: '유출', ms: 'Bocor', th: 'หลุด', de: 'Geleakt', fr: 'Fuité', vi: 'Bị rò rỉ', fil: 'Naleak', pt: 'Vazado'
  },
  category_big_tits: {
    en: 'Big Tits', id: 'Payudara Besar', 'zh-TW': '巨乳', 'zh-CN': '巨乳', ja: '巨乳', ko: '큰 가슴', ms: 'Payudara Besar', th: 'นมใหญ่', de: 'Große Brüste', fr: 'Gros seins', vi: 'Ngực lớn', fil: 'Malaking dibdib', pt: 'Peitos grandes'
  },
  category_milf: {
    en: 'MILF', id: 'MILF', 'zh-TW': '熟女', 'zh-CN': '熟女', ja: '熟女', ko: '밀프', ms: 'MILF', th: 'แม่บ้าน', de: 'MILF', fr: 'MILF', vi: 'Phụ nữ trưởng thành', fil: 'MILF', pt: 'MILF'
  },
  category_threesome: {
    en: 'Threesome', id: 'Threesome', 'zh-TW': '三人行', 'zh-CN': '三人行', ja: '3P', ko: '쓰리섬', ms: 'Threesome', th: 'สามคน', de: 'Dreier', fr: 'Trio', vi: 'Ba người', fil: 'Threesome', pt: 'Ménage à trois'
  },
  category_teen: {
    en: 'Teen', id: 'Remaja', 'zh-TW': '少女', 'zh-CN': '少女', ja: '美少女', ko: '틴', ms: 'Remaja', th: 'วัยรุ่น', de: 'Teen', fr: 'Adolescente', vi: 'Tuổi teen', fil: 'Tin', pt: 'Adolescente'
  },
  category_massage: {
    en: 'Massage', id: 'Pijat', 'zh-TW': '按摩', 'zh-CN': '按摩', ja: 'マッサージ', ko: '마사지', ms: 'Urut', th: 'นวด', de: 'Massage', fr: 'Massage', vi: 'Massage', fil: 'Masahe', pt: 'Massagem'
  },
  category_anal: {
    en: 'Anal', id: 'Anal', 'zh-TW': '肛交', 'zh-CN': '肛交', ja: 'アナル', ko: '애널', ms: 'Anal', th: 'ทวาร', de: 'Anal', fr: 'Anal', vi: 'Hậu môn', fil: 'Anal', pt: 'Anal'
  },
  category_lesbian: {
    en: 'Lesbian', id: 'Lesbian', 'zh-TW': '女同', 'zh-CN': '女同', ja: 'レズビアン', ko: '레즈비언', ms: 'Lesbian', th: 'เลสเบี้ยน', de: 'Lesbisch', fr: 'Lesbienne', vi: 'Đồng tính nữ', fil: 'Lesbiyana', pt: 'Lésbica'
  },
  category_bondage: {
    en: 'Bondage', id: 'Bondage', 'zh-TW': '束縛', 'zh-CN': '束缚', ja: '緊縛', ko: '본디지', ms: 'Bondage', th: 'บอนเดจ', de: 'Bondage', fr: 'Bondage', vi: 'Trói buộc', fil: 'Bondage', pt: 'Bondage'
  },
  category_office_lady: {
    en: 'Office Lady', id: 'Wanita Kantoran', 'zh-TW': 'OL', 'zh-CN': 'OL', ja: 'OL', ko: '오피스레이디', ms: 'Wanita Pejabat', th: 'OL', de: 'Bürodame', fr: 'Employée de bureau', vi: 'Nhân viên văn phòng', fil: 'Office Lady', pt: 'Secretária'
  },
  category_nurse: {
    en: 'Nurse', id: 'Perawat', 'zh-TW': '護士', 'zh-CN': '护士', ja: 'ナース', ko: '간호사', ms: 'Jururawat', th: 'พยาบาล', de: 'Krankenschwester', fr: 'Infirmière', vi: 'Y tá', fil: 'Nars', pt: 'Enfermeira'
  },
  category_teacher: {
    en: 'Teacher', id: 'Guru', 'zh-TW': '教師', 'zh-CN': '教师', ja: '女教師', ko: '교사', ms: 'Guru', th: 'ครู', de: 'Lehrerin', fr: 'Enseignante', vi: 'Giáo viên', fil: 'Guro', pt: 'Professora'
  },
  category_schoolgirl: {
    en: 'Schoolgirl', id: 'Pelajar', 'zh-TW': '女學生', 'zh-CN': '女学生', ja: '女子校生', ko: '여학생', ms: 'Pelajar', th: 'นักเรียนหญิง', de: 'Schülerin', fr: 'Écolière', vi: 'Nữ sinh', fil: 'Estudyante', pt: 'Colegial'
  },
  category_stepmom: {
    en: 'Stepmom', id: 'Ibu Tiri', 'zh-TW': '繼母', 'zh-CN': '继母', ja: '義母', ko: '새엄마', ms: 'Ibu Tiri', th: 'แม่เลี้ยง', de: 'Stiefmutter', fr: 'Belle-mère', vi: 'Mẹ kế', fil: 'Stepmother', pt: 'Madrasta'
  },
  category_gangbang: {
    en: 'Gangbang', id: 'Gangbang', 'zh-TW': '輪姦', 'zh-CN': '轮奸', ja: '輪姦', ko: '갱뱅', ms: 'Gangbang', th: 'แก๊งแบง', de: 'Gangbang', fr: 'Gangbang', vi: 'Nhóm', fil: 'Gangbang', pt: 'Gangbang'
  },
  category_ntr: {
    en: 'NTR', id: 'NTR', 'zh-TW': 'NTR', 'zh-CN': 'NTR', ja: '寝取られ', ko: 'NTR', ms: 'NTR', th: 'NTR', de: 'NTR', fr: 'NTR', vi: 'NTR', fil: 'NTR', pt: 'NTR'
  },
  category_pov: {
    en: 'POV', id: 'Sudut Pandang', 'zh-TW': '主觀視角', 'zh-CN': '主观视角', ja: '主観', ko: 'POV', ms: 'POV', th: 'มุมมองคนดู', de: 'POV', fr: 'Subjectif', vi: 'Góc nhìn', fil: 'POV', pt: 'POV'
  },
  category_orgy: {
    en: 'Orgy', id: 'Pesta', 'zh-TW': '群交', 'zh-CN': '群交', ja: '乱交', ko: '난교', ms: 'Orgy', th: 'ออร์จี้', de: 'Orgie', fr: 'Orgie', vi: 'Loạn dâm', fil: 'Orgy', pt: 'Orgia'
  },
  category_squirting: {
    en: 'Squirting', id: 'Squirting', 'zh-TW': '潮吹', 'zh-CN': '潮吹', ja: '潮吹き', ko: '분출', ms: 'Squirting', th: 'สไควร์ท', de: 'Squirting', fr: 'Éjaculation féminine', vi: 'Squirting', fil: 'Squirting', pt: 'Squirting'
  },
  category_blowjob: {
    en: 'Blowjob', id: 'Oral', 'zh-TW': '口交', 'zh-CN': '口交', ja: 'フェラ', ko: '블로우잡', ms: 'Oral', th: 'ออรัล', de: 'Blowjob', fr: 'Fellation', vi: 'Thổi kèn', fil: 'Blowjob', pt: 'Oral'
  },
  category_handjob: {
    en: 'Handjob', id: 'Handjob', 'zh-TW': '手交', 'zh-CN': '手交', ja: '手コキ', ko: '핸드잡', ms: 'Handjob', th: 'แฮนด์จ็อบ', de: 'Handjob', fr: 'Branlette', vi: 'Thủ dâm', fil: 'Handjob', pt: 'Punheta'
  },
  category_footjob: {
    en: 'Footjob', id: 'Footjob', 'zh-TW': '足交', 'zh-CN': '足交', ja: '足コキ', ko: '풋잡', ms: 'Footjob', th: 'ฟุตจ็อบ', de: 'Footjob', fr: 'Footjob', vi: 'Chân', fil: 'Footjob', pt: 'Footjob'
  },
  category_outdoor: {
    en: 'Outdoor', id: 'Luar Ruangan', 'zh-TW': '戶外', 'zh-CN': '户外', ja: '野外', ko: '야외', ms: 'Luar', th: 'กลางแจ้ง', de: 'Outdoor', fr: 'Extérieur', vi: 'Ngoài trời', fil: 'Outdoor', pt: 'Ao ar livre'
  },
  category_voyeur: {
    en: 'Voyeur', id: 'Mengintip', 'zh-TW': '偷窺', 'zh-CN': '偷窥', ja: '盗撮', ko: '관음', ms: 'Mengintai', th: 'แอบดู', de: 'Voyeur', fr: 'Voyeur', vi: 'Quay lén', fil: 'Voyeur', pt: 'Voyeur'
  },

  // Categories browse page UI strings
  categories_browse_title: {
    en: 'All Categories', id: 'Semua Kategori', 'zh-TW': '所有分類', 'zh-CN': '所有分类', ja: 'すべてのカテゴリー', ko: '모든 카테고리', ms: 'Semua Kategori', th: 'หมวดหมู่ทั้งหมด', de: 'Alle Kategorien', fr: 'Toutes les catégories', vi: 'Tất cả danh mục', fil: 'Lahat ng kategorya', pt: 'Todas as categorias'
  },
  categories_browse_desc: {
    en: 'Browse and explore all available categories', id: 'Jelajahi semua kategori yang tersedia', 'zh-TW': '瀏覽並探索所有可用分類', 'zh-CN': '浏览并探索所有可用分类', ja: '利用可能なすべてのカテゴリーを閲覧', ko: '사용 가능한 모든 카테고리 탐색', ms: 'Layari semua kategori yang tersedia', th: 'เรียกดูหมวดหมู่ทั้งหมดที่มี', de: 'Alle verfügbaren Kategorien durchsuchen', fr: 'Parcourir toutes les catégories disponibles', vi: 'Duyệt tất cả danh mục có sẵn', fil: 'I-browse ang lahat ng kategorya', pt: 'Navegue por todas as categorias disponíveis'
  },
  category_search_placeholder: {
    en: 'Search categories...', id: 'Cari kategori...', 'zh-TW': '搜索分類...', 'zh-CN': '搜索分类...', ja: 'カテゴリーを検索...', ko: '카테고리 검색...', ms: 'Cari kategori...', th: 'ค้นหาหมวดหมู่...', de: 'Kategorien suchen...', fr: 'Rechercher des catégories...', vi: 'Tìm danh mục...', fil: 'Maghanap ng kategorya...', pt: 'Buscar categorias...'
  },
  category_not_found: {
    en: 'No categories found', id: 'Kategori tidak ditemukan', 'zh-TW': '未找到分類', 'zh-CN': '未找到分类', ja: 'カテゴリーが見つかりません', ko: '카테고리를 찾을 수 없습니다', ms: 'Kategori tidak dijumpai', th: 'ไม่พบหมวดหมู่', de: 'Keine Kategorien gefunden', fr: 'Aucune catégorie trouvée', vi: 'Không tìm thấy danh mục', fil: 'Walang kategoryang nahanap', pt: 'Nenhuma categoria encontrada'
  },
  category_not_found_desc: {
    en: 'No results for "{query}"', id: 'Tidak ada hasil untuk "{query}"', 'zh-TW': '沒有"{query}"的結果', 'zh-CN': '没有"{query}"的结果', ja: '「{query}」の結果はありません', ko: '"{query}" 검색 결과가 없습니다', ms: 'Tiada hasil untuk "{query}"', th: 'ไม่มีผลลัพธ์สำหรับ "{query}"', de: 'Keine Ergebnisse für „{query}"', fr: 'Aucun résultat pour « {query} »', vi: 'Không có kết quả cho "{query}"', fil: 'Walang resulta para sa "{query}"', pt: 'Nenhum resultado para "{query}"'
  }
};

// Common JAV tags/words dictionary for dynamic title translations
const TITLE_DICTIONARY = {
  uncensored: {
    en: 'Uncensored', id: 'Tanpa Sensor', 'zh-TW': '無修正', 'zh-CN': '无修正', ja: '無修正', ko: '무삭제', ms: 'Tanpa Sensor', th: 'ไม่มีเซ็นเซอร์', de: 'Zensurfrei', fr: 'Non censuré', vi: 'Không che', fil: 'Walang sensor', pt: 'Sem censura'
  },
  subtitled: {
    en: 'Subtitled', id: 'Subtitle', 'zh-TW': '中文字幕', 'zh-CN': '中文字幕', ja: '字幕付き', ko: '자막', ms: 'Sari Kata', th: 'มีซับไตเติล', de: 'Untertitelt', fr: 'Sous-titré', vi: 'Phụ đề', fil: 'May subtitle', pt: 'Legendado'
  },
  sub: {
    en: 'Sub', id: 'Sub', 'zh-TW': '字幕', 'zh-CN': '字幕', ja: '字幕', ko: '자막', ms: 'Sari', th: 'ซับ', de: 'Sub', fr: 'Sous', vi: 'Phụ đề', fil: 'Sub', pt: 'Legenda'
  },
  amateur: {
    en: 'Amateur', id: 'Amatir', 'zh-TW': '素人', 'zh-CN': '素人', ja: '素人', ko: '아마추어', ms: 'Amatir', th: 'มือสมัครเล่น', de: 'Amateur', fr: 'Amateur', vi: 'Nghiệp dư', fil: 'Amateur', pt: 'Amador'
  },
  creampie: {
    en: 'Creampie', id: 'Creampie', 'zh-TW': '中出', 'zh-CN': '中出', ja: '中出し', ko: '질내사정', ms: 'Creampie', th: 'ครีมพาย', de: 'Creampie', fr: 'Creampie', vi: 'Xuất dalam', fil: 'Creampie', pt: 'Creampie'
  },
  cosplay: {
    en: 'Cosplay', id: 'Cosplay', 'zh-TW': '角色扮演', 'zh-CN': '角色扮演', ja: 'コスプレ', ko: '코스프레', ms: 'Kosplay', th: 'คอสเพลย์', de: 'Cosplay', fr: 'Cosplay', vi: 'Cosplay', fil: 'Cosplay', pt: 'Cosplay'
  },
  mosaic: {
    en: 'Mosaic', id: 'Mosaik', 'zh-TW': '有修正', 'zh-CN': '有修正', ja: 'モザイク', ko: '모자イク', ms: 'Mosaik', th: 'โมเสก', de: 'Mosaik', fr: 'Mosaïque', vi: 'Mờ che', fil: 'Mosaiko', pt: 'Mosaico'
  },
  leaked: {
    en: 'Leaked', id: 'Bocor', 'zh-TW': '流出', 'zh-CN': '流出', ja: '流出', ko: '유출됨', ms: 'Bocor', th: 'หลุด', de: 'Geleakt', fr: 'Fuité', vi: 'Bị rò rỉ', fil: 'Naleak', pt: 'Vazado'
  },
  leak: {
    en: 'Leak', id: 'Bocor', 'zh-TW': '流出', 'zh-CN': '流出', ja: '流出', ko: '유출', ms: 'Bocor', th: 'หลุด', de: 'Leak', fr: 'Fuite', vi: 'Rò rỉ', fil: 'Leak', pt: 'Vazamento'
  },
  legal_section_title: {
    en: 'Legal', id: 'Hukum', 'zh-TW': '法律資訊', 'zh-CN': '法律信息', ja: '法的情報', ko: '법적 고지', ms: 'Undang-Undang', th: 'ข้อกฎหมาย', de: 'Rechtliches', fr: 'Légal', vi: 'Pháp lý', fil: 'Legal', pt: 'Legal'
  },
  legal_2257_link: {
    en: '18 U.S.C. 2257', id: '18 U.S.C. 2257', 'zh-TW': '18 U.S.C. 2257', 'zh-CN': '18 U.S.C. 2257', ja: '18 U.S.C. 2257', ko: '18 U.S.C. 2257', ms: '18 U.S.C. 2257', th: '18 U.S.C. 2257', de: '18 U.S.C. 2257', fr: '18 U.S.C. 2257', vi: '18 U.S.C. 2257', fil: '18 U.S.C. 2257', pt: '18 U.S.C. 2257'
  },
  legal_dmca_link: {
    en: 'DMCA Policy', id: 'Kebijakan DMCA', 'zh-TW': 'DMCA 政策', 'zh-CN': 'DMCA 政策', ja: 'DMCAポリシー', ko: 'DMCA 정책', ms: 'Polisi DMCA', th: 'นโยบาย DMCA', de: 'DMCA-Richtlinie', fr: 'Politique DMCA', vi: 'Chính sách DMCA', fil: 'Patakaran ng DMCA', pt: 'Política DMCA'
  },
  legal_modal_close: {
    en: 'Close', id: 'Tutup', 'zh-TW': '關閉', 'zh-CN': '关闭', ja: '閉じる', ko: '닫기', ms: 'Tutup', th: 'ปิด', de: 'Schließen', fr: 'Fermer', vi: 'Đóng', fil: 'Isara', pt: 'Fechar'
  },
  legal_2257_title: {
    en: '18 U.S.C. 2257 Compliance Statement', id: 'Pernyataan Kepatuhan 18 U.S.C. 2257', 'zh-TW': '18 U.S.C. § 2257 記錄保存合規聲明', 'zh-CN': '18 U.S.C. § 2257 记录保存合规声明', ja: '18 U.S.C. § 2257 記録保持遵守声明', ko: '18 U.S.C. § 2257 기록 보존 준수 선언문', ms: 'Pernyataan Pematuhan Penyimpanan Rekod 18 U.S.C. § 2257', th: 'คำแถลงการปฏิบัติตามการเก็บรักษาบันทึกตาม 18 U.S.C. § 2257', de: '18 U.S.C. § 2257 Erklärung zur Einhaltung der Aufzeichnungspflichten', fr: 'Déclaration de conformité à la tenue des registres 18 U.S.C. § 2257', vi: 'Tuyên bố tuân thủ lưu trữ hồ sơ theo 18 U.S.C. § 2257', fil: 'Pahayag ng Pagsunod sa Pagpapanatili ng Rekord ng 18 U.S.C. § 2257', pt: 'Declaração de Conformidade de Manutenção de Registros 18 U.S.C. § 2257'
  },
  legal_dmca_title: {
    en: 'DMCA Copyright Policy', id: 'Kebijakan Hak Cipta DMCA', 'zh-TW': 'DMCA 著作權政策', 'zh-CN': 'DMCA 著作权政策', ja: 'DMCA著作権ポリシー', ko: 'DMCA 저작권 정책', ms: 'Polisi Hak Cipta DMCA', th: 'นโยบายลิขสิทธิ์ DMCA', de: 'DMCA-Urheberrechtsrichtlinie', fr: 'Politique de droits d\'auteur DMCA', vi: 'Chính sách bản quyền DMCA', fil: 'Patakaran sa Karapatang-ari ng DMCA', pt: 'Política de Direitos Autorais DMCA'
  },
  legal_contact_link: {
    en: 'Contact Us', id: 'Hubungi Kami', 'zh-TW': '聯絡我們', 'zh-CN': '联络我们', ja: 'お問い合わせ', ko: '문의하기', ms: 'Hubungi Kami', th: 'ติดต่อเรา', de: 'Kontakt', fr: 'Contactez-nous', vi: 'Liên hệ', fil: 'Contact Us', pt: 'Contate-nos'
  },
  legal_contact_title: {
    en: 'Contact Us & Partnerships', id: 'Hubungi Kami & Kemitraan', 'zh-TW': '聯絡我們與商務合作', 'zh-CN': '联络我们与商务合作', ja: 'お問い合わせ・広告掲載', ko: '문의하기 및 제휴', ms: 'Hubungi Kami & Kerjasama', th: 'ติดต่อเราและโฆษณา', de: 'Kontakt & Partnerschaften', fr: 'Contactez-nous & Partenariats', vi: 'Liên hệ & Hợp tác', fil: 'Makipag-ugnayan & Pakikipagtulungan', pt: 'Contato & Parcerias'
  },
  share_modal_title: {
    en: 'Share Video', id: 'Bagikan Video', 'zh-TW': '分享影片', 'zh-CN': '分享视频', ja: '動画を共有', ko: '비디오 공유', ms: 'Kongsi Video', th: 'แชร์วิดีโอ', de: 'Video teilen', fr: 'Partager la vidéo', vi: 'Chia sẻ Video', fil: 'Ibahagi ang Video', pt: 'Compartilhar Vídeo'
  },
  share_modal_copy: {
    en: 'Copy Link', id: 'Salin Tautan', 'zh-TW': '複製連結', 'zh-CN': '复制链接', ja: 'リンクをコピー', ko: '링크 복사', ms: 'Salin Pautan', th: 'คัดลอกลิงก์', de: 'Link kopieren', fr: 'Copier le lien', vi: 'Sao chép liên kết', fil: 'Kopyahin ang Link', pt: 'Copiar Link'
  }
};

/**
 * Decodes all HTML entities (e.g. &quot;, &#039;, &amp;) inside a string to raw characters.
 */
export function decodeHTMLEntities(text) {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Dynamically translates common JAV bracket tags and standalone words inside video titles
 * @param {string} title - The original video title
 * @returns {string} The translated video title
 */
export function translateVideoTitle(title) {
  if (!title) return '';
  const decodedTitle = decodeHTMLEntities(title);
  const lang = getLang();
  let translatedTitle = decodedTitle;
  const words = ['uncensored', 'subtitled', 'amateur', 'creampie', 'cosplay', 'mosaic', 'leaked', 'leak', 'sub'];

  for (const word of words) {
    const translations = TITLE_DICTIONARY[word];
    if (!translations) continue;
    const targetTranslation = translations[lang] || translations['en'] || word;

    // 1. Bracketed tags case-insensitive matching e.g., [Uncensored]
    const bracketRegex = new RegExp(`\\[(${word})\\]`, 'gi');
    translatedTitle = translatedTitle.replace(bracketRegex, (match, matchedWord) => {
      let replacement = targetTranslation;
      const isAllUpper = matchedWord === matchedWord.toUpperCase();
      const isAllLower = matchedWord === matchedWord.toLowerCase();
      const isTitleCase = matchedWord.charAt(0) === matchedWord.charAt(0).toUpperCase() && matchedWord.slice(1) === matchedWord.slice(1).toLowerCase();

      if (isAllUpper) {
        replacement = targetTranslation.toUpperCase();
      } else if (isTitleCase) {
        replacement = targetTranslation.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else if (isAllLower) {
        replacement = targetTranslation.toLowerCase();
      }
      return `[${replacement}]`;
    });

    // 2. Standalone words case-insensitive matching with word boundaries
    const wordRegex = new RegExp(`\\b(${word})\\b`, 'gi');
    translatedTitle = translatedTitle.replace(wordRegex, (match, matchedWord) => {
      let replacement = targetTranslation;
      const isAllUpper = matchedWord === matchedWord.toUpperCase();
      const isAllLower = matchedWord === matchedWord.toLowerCase();
      const isTitleCase = matchedWord.charAt(0) === matchedWord.charAt(0).toUpperCase() && matchedWord.slice(1) === matchedWord.slice(1).toLowerCase();

      if (isAllUpper) {
        replacement = targetTranslation.toUpperCase();
      } else if (isTitleCase) {
        replacement = targetTranslation.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else if (isAllLower) {
        replacement = targetTranslation.toLowerCase();
      }
      return replacement;
    });
  }

  return translatedTitle;
}

/**
 * Fetch active language code from current URL pathname segment, fallback to localStorage, and default to 'en'
 * @returns {string} Language code (e.g. 'en', 'id', 'ja')
 */
export function getLang() {
  const pathname = window.location.pathname;
  const segments = pathname.replace(/^\//, '').split('/');
  const firstSegment = segments[0] || '';
  const isValidLang = LANGS.some(l => l.code === firstSegment);
  if (isValidLang) {
    return firstSegment;
  }
  return localStorage.getItem('missav_lang') || 'en';
}

/**
 * Save selected language preference, re-render UI translation and trigger routing to reload feed
 * @param {string} langCode - New language code
 * @param {boolean} [triggerRedirect=true] - Trigger URL rewrite and popstate dispatch
 */
export function setLang(langCode, triggerRedirect = true) {
  localStorage.setItem('missav_lang', langCode);
  // Simpan juga ke cookie agar Cloudflare Worker bisa membaca preferensi ini
  // saat request berikutnya, mencegah geo-redirect menimpa pilihan manual user.
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `missav_lang=${langCode}; Path=/; Max-Age=2592000; SameSite=Lax${secureFlag}`;
  
  // Translate static UI elements immediately
  translateStaticUI();
  
  if (triggerRedirect) {
    const pathname = window.location.pathname;
    const cleanPath = pathname.replace(/^\//, '');
    const segments = cleanPath.split('/');
    const firstSegment = segments[0] || '';
    const isLangSegment = LANGS.some(l => l.code === firstSegment);
    
    let newPathname = '';
    if (isLangSegment) {
      segments[0] = langCode;
      newPathname = '/' + segments.join('/') + window.location.search;
    } else {
      newPathname = '/' + langCode + (pathname.startsWith('/') ? '' : '/') + pathname + window.location.search;
    }
    
    history.pushState(null, '', newPathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  
  const activeLang = LANGS.find(l => l.code === langCode);
  if (activeLang) {
    ui.showToast(`Language set to ${activeLang.label}`);
  }
}

/**
 * Retrieve translation string for a key and dynamically replace variables if provided
 * @param {string} key - Dictionary key (e.g. 'search_results')
 * @param {Object} [params={}] - Interpolation variables (e.g. { query: 'Yua', total: '12' })
 * @returns {string} Parsed translation string
 */
export function t(key, params = {}) {
  const lang = getLang();
  const translations = DICTIONARY[key] || TITLE_DICTIONARY[key];
  if (!translations) return '';

  let text = translations[lang] || translations['en'] || '';
  
  Object.keys(params).forEach(pKey => {
    text = text.replace(new RegExp(`{${pKey}}`, 'g'), params[pKey]);
  });

  return text;
}

/**
 * Translate all static text elements containing 'data-i18n', 'data-i18n-placeholder' or 'data-i18n-title' attributes
 */
export function translateStaticUI() {
  const activeLang = getLang();
  
  // 1. Translate static text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = t(key);
    if (translation) {
      el.textContent = translation;
    }
  });

  // 2. Translate input placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const translation = t(key);
    if (translation) {
      el.setAttribute('placeholder', translation);
    }
  });

  // 3. Translate title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    const translation = t(key);
    if (translation) {
      el.setAttribute('title', translation);
    }
  });

  // 4. Update the floating player title in real-time if visible and playing
  const floatTitle = document.getElementById('floating-player-title');
  if (floatTitle && window.missavJState && window.missavJState.activeVideo) {
    floatTitle.textContent = translateVideoTitle(window.missavJState.activeVideo.title);
  }

  // 5. Update header flag button visual trigger
  const triggerImg = document.getElementById('lang-trigger-flag');
  const activeLangObj = LANGS.find(l => l.code === activeLang);
  if (triggerImg && activeLangObj) {
    triggerImg.src = activeLangObj.flag;
    triggerImg.alt = activeLangObj.label;
    
    const triggerBtn = document.getElementById('lang-dropdown-trigger');
    if (triggerBtn) {
      triggerBtn.setAttribute('title', `Change Language (Current: ${activeLangObj.label})`);
    }
  }

  // 6. Update header categories navigation
  if (typeof window.missavJRenderCategories === 'function') {
    window.missavJRenderCategories();
  }
}

// Persistent localStorage cache for translated video titles
const FULL_TRANSLATION_CACHE_KEY = 'missav_full_title_translations_v1';
let fullTitleTranslations = {};
try {
  const cached = localStorage.getItem(FULL_TRANSLATION_CACHE_KEY);
  if (cached) {
    fullTitleTranslations = JSON.parse(cached);
  }
} catch (e) {
  console.error('Error loading translation cache:', e);
}

function saveFullTitleTranslations() {
  try {
    localStorage.setItem(FULL_TRANSLATION_CACHE_KEY, JSON.stringify(fullTitleTranslations));
  } catch (e) {
    // If local storage is full, reset cache to prevent fatal errors
    console.warn('Translation cache quota exceeded, resetting cache:', e);
    localStorage.removeItem(FULL_TRANSLATION_CACHE_KEY);
    fullTitleTranslations = {};
  }
}

// Configuration of alternate free public Google Translate endpoints for rotation
const TRANSLATION_ENDPOINTS = [
  { domain: 'translate.googleapis.com', client: 'gtx' },
  { domain: 'translate.google.com', client: 'dict-chrome-ex' },
  { domain: 'clients5.google.com', client: 'dict-chrome-ex' }
];
let activeEndpointIndex = 0;

/**
 * Rotates the active endpoint index to failover on errors or 429 rate limits.
 */
function rotateEndpoint() {
  activeEndpointIndex = (activeEndpointIndex + 1) % TRANSLATION_ENDPOINTS.length;
  const next = TRANSLATION_ENDPOINTS[activeEndpointIndex];
  console.warn(`Translation rate limit or error encountered. Rotating to alternative endpoint: ${next.domain} (${next.client})`);
}

/**
 * Translates English text to a target language asynchronously using a free Google Translate API.
 * Uses localStorage to cache translations for speed and rate-limit prevention.
 */
export async function translateText(text, targetLang) {
  if (!text) return '';
  if (!targetLang || targetLang === 'en') return text;

  const cleanedText = decodeHTMLEntities(text).trim();
  if (!cleanedText) return '';

  const cacheKey = `${targetLang}:${cleanedText}`;
  if (fullTitleTranslations[cacheKey]) {
    return fullTitleTranslations[cacheKey];
  }

  // Fallback to single translate query if batch system is bypassed
  let attempt = 0;
  while (attempt < TRANSLATION_ENDPOINTS.length) {
    const endpoint = TRANSLATION_ENDPOINTS[activeEndpointIndex];
    const url = `https://${endpoint.domain}/translate_a/single?client=${endpoint.client}&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanedText)}`;
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        rotateEndpoint();
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data[0]) {
        const translated = data[0].map(x => x[0]).join('');
        fullTitleTranslations[cacheKey] = translated;
        saveFullTitleTranslations();
        return translated;
      }
    } catch (e) {
      console.error(`Failed single translation fetch via ${endpoint.domain}:`, e);
      rotateEndpoint();
    }
    attempt++;
  }
  return text; // Return original on total failure
}

// Global batch translation queue
let translationQueue = [];
let batchTimeout = null;

/**
 * Registers an element to the global batch translation queue.
 */
function queueTranslation(element, originalText, targetLang) {
  // Prevent duplicate queuing
  if (element.dataset.translating === 'true') return;
  element.dataset.translating = 'true';

  translationQueue.push({ element, originalText, targetLang });

  // Debounce worker to collect all elements loaded during a DOM render frame
  clearTimeout(batchTimeout);
  batchTimeout = setTimeout(processTranslationQueue, 150);
}

/**
 * Processes the translation queue, batching up to 30 titles in a single Google Translate API request.
 */
async function processTranslationQueue() {
  if (translationQueue.length === 0) return;

  const queueToProcess = [...translationQueue];
  translationQueue = [];

  const lang = getLang();
  if (!lang || lang === 'en') {
    // If language is English, clear translation state and revert
    queueToProcess.forEach(({ element, originalText }) => {
      const defaultTitle = translateVideoTitle(originalText);
      element.textContent = defaultTitle;
      if (element.hasAttribute('title')) element.setAttribute('title', defaultTitle);
      delete element.dataset.translating;
    });
    return;
  }

  // 1. Group unique texts to translate
  const uniqueTexts = Array.from(new Set(queueToProcess.map(item => item.originalText.trim())));
  if (uniqueTexts.length === 0) {
    queueToProcess.forEach(({ element }) => delete element.dataset.translating);
    return;
  }

  // 2. Fetch translations in batches of up to 30 items
  const BATCH_SIZE = 30;
  const translationsMap = {};

  // Check cache first for all items to avoid querying Google if possible
  const textsToQuery = [];
  uniqueTexts.forEach(txt => {
    const cacheKey = `${lang}:${txt}`;
    if (fullTitleTranslations[cacheKey]) {
      translationsMap[txt] = fullTitleTranslations[cacheKey];
    } else {
      textsToQuery.push(txt);
    }
  });

  if (textsToQuery.length > 0) {
    for (let i = 0; i < textsToQuery.length; i += BATCH_SIZE) {
      const batch = textsToQuery.slice(i, i + BATCH_SIZE);
      // Join queries with standard newlines. Google Translate naturally preserves \n
      const combinedText = batch.join('\n');

      let success = false;
      let attempt = 0;

      while (!success && attempt < TRANSLATION_ENDPOINTS.length) {
        const endpoint = TRANSLATION_ENDPOINTS[activeEndpointIndex];
        const url = `https://${endpoint.domain}/translate_a/single?client=${endpoint.client}&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(combinedText)}`;
        try {
          const res = await fetch(url);
          if (res.status === 429) {
            rotateEndpoint();
            attempt++;
            continue;
          }
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const data = await res.json();
          if (data && data[0]) {
            // Google Translate single returns data[0] as list of segment pairs: [ [ "trans_part_1", "src_part_1" ], ... ]
            // Reconstruct the translated lines
            const fullTranslatedText = data[0].map(segment => segment[0]).join('');
            const lines = fullTranslatedText.split('\n');

            // Map translated lines back to the source batch texts
            batch.forEach((originalTxt, idx) => {
              const translatedTxt = (lines[idx] || originalTxt).trim();
              translationsMap[originalTxt] = translatedTxt;
              
              // Cache results
              const cacheKey = `${lang}:${originalTxt}`;
              fullTitleTranslations[cacheKey] = translatedTxt;
            });
            saveFullTitleTranslations();
            success = true;
          }
        } catch (e) {
          console.error(`Batch translation failed via ${endpoint.domain}:`, e);
          rotateEndpoint();
        }
        attempt++;
      }

      // Fallback: If translation fails completely for this batch, assign original text
      if (!success) {
        batch.forEach(originalTxt => {
          translationsMap[originalTxt] = originalTxt;
        });
      }
    }
  }

  // 3. Update the DOM elements with their respective translations
  queueToProcess.forEach(({ element, originalText }) => {
    const translated = translationsMap[originalText];
    if (translated && element.getAttribute('data-original-title') === originalText) {
      element.textContent = translated;
      if (element.hasAttribute('title')) {
        element.setAttribute('title', translated);
      }
    }
    delete element.dataset.translating;
  });
}

/**
 * Scans the active page for all elements with `data-original-title` and updates their text content.
 */
export function translatePageTitles() {
  const lang = getLang();
  const titleElements = document.querySelectorAll('[data-original-title]');
  
  titleElements.forEach((el) => {
    const original = el.getAttribute('data-original-title');
    if (!original) return;
    queueTranslation(el, original, lang);
  });
}

// Global MutationObserver instance to auto-translate titles as they render/append
let translationObserver = null;

/**
 * Initializes a MutationObserver on #app-content to automatically translate titles
 * loaded dynamically or appended by infinite scroll.
 */
export function initTranslationObserver() {
  if (translationObserver) {
    translationObserver.disconnect();
  }

  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  // Scan immediately on initialization
  translatePageTitles();

  translationObserver = new MutationObserver((mutations) => {
    let hasNewTitles = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector('[data-original-title]') || node.hasAttribute('data-original-title')) {
              hasNewTitles = true;
              break;
            }
          }
        }
      } else if (mutation.type === 'attributes' && mutation.attributeName === 'data-original-title') {
        hasNewTitles = true;
      }
      if (hasNewTitles) break;
    }

    if (hasNewTitles) {
      // Debounce slightly to allow the DOM to settle
      clearTimeout(window.missavJTranslateTimeout);
      window.missavJTranslateTimeout = setTimeout(translatePageTitles, 100);
    }
  });

  translationObserver.observe(appContent, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-original-title']
  });
}

window.i18n = { LANGS, HREFLANG_CODE_MAP, hreflangCode, getLang, setLang, t, translateStaticUI, translateVideoTitle, translateText, translatePageTitles, initTranslationObserver };
export default { LANGS, HREFLANG_CODE_MAP, hreflangCode, getLang, setLang, t, translateStaticUI, translateVideoTitle, translateText, translatePageTitles, initTranslationObserver };

