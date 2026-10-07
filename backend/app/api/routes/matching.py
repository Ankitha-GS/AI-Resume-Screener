from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.jobs import get_job_or_404
from app.database import get_db
from app.models.db_models import MatchResult, Resume
from app.models.schemas import CandidateInfo, JobRequirements, MatchOut
from app.services.matcher import match_candidate

router = APIRouter(prefix="/jobs/{job_id}", tags=["matching"])


def _out(r: MatchResult) -> MatchOut:
    return MatchOut(
        resume_id=r.resume_id, filename=r.resume.filename, candidate=CandidateInfo(**r.resume.candidate),
        score=r.score, matching_skills=r.matching_skills, missing_skills=r.missing_skills,
        experience_fit=r.experience_fit, experience_note=r.experience_note,
        explanation=r.explanation, breakdown=r.breakdown,
    )


def _ranked(db: Session, job_id: int) -> list[MatchOut]:
    rows = db.query(MatchResult).filter(MatchResult.job_id == job_id).order_by(MatchResult.score.desc()).all()
    return [_out(r) for r in rows]


@router.post("/match", response_model=list[MatchOut])
def run_matching(job_id: int, db: Session = Depends(get_db)):
    job = get_job_or_404(db, job_id)
    resumes = db.query(Resume).filter(Resume.job_id == job_id).all()
    if not resumes:
        raise HTTPException(400, "Upload at least one resume first.")

    req = JobRequirements(**(job.requirements or {}))
    # AI calls run in parallel threads; database writes stay on this thread.
    jobs_in = [(r.id, CandidateInfo(**r.candidate), r.raw_text) for r in resumes]
    with ThreadPoolExecutor(max_workers=4) as pool:
        outputs = list(pool.map(lambda x: (x[0], match_candidate(job.title, req, x[1], x[2])), jobs_in))

    db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
    for resume_id, res in outputs:
        db.add(MatchResult(job_id=job_id, resume_id=resume_id, **res))
    db.commit()
    return _ranked(db, job_id)


@router.get("/results", response_model=list[MatchOut])
def get_results(job_id: int, db: Session = Depends(get_db)):
    get_job_or_404(db, job_id)
    return _ranked(db, job_id)
