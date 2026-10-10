import os

replacements = {
    "Lisinopril": "Amlodipine",
    "Losartan": "Telmisartan",
    "Amoxicillin": "Azithromycin",
    "Metformin": "Glycomet",
    "Atorvastatin": "Atorva"
}

for root, dirs, files in os.walk("web/app"):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            for k, v in replacements.items():
                content = content.replace(k, v)
            with open(filepath, "w") as f:
                f.write(content)
