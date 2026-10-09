from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JobRequirements(BaseModel):
    required_skills: list[str]
    preferred_skills: list[str]
    min_years_experience: Optional[float]
    max_years_experience: Optional[float] = None
    seniority: Optional[str]
    summary: str


class CandidateInfo(BaseModel):
    name: str
    email: Optional[str]
    phone: Optional[str]
    current_title: Optional[str]
    skills: list[str]
    total_years_experience: float
    education: list[str]
    summary: str


class MatchEval(BaseModel):
    semantic_score: int = Field(ge=0, le=100)
    explanation: str
    
class RequirementEvaluation(BaseModel):
    requirement: str
    matched: bool
    evidence: str
    confidence: int = Field(ge=0, le=100)


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=30)


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    requirements: JobRequirements
    resume_count: int = 0
    created_at: datetime


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    candidate: CandidateInfo
    created_at: datetime


class UploadFailure(BaseModel):
    filename: str
    reason: str


class UploadResponse(BaseModel):
    uploaded: list[ResumeOut]
    failed: list[UploadFailure]


class MatchOut(BaseModel):
    resume_id: int
    filename: str
    candidate: CandidateInfo
    score: float
    matching_skills: list[str]
    missing_skills: list[str]
    experience_fit: str
    experience_note: str
    explanation: str
    breakdown: dict
