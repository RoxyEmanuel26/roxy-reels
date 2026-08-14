import urllib.request
import json

url = 'https://server.apijav.com/wp-json/myvideo/v1/posts?per_page=1'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=10)
    data = json.loads(res.read().decode('utf-8'))
    print(f"Thumbnail: {data[0].get('thumbnail')}")
except Exception as e:
    print(f"Error: {e}")
