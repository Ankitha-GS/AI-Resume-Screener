from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.routes.jobs import get_job_or_404
from app.config import settings
from app.database import get_db
from app.models.db_models import Resume
from app.models.schemas import ResumeOut, UploadFailure, UploadResponse
from app.services import gemini_service
from app.services.pdf_parser import PDFParseError, extract_text

router = APIRouter(prefix="/jobs/{job_id}/resumes", tags=["resumes"])


@router.post("", response_model=UploadResponse)
def upload_resumes(job_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    get_job_or_404(db, job_id)
    if len(files) > settings.MAX_FILES_PER_UPLOAD:
        raise HTTPException(400, f"Upload at most {settings.MAX_FILES_PER_UPLOAD} resumes at a time.")

    uploaded, failed = [], []
    limit = settings.MAX_UPLOAD_MB * 1024 * 1024
    for f in files:
        name = f.filename or "resume.pdf"
        if not name.lower().endswith(".pdf"):
            failed.append(UploadFailure(filename=name, reason="Only PDF files are supported."))
            continue
        data = f.file.read(limit + 1)
        if len(data) > limit:
            failed.append(UploadFailure(filename=name, reason=f"File is larger than {settings.MAX_UPLOAD_MB} MB."))
            continue
        try:
            text = extract_text(data)
        except PDFParseError as exc:
            failed.append(UploadFailure(filename=name, reason=str(exc)))
            continue
        cand = gemini_service.extract_candidate(text)
        resume = Resume(job_id=job_id, filename=name, raw_text=text, candidate=cand.model_dump())
        db.add(resume)
        db.commit()
        db.refresh(resume)
        uploaded.append(ResumeOut.model_validate(resume))
    return UploadResponse(uploaded=uploaded, failed=failed)


@router.get("", response_model=list[ResumeOut])
def list_resumes(job_id: int, db: Session = Depends(get_db)):
    get_job_or_404(db, job_id)
    return db.query(Resume).filter(Resume.job_id == job_id).order_by(Resume.created_at).all()


@router.delete("/{resume_id}", status_code=204)
def delete_resume(job_id: int, resume_id: int, db: Session = Depends(get_db)):
    r = db.query(Resume).filter(Resume.id == resume_id, Resume.job_id == job_id).first()
    if not r:
        raise HTTPException(404, "Resume not found")
    db.delete(r)
    db.commit()
