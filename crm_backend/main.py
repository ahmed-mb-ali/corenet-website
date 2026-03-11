from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_URL
from .database import engine
from .routers import auth, booking, leads, pipeline, availability, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import text
    from .models import Base
    # Create all tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    # Add password_hash column if table predates this column
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR"
        ))
        conn.commit()
    yield


app = FastAPI(title="Corenet CRM API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "https://www.corenet.sa",
        "https://corenet.sa",
        "https://crm.corenet.sa",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(booking.router, prefix="/api/booking")
app.include_router(leads.router, prefix="/api/leads")
app.include_router(pipeline.router, prefix="/api/pipeline")
app.include_router(availability.router, prefix="/api/availability")
app.include_router(settings.router, prefix="/api/settings")


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
