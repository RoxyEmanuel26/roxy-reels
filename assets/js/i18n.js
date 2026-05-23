/**
 * MISSAV-J — Multi-Language Internationalization (i18n) Engine
 * Mengelola kamus terjemahan modular untuk 13 bahasa, preferensi localStorage,
 * serta fungsi lokalisasi statik & dinamis untuk seluruh antarmuka SPA.
 */

import ui from './ui.js';

// Konfigurasi 13 Bahasa dengan Ikon Bendera Lingkaran dari assets/pics
export const LANGS = [
  { code: 'zh-TW', label: '繁體中文', flag: 'assets/pics/hong-kong.png' },
  { code: 'zh-CN', label: '简体中文', flag: 'assets/pics/china.png' },
  { code: 'en', label: 'English', flag: 'assets/pics/united-kingdom.png' },
  { code: 'ja', label: '日本語', flag: 'assets/pics/japan.png' },
  { code: 'ko', label: '한국의', flag: 'assets/pics/south-korea.png' },
  { code: 'ms', label: 'Melayu', flag: 'assets/pics/malaysia.png' },
  { code: 'th', label: 'ไทย', flag: 'assets/pics/thailand.png' },
  { code: 'de', label: 'Deutsch', flag: 'assets/pics/germany.png' },
  { code: 'fr', label: 'Français', flag: 'assets/pics/france.png' },
  { code: 'vi', label: 'Tiếng Việt', flag: 'assets/pics/vietnam.png' },
  { code: 'id', label: 'Bahasa Indonesia', flag: 'assets/pics/indonesia.png' },
  { code: 'fil', label: 'Filipino', flag: 'assets/pics/philippines.png' },
  { code: 'pt', label: 'Português', flag: 'assets/pics/brazil.png' }
];

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

  // Judul Pembagi / Section Titles
  sidebar_main_categories: {
    en: 'Main Categories', id: 'Kategori Utama', 'zh-TW': '主分類', 'zh-CN': '主分类', ja: 'カテゴリー', ko: '주요 카테고리', ms: 'Kategori Utama', th: 'หมวดหมู่หลัก', de: 'Hauptkategorien', fr: 'Catégories Principales', vi: 'Danh mục chính', fil: 'Pangunahing Kategorya', pt: 'Categorias Principais'
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
  no_related_videos: {
    en: 'No related videos', id: 'Tidak ada video terkait', 'zh-TW': '沒有推薦影片', 'zh-CN': '没有推荐视频', ja: '関連動画はありません', ko: '관련 비디오가 없습니다', ms: 'Tiada video berkaitan', th: 'ไม่มีวิดีโอที่เกี่ยวข้อง', de: 'Keine ähnlichen Videos', fr: 'Aucune vidéo connexe', vi: 'Không có video liên quan', fil: 'Walang kaugnay na video', pt: 'Nenhum vídeo relacionado'
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
  }
};

/**
 * Dynamically translates common JAV bracket tags and standalone words inside video titles
 * @param {string} title - The original video title
 * @returns {string} The translated video title
 */
export function translateVideoTitle(title) {
  if (!title) return '';
  const lang = getLang();
  let translatedTitle = title;
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
 * Fetch active language code from localStorage with a default fallback to 'en'
 * @returns {string} Language code (e.g. 'en', 'id', 'ja')
 */
export function getLang() {
  return localStorage.getItem('missav_lang') || 'en';
}

/**
 * Save selected language preference, re-render UI translation and trigger routing to reload feed
 * @param {string} langCode - New language code
 * @param {boolean} [triggerRedirect=true] - Trigger URL rewrite and popstate dispatch
 */
export function setLang(langCode, triggerRedirect = true) {
  localStorage.setItem('missav_lang', langCode);
  
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
  const translations = DICTIONARY[key];
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
}

window.i18n = { LANGS, getLang, setLang, t, translateStaticUI, translateVideoTitle };
export default { LANGS, getLang, setLang, t, translateStaticUI, translateVideoTitle };
