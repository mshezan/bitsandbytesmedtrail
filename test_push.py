import hmac
import hashlib
import json
import urllib.request

secret = b"demo_hmac_secret"
payload = json.dumps({
    "mrn": "SUN-1234",
    "patient": {"name": "Priya Sharma", "phone": "+919876543210"},
    "data": {"test": "Glycosylated Hb", "value": "7.5"}
}).encode('utf-8')

signature = "sha256=" + hmac.new(secret, payload, hashlib.sha256).hexdigest()

req = urllib.request.Request("http://localhost:8000/ingest/push/mock-sunrise")
req.add_header("X-Hub-Signature", signature)
req.add_header("Content-Type", "application/json")

res = urllib.request.urlopen(req, data=payload)
print(res.read().decode())
