# AI-Hire

AI-powered resume screening and candidate matching.
Create a job, upload PDF resumes, and get candidates ranked with a match score, matching and missing skills, experience fit, and a plain-language explanation.

## How the hybrid matching works

| Part | Weight | Source |
|------|--------|--------|
| Skill overlap | 55% | Deterministic: required skills count fully, preferred count half |
| Experience fit | 15% | Deterministic: candidate years vs. job minimum |
| Semantic fit | 30% | Gemini judges real experience and writes the explanation |

If Gemini is unavailable, the app falls back to keyword extraction and re-normalises the weights, so it still works offline.

## Run locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # add your GEMINI_API_KEY
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs. Run tests with `pytest`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173.

## Deploy

1. Push to GitHub.
2. **Database**: on Render, create a PostgreSQL instance and copy its *Internal Database URL*.
3. **Backend (Render Web Service)**, root directory `backend`:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Env: `GEMINI_API_KEY`, `DATABASE_URL`, `CORS_ORIGINS=https://your-app.vercel.app`
4. **Frontend (Vercel)**, root directory `frontend`, framework Vite:
   - Env: `VITE_API_URL=https://your-backend.onrender.com/api`

## Added beyond the original plan

- `database.py` and `db_models.py` (SQLAlchemy tables for jobs, resumes, results)
- Offline fallback when Gemini is unavailable or rate-limited
- Parallel AI calls when ranking, retries, per-file upload errors
- Delete jobs and resumes, re-rank, and an automated end-to-end test

## Next ideas
Authentication, OCR for scanned PDFs, DOCX support, Alembic migrations, CSV export of rankings.
