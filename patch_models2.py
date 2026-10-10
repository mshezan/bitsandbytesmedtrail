import re
with open("api/app/models.py", "r") as f:
    content = f.read()

content = content.replace(
    'abha_address: Mapped[str | None] = mapped_column(String(128))',
    'abha_address: Mapped[str | None] = mapped_column(String(128))\n    insurance: Mapped[str | None] = mapped_column(String(128))'
)
with open("api/app/models.py", "w") as f:
    f.write(content)

with open("api/app/schemas.py", "r") as f:
    content2 = f.read()

content2 = content2.replace(
    'abha_address: str | None = None',
    'abha_address: str | None = None\n    insurance: str | None = None'
)
with open("api/app/schemas.py", "w") as f:
    f.write(content2)
