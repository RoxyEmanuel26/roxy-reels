###############################################################################
#  MISSAV-J — Smart Sitemap Generator v2.0 (OPTIMIZED)
#  FULL CRAWL — Multi-Type Sitemaps (Pages, Actors, Categories, Studios, Videos)
#  Output: ./sitemaps/ (folder sitemaps di root proyek)
#  Fitur: Auto Save & Resume, Progress Tracking, Multi-Bahasa (13 bahasa)
#  Optimasi: StringBuilder untuk performa XML generation 100x lebih cepat
###############################################################################

$ErrorActionPreference = 'Stop'

# ═══════════════════════════════════════════════════════════════════════════════
# KONFIGURASI
# ═══════════════════════════════════════════════════════════════════════════════
$baseUrl       = 'https://www.missav-j.com'
$apiBaseUrl    = 'https://server.apijav.com/wp-json/myvideo/v1/posts'
$dateStr       = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+07:00"
$todayStr      = Get-Date -Format "yyyy-MM-dd"
$perPage       = 1000
$delaySeconds  = 0

# Deteksi lokasi root proyek secara otomatis
$projectRoot = $PSScriptRoot
if (Test-Path (Join-Path $PSScriptRoot "..\..\index.html")) {
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
} elseif (Test-Path (Join-Path $PSScriptRoot "index.html")) {
    $projectRoot = $PSScriptRoot
}

$sitemapsDir = Join-Path $projectRoot "sitemaps"

# Muat berkas .env untuk kredensial Supabase
$envFile = Join-Path $projectRoot ".env"
$supabaseUrl = ""
$supabaseKey = ""

if (Test-Path $envFile) {
    Get-Content $envFile | Foreach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $parts = $line.Split('=', 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            if ($key -eq 'SUPABASE_URL') { $supabaseUrl = $val.Trim('"', "'") }
            elseif ($key -eq 'SUPABASE_KEY') { $supabaseKey = $val.Trim('"', "'") }
        }
    }
}

# 13 Bahasa yang didukung
$LANGS = @('zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt')
$VIDEO_LANGS = @('en') # Hanya menghasilkan sitemap video bahasa Inggris (berisi alternate link ke semua bahasa)


# Halaman statis beserta SEO metadata
$STATIC_ROUTES = @(
    @{ path = '';               priority = '1.00'; changefreq = 'daily'  },
    @{ path = 'trending';       priority = '0.90'; changefreq = 'daily'  },
    @{ path = 'recent';         priority = '0.90'; changefreq = 'daily'  },
    @{ path = 'actors';         priority = '0.80'; changefreq = 'weekly' },
    @{ path = 'categories';     priority = '0.80'; changefreq = 'weekly' },
    @{ path = 'studios';        priority = '0.80'; changefreq = 'weekly' },
    @{ path = 'popular-actors'; priority = '0.70'; changefreq = 'weekly' }
)

# Studio populer
$STUDIOS = @(
    'S1 NO.1 STYLE', 'MOODYZ', 'PRESTIGE', 'Soft On Demand',
    'Idea Pocket', 'FALENO', 'MUTEKI', 'Fitch',
    'OPPAL', 'Kawaii*', 'KMP', 'Attackers', 'Premium', 'Other'
)

# ═══════════════════════════════════════════════════════════════════════════════
# HEADER BANNER
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "+---------------------------------------------------------+" -ForegroundColor Cyan
Write-Host "|   MISSAV-J Sitemap Generator v2.0 (OPTIMIZED)           |" -ForegroundColor Cyan
Write-Host "|   FULL CRAWL - StringBuilder + Auto Resume              |" -ForegroundColor Cyan
Write-Host "|   Website: $baseUrl                    |" -ForegroundColor Cyan
Write-Host "|   Waktu:   $todayStr                                |" -ForegroundColor Cyan
Write-Host "|   Root:    $projectRoot" -ForegroundColor Cyan
Write-Host "+---------------------------------------------------------+" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITAS (OPTIMIZED dengan StringBuilder)
# ═══════════════════════════════════════════════════════════════════════════════

