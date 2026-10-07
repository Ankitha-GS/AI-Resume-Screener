from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, jobs, matching, resumes
from app.config import settings
from app.database import Base, engine
from app.models import db_models  # noqa: F401  (registers tables)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI-Hire API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, jobs.router, resumes.router, matching.router):
    app.include_router(r, prefix="/api")


@app.get("/")
def root():
    return {"name": "AI-Hire API", "docs": "/docs"}
