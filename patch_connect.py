with open("web/app/connect/page.tsx", "r") as f:
    content = f.read()

content = content.replace("UCSF Health", "Kaveri Multispeciality Hospital")
content = content.replace("Quest Diagnostics", "Metro Diagnostics")
content = content.replace("CVS Pharmacy", "MedPlus Pharmacy")
content = content.replace("FHIR R4 Schema", "ABDM-aligned FHIR R4 Schema")
content = content.replace("Internal standardized FHIR payload", "ABDM-aligned simulated FHIR payload")

with open("web/app/connect/page.tsx", "w") as f:
    f.write(content)
