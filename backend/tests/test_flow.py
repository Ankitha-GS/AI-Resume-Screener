import fitz
from fastapi.testclient import TestClient

from app.main import app


def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_textbox(fitz.Rect(40, 40, 550, 800), text)
    return doc.tobytes()


def test_full_flow(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")  # force offline mode
    with TestClient(app) as c:
        job = c.post("/api/jobs", json={
            "title": "Backend Engineer",
            "description": "We need 3 years of Python, FastAPI, PostgreSQL and Docker experience for our team.",
        }).json()
        assert "python" in job["requirements"]["required_skills"]

        strong = make_pdf("Asha Rao\nasha@x.com\nBackend dev with 5 years experience. Python, FastAPI, PostgreSQL, Docker, Git.")
        weak = make_pdf("Ben Lee\nben@x.com\nFrontend dev with 1 years experience. React, CSS, HTML, JavaScript tools used daily.")
        r = c.post(f"/api/jobs/{job['id']}/resumes", files=[
            ("files", ("a.pdf", strong, "application/pdf")),
            ("files", ("b.pdf", weak, "application/pdf")),
            ("files", ("c.txt", b"nope", "text/plain")),
        ]).json()
        assert len(r["uploaded"]) == 2 and len(r["failed"]) == 1

        ranked = c.post(f"/api/jobs/{job['id']}/match").json()
        assert ranked[0]["filename"] == "a.pdf"
        assert ranked[0]["score"] > ranked[1]["score"]
