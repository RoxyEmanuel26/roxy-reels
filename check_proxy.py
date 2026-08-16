import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://www.missav-j.com/api/posts?per_page=1'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, context=ctx, timeout=10)
    print(f"Status: {res.status}")
except Exception as e:
    if hasattr(e, 'read'):
        print(f"Error: {e} -> Body: {e.read().decode('utf-8')}")
    else:
        print(f"Error: {e}")
