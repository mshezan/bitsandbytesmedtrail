import re
with open("api/app/schemas.py", "r") as f:
    content = f.read()

content = content.replace(
    'emergency_contact: str | None = None',
    'emergency_contact: str | None = None\n    abha_number: str | None = None\n    abha_address: str | None = None'
)
content = content.replace(
    'emergency: str | None = None',
    'emergency: str | None = None\n    abha_number: str | None = None\n    abha_address: str | None = None'
)
with open("api/app/schemas.py", "w") as f:
    f.write(content)
