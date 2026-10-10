import re

with open("api/seed/seed.py", "r") as f:
    content = f.read()

new_imports = """
from app.models import Organization, Staff
"""

content = content.replace("from app.models import", "from app.models import Organization, Staff,")

seed_orgs_staff = """
def seed_orgs_and_staff(db: Session) -> None:
    if db.query(Organization).count() > 0:
        return
        
    orgs = [
        Organization(id=uuid.uuid4(), name="Kaveri Multispeciality Hospital", type="hospital", city="Chennai", state="Tamil Nadu", registration_no="HOSP-KAV-001"),
        Organization(id=uuid.uuid4(), name="Metro Diagnostics", type="lab", city="Bengaluru", state="Karnataka", registration_no="LAB-MET-002"),
        Organization(id=uuid.uuid4(), name="Sunrise Heart Institute", type="hospital", city="Hyderabad", state="Telangana", registration_no="HOSP-SUN-003"),
        Organization(id=uuid.uuid4(), name="Sanjeevani Clinic", type="clinic", city="Pune", state="Maharashtra", registration_no="CLIN-SAN-004"),
        Organization(id=uuid.uuid4(), name="MedPlus Pharmacy", type="pharmacy", city="Mumbai", state="Maharashtra", registration_no="PHAR-MED-005")
    ]
    db.add_all(orgs)
    db.flush()
    
    # Create Staff users
    staff_users = [
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Ramesh Iyer", phone="+919876500001", email="ramesh.iyer@kaveri.local"),
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Kavita Nair", phone="+919876500002", email="kavita.nair@sunrise.local"),
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Harpreet Singh", phone="+919876500003", email="harpreet.singh@sanjeevani.local")
    ]
    db.add_all(staff_users)
    db.flush()
    
    # Link Staff to Orgs
    staff = [
        Staff(id=uuid.uuid4(), user_id=staff_users[0].id, org_id=orgs[0].id, role="doctor", designation="MD General Medicine", license_no="MCI-1001"),
        Staff(id=uuid.uuid4(), user_id=staff_users[1].id, org_id=orgs[2].id, role="doctor", designation="DM Cardiology", license_no="MCI-1002"),
        Staff(id=uuid.uuid4(), user_id=staff_users[2].id, org_id=orgs[3].id, role="doctor", designation="MBBS", license_no="MCI-1003")
    ]
    db.add_all(staff)
    db.commit()
"""

content = content.replace("def seed_rules", seed_orgs_staff + "\ndef seed_rules")

run_update = """    try:
        seed_orgs_and_staff(db)
        seed_rules(db)"""
content = content.replace("    try:\n        seed_rules(db)", run_update)

with open("api/seed/seed.py", "w") as f:
    f.write(content)

