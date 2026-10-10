with open("web/app/home/page.tsx", "r") as f:
    content = f.read()

content = content.replace("Valley Hospital ER", "Apollo Hospitals ER")
content = content.replace("Lisinopril from UCSF and Losartan from City Clinic", "Amlodipine from Kaveri Hospital and Telmisartan from Sanjeevani Clinic")
content = content.replace("Quest Diagnostics", "Dr. Lal PathLabs")
content = content.replace("Amoxicillin prescribed by Dr. Chen", "Azithromycin prescribed by Dr. Gupta")

# Update Source Mock UI logic if any
content = content.replace("UCSF", "Kaveri Hospital")
content = content.replace("UCSF Health", "Kaveri Multispeciality")
content = content.replace("CVS Pharmacy", "MedPlus Pharmacy")
content = content.replace("CVS", "MedPlus")
content = content.replace("Quest Diagnostics", "Metro Diagnostics")
content = content.replace("QD", "Metro")

with open("web/app/home/page.tsx", "w") as f:
    f.write(content)
