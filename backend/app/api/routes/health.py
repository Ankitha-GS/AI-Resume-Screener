from fastapi import APIRouter

from app.services import gemini_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "ai_enabled": gemini_service.is_available()}
