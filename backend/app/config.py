
import os
from dotenv import load_dotenv

load_dotenv()


def _db_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./ai_hire.db")
    # Render/Heroku style URLs start with postgres:// which SQLAlchemy rejects
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    DATABASE_URL: str = _db_url()

    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,https://ai-resume-screener-one-sigma.vercel.app,https://ai-resume-screener-m4s7ttoal-ankitha-gs-projects.vercel.app",
        ).split(",")
        if o.strip()
    ]

    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "5"))
    MAX_FILES_PER_UPLOAD: int = 20

    # Hybrid scoring weights (skills + experience + AI semantic judgement)
    W_SKILLS: float = 0.55
    W_EXPERIENCE: float = 0.15
    W_SEMANTIC: float = 0.30


settings = Settings()