# Escape karakter XML khusus
function EscXml([string]$text) {
    $result = $text
    $result = $result -creplace '&', '&amp;'
    $result = $result -creplace '<', '&lt;'
    $result = $result -creplace '>', '&gt;'
    $result = $result -creplace '"', '&quot;'
    $result = $result -creplace "'", '&apos;'
    return $result
}

# Encode path segment URL — hanya encode karakter non-ASCII ke persen-encoding
# Menjaga karakter ASCII yang aman: a-z A-Z 0-9 - _ . ~ /
# Contoh: "広瀬リオナ" -> "%E5%BA%83%E7%80%AC%E3%83%AA%E3%82%AA%E3%83%8A"
function Encode-UrlPath([string]$path) {
    if (-not $path) { return '' }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($path)
    $sb = [System.Text.StringBuilder]::new($bytes.Length * 2)
    foreach ($b in $bytes) {
        $c = [char]$b
        # Karakter ASCII yang aman di URL path: a-z A-Z 0-9 - _ . ~ / : @
        if (($b -ge 0x41 -and $b -le 0x5A) -or  # A-Z
            ($b -ge 0x61 -and $b -le 0x7A) -or  # a-z
            ($b -ge 0x30 -and $b -le 0x39) -or  # 0-9
            $b -eq 0x2D -or  # -
            $b -eq 0x5F -or  # _
            $b -eq 0x2E -or  # .
            $b -eq 0x7E -or  # ~
            $b -eq 0x2F -or  # /
            $b -eq 0x3A -or  # :
            $b -eq 0x40) {   # @
            [void]$sb.Append($c)
        } else {
            [void]$sb.Append(('%{0:X2}' -f $b))
        }
    }
    return $sb.ToString()
}

# Slugify teks ke URL-safe slug (Unicode-safe)
function Slugify([string]$text) {
    if (-not $text) { return '' }
    $slug = $text.ToLower().Trim()
    $slug = $slug -replace '[\s\-_]+', '-'
    $slug = $slug -replace '[^\p{L}\p{N}\-]', ''
    $slug = $slug -replace '-+', '-'
    $slug = $slug.Trim('-')
    if ($slug.Length -gt 100) { $slug = $slug.Substring(0, 100).TrimEnd('-') }
    return $slug
}

# Tambah alternate links ke StringBuilder (FAST)
function Add-Alternates {
    param(
        [System.Text.StringBuilder]$sb,
        [scriptblock]$makeUrl
    )
    foreach ($l in $LANGS) {
        $url = & $makeUrl $l
        $encodedUrl = Encode-UrlPath $url
        $escapedUrl = EscXml $encodedUrl
        [void]$sb.AppendLine("    <xhtml:link rel=`"alternate`" hreflang=`"$l`" href=`"$escapedUrl`" />")
    }
    $urlEn = & $makeUrl 'en'
    $encodedUrlEn = Encode-UrlPath $urlEn
    $escapedUrlEn = EscXml $encodedUrlEn
    [void]$sb.AppendLine("    <xhtml:link rel=`"alternate`" hreflang=`"x-default`" href=`"$escapedUrlEn`" />")
}

# Header XML urlset
function Get-UrlsetOpen {
    return '<?xml version="1.0" encoding="UTF-8"?>' + "`r`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "`r`n"
}

