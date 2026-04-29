import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://api-inference.huggingface.co/models/alpha-ai/LLAMA3-3B-Medical-COT',
    data=json.dumps({'inputs': 'test'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    print(urllib.request.urlopen(req, context=ctx).read())
except Exception as e:
    if hasattr(e, 'read'):
        print(e.read())
    else:
        print(e)
