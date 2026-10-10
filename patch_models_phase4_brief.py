with open("api/app/models.py", "r") as f:
    content = f.read()

new_table = """
class PreVisitBrief(Base):
    __tablename__ = "pre_visit_briefs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    content_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
"""

if "class PreVisitBrief" not in content:
    content += new_table
    with open("api/app/models.py", "w") as f:
        f.write(content)
