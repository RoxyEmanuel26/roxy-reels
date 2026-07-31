/**
 * MISSAV-J — SPA Catchall Router & SEO Tag Injector (Cloudflare)
 * 
 * OPTIMIZED: Menghilangkan loopback request ke /api/posts.
 * Sekarang fetch langsung ke server.apijav.com & Supabase
 * untuk menghemat 1 Worker request per halaman watch.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const VALID_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

// Map internal language keys to valid ISO 639-1 hreflang / html-lang codes.
// Mirrors HREFLANG_CODE_MAP in assets/js/i18n.js and the sitemap emitters:
// URL paths keep /fil/, but the lang attribute must be 'tl' (ISO 639-1 Tagalog).
const HREFLANG_CODE_MAP = { fil: 'tl' };
const hreflangCode = (langKey) => HREFLANG_CODE_MAP[langKey] || langKey;

function generateHreflangTags(urlOrigin, urlPathname, urlSearch) {
  let cleanPath = urlPathname.replace(/^\/(id|ja|ko|zh-TW|zh-CN|ms|th|de|fr|vi|fil|pt)(?=\/|$)/, '');
  if (cleanPath === '') cleanPath = '/';
  
  const allLangs = ['en', 'id', 'ja', 'ko', 'zh-TW', 'zh-CN', 'ms', 'th', 'de', 'fr', 'vi', 'fil', 'pt'];
  
  const tags = allLangs.map(lang => {
    const code = hreflangCode(lang);
    let path = cleanPath;
    if (lang !== 'en') {
      path = cleanPath === '/' ? `/${lang}` : `/${lang}${cleanPath}`;
    }
    // Use escapeHtml to safely encode ampersands (&) and quotes from urlSearch
    return `<link rel="alternate" hreflang="${code}" href="${escapeHtml(urlOrigin + path + urlSearch)}" />`;
  });
  
  tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(urlOrigin + cleanPath + urlSearch)}" />`);
  return tags.join('\n  ');
}

const DESC_TEMPLATES = {
  'zh-TW': (code, title) => `免費觀看 JAV ${code ? code + ' ' : ''}${title}，盡在 MISSAV-J 高畫質串流平台。`,
  'zh-CN': (code, title) => `免费观看 JAV ${code ? code + ' ' : ''}${title}，尽在 MISSAV-J 高清流媒体平台。`,
  'en': (code, title) => `Watch ${code ? code + ' ' : ''}${title} for free in premium HD streaming quality on MISSAV-J.`,
  'ja': (code, title) => `MISSAV-J で ${code ? code + ' ' : ''}${title} を高画質で無料視聴。`,
  'ko': (code, title) => `MISSAV-J에서 ${code ? code + ' ' : ''}${title} 무료 HD 스트리밍 시청.`,
  'ms': (code, title) => `Tonton ${code ? code + ' ' : ''}${title} secara percuma dengan kualiti HD premium di MISSAV-J.`,
  'th': (code, title) => `ดู ${code ? code + ' ' : ''}${title} ฟรีในคุณภาพ HD ระดับพรีเมียมบน MISSAV-J`,
  'de': (code, title) => `Sehen Sie ${code ? code + ' ' : ''}${title} kostenlos in Premium-HD-Streaming-Qualität auf MISSAV-J.`,
  'fr': (code, title) => `Regardez ${code ? code + ' ' : ''}${title} gratuitement en qualité HD premium sur MISSAV-J.`,
  'vi': (code, title) => `Xem ${code ? code + ' ' : ''}${title} miễn phí chất lượng HD cao cấp trên MISSAV-J.`,
  'id': (code, title) => `Nonton video JAV ${code ? code + ' ' : ''}${title} gratis dengan streaming kualitas premium di MISSAV-J.`,
  'fil': (code, title) => `Panoorin ang ${code ? code + ' ' : ''}${title} nang libre sa premium HD streaming sa MISSAV-J.`,
  'pt': (code, title) => `Assista ao ${code ? code + ' ' : ''}${title} gratuitamente em qualidade de streaming HD premium na MISSAV-J.`
};

const SEO_I18N = {
  en: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming. Explore the latest releases, trending videos, and top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Watch JAV videos starring %s in premium HD on MISSAV-J. Explore the full filmography and profile." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Watch the latest and best %s JAV videos online for free. Premium high-quality streaming on MISSAV-J." },
    studio: { t: "%s Studio JAV Videos | MISSAV-J", d: "Explore the official collection of %s JAV videos. High definition streaming for %s releases." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Watch the most popular and trending JAV videos right now on MISSAV-J." },
    recent: { t: "Recent JAV Videos | MISSAV-J", d: "Watch the newest and latest JAV video releases on MISSAV-J." },
    actors: { t: "All JAV Actresses | MISSAV-J", d: "Browse our complete database of JAV actresses and their full video collections." },
    categories: { t: "All JAV Categories | MISSAV-J", d: "Explore all JAV categories, genres, and tags on MISSAV-J." },
    studios: { t: "All JAV Studios | MISSAV-J", d: "Browse videos from top JAV studios and production companies on MISSAV-J." },
    search: { t: "Search Results | MISSAV-J", d: "Search results for premium JAV videos on MISSAV-J." },
    history: { t: "Session History | MISSAV-J", d: "Your recently watched JAV videos on MISSAV-J." },
    watch_later: { t: "Watch Later | MISSAV-J", d: "Your saved JAV videos to watch later on MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming on MISSAV-J." }
  },
  id: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton video JAV premium terbaik. Jelajahi rilis terbaru, video trending, dan aktris top." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV dari %s dalam kualitas HD premium di MISSAV-J. Jelajahi profil lengkapnya." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terbaru dan terbaik secara online. Streaming kualitas tinggi premium di MISSAV-J." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Jelajahi koleksi resmi video JAV %s. Streaming definisi tinggi untuk rilis %s." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling populer dan trending saat ini di MISSAV-J." },
    recent: { t: "Video JAV Terbaru | MISSAV-J", d: "Tonton rilis video JAV terbaru dan teranyar di MISSAV-J." },
    actors: { t: "Semua Aktris JAV | MISSAV-J", d: "Jelajahi basis data lengkap aktris JAV kami dan koleksi video mereka." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Jelajahi semua kategori, genre, dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Jelajahi video dari studio dan perusahaan produksi JAV teratas di MISSAV-J." },
    search: { t: "Hasil Pencarian | MISSAV-J", d: "Hasil pencarian untuk video JAV premium di MISSAV-J." },
    history: { t: "Riwayat Sesi | MISSAV-J", d: "Video JAV yang baru saja Anda tonton di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang Anda simpan untuk ditonton nanti di MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton streaming JAV premium terbaik di MISSAV-J." }
  },
  ja: {
    home: { t: "MISSAV-J | プレミアムJAVストリーミング", d: "最高のプレミアムJAVストリーミングを視聴。最新リリース、トレンド動画、人気女優を探索。" },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-Jで %s 出演のJAV動画をプレミアムHDで視聴。完全なプロフィールを探索。" },
    category: { t: "%s JAV動画 | MISSAV-J", d: "最新かつ最高の %s JAV動画をオンラインで無料視聴。MISSAV-Jでのプレミアム高品質ストリーミング。" },
    studio: { t: "%s JAV動画 | MISSAV-J", d: "公式の %s JAV動画コレクションを探索。%s リリースの高解像度ストリーミング。" },
    trending: { t: "急上昇JAV動画 | MISSAV-J", d: "MISSAV-Jで今最も人気のあるトレンドJAV動画を視聴。" },
    recent: { t: "新着JAV動画 | MISSAV-J", d: "MISSAV-Jで最新のJAV動画リリースを視聴。" },
    actors: { t: "すべてのJAV女優 | MISSAV-J", d: "JAV女優の完全なデータベースとフルビデオコレクションを閲覧。" },
    categories: { t: "すべてのJAVカテゴリー | MISSAV-J", d: "MISSAV-JですべてのJAVカテゴリー、ジャンル、タグを探索。" },
    studios: { t: "すべてのJAVメーカー | MISSAV-J", d: "MISSAV-JでトップJAVメーカーや制作会社の動画を閲覧。" },
    search: { t: "検索結果 | MISSAV-J", d: "MISSAV-JのプレミアムJAV動画の検索結果。" },
    history: { t: "視聴履歴 | MISSAV-J", d: "MISSAV-Jで最近視聴したJAV動画。" },
    watch_later: { t: "後で見る | MISSAV-J", d: "MISSAV-Jで後で見るために保存したJAV動画。" },
    default: { t: "MISSAV-J | プレミアムJAVストリーミング", d: "MISSAV-Jで最高のプレミアムJAVストリーミングを視聴。" }
  },
  ko: {
    home: { t: "MISSAV-J | 프리미엄 JAV 스트리밍", d: "최고의 프리미엄 JAV 스트리밍을 시청하세요. 최신 릴리스, 인기 동영상 및 최고 여배우를 탐색하십시오." },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-J에서 %s 출연 JAV 동영상을 프리미엄 HD로 시청하세요." },
    category: { t: "%s JAV 동영상 | MISSAV-J", d: "온라인에서 최신 및 최고의 %s JAV 동영상을 무료로 시청하세요." },
    studio: { t: "%s JAV 동영상 | MISSAV-J", d: "공식 %s JAV 동영상 컬렉션을 탐색하십시오." },
    trending: { t: "인기 JAV 동영상 | MISSAV-J", d: "MISSAV-J에서 지금 가장 인기 있고 트렌디한 JAV 동영상을 시청하세요." },
    recent: { t: "최신 JAV 동영상 | MISSAV-J", d: "MISSAV-J에서 최신 JAV 동영상 릴리스를 시청하세요." },
    actors: { t: "모든 JAV 여배우 | MISSAV-J", d: "우리의 완전한 JAV 여배우 데이터베이스를 찾아보십시오." },
    categories: { t: "모든 JAV 카테고리 | MISSAV-J", d: "MISSAV-J에서 모든 JAV 카테고리를 탐색하십시오." },
    studios: { t: "모든 JAV 스튜디오 | MISSAV-J", d: "MISSAV-J에서 인기 JAV 스튜디오의 동영상을 찾아보십시오." },
    search: { t: "검색 결과 | MISSAV-J", d: "MISSAV-J의 프리미엄 JAV 동영상 검색 결과." },
    history: { t: "시청 기록 | MISSAV-J", d: "MISSAV-J에서 최근에 시청한 JAV 동영상." },
    watch_later: { t: "나중에 보기 | MISSAV-J", d: "MISSAV-J에 나중에 보기 위해 저장한 JAV 동영상." },
    default: { t: "MISSAV-J | 프리미엄 JAV 스트리밍", d: "MISSAV-J에서 최고의 프리미엄 JAV 스트리밍을 시청하세요." }
  },
  'zh-TW': {
    home: { t: "MISSAV-J | 高級 JAV 串流", d: "觀看最好的高級 JAV 串流。探索最新發布、熱門影片和頂級女優。" },
    actor: { t: "%s | MISSAV-J", d: "在 MISSAV-J 上以高級 HD 觀看由 %s 主演的 JAV 影片。探索完整的影片庫。" },
    category: { t: "%s JAV 影片 | MISSAV-J", d: "在線免費觀看最新最好的 %s JAV 影片。MISSAV-J 提供高級高品質串流。" },
    studio: { t: "%s JAV 影片 | MISSAV-J", d: "探索官方的 %s JAV 影片收藏。MISSAV-J 提供高畫質串流。" },
    trending: { t: "熱門 JAV 影片 | MISSAV-J", d: "在 MISSAV-J 上觀看目前最受歡迎和熱門的 JAV 影片。" },
    recent: { t: "最新 JAV 影片 | MISSAV-J", d: "在 MISSAV-J 上觀看最新的 JAV 影片發布。" },
    actors: { t: "所有 JAV 女優 | MISSAV-J", d: "瀏覽我們完整的 JAV 女優數據庫和她們的影片收藏。" },
    categories: { t: "所有 JAV 分類 | MISSAV-J", d: "探索 MISSAV-J 上的所有 JAV 分類、流派和標籤。" },
    studios: { t: "所有 JAV 片商 | MISSAV-J", d: "瀏覽 MISSAV-J 上頂級 JAV 片商的影片。" },
    search: { t: "搜索結果 | MISSAV-J", d: "MISSAV-J 上高級 JAV 影片的搜索結果。" },
    history: { t: "觀看歷史 | MISSAV-J", d: "您最近在 MISSAV-J 觀看的 JAV 影片。" },
    watch_later: { t: "稍後觀看 | MISSAV-J", d: "您保存在 MISSAV-J 稍後觀看的 JAV 影片。" },
    default: { t: "MISSAV-J | 高級 JAV 串流", d: "在 MISSAV-J 觀看最好的高級 JAV 串流。" }
  },
  'zh-CN': {
    home: { t: "MISSAV-J | 高级 JAV 流媒体", d: "观看最好的高级 JAV 流媒体。探索最新发布、热门视频和顶级女优。" },
    actor: { t: "%s | MISSAV-J", d: "在 MISSAV-J 上以高级 HD 观看由 %s 主演的 JAV 视频。探索完整的影片库。" },
    category: { t: "%s JAV 视频 | MISSAV-J", d: "在线免费观看最新最好的 %s JAV 视频。MISSAV-J 提供高级高质量流媒体。" },
    studio: { t: "%s JAV 视频 | MISSAV-J", d: "探索官方的 %s JAV 视频收藏。MISSAV-J 提供高清流媒体。" },
    trending: { t: "热门 JAV 视频 | MISSAV-J", d: "在 MISSAV-J 上观看目前最受欢迎和热门的 JAV 视频。" },
    recent: { t: "最新 JAV 视频 | MISSAV-J", d: "在 MISSAV-J 上观看最新的 JAV 视频发布。" },
    actors: { t: "所有 JAV 女优 | MISSAV-J", d: "浏览我们完整的 JAV 女优数据库和她们的视频收藏。" },
    categories: { t: "所有 JAV 分类 | MISSAV-J", d: "探索 MISSAV-J 上的所有 JAV 分类、流派和标签。" },
    studios: { t: "所有 JAV 片商 | MISSAV-J", d: "浏览 MISSAV-J 上顶级 JAV 片商的视频。" },
    search: { t: "搜索结果 | MISSAV-J", d: "MISSAV-J 上高级 JAV 视频的搜索结果。" },
    history: { t: "观看历史 | MISSAV-J", d: "您最近在 MISSAV-J 观看的 JAV 视频。" },
    watch_later: { t: "稍后观看 | MISSAV-J", d: "您保存在 MISSAV-J 稍后观看的 JAV 视频。" },
    default: { t: "MISSAV-J | 高级 JAV 流媒体", d: "在 MISSAV-J 观看最好的高级 JAV 流媒体。" }
  },
  ms: {
    home: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik. Terokai keluaran terkini, video trending dan pelakon popular." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV yang dibintangi %s dalam HD premium di MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terkini dan terbaik dalam talian secara percuma." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Terokai koleksi rasmi video JAV %s di MISSAV-J." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling popular dan trending sekarang di MISSAV-J." },
    recent: { t: "Video JAV Terkini | MISSAV-J", d: "Tonton keluaran video JAV terkini di MISSAV-J." },
    actors: { t: "Semua Pelakon JAV | MISSAV-J", d: "Semak imbas pangkalan data lengkap pelakon JAV kami." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Terokai semua kategori, genre dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Semak imbas video dari studio JAV teratas di MISSAV-J." },
    search: { t: "Hasil Carian | MISSAV-J", d: "Hasil carian untuk video JAV premium di MISSAV-J." },
    history: { t: "Sejarah Sesi | MISSAV-J", d: "Video JAV yang anda tonton baru-baru ini di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang anda simpan untuk ditonton nanti di MISSAV-J." },
    default: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik di MISSAV-J." }
  },
  th: {
    home: { t: "MISSAV-J | สตรีมมิ่ง JAV พรีเมียม", d: "ดูการสตรีม JAV พรีเมียมที่ดีที่สุด สำรวจการเปิดตัวล่าสุด วิดีโอยอดนิยม และนักแสดงหญิงชั้นนำ" },
    actor: { t: "%s | MISSAV-J", d: "ดูวิดีโอ JAV ที่นำแสดงโดย %s ในรูปแบบ HD พรีเมียมบน MISSAV-J" },
    category: { t: "วิดีโอ JAV %s | MISSAV-J", d: "ดูวิดีโอ JAV %s ล่าสุดและดีที่สุดออนไลน์ฟรี" },
    studio: { t: "วิดีโอ JAV %s | MISSAV-J", d: "สำรวจคอลเลกชันอย่างเป็นทางการของวิดีโอ JAV %s บน MISSAV-J" },
    trending: { t: "วิดีโอ JAV ยอดนิยม | MISSAV-J", d: "ดูวิดีโอ JAV ที่ได้รับความนิยมและเป็นกระแสที่สุดตอนนี้บน MISSAV-J" },
    recent: { t: "วิดีโอ JAV ล่าสุด | MISSAV-J", d: "ดูวิดีโอ JAV ล่าสุดที่เพิ่งเปิดตัวบน MISSAV-J" },
    actors: { t: "นักแสดงหญิง JAV ทั้งหมด | MISSAV-J", d: "เรียกดูฐานข้อมูลนักแสดงหญิง JAV ที่สมบูรณ์ของเรา" },
    categories: { t: "หมวดหมู่ JAV ทั้งหมด | MISSAV-J", d: "สำรวจหมวดหมู่และแนวเพลง JAV ทั้งหมดบน MISSAV-J" },
    studios: { t: "สตูดิโอ JAV ทั้งหมด | MISSAV-J", d: "เรียกดูวิดีโอจากสตูดิโอ JAV ชั้นนำบน MISSAV-J" },
    search: { t: "ผลการค้นหา | MISSAV-J", d: "ผลการค้นหาสำหรับวิดีโอ JAV พรีเมียมบน MISSAV-J" },
    history: { t: "ประวัติการเข้าชม | MISSAV-J", d: "วิดีโอ JAV ที่คุณเพิ่งดูล่าสุดบน MISSAV-J" },
    watch_later: { t: "ดูภายหลัง | MISSAV-J", d: "วิดีโอ JAV ที่คุณบันทึกไว้เพื่อดูภายหลังบน MISSAV-J" },
    default: { t: "MISSAV-J | สตรีมมิ่ง JAV พรีเมียม", d: "ดูการสตรีม JAV พรีเมียมที่ดีที่สุดบน MISSAV-J" }
  },
  de: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams an. Entdecken Sie die neuesten Veröffentlichungen, Trendvideos und Top-Schauspielerinnen." },
    actor: { t: "%s | MISSAV-J", d: "Sehen Sie sich JAV-Videos mit %s in Premium-HD auf MISSAV-J an." },
    category: { t: "%s JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten und besten %s JAV-Videos online kostenlos an." },
    studio: { t: "%s JAV-Videos | MISSAV-J", d: "Entdecken Sie die offizielle Sammlung von %s JAV-Videos auf MISSAV-J." },
    trending: { t: "Trendige JAV-Videos | MISSAV-J", d: "Sehen Sie sich jetzt die beliebtesten und angesagtesten JAV-Videos auf MISSAV-J an." },
    recent: { t: "Neueste JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten JAV-Video-Veröffentlichungen auf MISSAV-J an." },
    actors: { t: "Alle JAV-Schauspielerinnen | MISSAV-J", d: "Durchsuchen Sie unsere komplette Datenbank von JAV-Schauspielerinnen." },
    categories: { t: "Alle JAV-Kategorien | MISSAV-J", d: "Entdecken Sie alle JAV-Kategorien und Genres auf MISSAV-J." },
    studios: { t: "Alle JAV-Studios | MISSAV-J", d: "Durchsuchen Sie Videos von den besten JAV-Studios auf MISSAV-J." },
    search: { t: "Suchergebnisse | MISSAV-J", d: "Suchergebnisse für Premium-JAV-Videos auf MISSAV-J." },
    history: { t: "Verlauf | MISSAV-J", d: "Ihre kürzlich angesehenen JAV-Videos auf MISSAV-J." },
    watch_later: { t: "Später ansehen | MISSAV-J", d: "Ihre gespeicherten JAV-Videos auf MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams auf MISSAV-J an." }
  },
  fr: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium. Découvrez les dernières sorties, les vidéos tendance et les meilleures actrices." },
    actor: { t: "%s | MISSAV-J", d: "Regardez des vidéos JAV avec %s en HD premium sur MISSAV-J." },
    category: { t: "Vidéos JAV %s | MISSAV-J", d: "Regardez les dernières et les meilleures vidéos JAV %s en ligne gratuitement." },
    studio: { t: "Vidéos JAV %s | MISSAV-J", d: "Découvrez la collection officielle de vidéos JAV %s sur MISSAV-J." },
    trending: { t: "Vidéos JAV tendance | MISSAV-J", d: "Regardez les vidéos JAV les plus populaires en ce moment sur MISSAV-J." },
    recent: { t: "Dernières vidéos JAV | MISSAV-J", d: "Regardez les dernières sorties de vidéos JAV sur MISSAV-J." },
    actors: { t: "Toutes les actrices JAV | MISSAV-J", d: "Parcourez notre base de données complète d'actrices JAV." },
    categories: { t: "Toutes les catégories JAV | MISSAV-J", d: "Découvrez toutes les catégories et genres JAV sur MISSAV-J." },
    studios: { t: "Tous les studios JAV | MISSAV-J", d: "Parcourez les vidéos des meilleurs studios JAV sur MISSAV-J." },
    search: { t: "Résultats de recherche | MISSAV-J", d: "Résultats de recherche pour les vidéos JAV premium sur MISSAV-J." },
    history: { t: "Historique | MISSAV-J", d: "Vos vidéos JAV récemment regardées sur MISSAV-J." },
    watch_later: { t: "À regarder plus tard | MISSAV-J", d: "Vos vidéos JAV enregistrées sur MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium sur MISSAV-J." }
  },
  vi: {
    home: { t: "MISSAV-J | Truyền phát JAV Cao cấp", d: "Xem truyền phát JAV cao cấp tốt nhất. Khám phá các bản phát hành mới nhất, video thịnh hành và các nữ diễn viên hàng đầu." },
    actor: { t: "%s | MISSAV-J", d: "Xem video JAV có sự tham gia của %s với chất lượng HD cao cấp trên MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Xem video JAV %s mới nhất và tốt nhất trực tuyến miễn phí." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Khám phá bộ sưu tập chính thức của các video JAV %s trên MISSAV-J." },
    trending: { t: "Video JAV thịnh hành | MISSAV-J", d: "Xem các video JAV phổ biến và thịnh hành nhất ngay bây giờ trên MISSAV-J." },
    recent: { t: "Video JAV mới nhất | MISSAV-J", d: "Xem các bản phát hành video JAV mới nhất trên MISSAV-J." },
    actors: { t: "Tất cả Nữ diễn viên JAV | MISSAV-J", d: "Duyệt qua cơ sở dữ liệu hoàn chỉnh của chúng tôi về các nữ diễn viên JAV." },
    categories: { t: "Tất cả Danh mục JAV | MISSAV-J", d: "Khám phá tất cả các danh mục và thể loại JAV trên MISSAV-J." },
    studios: { t: "Tất cả Studio JAV | MISSAV-J", d: "Duyệt video từ các studio JAV hàng đầu trên MISSAV-J." },
    search: { t: "Kết quả Tìm kiếm | MISSAV-J", d: "Kết quả tìm kiếm cho các video JAV cao cấp trên MISSAV-J." },
    history: { t: "Lịch sử xem | MISSAV-J", d: "Các video JAV bạn đã xem gần đây trên MISSAV-J." },
    watch_later: { t: "Xem sau | MISSAV-J", d: "Các video JAV bạn đã lưu để xem sau trên MISSAV-J." },
    default: { t: "MISSAV-J | Truyền phát JAV Cao cấp", d: "Xem truyền phát JAV cao cấp tốt nhất trên MISSAV-J." }
  },
  fil: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming. Tuklasin ang mga pinakabagong release, trending videos, at top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Panoorin ang mga JAV video na pinagbibidahan ni %s sa premium HD sa MISSAV-J." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Panoorin ang pinakabago at pinakamahusay na %s JAV videos online nang libre." },
    studio: { t: "%s JAV Videos | MISSAV-J", d: "Galugarin ang opisyal na koleksyon ng mga %s JAV videos sa MISSAV-J." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Panoorin ang pinakasikat at trending na JAV videos ngayon sa MISSAV-J." },
    recent: { t: "Pinakabagong JAV Videos | MISSAV-J", d: "Panoorin ang mga pinakabagong release ng JAV video sa MISSAV-J." },
    actors: { t: "Lahat ng JAV Actresses | MISSAV-J", d: "I-browse ang aming kumpletong database ng mga JAV actresses." },
    categories: { t: "Lahat ng JAV Categories | MISSAV-J", d: "Galugarin ang lahat ng JAV categories at genres sa MISSAV-J." },
    studios: { t: "Lahat ng JAV Studios | MISSAV-J", d: "Mag-browse ng mga video mula sa nangungunang JAV studios sa MISSAV-J." },
    search: { t: "Mga Resulta ng Paghahanap | MISSAV-J", d: "Mga resulta ng paghahanap para sa premium JAV videos sa MISSAV-J." },
    history: { t: "Kasaysayan ng Napanood | MISSAV-J", d: "Ang iyong mga kamakailang napanood na JAV videos sa MISSAV-J." },
    watch_later: { t: "Panoorin Mamaya | MISSAV-J", d: "Ang iyong mga na-save na JAV videos para panoorin mamaya sa MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming sa MISSAV-J." }
  },
  pt: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium. Explore os lançamentos mais recentes, vídeos em alta e as melhores atrizes." },
    actor: { t: "%s | MISSAV-J", d: "Assista a vídeos JAV com %s em HD premium no MISSAV-J." },
    category: { t: "Vídeos JAV %s | MISSAV-J", d: "Assista aos melhores e mais recentes vídeos JAV %s online gratuitamente." },
    studio: { t: "Vídeos JAV %s | MISSAV-J", d: "Explore a coleção oficial de vídeos JAV %s no MISSAV-J." },
    trending: { t: "Vídeos JAV em alta | MISSAV-J", d: "Assista aos vídeos JAV mais populares e em alta no momento no MISSAV-J." },
    recent: { t: "Vídeos JAV mais recentes | MISSAV-J", d: "Assista aos lançamentos de vídeos JAV mais recentes no MISSAV-J." },
    actors: { t: "Todas as atrizes JAV | MISSAV-J", d: "Navegue pelo nosso banco de dados completo de atrizes JAV." },
    categories: { t: "Todas as categorias JAV | MISSAV-J", d: "Explore todas as categorias e gêneros JAV no MISSAV-J." },
    studios: { t: "Todos os estúdios JAV | MISSAV-J", d: "Navegue por vídeos dos principais estúdios JAV no MISSAV-J." },
    search: { t: "Resultados da pesquisa | MISSAV-J", d: "Resultados da pesquisa por vídeos JAV premium no MISSAV-J." },
    history: { t: "Histórico | MISSAV-J", d: "Seus vídeos JAV assistidos recentemente no MISSAV-J." },
    watch_later: { t: "Assistir mais tarde | MISSAV-J", d: "Seus vídeos JAV salvos para assistir mais tarde no MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium no MISSAV-J." }
  }
};


function formatDuration(durationStr) {
  if (!durationStr || durationStr === '00:00:00') return null;
  const parts = durationStr.split(':').map(Number);
  if (parts.length !== 3) return null;
  const [h, m, s] = parts;
  if (h === 0 && m === 0 && s === 0) return null;
  let iso = 'PT';
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0) iso += `${s}S`;
  return iso === 'PT' ? null : iso;
}

/**
 * Fetch metadata video langsung dari API eksternal (tanpa loopback).
 * Hanya mengambil data dasar yang dibutuhkan untuk OG tags.
 */
