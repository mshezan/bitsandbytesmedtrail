with open("api/app/pipeline/engine.py", "r") as f:
    content = f.read()

content = content.replace("    def _is_duplicate\n", "    def _is_duplicate(self, patient_id, data):\n")

with open("api/app/pipeline/engine.py", "w") as f:
    f.write(content)
