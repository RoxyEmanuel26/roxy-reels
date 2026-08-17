import urllib.request
import urllib.parse
import json
import re

print("=== 1. Testing SSR OG Tags & JSON-LD ===")
url = "http://127.0.0.1:8788/en/watch/waaa-642-lima-arai-11883"
req = urllib.request.Request(url, headers={'User-Agent': 'Twitterbot/1.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"Status: {response.status}")
        
        # Check OG and Twitter tags
        og_image = re.search(r'<meta property="og:image"[^>]*content="([^"]*)"', html)
        if og_image:
            print(f"og:image: {og_image.group(1)}")
            
        twitter_image = re.search(r'<meta name="twitter:image"[^>]*content="([^"]*)"', html)
        if twitter_image:
            print(f"twitter:image: {twitter_image.group(1)}")
            
        # Check JSON-LD
        if 'application/ld+json' in html:
            if 'thumbnailUrl' in html:
                match = re.search(r'"thumbnailUrl"\s*:\s*([^,]+)', html)
                print(f"JSON-LD thumbnailUrl snippet: {match.group(1) if match else 'Not matched'}")
            else:
                print("thumbnailUrl string NOT in HTML at all!")
        else:
            print("application/ld+json NOT in HTML at all!")
            
except Exception as e:
    print(f"SSR Request Failed: {e}")

print("\n=== 2. Testing Image Proxy ===")
proxy_url = "http://127.0.0.1:8788/api/image?url=" + urllib.parse.quote("https://pics.dmm.co.jp/digital/video/waaa642/waaa642pl.jpg")
req2 = urllib.request.Request(proxy_url, headers={'User-Agent': 'Twitterbot/1.0'})
try:
    with urllib.request.urlopen(req2) as response2:
        print(f"Status: {response2.status}")
        print(f"Content-Type: {response2.headers.get('Content-Type')}")
        size = len(response2.read())
        print(f"Image Size: {size} bytes")
except urllib.error.HTTPError as e:
    print(f"Proxy Request Failed with status: {e.code}")
    print(e.read().decode('utf-8', errors='ignore'))
except Exception as e:
    print(f"Proxy Request Failed: {e}")
