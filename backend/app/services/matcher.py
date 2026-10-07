from app.config import settings
from app.models.schemas import CandidateInfo, JobRequirements
from app.services import gemini_service
from app.utils.skills import normalize


def skill_match(req: JobRequirements, cand: CandidateInfo):
    """Deterministic part of the hybrid score."""
    cand_skills = {normalize(s) for s in cand.skills}
    required = {normalize(s): s for s in req.required_skills}
    preferred = {normalize(s): s for s in req.preferred_skills}

    req_hit = [required[k] for k in required if k in cand_skills]
    pref_hit = [preferred[k] for k in preferred if k in cand_skills]
    missing = [required[k] for k in required if k not in cand_skills]

    # Required skills count fully, preferred skills count half.
    total = len(required) + 0.5 * len(preferred)
    got = len(req_hit) + 0.5 * len(pref_hit)
    score = got / total if total else 0.5
    return score, req_hit + pref_hit, missing


def experience_fit(req: JobRequirements, cand: CandidateInfo):
    need, have = req.min_years_experience, cand.total_years_experience or 0
    if not need:
        return 1.0, "No requirement", f"{have:g} years of experience; none required."
    if have >= need:
        return 1.0, "Strong fit", f"{have:g} years vs {need:g} required."
    ratio = have / need
    if ratio >= 0.7:
        return ratio, "Partial fit", f"{have:g} years, slightly under the {need:g} required."
    return ratio, "Below requirement", f"{have:g} years vs {need:g} required."


def match_candidate(job_title: str, req: JobRequirements, cand: CandidateInfo, resume_text: str) -> dict:
    s_skill, matching, missing = skill_match(req, cand)
    s_exp, exp_label, exp_note = experience_fit(req, cand)
    ai = gemini_service.evaluate_match(job_title, req, cand, resume_text)

    w = {"skills": settings.W_SKILLS, "experience": settings.W_EXPERIENCE}
    parts = {"skills": s_skill * 100, "experience": s_exp * 100}
    if ai:
        w["semantic"] = settings.W_SEMANTIC
        parts["semantic"] = float(ai.semantic_score)
    total_w = sum(w.values())  # re-normalise if AI part is missing
    score = sum(parts[k] * w[k] for k in w) / total_w

    if ai:
        explanation = ai.explanation
    else:
        explanation = (
            f"Matches {len(matching)} skill(s) and is missing {len(missing)}. {exp_note} "
            "Score is based on skills and experience only (AI evaluation unavailable)."
        )
    return {
        "score": round(score, 1),
        "matching_skills": matching,
        "missing_skills": missing,
        "experience_fit": exp_label,
        "experience_note": exp_note,
        "explanation": explanation,
        "breakdown": {k: {"value": round(parts[k], 1), "weight": round(w[k] / total_w, 2)} for k in parts},
    }
