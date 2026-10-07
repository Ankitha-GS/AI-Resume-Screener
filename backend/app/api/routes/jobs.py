from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import Job
from app.models.schemas import JobCreate, JobOut, JobRequirements
from app.services import gemini_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


def job_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id, title=job.title, description=job.description,
        requirements=JobRequirements(**(job.requirements or {})),
        resume_count=len(job.resumes), created_at=job.created_at,
    )


def get_job_or_404(db: Session, job_id: int) -> Job:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("", response_model=JobOut, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    req = gemini_service.analyze_job(payload.title, payload.description)
    job = Job(title=payload.title.strip(), description=payload.description.strip(), requirements=req.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_out(job)


@router.get("", response_model=list[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return [job_out(j) for j in db.query(Job).order_by(Job.created_at.desc()).all()]


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    return job_out(get_job_or_404(db, job_id))


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    db.delete(get_job_or_404(db, job_id))
    db.commit()