# Ambil data terjemahan batch dari database Supabase
function Get-BatchTranslationsFromDb {
    param(
        [int[]]$ids
    )
    if ($ids.Count -eq 0 -or -not $supabaseUrl -or -not $supabaseKey) {
        return @{}
    }
    
    $results = @{}
    $batchSize = 500
    for ($i = 0; $i -lt $ids.Count; $i += $batchSize) {
        $endIdx = [Math]::Min($i + $batchSize - 1, $ids.Count - 1)
        $chunk = $ids[$i..$endIdx]
        $idsStr = $chunk -join ','
        
        $url = "$supabaseUrl/rest/v1/translations?id=in.($idsStr)&select=id,translations"
        try {
            $res = Invoke-RestMethod -Uri $url -Method Get -Headers @{
                'apikey'        = $supabaseKey
                'Authorization' = "Bearer $supabaseKey"
            } -TimeoutSec 15
            
            if ($res) {
                foreach ($item in $res) {
                    $results[[string]$item.id] = $item.translations
                }
            }
        } catch {
            Write-Host "       [!] Gagal mengambil batch translasi dari Supabase: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    return $results
}

# Terjemahkan judul video ke bahasa target menggunakan Google Translate
function Translate-Title {
    param(
        [string]$title,
        [string]$lang
    )
    if ($lang -eq 'en') { return $title }
    
    $domains = @('translate.googleapis.com', 'translate.google.com', 'translate.google.co.id')
    foreach ($domain in $domains) {
        $encodedTitle = [uri]::EscapeDataString($title)
        $url = "https://$domain/translate_a/single?client=gtx&sl=auto&tl=$lang&dt=t&q=$encodedTitle"
        try {
            $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
            if ($response -and $response[0]) {
                $segments = @()
                foreach ($seg in $response[0]) {
                    if ($seg[0]) { $segments += $seg[0] }
                }
                $translated = $segments -join ""
                if ($translated) {
                    return $translated.Trim()
                }
            }
        } catch {
            # Abaikan error dan coba domain berikutnya
        }
    }
    return $title
}

# Simpan hasil terjemahan ke database Supabase
function Save-TranslationToDb {
    param(
        [int]$id,
        $translations
    )
    if (-not $supabaseUrl -or -not $supabaseKey) {
        return
    }
    
    $url = "$supabaseUrl/rest/v1/translations"
    
    # Supabase UPSERT dengan REST menggunakan header Prefer
    $body = @{
        id = $id
        translations = $translations
    } | ConvertTo-Json -Depth 10 -Compress

    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    
    try {
        $headers = @{
            'apikey'        = $supabaseKey
            'Authorization' = "Bearer $supabaseKey"
            'Prefer'        = 'resolution=merge-duplicates'
        }
        $res = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bodyBytes -TimeoutSec 10
    } catch {
        Write-Host "       [!] Gagal menyimpan translasi ke Supabase untuk ID $id : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# STATE MANAGEMENT (Auto Save & Resume)
# ═══════════════════════════════════════════════════════════════════════════════
$stateFile = Join-Path $PSScriptRoot "sitemap_state.json"
$state = @{
    completedLangPages = @()
    videoSitemapFiles  = @()
    grandTotalVideos   = 0
    grandTotalRequests = 0
}

if (Test-Path $stateFile) {
    Write-Host "[INFO] Ditemukan file state sebelumnya. Melanjutkan proses..." -ForegroundColor Yellow
    $savedState = Get-Content $stateFile -Raw | ConvertFrom-Json
    if ($savedState.completedLangPages) { $state.completedLangPages = @($savedState.completedLangPages) }
    if ($savedState.videoSitemapFiles) { $state.videoSitemapFiles = @($savedState.videoSitemapFiles) }
    if ($savedState.grandTotalVideos) { $state.grandTotalVideos = $savedState.grandTotalVideos }
    if ($savedState.grandTotalRequests) { $state.grandTotalRequests = $savedState.grandTotalRequests }
}

function Save-State {
    $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
}

# ═══════════════════════════════════════════════════════════════════════════════
# PERSIAPAN FOLDER OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════
if (-not (Test-Path $sitemapsDir)) {
    New-Item -ItemType Directory -Path $sitemapsDir -Force | Out-Null
    Write-Host "[INIT] Folder sitemaps dibuat: $sitemapsDir" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════════
# MUAT DATA LOKAL
# ═══════════════════════════════════════════════════════════════════════════════
$actorsJsonPath     = Join-Path $projectRoot "api\actors.json"
$categoriesJsonPath = Join-Path $projectRoot "api\categories.json"

Write-Host "[DATA] Memuat data aktor dari: actors.json" -ForegroundColor Gray
$ACTORS = @()
if (Test-Path $actorsJsonPath) {
    $ACTORS = Get-Content $actorsJsonPath -Raw | ConvertFrom-Json
    Write-Host "       -> $($ACTORS.Count) aktor dimuat" -ForegroundColor Green
} else {
    Write-Host "       -> [!] File actors.json tidak ditemukan!" -ForegroundColor Red
}

Write-Host "[DATA] Memuat data kategori dari: categories.json" -ForegroundColor Gray
$CATEGORIES = @()
if (Test-Path $categoriesJsonPath) {
    $CATEGORIES = Get-Content $categoriesJsonPath -Raw | ConvertFrom-Json
    Write-Host "       -> $($CATEGORIES.Count) kategori dimuat" -ForegroundColor Green
} else {
    Write-Host "       -> [!] File categories.json tidak ditemukan!" -ForegroundColor Red
}
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: SITEMAP HALAMAN STATIS
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[STEP 1/5] Membuat sitemap_pages.xml..." -ForegroundColor Cyan

$sb = [System.Text.StringBuilder]::new(50000)
[void]$sb.Append((Get-UrlsetOpen))

foreach ($route in $STATIC_ROUTES) {
    $routePath = $route.path
    $makeUrlFunc = {
        param($lang)
        if ($routePath) { return "$baseUrl/$lang/$routePath" }
        else { return "$baseUrl/$lang" }
    }

    $canonicalUrl = Encode-UrlPath (& $makeUrlFunc 'en')
    [void]$sb.AppendLine("  <url>")
    [void]$sb.AppendLine("    <loc>$(EscXml $canonicalUrl)</loc>")
    [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
    [void]$sb.AppendLine("    <changefreq>$($route.changefreq)</changefreq>")
    [void]$sb.AppendLine("    <priority>$($route.priority)</priority>")
    Add-Alternates -sb $sb -makeUrl $makeUrlFunc
    [void]$sb.AppendLine("  </url>")
}
[void]$sb.Append("</urlset>")

$pagesFile = Join-Path $sitemapsDir "sitemap_pages.xml"
[System.IO.File]::WriteAllText($pagesFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "       -> sitemap_pages.xml ($($STATIC_ROUTES.Count) halaman x 13 bahasa)" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: SITEMAP AKTOR
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[STEP 2/5] Membuat sitemap_actors..." -ForegroundColor Cyan

$actorsPerFile  = 2450
$actorFileNames = @()

if ($ACTORS.Count -gt 0) {
    $totalChunks = [Math]::Ceiling($ACTORS.Count / $actorsPerFile)
    
    for ($chunk = 0; $chunk -lt $totalChunks; $chunk++) {
        $startIdx = $chunk * $actorsPerFile
        $endIdx   = [Math]::Min($startIdx + $actorsPerFile - 1, $ACTORS.Count - 1)
        $batch    = $ACTORS[$startIdx..$endIdx]
        
        $fileName = "sitemap_actors_$($chunk + 1).xml"
        $actorFileNames += $fileName
        
        $sb = [System.Text.StringBuilder]::new(2000000)
        [void]$sb.Append((Get-UrlsetOpen))
        
        foreach ($actorName in $batch) {
            if (-not $actorName) { continue }
            $encoded = [uri]::EscapeDataString($actorName)
            $makeUrlFunc = {
                param($lang)
                return "$baseUrl/$lang/actor?name=$encoded"
            }
            
            $canonicalUrl = Encode-UrlPath (& $makeUrlFunc 'en')
            [void]$sb.AppendLine("  <url>")
            [void]$sb.AppendLine("    <loc>$(EscXml $canonicalUrl)</loc>")
            [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
            [void]$sb.AppendLine("    <changefreq>weekly</changefreq>")
            [void]$sb.AppendLine("    <priority>0.60</priority>")
            Add-Alternates -sb $sb -makeUrl $makeUrlFunc
            [void]$sb.AppendLine("  </url>")
        }
        [void]$sb.Append("</urlset>")
        
        $filePath = Join-Path $sitemapsDir $fileName
        [System.IO.File]::WriteAllText($filePath, $sb.ToString(), [System.Text.Encoding]::UTF8)
        Write-Host "       -> $fileName ($($batch.Count) aktor)" -ForegroundColor Green
    }
} else {
    Write-Host "       -> Dilewati (tidak ada data aktor)" -ForegroundColor Yellow
}
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: SITEMAP KATEGORI
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[STEP 3/5] Membuat sitemap_categories.xml..." -ForegroundColor Cyan

if ($CATEGORIES.Count -gt 0) {
    $sb = [System.Text.StringBuilder]::new(500000)
    [void]$sb.Append((Get-UrlsetOpen))
    
    foreach ($catName in $CATEGORIES) {
        if (-not $catName) { continue }
        $encoded = [uri]::EscapeDataString($catName)
        $makeUrlFunc = {
            param($lang)
            return "$baseUrl/$lang/category?name=$encoded"
        }
        
        $canonicalUrl = Encode-UrlPath (& $makeUrlFunc 'en')
        [void]$sb.AppendLine("  <url>")
        [void]$sb.AppendLine("    <loc>$(EscXml $canonicalUrl)</loc>")
        [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
        [void]$sb.AppendLine("    <changefreq>weekly</changefreq>")
        [void]$sb.AppendLine("    <priority>0.60</priority>")
        Add-Alternates -sb $sb -makeUrl $makeUrlFunc
        [void]$sb.AppendLine("  </url>")
    }
    [void]$sb.Append("</urlset>")
    
    $catFile = Join-Path $sitemapsDir "sitemap_categories.xml"
    [System.IO.File]::WriteAllText($catFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "       -> sitemap_categories.xml ($($CATEGORIES.Count) kategori)" -ForegroundColor Green
} else {
    Write-Host "       -> Dilewati (tidak ada data kategori)" -ForegroundColor Yellow
}
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: SITEMAP STUDIO
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[STEP 4/5] Membuat sitemap_studios.xml..." -ForegroundColor Cyan

$sb = [System.Text.StringBuilder]::new(50000)
[void]$sb.Append((Get-UrlsetOpen))

foreach ($studioName in $STUDIOS) {
    $encoded = [uri]::EscapeDataString($studioName)
    $makeUrlFunc = {
        param($lang)
        return "$baseUrl/$lang/studio?name=$encoded"
    }
    
    $canonicalUrl = Encode-UrlPath (& $makeUrlFunc 'en')
    [void]$sb.AppendLine("  <url>")
    [void]$sb.AppendLine("    <loc>$(EscXml $canonicalUrl)</loc>")
    [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
    [void]$sb.AppendLine("    <changefreq>weekly</changefreq>")
    [void]$sb.AppendLine("    <priority>0.50</priority>")
    Add-Alternates -sb $sb -makeUrl $makeUrlFunc
    [void]$sb.AppendLine("  </url>")
}
[void]$sb.Append("</urlset>")

$studioFile = Join-Path $sitemapsDir "sitemap_studios.xml"
[System.IO.File]::WriteAllText($studioFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "       -> sitemap_studios.xml ($($STUDIOS.Count) studio)" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: SITEMAP VIDEO PER BAHASA (OPTIMIZED — StringBuilder + direct write)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[STEP 5/5] Membuat sitemap video (FULL CRAWL)..." -ForegroundColor Cyan

# 5a. Ambil total halaman dari API
Write-Host "       [API] Mengambil total post dari backend..." -ForegroundColor Gray
$totalPosts = 113259
$totalPages = 114

try {
    $apiUrlHead = $apiBaseUrl + "?per_page=1"
    $headResponse = Invoke-WebRequest -Uri $apiUrlHead -Method Get -Headers @{
        'X-Client-Site' = 'https://www.missav-j.com'
    } -TimeoutSec 15 -UseBasicParsing

    $totalHeader = $headResponse.Headers['X-WP-Total']
    if ($totalHeader) {
        $totalPosts = [int]$totalHeader
        $totalPages = [Math]::Ceiling($totalPosts / $perPage)
        Write-Host "       [API] Total dari header: $totalPosts posts" -ForegroundColor Green
    }
} catch {
    Write-Host "       [!] Gagal ambil total dari API, gunakan fallback: $totalPosts" -ForegroundColor Yellow
}

Write-Host "       Total: $totalPosts video | $totalPages halaman | $($LANGS.Count) bahasa (Alternates)" -ForegroundColor White
Write-Host "       Estimasi: $($totalPages * $VIDEO_LANGS.Count) file sitemap video" -ForegroundColor White
Write-Host ""

$globalTimer = [System.Diagnostics.Stopwatch]::StartNew()

# 5b. Crawl setiap halaman API lalu generate sitemap per bahasa
for ($page = 1; $page -le $totalPages; $page++) {
    # Cek apakah SEMUA bahasa sitemap video untuk halaman ini sudah selesai
    $allLangsDone = $true
    foreach ($lang in $VIDEO_LANGS) {
        $key = "$lang-$page"
        if ($state.completedLangPages -notcontains $key) {
            $allLangsDone = $false
            break
        }
    }
    if ($allLangsDone) {
        if ($page % 20 -eq 0) {
            Write-Host "       [SKIP] Halaman $page - sudah selesai" -ForegroundColor DarkGray
        }
        continue
    }

    $pageTimer = [System.Diagnostics.Stopwatch]::StartNew()

    # Fetch data post dari API
    $posts = $null
    try {
        $apiUrlPage = $apiBaseUrl + "?per_page=$perPage" + "&page=$page"
        $posts = Invoke-RestMethod -Uri $apiUrlPage -Method Get -Headers @{
            'X-Client-Site' = 'https://www.missav-j.com'
        } -TimeoutSec 120
        $state.grandTotalRequests++
    } catch {
        Write-Host "       [!] Halaman $page - Error API: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 3
        continue
    }

    if (-not $posts -or $posts.Count -eq 0) {
        Write-Host "       [INFO] Halaman $page - tidak ada data, berhenti." -ForegroundColor Yellow
        break
    }

    $fetchedCount = $posts.Count
    $state.grandTotalVideos += $fetchedCount

    # Pre-compute slugs secara lokal per bahasa menggunakan terjemahan dari database
    $postData = @()
    
    # Ambil data terjemahan batch dari database Supabase untuk postingan halaman ini
    $ids = @()
    foreach ($post in $posts) {
        $ids += [int]$post.id
    }
    $translationsMap = Get-BatchTranslationsFromDb -ids $ids

    foreach ($post in $posts) {
        $id      = $post.id
        $code    = if ($post.code) { $post.code } else { '' }
        $title   = if ($post.title) { $post.title } else { '' }
        $dateVal = if ($post.date -and $post.date.Length -ge 10) { $post.date.Substring(0, 10) } else { $todayStr }

        $changefreq = 'monthly'
        $priority = '0.50'
        try {
            $postDateObj = [datetime]::ParseExact($dateVal, 'yyyy-MM-dd', $null)
            $ageDays = ([datetime]::Now - $postDateObj).TotalDays
            if ($ageDays -lt 7) {
                $changefreq = 'daily'
                $priority = '0.90'
            } elseif ($ageDays -lt 30) {
                $changefreq = 'weekly'
                $priority = '0.70'
            }
        } catch { }

        $cleanCode = Slugify $code
        $translations = $translationsMap[[string]$id]
        if (-not $translations) {
            $translations = @{}
        }

        $translationsHash = @{}
        if ($translations -is [System.Management.Automation.PSCustomObject]) {
            foreach ($prop in $translations.PSObject.Properties) {
                $translationsHash[$prop.Name] = $prop.Value
            }
        } elseif ($translations -is [System.Collections.IDictionary]) {
            $translationsHash = $translations
        }

        $hasNewTranslation = $false
        foreach ($altLang in $LANGS) {
            if ($altLang -eq 'en') { continue }
            if (-not $translationsHash.ContainsKey($altLang) -or -not $translationsHash[$altLang]) {
                Write-Host "       [TRANSLATE] ID $id ($altLang)..." -ForegroundColor Yellow
                $translated = Translate-Title -title $title -lang $altLang
                $translationsHash[$altLang] = $translated
                $hasNewTranslation = $true
            }
        }

        if ($hasNewTranslation) {
            Save-TranslationToDb -id ([int]$id) -translations $translationsHash
        }
        $translations = $translationsHash

        # Bangun localized slugs untuk seluruh 13 bahasa pendukung
        $localizedSlugs = @{}
        foreach ($altLang in $LANGS) {
            $tTitle = $title
            if ($translations.ContainsKey($altLang) -and $translations[$altLang]) {
                $tTitle = $translations[$altLang]
            }
            $slug = Slugify $tTitle
            $slug = if ($cleanCode) { "$cleanCode-$slug" } else { $slug }
            if ($slug.Length -gt 100) { $slug = $slug.Substring(0, 100).TrimEnd('-') }
            if (-not $slug) { $slug = 'video' }
            
            $localizedSlugs[$altLang] = $slug
        }

        $postData += @{
            id             = $id
            dateVal        = $dateVal
            changefreq     = $changefreq
            priority       = $priority
            localizedSlugs = $localizedSlugs
        }
    }

    # Generate file sitemap per bahasa untuk batch post ini
    foreach ($lang in $VIDEO_LANGS) {
        $key = "$lang-$page"
        if ($state.completedLangPages -contains $key) { continue }

        # Gunakan StringBuilder — JAUH lebih cepat dari string concatenation
        $sb = [System.Text.StringBuilder]::new(500000)
        [void]$sb.Append((Get-UrlsetOpen))

        foreach ($pd in $postData) {
            $enSlug = $pd.localizedSlugs['en']
            $locUrl = Encode-UrlPath "$baseUrl/$lang/watch/$($pd.localizedSlugs[$lang])-$($pd.id)"

            [void]$sb.AppendLine("  <url>")
            [void]$sb.AppendLine("    <loc>$(EscXml $locUrl)</loc>")
            [void]$sb.AppendLine("    <lastmod>$($pd.dateVal)</lastmod>")
            [void]$sb.AppendLine("    <changefreq>$($pd.changefreq)</changefreq>")
            [void]$sb.AppendLine("    <priority>$($pd.priority)</priority>")

            # Alternate links untuk semua bahasa (dengan slug terlokalisasi unik masing-masing bahasa)
            foreach ($altLang in $LANGS) {
                $altUrl = Encode-UrlPath "$baseUrl/$altLang/watch/$($pd.localizedSlugs[$altLang])-$($pd.id)"
                [void]$sb.AppendLine("    <xhtml:link rel=`"alternate`" hreflang=`"$altLang`" href=`"$(EscXml $altUrl)`" />")
            }
            # x-default -> English
            $enUrl = Encode-UrlPath "$baseUrl/en/watch/${enSlug}-$($pd.id)"
            [void]$sb.AppendLine("    <xhtml:link rel=`"alternate`" hreflang=`"x-default`" href=`"$(EscXml $enUrl)`" />")

            [void]$sb.AppendLine("  </url>")
        }

        [void]$sb.Append("</urlset>")

        $fileName = "sitemap_videos_${page}.xml"
        $filePath = Join-Path $sitemapsDir $fileName
        [System.IO.File]::WriteAllText($filePath, $sb.ToString(), [System.Text.Encoding]::UTF8)

        # Track state
        $state.completedLangPages += $key
        if ($state.videoSitemapFiles -notcontains $fileName) {
            $state.videoSitemapFiles += $fileName
        }
    }

    $pageTimer.Stop()
    $elapsed = $globalTimer.Elapsed
    $progress = [Math]::Round(($page / $totalPages) * 100, 1)
    $eta = if ($page -gt 0) {
        $avgPerPage = $elapsed.TotalSeconds / $page
        $remaining = ($totalPages - $page) * $avgPerPage
        [TimeSpan]::FromSeconds($remaining).ToString("hh\:mm\:ss")
    } else { "..." }

    Write-Host "       [PAGE $page/$totalPages] ${fetchedCount}v x $($VIDEO_LANGS.Count)lang | $($pageTimer.Elapsed.TotalSeconds.ToString('F1'))s | ${progress}% | ETA: $eta" -ForegroundColor White

    # Save state setiap 5 halaman
    if ($page % 5 -eq 0) {
        Save-State
    }

    Start-Sleep -Seconds $delaySeconds
}

# Save state terakhir
Save-State
$globalTimer.Stop()
Write-Host ""
Write-Host "       Crawl selesai dalam $($globalTimer.Elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# GENERATE SITEMAP INDEX (sitemap_index.xml)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "[INDEX] Membuat sitemap_index.xml (Master Index)..." -ForegroundColor Cyan

$sb = [System.Text.StringBuilder]::new(100000)
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

# 1. Halaman statis
[void]$sb.AppendLine("  <sitemap>")
[void]$sb.AppendLine("    <loc>$baseUrl/sitemaps/sitemap_pages.xml</loc>")
[void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
[void]$sb.AppendLine("  </sitemap>")

# 2. Aktor
foreach ($af in $actorFileNames) {
    [void]$sb.AppendLine("  <sitemap>")
    [void]$sb.AppendLine("    <loc>$baseUrl/sitemaps/$af</loc>")
    [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
    [void]$sb.AppendLine("  </sitemap>")
}

# 3. Kategori
if ($CATEGORIES.Count -gt 0) {
    [void]$sb.AppendLine("  <sitemap>")
    [void]$sb.AppendLine("    <loc>$baseUrl/sitemaps/sitemap_categories.xml</loc>")
    [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
    [void]$sb.AppendLine("  </sitemap>")
}

# 4. Studio
[void]$sb.AppendLine("  <sitemap>")
[void]$sb.AppendLine("    <loc>$baseUrl/sitemaps/sitemap_studios.xml</loc>")
[void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
[void]$sb.AppendLine("  </sitemap>")

# 5. Video sitemaps (sorted)
$sortedVideoFiles = $state.videoSitemapFiles | Sort-Object
foreach ($vf in $sortedVideoFiles) {
    [void]$sb.AppendLine("  <sitemap>")
    [void]$sb.AppendLine("    <loc>$baseUrl/sitemaps/$vf</loc>")
    [void]$sb.AppendLine("    <lastmod>$todayStr</lastmod>")
    [void]$sb.AppendLine("  </sitemap>")
}

[void]$sb.Append("</sitemapindex>")

$indexFile = Join-Path $sitemapsDir "sitemap_index.xml"
[System.IO.File]::WriteAllText($indexFile, $sb.ToString(), [System.Text.Encoding]::UTF8)

$totalSitemaps = 1 + $actorFileNames.Count + 1 + 1 + $state.videoSitemapFiles.Count
Write-Host "       -> sitemap_index.xml ($totalSitemaps sub-sitemaps)" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# RINGKASAN AKHIR
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "+---------------------------------------------------------+" -ForegroundColor Green
Write-Host "|             SEMUA SELESAI!                               |" -ForegroundColor Green
Write-Host "+---------------------------------------------------------+" -ForegroundColor Green
Write-Host "|  Folder output      : $sitemapsDir" -ForegroundColor White
Write-Host "|  sitemap_index.xml  : $totalSitemaps sub-sitemaps" -ForegroundColor White
Write-Host "|  sitemap_pages      : $($STATIC_ROUTES.Count) halaman statis" -ForegroundColor White
Write-Host "|  sitemap_actors     : $($ACTORS.Count) aktor ($($actorFileNames.Count) file)" -ForegroundColor White
Write-Host "|  sitemap_categories : $($CATEGORIES.Count) kategori" -ForegroundColor White
Write-Host "|  sitemap_studios    : $($STUDIOS.Count) studio" -ForegroundColor White
Write-Host "|  sitemap_videos     : $($state.videoSitemapFiles.Count) file ($($state.grandTotalVideos) video)" -ForegroundColor White
Write-Host "|  API requests       : $($state.grandTotalRequests)" -ForegroundColor White
Write-Host "+---------------------------------------------------------+" -ForegroundColor Green
Write-Host ""

# Hapus state file karena sudah selesai
if (Test-Path $stateFile) {
    Remove-Item $stateFile -Force
    Write-Host "[CLEANUP] File state dihapus (semua selesai)." -ForegroundColor DarkGray
}
Write-Host ""
