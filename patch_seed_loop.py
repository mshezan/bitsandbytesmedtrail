with open("api/seed/seed.py", "r") as f:
    content = f.read()

import re

loop_code = """
        # Phase 7: Generate 35 more patients
        for i in range(35):
            pid = ensure_user_patient(
                db,
                phone=f"+9198000{i:04d}",
                name=f"Demo Patient {i}",
                email=f"demo{i}@medtrail.local",
                dob=date(1980 + (i % 20), (i % 12) + 1, (i % 28) + 1),
                sex="male" if i % 2 == 0 else "female",
                blood_group="O+",
                emergency="Emergency Contact",
                abha_number=f"91-0000-0000-{i:04d}",
                abha_address=f"demo{i}@abdm"
            )
            rec(pid.id, "condition", condition("Hypertension", "2020-01-01"), "Kaveri Multispeciality Hospital", "2020-01-01")
            rec(pid.id, "observation", observation("HbA1c", 6.5, "2023-01-01", "mg/dL"), "Metro Diagnostics", "2023-01-01")
"""

content = content.replace("db.commit()\\n        n = db.query(Record).count()", loop_code + "\\n        db.commit()\\n        n = db.query(Record).count()")

with open("api/seed/seed.py", "w") as f:
    f.write(content)
