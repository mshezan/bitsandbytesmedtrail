import re
with open("api/app/models.py", "r") as f:
    content = f.read()

content = content.replace(
    'emergency_contact: Mapped[str | None] = mapped_column(String(200))',
    'emergency_contact: Mapped[str | None] = mapped_column(String(200))\n    abha_number: Mapped[str | None] = mapped_column(String(32))\n    abha_address: Mapped[str | None] = mapped_column(String(128))'
)
with open("api/app/models.py", "w") as f:
    f.write(content)
