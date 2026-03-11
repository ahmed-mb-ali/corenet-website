from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_URL
from .routers import auth, booking, leads, pipeline, availability, settings

app = FastAPI(title="Corenet CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
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
