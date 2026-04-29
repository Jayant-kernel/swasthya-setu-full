import urllib.request
import json
import ssl

req = urllib.request.Request(
    'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
    data=json.dumps({'inputs': 'test'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    print(urllib.request.urlopen(req).read())
except Exception as e:
    if hasattr(e, 'read'):
        print("ERROR:", e.code, e.read())
    else:
        print(e)
