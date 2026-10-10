with open("api/app/routers/patient_router.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith("def get_insights("):
        skip = True
        new_lines.append(line)
        new_lines.append("    from app.insights import generate_insights\n")
        new_lines.append("    return generate_insights(patient.id, db)\n")
    elif skip and line.startswith("def "):
        skip = False
    
    if not skip:
        new_lines.append(line)

with open("api/app/routers/patient_router.py", "w") as f:
    f.writelines(new_lines)
