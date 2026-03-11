from datetime import date as Date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Availability, User
from ..auth import get_current_user

router = APIRouter()


def resolve_user_id(
    user_id: Optional[str],
    current_user: User,
) -> str:
    if user_id and user_id != str(current_user.id):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin only")
        return user_id
    return str(current_user.id)


@router.get("")
@router.get("/")
def get_availability(
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = resolve_user_id(user_id, current_user)
    working_hours = (
        db.query(Availability)
        .filter(Availability.user_id == uid, Availability.is_blocked == False)
        .order_by(Availability.day_of_week)
        .all()
    )
    blocked_dates = (
        db.query(Availability)
        .filter(Availability.user_id == uid, Availability.is_blocked == True)
        .order_by(Availability.block_date)
        .all()
    )

    def fmt_wh(a):
        return {
            "id": a.id, "user_id": a.user_id, "day_of_week": a.day_of_week,
            "start_time": str(a.start_time), "end_time": str(a.end_time),
            "is_blocked": False,
        }

    def fmt_bd(a):
        return {
            "id": a.id, "user_id": a.user_id, "block_date": str(a.block_date),
            "block_reason": a.block_reason, "is_blocked": True,
        }

    return {
        "workingHours": [fmt_wh(a) for a in working_hours],
        "blockedDates": [fmt_bd(a) for a in blocked_dates],
    }


class HourEntry(BaseModel):
    dayOfWeek: int
    enabled: bool
    startTime: str
    endTime: str


class SaveHoursBody(BaseModel):
    user_id: Optional[str] = None
    hours: List[HourEntry]


@router.put("/working-hours")
def save_working_hours(
    body: SaveHoursBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = resolve_user_id(body.user_id, current_user)
    db.query(Availability).filter(
        Availability.user_id == uid, Availability.is_blocked == False
    ).delete()

    rows = [
        Availability(
            user_id=uid,
            day_of_week=h.dayOfWeek,
            start_time=h.startTime,
            end_time=h.endTime,
            is_blocked=False,
        )
        for h in body.hours if h.enabled
    ]
    db.add_all(rows)
    db.commit()
    return {"success": True}


class BlockBody(BaseModel):
    user_id: Optional[str] = None
    date: str
    reason: Optional[str] = None


@router.post("/block", status_code=201)
def add_block(
    body: BlockBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = resolve_user_id(body.user_id, current_user)
    row = Availability(
        user_id=uid,
        is_blocked=True,
        block_date=body.date,
        block_reason=body.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "user_id": row.user_id, "block_date": str(row.block_date), "block_reason": row.block_reason}


@router.delete("/block/{block_id}")
def remove_block(
    block_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Availability).filter(
        Availability.id == block_id, Availability.is_blocked == True
    )
    if current_user.role != "admin":
        query = query.filter(Availability.user_id == str(current_user.id))
    row = query.first()
    if not row:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(row)
    db.commit()
    return {"success": True}
