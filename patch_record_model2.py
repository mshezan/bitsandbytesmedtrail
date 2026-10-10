with open("api/app/models.py", "r") as f:
    content = f.read()

content = content.replace(
    'source_name: Mapped[str] = mapped_column(String(200), nullable=False)',
    'source_name: Mapped[str] = mapped_column(String(200), nullable=False)\n    content_hash: Mapped[str | None] = mapped_column(String(64))\n    source_id: Mapped[str | None] = mapped_column(String)'
)

with open("api/app/models.py", "w") as f:
    f.write(content)
