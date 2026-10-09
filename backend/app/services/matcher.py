
from app.config import settings
from app.models.schemas import CandidateInfo, JobRequirements
from app.services import gemini_service
from app.utils.skills import normalize


def skill_match(req: JobRequirements, cand: CandidateInfo, resume_text: str):
    """Score job requirements using resume evidence when Gemini is available."""
    required = list(dict.fromkeys(req.required_skills))
    preferred = list(dict.fromkeys(req.preferred_skills))
    all_requirements = required + [
        item for item in preferred if item not in required
    ]

    evaluations = gemini_service.evaluate_requirements(
        all_requirements, resume_text
    )

    if evaluations:
        by_requirement = {
            normalize(item.requirement): item
            for item in evaluations
        }

        matching = []
        missing = []
        required_scores = []
        preferred_scores = []

        for requirement in required:
            result = by_requirement.get(normalize(requirement))
            if result is None:
                missing.append(requirement)
                required_scores.append(0.0)
            elif result.matched:
                matching.append(requirement)
                required_scores.append(result.confidence / 100)
            else:
                missing.append(requirement)
                required_scores.append(0.0)

        for requirement in preferred:
            if requirement in required:
                continue
            result = by_requirement.get(normalize(requirement))
            if result and result.matched:
                matching.append(requirement)
                preferred_scores.append(result.confidence / 100)
            else:
                preferred_scores.append(0.0)

        required_avg = (
            sum(required_scores) / len(required_scores)
            if required_scores else None
        )
        preferred_avg = (
            sum(preferred_scores) / len(preferred_scores)
            if preferred_scores else None
        )

        if required_avg is not None and preferred_avg is not None:
            score = (required_avg + 0.5 * preferred_avg) / 1.5
        elif required_avg is not None:
            score = required_avg
        elif preferred_avg is not None:
            score = preferred_avg
        else:
            score = 0.5

        return score, matching, missing

    # Fallback: exact normalized skill matching if AI evaluation is unavailable.
    candidate_skills = {normalize(skill) for skill in cand.skills}
    required_map = {normalize(skill): skill for skill in required}
    preferred_map = {normalize(skill): skill for skill in preferred}

    matched_required = [
        original for key, original in required_map.items()
        if key in candidate_skills
    ]
    matched_preferred = [
        original for key, original in preferred_map.items()
        if key in candidate_skills
    ]
    missing = [
        original for key, original in required_map.items()
        if key not in candidate_skills
    ]

    total = len(required_map) + 0.5 * len(preferred_map)
    got = len(matched_required) + 0.5 * len(matched_preferred)
    score = got / total if total else 0.5

    return score, matched_required + matched_preferred, missing


def experience_fit(req: JobRequirements, cand: CandidateInfo):
    have = cand.total_years_experience or 0
    minimum = req.min_years_experience
    maximum = req.max_years_experience

    if minimum is None and maximum is None:
        return 1.0, "No requirement", (
            f"{have:g} years of experience; no specific requirement."
        )

    if minimum is not None and maximum is not None:
        if minimum <= have <= maximum:
            return 1.0, "Strong fit", (
                f"{have:g} years; required range is "
                f"{minimum:g}-{maximum:g} years."
            )
        if have < minimum:
            return 0.0, "Below requirement", (
                f"{have:g} years; minimum required is {minimum:g} years."
            )
        return 0.8, "Above stated range", (
            f"{have:g} years; stated range is {minimum:g}-{maximum:g} years."
        )

    if minimum is not None:
        if have >= minimum:
            return 1.0, "Strong fit", (
                f"{have:g} years vs {minimum:g}+ years required."
            )
        ratio = have / minimum if minimum > 0 else 1.0
        if ratio >= 0.7:
            return ratio, "Partial fit", (
                f"{have:g} years, slightly below the {minimum:g}+ years required."
            )
        return ratio, "Below requirement", (
            f"{have:g} years vs {minimum:g}+ years required."
        )

    if maximum is not None:
        if have <= maximum:
            return 1.0, "Strong fit", (
                f"{have:g} years; maximum stated experience is {maximum:g} years."
            )
        return 0.8, "Above stated range", (
            f"{have:g} years; maximum stated experience is {maximum:g} years."
        )

    return 1.0, "No requirement", f"{have:g} years of experience."


def match_candidate(
    job_title: str,
    req: JobRequirements,
    cand: CandidateInfo,
    resume_text: str,
) -> dict:
    s_skill, matching, missing = skill_match(req, cand, resume_text)
    s_exp, exp_label, exp_note = experience_fit(req, cand)
    ai = gemini_service.evaluate_match(job_title, req, cand, resume_text)

    weights = {
        "skills": settings.W_SKILLS,
        "experience": settings.W_EXPERIENCE,
    }
    parts = {
        "skills": s_skill * 100,
        "experience": s_exp * 100,
    }

    if ai:
        weights["semantic"] = settings.W_SEMANTIC
        parts["semantic"] = float(ai.semantic_score)

    total_weight = sum(weights.values())
    score = (
        sum(parts[key] * weights[key] for key in weights) / total_weight
        if total_weight else 0.0
    )

    if ai:
        explanation = ai.explanation
    else:
        explanation = (
            f"Matches {len(matching)} requirement(s) and has "
            f"{len(missing)} unmatched required requirement(s). "
            f"{exp_note} "
            "AI semantic evaluation is unavailable."
        )

    return {
        "score": round(score, 1),
        "matching_skills": matching,
        "missing_skills": missing,
        "experience_fit": exp_label,
        "experience_note": exp_note,
        "explanation": explanation,
        "breakdown": {
            key: {
                "value": round(parts[key], 1),
                "weight": round(weights[key] / total_weight, 2),
            }
            for key in parts
        },
    }
