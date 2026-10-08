import json
import logging
import re
import time

from pydantic import BaseModel

from app.config import settings
from app.models.schemas import CandidateInfo, JobRequirements, MatchEval
from app.utils.skills import find_skills

log = logging.getLogger("ai_hire.gemini")

_client = None
MAX_CHARS = 15000


def is_available() -> bool:
    return bool(settings.GEMINI_API_KEY)


def _get_client():
    global _client
    if _client is None:
        from google import genai
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

def _generate(prompt: str, schema: type[BaseModel], retries: int = 2) -> BaseModel:
    from google.genai import types

    # Convert Pydantic model to JSON schema
    response_schema = schema.model_json_schema()

    # Gemini does not support "default" in response schemas.
    # Remove it recursively from the entire schema.
    def remove_defaults(obj):
        if isinstance(obj, dict):
            obj.pop("default", None)
            for value in obj.values():
                remove_defaults(value)
        elif isinstance(obj, list):
            for item in obj:
                remove_defaults(item)

    remove_defaults(response_schema)

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=response_schema,
        temperature=0.1,
    )

    last = None

    for attempt in range(retries + 1):
        try:
            resp = _get_client().models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config,
            )

            raw = re.sub(
                r"^```(?:json)?|```$",
                "",
                (resp.text or "").strip(),
                flags=re.M,
            ).strip()

            return schema.model_validate(json.loads(raw))

        except Exception as exc:
            last = exc
            log.warning(
                "Gemini attempt %s failed: %s",
                attempt + 1,
                exc,
            )
            time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"Gemini request failed: {last}")


def analyze_job(title: str, description: str) -> JobRequirements:
    if is_available():
        prompt = f"""You are an expert technical recruiter. Analyse this job posting.
Return: required_skills (must-have, short names like "Python"), preferred_skills (nice-to-have),
min_years_experience (number or null), seniority (junior/mid/senior/lead or null),
summary (one sentence).

TITLE: {title}
DESCRIPTION:
{description[:MAX_CHARS]}"""
        try:
            return _generate(prompt, JobRequirements)
        except RuntimeError:
            pass
    # Offline fallback
    years = [int(y) for y in re.findall(r"(\d+)\+?\s*(?:years|yrs)", description.lower())]
    return JobRequirements(
        required_skills=find_skills(description),
        min_years_experience=min(years) if years else None,
        summary="Requirements detected with keyword matching (Gemini unavailable).",
    )


def extract_candidate(resume_text: str) -> CandidateInfo:
    if is_available():
        prompt = f"""Extract structured data from this resume. Do not invent anything.
Fields: name, email, phone, current_title, skills (list of short skill names),
total_years_experience (number, estimated from work history dates), education (list of strings),
summary (two sentences max).

RESUME:
{resume_text[:MAX_CHARS]}"""
        try:
            return _generate(prompt, CandidateInfo)
        except RuntimeError:
            pass
    # Offline fallback
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", resume_text)
    years = [int(y) for y in re.findall(r"(\d+)\+?\s*(?:years|yrs)", resume_text.lower())]
    first_line = resume_text.strip().splitlines()[0][:80]
    return CandidateInfo(
        name=first_line, email=email.group(0) if email else None,
        skills=find_skills(resume_text), total_years_experience=max(years) if years else 0,
        summary="Extracted with keyword matching (Gemini unavailable).",
    )


def evaluate_match(job_title: str, req: JobRequirements, cand: CandidateInfo, resume_text: str) -> MatchEval | None:
    """Semantic judgement: does the candidate's real experience fit the role? None if AI is unavailable."""
    if not is_available():
        return None
    prompt = f"""You are a fair, careful recruiter. Compare the candidate with the job.
Give semantic_score (0-100) for overall fit, judging real experience and context, not just keyword overlap.
Then write explanation: 2-3 plain sentences covering strengths, gaps, and a recommendation.
Only use facts in the resume.

JOB: {job_title}
REQUIRED: {", ".join(req.required_skills)}
PREFERRED: {", ".join(req.preferred_skills)}
MIN YEARS: {req.min_years_experience}
SUMMARY: {req.summary}

CANDIDATE: {cand.name}, {cand.total_years_experience} years, skills: {", ".join(cand.skills)}
RESUME:
{resume_text[:8000]}"""
    try:
        return _generate(prompt, MatchEval)
    except RuntimeError:
        return None
