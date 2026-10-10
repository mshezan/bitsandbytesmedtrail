with open("api/seed/seed.py", "r") as f:
    content = f.read()

content = content.replace("\\n        db.commit()\\n        n = db.query(Record).count()", "\n        db.commit()\n        n = db.query(Record).count()")

with open("api/seed/seed.py", "w") as f:
    f.write(content)
