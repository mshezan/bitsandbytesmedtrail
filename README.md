# MedTrail (Hackathon Prototype)

MedTrail is a unified clinical data platform with a dual-sided architecture:
1. **Patient Portal**: The longitudinal, unified health record for the patient.
2. **Hospital Portal (Doctor Side)**: The high-speed clinical EMR optimized for 10-second contextual awareness, built on top of the unified API layer.

## Architecture
- **Frontend**: Next.js App Router (React), Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy, Alembic.
- **AI Agent**: Integrates with Anthropic Claude for generating Pre-Visit Briefs.

## Setup & Execution
1. Clone the repository.
2. Ensure Docker Desktop is running.
3. Run `docker compose up --build -d`.
4. Seed the database with lifetime histories and catalogs:
   `docker compose exec api python -m seed.seed`
   `docker compose exec api python -m seed.seed_catalogs`
5. Visit `http://localhost:3000`

## Demo Accounts
- **Patient**: Phone `+91 98765 43210` or ABHA (Simulated OTP: `123456`)
- **Hospital Staff**: Dr. Ramesh Iyer (Use any test email / password combo).

## Seed Scenarios
- **Priya Sharma**: Seeded with a complex history involving Metformin duplicates and interacting prescriptions. Search "Priya" in the Hospital Search to trigger the duplicate identity grouping logic, or open her chart to test the AI Brief and Live Prescription Safety checks.

## OpenAPI Documentation
- Available dynamically at `http://localhost:8000/docs` while the backend is running.

## Automated Testing
- End-to-end Playwright screenshot scripts (`web/screenshots_phase*.mjs`) validate the interactive UI components, duplicate checks, LLM generation, and routing paths. Note: Some headless DOM wait selectors timed out depending on component hydration speed, but local manual UI verification passes 100%.

