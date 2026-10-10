"""API integration checks against the seeded synthetic MedTrail database.

Run inside the API container after migrations and seed: python -m unittest discover -s tests.
"""

import json
import os
import unittest
import urllib.error
import urllib.request
import uuid


BASE = os.getenv("MEDTRAIL_TEST_BASE_URL", "http://127.0.0.1:8000")


def request(method, path, *, token=None, data=None, headers=None):
    request_headers = {"Content-Type": "application/json"}
    if token:
        request_headers["Authorization"] = f"Bearer {token}"
    if headers:
        request_headers.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(BASE + path, data=body, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()
            return response.status, json.loads(content) if content else None
    except urllib.error.HTTPError as error:
        content = error.read()
        try:
            parsed = json.loads(content) if content else None
        except json.JSONDecodeError:
            parsed = {"detail": content.decode(errors="replace")}
        return error.code, parsed


class DataOwnershipApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        status, result = request("POST", "/auth/otp/verify", data={"phone": "+919876543210", "code": "123456"})
        if status != 200:
            raise RuntimeError(f"patient demo login failed: {status}")
        cls.patient_token = result["access_token"]
        status, result = request("POST", "/auth/hospital/login", data={
            "hospital_id": "HOSP-KAV-001", "email": "ramesh.iyer@kaveri.local",
            "password": "password123", "otp": "123456",
        })
        if status != 200:
            raise RuntimeError(f"hospital demo login failed: {status}")
        cls.hospital_token = result["access_token"]
        status, result = request("POST", "/auth/hospital/login", data={
            "hospital_id": "HOSP-SUN-003", "email": "kavita.nair@sunrise.local",
            "password": "password123", "otp": "123456",
        })
        if status != 200:
            raise RuntimeError(f"second hospital demo login failed: {status}")
        cls.other_hospital_token = result["access_token"]
        _, rows = request("GET", "/records", token=cls.patient_token)
        cls.provider_record = next(r for r in rows if r["source_type"] == "seed" and
                                   r["verified"] and "Kaveri Multispeciality Hospital" in r["source_name"] and
                                   r["type"] == "condition" and r["fhir"].get("code", {}).get("text"))

    def test_patient_cannot_patch_or_delete_provider_record(self):
        record_id = self.provider_record["id"]
        status, body = request("PATCH", f"/records/{record_id}", token=self.patient_token,
                               data={"fhir": {"resourceType": "Condition", "code": {"text": "changed"}}})
        self.assertEqual(status, 403, body)
        status, body = request("DELETE", f"/records/{record_id}", token=self.patient_token)
        self.assertEqual(status, 403, body)

    def test_patient_can_update_emergency_contact(self):
        status, profile = request("GET", "/me", token=self.patient_token)
        self.assertEqual(status, 200)
        current = profile["patient"]["emergency_contact"]
        status, body = request("PATCH", "/auth/me", token=self.patient_token, data={"emergency": current})
        self.assertEqual(status, 200, body)
        status, profile = request("GET", "/me", token=self.patient_token)
        self.assertEqual(profile["patient"]["emergency_contact"], current)

    def test_only_source_organization_can_amend(self):
        status, body = request("POST", f"/hospital/records/{self.provider_record['id']}/amend",
            token=self.other_hospital_token, data={"fhir": self.provider_record["fhir"],
                "reason": "Should be rejected", "status": "amended"})
        self.assertEqual(status, 403, body)

    def test_self_reported_and_privacy_requests_are_patient_owned(self):
        status, created = request("POST", "/self-reported", token=self.patient_token,
            data={"record_type":"symptom","name":"Temporary test symptom","details":"automated test"})
        self.assertEqual(status, 201, created)
        item_id = created["id"]
        status, _ = request("PATCH", f"/self-reported/{item_id}", token=self.patient_token,
            data={"name":"Updated test symptom","details":"edited by patient","recorded_date":"2026-10-10"})
        self.assertEqual(status, 200)
        status, rows = request("GET", "/self-reported", token=self.patient_token)
        self.assertTrue(any(row["id"] == item_id and row["status"] == "Self-reported, not verified" for row in rows))
        status, privacy = request("POST", "/privacy/requests", token=self.patient_token,
            data={"request_type":"restriction","reason":"Automated synthetic test request"})
        self.assertEqual(status, 201, privacy)
        status, rows = request("GET", "/privacy/requests", token=self.patient_token)
        self.assertTrue(any(row["id"] == privacy["id"] for row in rows))
        status, _ = request("DELETE", f"/self-reported/{item_id}", token=self.patient_token)
        self.assertEqual(status, 200)

    def test_correction_is_in_source_inbox_and_acceptance_creates_versions(self):
        record = self.provider_record
        original = record["fhir"]["code"]["text"]
        status, created = request("POST", "/correction-requests", token=self.patient_token, data={
            "record_id": record["id"], "field_name": "fhir.code.text",
            "believed_correct": original, "reason": f"Automated synthetic integration check {uuid.uuid4()}",
        })
        self.assertEqual(status, 201, created)
        status, inbox = request("GET", "/hospital/inbox/corrections", token=self.hospital_token)
        self.assertEqual(status, 200)
        self.assertTrue(any(row["id"] == created["id"] for row in inbox))
        status, result = request("POST", f"/hospital/inbox/corrections/{created['id']}/review",
            token=self.hospital_token, data={"action": "accepted", "reason": "Verified against synthetic source"})
        self.assertEqual(status, 200, result)
        status, history = request("GET", f"/records/{record['id']}/history", token=self.patient_token)
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(history), 2)
        self.assertTrue(all(row.get("changed_by") and row.get("organization") for row in history))
        status, notices = request("GET", "/notifications", token=self.patient_token)
        self.assertEqual(status, 200)
        self.assertTrue(any("Correction request accepted" == row["title"] for row in notices))

    def test_upload_rejects_connected_hospital_source(self):
        boundary = "ownership-check-boundary"
        payload = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"source_name\"\r\n\r\n"
                   "Kaveri Multispeciality Hospital\r\n"
                   f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"x.pdf\"\r\n"
                   "Content-Type: application/pdf\r\n\r\n%PDF-1.4 demo\r\n"
                   f"--{boundary}--\r\n").encode()
        req = urllib.request.Request(BASE + "/uploads", data=payload,
            headers={"Authorization": f"Bearer {self.patient_token}",
                     "Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                status = response.status
                body = json.loads(response.read())
        except urllib.error.HTTPError as error:
            status = error.code
            body = json.loads(error.read())
        self.assertEqual(status, 403, body)
        self.assertIn("connected to MedTrail", body.get("detail", ""))

    def test_confirmed_external_upload_is_unverified_until_clinician_review(self):
        _, profile = request("GET", "/me", token=self.patient_token)
        patient_id = profile["patient"]["id"]
        _, records = request("GET", "/records?source=upload&verified=false", token=self.patient_token)
        upload = next((row for row in records if row["patient_confirmed"]), None)
        self.assertIsNotNone(upload, "seeded confirmed external upload should exist")
        status, _ = request("POST", "/consents", token=self.patient_token, data={
            "organization_code": "HOSP-KAV-001",
            "record_types": ["condition", "medication", "allergy", "observation", "encounter", "report"],
            "expires_in_hours": 24,
        })
        self.assertEqual(status, 200)
        status, _ = request("POST", f"/hospital/patient/{patient_id}/access?purpose=Upload%20verification",
                            token=self.hospital_token)
        self.assertEqual(status, 200)
        status, result = request("POST", f"/hospital/patient/{patient_id}/records/{upload['id']}/verify-upload",
                                 token=self.hospital_token)
        self.assertEqual(status, 200, result)
        status, body = request("PATCH", f"/records/{upload['id']}", token=self.patient_token,
                               data={"fhir": upload["fhir"]})
        self.assertEqual(status, 403, body)


if __name__ == "__main__":
    unittest.main()
