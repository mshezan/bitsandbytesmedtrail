with open("api/app/main.py", "r") as f:
    content = f.read()

content = content.replace(
    '"verified_records": db.query(func.count(Record.id)).filter(Record.verified.is_(True)).scalar()',
    '"verified_records": db.query(func.count(Record.id)).filter(Record.verified.is_(True)).scalar(),\n            "sources": db.query(Record.source_name).distinct().count(),\n            "insights_generated": 284 # mocked for demo'
)

with open("api/app/main.py", "w") as f:
    f.write(content)
