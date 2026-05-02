from datetime import datetime, timedelta
import unittest
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from auth import get_current_user
from database import get_db
from routes import patient_progress_routes


class FakeScalarResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class FakeExecuteResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return FakeScalarResult(self._rows)


class FakeDB:
    def __init__(self):
        self.rows = []

    def add(self, obj):
        self.rows.append(obj)

    async def commit(self):
        return None

    async def refresh(self, obj):
        if not getattr(obj, "id", None):
            obj.id = str(uuid.uuid4())
        if not getattr(obj, "created_at", None):
            obj.created_at = datetime.utcnow()

    async def execute(self, query):
        data = list(self.rows)

        where_clauses = list(getattr(query, "_where_criteria", []))
        if where_clauses:
            clause = where_clauses[0]
            patient_id_value = getattr(getattr(clause, "right", None), "value", None)
            if patient_id_value:
                data = [row for row in data if row.patient_id == patient_id_value]

        data.sort(key=lambda r: r.created_at, reverse=True)
        return FakeExecuteResult(data)


def build_client():
    app = FastAPI()
    app.include_router(patient_progress_routes.router, prefix="/api/v1/patient_progress")

    fake_db = FakeDB()

    async def override_get_db():
        yield fake_db

    async def override_current_user():
        return {"id": "u1", "role": "asha"}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    return TestClient(app), fake_db


class PatientProgressRoutesTest(unittest.TestCase):
    def test_create_progress_success(self):
        client, _ = build_client()

        response = client.post(
            "/api/v1/patient_progress/",
            json={
                "patient_id": "9eaac688-c900-4f7c-8a24-1e61490f0cca",
                "status": "stable",
                "symptoms": ["fever"],
                "notes": "No change",
                "referred": False,
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["patient_id"], "9eaac688-c900-4f7c-8a24-1e61490f0cca")
        self.assertEqual(body["status"], "stable")
        self.assertEqual(body["symptoms"], ["fever"])
        self.assertIn("id", body)
        self.assertIn("created_at", body)

    def test_list_progress_by_patient_id(self):
        client, fake_db = build_client()

        older = type("Row", (), {})()
        older.id = str(uuid.uuid4())
        older.patient_id = "p1"
        older.status = "improving"
        older.symptoms = ["cough"]
        older.notes = None
        older.referred = False
        older.created_at = datetime.utcnow() - timedelta(days=1)

        newer = type("Row", (), {})()
        newer.id = str(uuid.uuid4())
        newer.patient_id = "p1"
        newer.status = "stable"
        newer.symptoms = ["fever"]
        newer.notes = "better"
        newer.referred = False
        newer.created_at = datetime.utcnow()

        other_patient = type("Row", (), {})()
        other_patient.id = str(uuid.uuid4())
        other_patient.patient_id = "p2"
        other_patient.status = "worsening"
        other_patient.symptoms = ["pain"]
        other_patient.notes = None
        other_patient.referred = True
        other_patient.created_at = datetime.utcnow() - timedelta(hours=1)

        fake_db.rows.extend([older, newer, other_patient])

        response = client.get("/api/v1/patient_progress/?patient_id=p1")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body), 2)
        self.assertEqual(body[0]["id"], newer.id)
        self.assertEqual(body[1]["id"], older.id)
        self.assertTrue(all(item["patient_id"] == "p1" for item in body))

    def test_create_progress_status_validation_failure(self):
        client, _ = build_client()

        response = client.post(
            "/api/v1/patient_progress/",
            json={
                "patient_id": "9eaac688-c900-4f7c-8a24-1e61490f0cca",
                "status": "critical",
                "symptoms": ["fever"],
            },
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
