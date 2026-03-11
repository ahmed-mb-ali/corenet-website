from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt

from ..database import get_db
from ..models import User, Tenant, Pipeline, Stage, Availability
from ..auth import get_current_user, create_token
from ..config import TENANT_ID

router = APIRouter()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


class LoginBody(BaseModel):
    email: str
    password: str


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "priority": current_user.priority,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == body.email.strip().lower(),
        User.is_active == True,
    ).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


class SeedAdminBody(BaseModel):
    secret: str
    name: str
    email: str
    password: str


@router.post("/setup", status_code=201)
def setup_admin(body: SeedAdminBody, db: Session = Depends(get_db)):
    """One-time setup endpoint — creates the first admin + default pipeline/stages."""
    import os
    expected = os.environ.get("SETUP_SECRET", "")
    if not expected or body.secret != expected:
        raise HTTPException(status_code=403, detail="Invalid setup secret")

    # Block if admin already exists
    existing = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Admin already exists")

    # Ensure tenant row exists
    tenant = db.query(Tenant).filter(Tenant.id == TENANT_ID).first()
    if not tenant:
        tenant = Tenant(id=TENANT_ID, name="Corenet")
        db.add(tenant)
        db.flush()

    # Create admin user
    admin = User(
        tenant_id=TENANT_ID,
        name=body.name,
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
        role="admin",
        priority=1,
        is_active=True,
    )
    db.add(admin)
    db.flush()

    # Seed default availability Sun–Thu 9:00–17:00
    for day in range(5):
        db.add(Availability(
            user_id=str(admin.id),
            day_of_week=day,
            start_time="09:00:00",
            end_time="17:00:00",
            is_blocked=False,
        ))

    # Create default pipeline + stages if none exist
    pipeline = db.query(Pipeline).filter(Pipeline.tenant_id == TENANT_ID).first()
    if not pipeline:
        pipeline = Pipeline(
            tenant_id=TENANT_ID,
            name="Sales Pipeline",
            is_default=True,
        )
        db.add(pipeline)
        db.flush()

        stages = [
            ("New Lead",      "#335cff", 1),
            ("Contacted",     "#f59e0b", 2),
            ("Demo Booked",   "#3ab874", 3),
            ("Proposal Sent", "#8b5cf6", 4),
            ("Won",           "#10b981", 5),
            ("Lost",          "#ef4444", 6),
        ]
        for name, color, pos in stages:
            db.add(Stage(pipeline_id=str(pipeline.id), name=name, color=color, position=pos))

    db.commit()
    return {"success": True, "message": "Admin created and pipeline seeded"}
