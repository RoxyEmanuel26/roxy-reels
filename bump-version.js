const fs = require('fs');
const path = require('path');

// Ambil versi baru dari argumen terminal (contoh: node bump-version.js 2.0.2)
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Harap masukkan versi baru. Contoh: node bump-version.js 2.0.2');
  process.exit(1);
}

console.log(`🚀 Memperbarui seluruh versi cache menjadi: v${newVersion}...`);

const filesToUpdate = [
  'index.html',
  'sw.js',
  'assets/js/actors.js',
  'assets/js/ads.js',
  'assets/js/analytics.js',
  'assets/js/app.js',
  'assets/js/categories.js',
  'assets/js/feed.js',
  'assets/js/filter.js',
  'assets/js/i18n.js',
  'assets/js/player.js',
  'assets/js/popular_actors.js',
  'assets/js/recent.js',
  'assets/js/search.js',
  'assets/js/studios.js',
  'assets/js/trending.js'
];

let totalReplaced = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 1. Ganti semua parameter URL (misal: ?v=2.0.1 menjadi ?v=2.0.2)
    // Regex: mencari pola ?v=angka.angka.angka
    let newContent = content.replace(/\?v=\d+\.\d+\.\d+/g, `?v=${newVersion}`);
    
    // 2. Khusus untuk sw.js, ganti nama CACHE_NAME
    // Regex: mencari pola CACHE_NAME = 'missavj-cache-v...'
    if (filePath === 'sw.js') {
      newContent = newContent.replace(/CACHE_NAME\s*=\s*'missavj-cache-v\d+\.\d+\.\d+'/g, `CACHE_NAME = 'missavj-cache-v${newVersion}'`);
    }

    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✅ Diperbarui: ${filePath}`);
      totalReplaced++;
    } else {
      console.log(`➖ Tidak ada yang berubah di: ${filePath}`);
    }
  } else {
    console.warn(`⚠️ File tidak ditemukan: ${filePath}`);
  }
});

console.log(`🎉 Selesai! Berhasil memperbarui ${totalReplaced} file.`);
console.log(`Sekarang Anda bisa menjalankan: git add . && git commit -m "bump version to ${newVersion}" && git push`);
