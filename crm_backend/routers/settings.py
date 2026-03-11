from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Availability
from ..auth import get_current_user, require_admin

router = APIRouter()


def user_dict(u: User):
    return {
        "id": u.id, "name": u.name, "email": u.email, "phone": u.phone,
        "role": u.role, "priority": u.priority, "is_active": u.is_active,
        "gcal_id": u.gcal_id, "created_at": u.created_at,
    }


@router.get("/team")
def list_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.tenant_id == current_user.tenant_id)
        .order_by(User.priority.asc())
        .all()
    )
    return [user_dict(u) for u in users]


class CreateRepBody(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "rep"


@router.post("/team", status_code=201)
def create_rep(
    body: CreateRepBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(
        User.tenant_id == current_user.tenant_id, User.email == body.email
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    max_priority = db.query(func.max(User.priority)).filter(
        User.tenant_id == current_user.tenant_id
    ).scalar() or 0

    user = User(
        tenant_id=current_user.tenant_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        role=body.role,
        priority=max_priority + 1,
        is_active=True,
    )
    db.add(user)
    db.flush()  # get user.id before inserting availability

    # Seed default availability Sun–Thu 9:00–17:00
    for day in range(5):  # 0=Sun ... 4=Thu
        db.add(Availability(
            user_id=str(user.id),
            day_of_week=day,
            start_time="09:00:00",
            end_time="17:00:00",
            is_blocked=False,
        ))

    db.commit()
    db.refresh(user)
    return user_dict(user)


class PatchRepBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


@router.patch("/team/{user_id}")
def patch_rep(
    user_id: str,
    body: PatchRepBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id, User.tenant_id == current_user.tenant_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(user, field, val)

    db.commit()
    db.refresh(user)
    return user_dict(user)


@router.delete("/team/{user_id}")
def deactivate_rep(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user = db.query(User).filter(
        User.id == user_id, User.tenant_id == current_user.tenant_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    return {"success": True}


class ReorderItem(BaseModel):
    id: str
    priority: int


class ReorderBody(BaseModel):
    order: List[ReorderItem]


@router.put("/team/reorder")
def reorder_team(
    body: ReorderBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    for item in body.order:
        db.query(User).filter(
            User.id == item.id, User.tenant_id == current_user.tenant_id
        ).update({"priority": item.priority})
    db.commit()
    return {"success": True}