async function fetchPostMetadata(id, origin) {
  const apiUrl = `${TARGET_BASE}/posts/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': 'https://www.missav-j.com',
        'Referer': 'https://www.missav-j.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[OG Fetch Error]', err);
    return null;
  }
}

/**
 * Ambil terjemahan judul dari Supabase (lazy, hanya bahasa yang diminta).
 */
async function getTranslatedTitle(id, lang, supabaseUrl, supabaseKey) {
  if (!lang || lang === 'en' || !supabaseUrl || !supabaseKey) return null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && data[0].translations && data[0].translations[lang]) {
      return data[0].translations[lang];
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('[OG Supabase Error]', e);
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Truncate a RAW (un-escaped) string to at most `max` characters, appending an
// ellipsis when clipped. Operate on the raw name and escape AFTER, so we never
// slice through an HTML entity. Fixes Ahrefs "Title too long" / "Meta
// description too long" on programmatic actor pages whose names are very long.
function truncateChars(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + '\u2026';
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Handle sitemap.xml rewrite to static sitemap_index.xml
  if (pathname === '/sitemap.xml') {
    const newRequest = new Request(new URL('/sitemaps/sitemap_index.xml', request.url), request);
    return env.ASSETS.fetch(newRequest);
  }
  // Check cache for GET requests on Watch and Listing Pages only
  const isGet = request.method === 'GET';
  const watchRegex = /^\/(?:([a-zA-Z\-]+)\/)?watch(?:\/([^\/]+))?$/;
  const listRegex = /^\/(?:([a-zA-Z\-]+)\/)?(actor|category|studio|trending|recent|actors|categories|studios|popular-actors|watch-later|history|search)$/;
  const langRegex = /^\/([a-zA-Z\-]+)\/?$/;
  
  const isWatch = pathname.match(watchRegex);
  const isList = pathname.match(listRegex);
  const isLangRoot = pathname.match(langRegex);
  const isCacheableRoute = isGet && (isWatch || isList || isLangRoot);

  let cache = null;
  if (isCacheableRoute) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (e) {
      console.error('[Cache SSR Match Error]', e);
    }
  }
  // 2. Check if this is a Watch page that needs Open Graph tag injection
  const watchMatch = isWatch;

  if (watchMatch) {
    const lang = watchMatch[1] || 'en';
    const slug = watchMatch[2] || '';
    const isLangValid = VALID_LANGS.includes(lang);

    if (isLangValid || (!watchMatch[1] && lang === 'en')) {
      let id = null;
      if (slug) {
        const match = slug.match(/.*-(\d+)$/);
        if (match) {
          id = match[1];
        } else if (slug.match(/^\d+$/)) {
          id = slug;
        }
      }

      const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
      if (!indexResponse.ok) {
        return new Response('Internal Server Error: Failed to fetch index.html', { status: 500 });
      }
      let htmlContent = await indexResponse.text();

      // Stamp <html lang> to match the route's language for crawlers. index.html
      // ships a static lang="id" default; without this the JS-only fix in app.js
      // never reaches non-JS crawlers -> "Hreflang and HTML lang mismatch".
      const watchHtmlLang = hreflangCode(isLangValid ? lang : 'en');
      htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${watchHtmlLang}"`);

      if (id) {
        try {
          // OPTIMIZED: Fetch langsung ke server.apijav.com (tanpa loopback)
          const activeLang = isLangValid ? lang : 'en';
          const post = await fetchPostMetadata(id, url.origin);

          if (post && post.title) {
            let title = post.title;

            // Ambil terjemahan judul dari Supabase jika bukan bahasa Inggris
            if (activeLang !== 'en') {
              const translated = await getTranslatedTitle(
                id, activeLang,
                env.SUPABASE_URL, env.SUPABASE_KEY
              );
              if (translated) title = translated;
            }

            const code = post.code || '';
            const fullTitle = code ? `[${code}] ${title} - MISSAV-J` : `${title} - MISSAV-J`;
            const descFn = DESC_TEMPLATES[activeLang] || DESC_TEMPLATES['en'];
            const description = descFn(code, title);

            let imageUrl = post.thumbnail || '/assets/images/logo.webp';
            
            // Bypass API image proxy for Googlebot to prevent 403 Forbidden on thumbnails
            if (imageUrl.includes('apijav.php?url=')) {
              try {
                const urlObj = new URL(imageUrl);
                const actualUrl = urlObj.searchParams.get('url');
                if (actualUrl) imageUrl = actualUrl;
              } catch (e) {}
            }

            if (imageUrl && imageUrl.startsWith('//')) {
              imageUrl = `https:${imageUrl}`;
            } else if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              imageUrl = `${url.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            const pageUrl = `${url.origin}${url.pathname}${url.search}`;

            htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
            htmlContent = htmlContent.replace(
              /<meta name="description" id="meta-description" content="[^"]*"/i,
              `<meta name="description" id="meta-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
              `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:url" id="og-url" content="[^"]*"/i,
              `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:title" id="og-title" content="[^"]*"/i,
              `<meta property="og:title" id="og-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:description" id="og-description" content="[^"]*"/i,
              `<meta property="og:description" id="og-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:image" id="og-image" content="[^"]*"/i,
              `<meta property="og:image" id="og-image" content="${escapeHtml(imageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
              `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
              `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:image" id="twitter-image" content="[^"]*"/i,
              `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(imageUrl)}"`
            );
            
            const hreflangBlock = generateHreflangTags(url.origin, url.pathname, url.search);
            htmlContent = htmlContent.replace(/<\/head>/i, `  ${hreflangBlock}\n</head>`);

            if (htmlContent.includes('"@type": "WebSite"')) {
              const cleanEmbedUrl = post.embed_url ? post.embed_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&') : `https://server.apijav.com/embed/${id}`;
              const isoDuration = formatDuration(post.duration);
              const actorsList = (post.actors || []).map(a => ({
                "@type": "Person",
                "name": typeof a === 'string' ? a : (a.name || a)
              }));
              const genreList = (post.categories || []).map(c => typeof c === 'string' ? c : (c.name || c));

              let uploadDate = new Date().toISOString();
              if (post.date) {
                const parsedDate = new Date(post.date);
                if (!isNaN(parsedDate.getTime())) {
                  uploadDate = parsedDate.toISOString();
                }
              }

              const videoSchema = {
                "@type": "VideoObject",
                "name": title,
                "description": description,
                "thumbnailUrl": imageUrl,
                "uploadDate": uploadDate,
                "embedUrl": cleanEmbedUrl,
                "publisher": {
                  "@type": "Organization",
                  "name": "MISSAV-J",
                  "url": "https://www.missav-j.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.missav-j.com/assets/images/logo.webp"
                  }
                },
                "inLanguage": "ja"
              };

              if (isoDuration) videoSchema.duration = isoDuration;
              if (post.views) {
                videoSchema.interactionStatistic = {
                  "@type": "InteractionCounter",
                  "interactionType": { "@type": "WatchAction" },
                  "userInteractionCount": parseInt(post.views) || 0
                };
              }
              if (actorsList.length > 0) videoSchema.actor = actorsList;
              if (genreList.length > 0) videoSchema.genre = genreList;
              if (post.studio) {
                videoSchema.productionCompany = {
                  "@type": "Organization",
                  "name": typeof post.studio === 'string' ? post.studio : (post.studio.name || post.studio)
                };
              }

              // BreadcrumbList schema
              const breadcrumbSchema = {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.missav-j.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item": pageUrl
                  }
                ]
              };

              const structuredData = {
                "@context": "https://schema.org",
                "@graph": [videoSchema, breadcrumbSchema]
              };
              htmlContent = htmlContent.replace(
                /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
                `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
              );

              // Inject iframe into raw HTML for first-wave crawler indexing
              const seoFallbackContent = `
        <div class="seo-fallback" style="display: none;">
          <h1>${escapeHtml(fullTitle)}</h1>
          <p>${escapeHtml(description)}</p>
          <iframe src="${escapeHtml(cleanEmbedUrl)}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>
        </div>
              `;
              htmlContent = htmlContent.replace(/<div class="seo-fallback" style="display: none;">[\s\S]*?<\/div>/i, seoFallbackContent);
            }
          }
        } catch (err) {
          console.error('[Watch OG Error]', err);
        }
      }

      const watchResponse = new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, max-age=300'
        }
      });

      if (cache && isCacheableRoute) {
        context.waitUntil(cache.put(request, watchResponse.clone()));
      }

      return watchResponse;
    }
  } else {
    // 3. Programmatic SEO for Listing Pages (Actor, Category, Studio, Trending, etc)
    const listMatch = isList || isLangRoot;

    if (listMatch) {
      const lang = listMatch[1] || 'en';
      const type = isList ? listMatch[2] : 'home';
      const isLangValid = VALID_LANGS.includes(lang);

      if (isLangValid || (!listMatch[1] && lang === 'en')) {
        const activeLang = isLangValid ? lang : 'en';
        const nameParam = url.searchParams.get('name') || '';
        
        const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
        if (!indexResponse.ok) {
          return new Response('Internal Server Error: Failed to fetch index.html', { status: 500 });
        }
        let htmlContent = await indexResponse.text();

        // Stamp <html lang> to match the route's language for crawlers (see note
        // in the watch branch above) -> fixes "Hreflang and HTML lang mismatch".
        const listHtmlLang = hreflangCode(activeLang);
        htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${listHtmlLang}"`);

        let pageTitle = 'MISSAV-J';
        let pageDesc = 'MISSAV-J Streaming';
        let schemaType = 'CollectionPage';
        
        // Resolve actual route type from URL pattern (popular-actors falls back to actors, empty type is home)
        const typeKey = (type === 'popular-actors') ? 'actors' : (type === 'watch-later') ? 'watch_later' : (type || 'home');
        const langDict = SEO_I18N[activeLang] || SEO_I18N['en'];
        const pageTemplate = langDict[typeKey] || SEO_I18N['en'][typeKey] || langDict['default'] || SEO_I18N['en']['default'];
        
        const safeName = nameParam ? escapeHtml(nameParam) : '';
        const titleName = (type === 'actor') ? escapeHtml(truncateChars(nameParam, 49)) : safeName;
        const descName = (type === 'actor') ? escapeHtml(truncateChars(nameParam, 65)) : safeName;
        
        pageTitle = pageTemplate.t.replace(/%s/g, titleName);
        pageDesc = pageTemplate.d.replace(/%s/g, descName);
        
        if (type === 'actor' && nameParam) {
          schemaType = 'ProfilePage';
        } else if (type === 'search') {
          schemaType = 'SearchResultsPage';
        }

        const pageUrl = `${url.origin}${url.pathname}${url.search}`;
        
        htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, `<title>${pageTitle}</title>`);
        htmlContent = htmlContent.replace(
          /<meta name="description" id="meta-description" content="[^"]*"/i,
          `<meta name="description" id="meta-description" content="${pageDesc}"`
        );
        htmlContent = htmlContent.replace(
          /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
          `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:url" id="og-url" content="[^"]*"/i,
          `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:title" id="og-title" content="[^"]*"/i,
          `<meta property="og:title" id="og-title" content="${pageTitle}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:description" id="og-description" content="[^"]*"/i,
          `<meta property="og:description" id="og-description" content="${pageDesc}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
          `<meta name="twitter:title" id="twitter-title" content="${pageTitle}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
          `<meta name="twitter:description" id="twitter-description" content="${pageDesc}"`
        );
        
        const hreflangBlock = generateHreflangTags(url.origin, url.pathname, url.search);
        htmlContent = htmlContent.replace(/<\/head>/i, `  ${hreflangBlock}\n</head>`);

        // JSON-LD ItemList / ProfilePage / CollectionPage / SearchResultsPage
        let schemaJson = {};
        if (schemaType === 'ProfilePage' && nameParam) {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": nameParam,
              "url": pageUrl
            }
          };
        } else if (schemaType === 'SearchResultsPage') {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": pageTitle,
            "description": pageDesc,
            "url": pageUrl
          };
        } else {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": pageDesc,
            "url": pageUrl
          };
        }
        
        // BreadcrumbList for listing
        const breadcrumbSchema = {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.missav-j.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": (nameParam ? safeName : type.charAt(0).toUpperCase() + type.slice(1)),
              "item": pageUrl
            }
          ]
        };
        
        const structuredData = {
          "@context": "https://schema.org",
          "@graph": [schemaJson, breadcrumbSchema]
        };
        
        htmlContent = htmlContent.replace(
          /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
          `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
        );
        
        // On the /actors directory hub, inject a real crawlable <a> list of every
        // actor into the server-side fallback. Actor links are otherwise built only
        // by client JS, so non-JS crawlers never see an internal link into any
        // /actor?name=... page -> 1,744 indexable "Orphan page" errors. This gives
        // every actor page one incoming internal link from an indexable hub.
        let actorLinksHtml = '';
        if (type === 'actors') {
          try {
            const actorsRes = await env.ASSETS.fetch(new URL('/api/actors.json', request.url));
            if (actorsRes.ok) {
              const actorNames = await actorsRes.json();
              if (Array.isArray(actorNames)) {
                // Names in actors.json are already HTML-encoded (e.g. '&amp;') and
                // contain no raw <, >, or " -> insert display text verbatim (escaping
                // would double-encode). href uses encodeURIComponent, matching the
                // exact encoding used in sitemaps/sitemap_actors_*.xml.
                const items = actorNames
                  .filter(n => typeof n === 'string' && n.trim() !== '')
                  .map(n => `<li><a href="/${activeLang}/actor?name=${encodeURIComponent(n)}">${n}</a></li>`)
                  .join('');
                actorLinksHtml = `<nav aria-label="All actors"><ul>${items}</ul></nav>`;
              }
            }
          } catch (err) {
            console.error('[Actor Directory Error]', err);
          }
        }

        // Inject fallback h1 text (+ crawlable actor directory on /actors)
        const seoFallbackContent = `
          <div class="seo-fallback" style="display: none;">
            <h1>${pageTitle}</h1>
            <p>${pageDesc}</p>
            ${actorLinksHtml}
          </div>
        `;
        // Function replacer: actor names may contain `$`, which is special in a
        // string replacement ($&, $1, ...). A function value is inserted verbatim.
        htmlContent = htmlContent.replace(/<div class="seo-fallback" style="display: none;">[\s\S]*?<\/div>/i, () => seoFallbackContent);

        const listResponse = new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'CDN-Cache-Control': 'public, max-age=300'
          }
        });

        if (cache && isCacheableRoute) {
          context.waitUntil(cache.put(request, listResponse.clone()));
        }

        return listResponse;
      }
    }
  }

  // 4. Fallback SPA routing
  const res = await env.ASSETS.fetch(request);

  if (res.status === 404) {
    const ext = pathname.split('.').pop();
    const hasExtension = pathname.includes('.') && ext.length < 5;

    if (!pathname.startsWith('/api') && !hasExtension) {
      const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
      return new Response(indexResponse.body, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'CDN-Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }

  return res;
}
