import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://server.apijav.com/wp-json/myvideo/v1/posts?per_page=1'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, context=ctx, timeout=10)
    data = json.loads(res.read().decode('utf-8'))
    print(f"Length: {len(data)}")
    print(f"First item ID: {data[0].get('id') if len(data) > 0 else 'N/A'}")
except Exception as e:
    print(f"Error: {e}")
