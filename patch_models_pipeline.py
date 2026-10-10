import sys

with open("api/app/models.py", "r") as f:
    content = f.read()

new_models = """
class IntegrationQueue(Base):
    __tablename__ = "integration_queues"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    queue_type: Mapped[str] = mapped_column(String) # 'dlq', 'mapping_review', 'identity_review'
    source_org_id: Mapped[str] = mapped_column(String)
    payload: Mapped[dict] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String, default="pending")
    reason: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

class PipelineLog(Base):
    __tablename__ = "pipeline_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[str] = mapped_column(String)
    org_id: Mapped[str] = mapped_column(String)
    stage: Mapped[str] = mapped_column(String) # FETCH, PARSE, MAP, VALIDATE, RESOLVE, STORE
    status: Mapped[str] = mapped_column(String) # success, error
    metrics: Mapped[dict] = mapped_column(JSONB)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
"""

if "class IntegrationQueue" not in content:
    content += new_models
    with open("api/app/models.py", "w") as f:
        f.write(content)
