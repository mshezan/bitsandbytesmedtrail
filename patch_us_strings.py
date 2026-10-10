import os
import glob

replacements = {
    "UCSF Health": "Kaveri Multispeciality",
    "UCSF Lab": "Metro Diagnostics",
    "UCSF": "Kaveri Hospital",
    "Quest Diagnostics": "Dr. Lal PathLabs",
    "Quest": "Lal PathLabs",
    "CVS Pharmacy": "MedPlus Pharmacy",
    "CVS": "MedPlus",
    "Valley Hospital ER": "Apollo Hospitals ER",
    "Valley Hospital": "Apollo Hospitals",
    "Dr. Chen": "Dr. Sharma",
    "City Clinic": "Sanjeevani Clinic",
    "SSN": "ABHA",
    "Social Security": "ABHA Number"
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
