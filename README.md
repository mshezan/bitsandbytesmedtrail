# MedTrail

Patients with long-term conditions have records scattered across clinics, labs, and pharmacies. MedTrail collects these records into one unified timeline, flags risks using an insights engine, and lets the patient share exactly what they choose, with an expiry.

> **Note:** Simulated data only. No real hospital integration. Demo data, not medical advice. Never logs patient clinical data in server logs.

## Architecture

```
                 +-------------------+
                 |    MedTrail Web   |  <-- Next.js (App Router), Tailwind
                 |   (PWA UI/UX)     |
                 +--------+----------+
                          | (REST API / JSON)
                          v
                 +-------------------+
                 |   MedTrail API    |  <-- FastAPI (Python 3.11), SQLAlchemy
                 |   (Core Logic)    |
                 +---+----+------+---+
                     |    |      |
      (FHIR JSONB)   |    |      |  (S3 Object Storage)
             +-------v+  +v------+--+   
             |        |  |          |   +--------------------+
             | PostGIS|  |  MinIO   +---> LLM / OCR Extractor|
             |  DB    |  |          |   | (Claude / Tesseract|
             +--------+  +----------+   +--------------------+
```

## Setup & Run

The entire stack runs with one command:

```bash
docker compose up -d
```

This starts:
1. **API** (FastAPI) on port 8000
2. **Web** (Next.js) on port 3000
3. **Database** (PostgreSQL)
4. **Storage** (MinIO)

The `docker-compose.yml` automatically seeds the database with 5 dummy patients and configures the environment.

## 3-Minute Demo Script

1. **Visit http://localhost:3000**
   - Click "Sign In to MedTrail".
2. **Login as Patient B**
   - Phone: `5550102` (James, has asthma and a penicillin allergy)
   - OTP: `123456`
3. **Explore Patient Home**
   - View summary cards for Conditions, Active Meds, and Allergies.
   - Notice the **Insights** panel automatically flags a Critical Allergy Conflict (Penicillin) based on his active meds.
4. **View Timeline**
   - Click "View Timeline".
   - Search for specific terms, or filter by "Lab Results".
   - Click "View Trend" on an observation to see a Recharts line graph of historical values.
5. **Add & Sync Records**
   - Click "+ Add Records" on the Home page.
   - Click "Sync" under the Mock Legacy Clinic to pull in simulated FHIR data.
   - Observe the success alert.
6. **Upload & Extract (OCR/LLM)**
   - Upload any sample PDF or image.
   - The system parses it in the background using Claude/Tesseract.
   - You'll be redirected to the "Review Extracted Data" screen to approve/discard the parsed items before they hit your timeline.
7. **Share with Clinician**
   - Go to "Share" from the Home page.
   - Select exactly what you want to share (e.g. only Labs and Conditions), set a 1-hour expiry, and optional PIN.
   - Copy the generated URL and open it in an incognito window.
   - Enter the PIN if set, and observe the beautiful Read-Only Clinician Summary.
8. **Audit & Revoke**
   - Close the clinician window and go back to your app.
   - Click "View Access Log" to see that the clinician viewed your records.
   - Click "Revoke" on the active share. The link instantly dies.
9. **Emergency Card**
   - Click "Emergency Card" from the Home page to generate a permanent QR code containing critical ER info.
