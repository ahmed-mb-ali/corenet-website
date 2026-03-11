from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import User
from ..auth import get_current_user, create_token
from ..config import NODE_ENV

router = APIRouter()


class LoginBody(BaseModel):
    email: str


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
    if NODE_ENV == "production":
        raise HTTPException(status_code=404, detail="Not found")
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    token = create_token(user)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }
