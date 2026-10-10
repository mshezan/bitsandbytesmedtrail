with open("api/app/pipeline/engine.py", "r") as f:
    code = f.read()

code = code.replace(
    'rec = Record(\n            patient_id=patient_id,\n            type="UnifiedRecord",\n            data=data,\n            source_org=self.org_id,\n            source_id=source_mrn,\n            content_hash=content_hash,\n            verified=True\n        )',
    'rec = Record(\n            patient_id=patient_id,\n            type="report",\n            fhir=data,\n            source_name=self.org_id,\n            source_type="connector",\n            source_id=source_mrn,\n            content_hash=content_hash,\n            recorded_date=datetime.now(timezone.utc)\n        )'
)

with open("api/app/pipeline/engine.py", "w") as f:
    f.write(code)
