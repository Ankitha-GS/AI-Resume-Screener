from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=_now)
    resumes = relationship("Resume", back_populates="job", cascade="all, delete-orphan")
    results = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(300), nullable=False)
    raw_text = Column(Text, nullable=False)
    candidate = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=_now)
    job = relationship("Job", back_populates="resumes")
    result = relationship("MatchResult", back_populates="resume", cascade="all, delete-orphan", uselist=False)


class MatchResult(Base):
    __tablename__ = "match_results"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    matching_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    experience_fit = Column(String(50))
    experience_note = Column(String(300))
    explanation = Column(Text)
    breakdown = Column(JSON, default=dict)
    job = relationship("Job", back_populates="results")
    resume = relationship("Resume", back_populates="result")
