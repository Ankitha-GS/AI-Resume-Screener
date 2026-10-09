import json
import logging
import re
import time

from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    CandidateInfo,
    JobRequirements,
    MatchEval,
    RequirementEvaluation,
)
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
Return a structured analysis of the job posting.

required_skills: List of concise, atomic skills or requirements that are explicitly required. Split combined requirements into separate items.
preferred_skills: List of concise, atomic skills or requirements that are preferred or nice-to-have. Split combined requirements into separate items.
min_years_experience: Minimum years of experience required. Use 0 if the job accepts freshers. Use null if experience is not specified.
max_years_experience: Maximum years of experience accepted. Use null if there is no maximum or it is not specified.
seniority: junior, mid, senior, lead, or null.
summary: One sentence summarizing the role.

Important:
- Understand experience ranges such as "0-2 years", "1-3 years", "2+ years", and "freshers welcome".
- For "0-2 years", return min_years_experience = 0 and max_years_experience = 2.
- For "2+ years", return min_years_experience = 2 and max_years_experience = null.
- Do not invent requirements that are not present in the job posting.
- Keep skills concise and meaningful.
- Return each skill or requirement as a separate item.
- Keep the wording concise and consistent with the job posting.
- Do not combine multiple skills into one item.
- Do not add skills just because they are common in the industry.
- This must work for any profession or domain, not only technology roles.
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
    preferred_skills=[],
    min_years_experience=min(years) if years else None,
    max_years_experience=None,
    seniority=None,
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
    name=first_line,
    email=email.group(0) if email else None,
    phone=None,
    current_title=None,
    skills=find_skills(resume_text),
    total_years_experience=max(years) if years else 0,
    education=[],
    summary="Extracted with keyword matching (Gemini unavailable).",
)


def evaluate_match(job_title: str, req: JobRequirements, cand: CandidateInfo, resume_text: str) -> MatchEval | None:
    """Semantic judgement: does the candidate's real experience fit the role? None if AI is unavailable."""
    if not is_available():
        return None
    prompt = f"""You are a fair, careful recruiter. Compare the candidate with the job.
Give semantic_score (0-100) for contextual fit based on relevant experience, transferable skills, and evidence in the resume. Do not simply repeat the keyword or requirement-match score.
Then write explanation: 2-3 plain sentences covering strengths, gaps, and a recommendation.
Only use facts in the resume.

JOB: {job_title}
REQUIRED: {", ".join(req.required_skills)}
PREFERRED: {", ".join(req.preferred_skills)}
MIN YEARS: {req.min_years_experience}
MAX YEARS: {req.max_years_experience}
SUMMARY: {req.summary}
CANDIDATE: {cand.name}, {cand.total_years_experience} years, skills: {", ".join(cand.skills)}
RESUME:
{resume_text[:8000]}"""
    try:
        return _generate(prompt, MatchEval)
    except RuntimeError:
        return None


def evaluate_requirements(
    requirements: list[str],
    resume_text: str,
) -> list[RequirementEvaluation]:
    """Evaluate each job requirement using evidence from the resume."""
    if not is_available() or not requirements:
        return []

    prompt = f"""You are a fair recruiter evaluating a resume against job requirements.

For every requirement provided, return exactly one evaluation containing:
- requirement: the original requirement text
- matched: true only when the resume provides supporting evidence
- evidence: a short quote or accurate summary of relevant resume evidence
- confidence: an integer from 0 to 100 indicating confidence in this evaluation

Rules:
- Evaluate every requirement independently.
- Use evidence from the resume only.
- Do not assume a skill or qualification exists because it is common in the profession.
- Related experience can count when it genuinely demonstrates the requirement.
- Do not treat a lack of evidence as proof that the candidate lacks the skill.
- If evidence is absent, set matched to false and explain that evidence was not found.
- Never invent qualifications, experience, or achievements.

REQUIREMENTS:
{json.dumps(requirements, ensure_ascii=False)}

RESUME:
{resume_text[:MAX_CHARS]}
"""

    class RequirementEvaluationList(BaseModel):
        evaluations: list[RequirementEvaluation]

    try:
        result = _generate(prompt, RequirementEvaluationList)
        return result.evaluations
    except RuntimeError:
        log.exception("Requirement evaluation failed")
        return []
