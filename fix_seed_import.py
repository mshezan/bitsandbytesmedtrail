with open("api/seed/seed.py", "r") as f:
    content = f.read()

content = content.replace("from app.models import Organization, Staff, (", "from app.models import Organization, Staff, \\")
content = content.replace("from app.models import Organization, Staff, \\", "from app.models import Organization, Staff\nfrom app.models import (")
with open("api/seed/seed.py", "w") as f:
    f.write(content)
