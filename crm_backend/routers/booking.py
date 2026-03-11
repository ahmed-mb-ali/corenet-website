from datetime import date, time, datetime, timedelta
from typing import Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User, Availability, Booking, Lead, Pipeline, Stage, Activity, SmsLog
from ..services.assignment import assign_rep
from ..config import TENANT_ID, TIMEZONE, SLOT_DURATION

router = APIRouter()

MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"]
DAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]


def add_minutes(t: time, mins: int) -> time:
    total = t.hour * 60 + t.minute + mins
    return time(total // 60, total % 60)


def js_day_of_week(d: date) -> int:
    """Return JS-style day of week: Sun=0 ... Sat=6"""
    return (d.weekday() + 1) % 7


def format_date(d: date) -> str:
    js_dow = js_day_of_week(d)
    return f"{DAYS_EN[js_dow]}, {MONTHS_EN[d.month - 1]} {d.day}, {d.year}"


@router.get("/availability")
def get_availability(
    month: str = Query(..., regex=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
):
    year, mon = int(month[:4]), int(month[5:])
    start_date = date(year, mon, 1)
    # Last day of month
    if mon == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, mon + 1, 1) - timedelta(days=1)

    reps = db.query(User).filter(User.tenant_id == TENANT_ID, User.is_active == True).all()
    rep_ids = [str(r.id) for r in reps]

    if not rep_ids:
        return {"timezone": TIMEZONE, "duration": SLOT_DURATION, "slots": {}}

    working_hours = db.query(Availability).filter(
        Availability.user_id.in_(rep_ids),
        Availability.is_blocked == False,
        Availability.day_of_week.isnot(None),
    ).all()

    blocked_dates = db.query(Availability).filter(
        Availability.user_id.in_(rep_ids),
        Availability.is_blocked == True,
        Availability.block_date.isnot(None),
    ).all()

    existing_bookings = db.query(Booking).filter(
        Booking.tenant_id == TENANT_ID,
        Booking.status != "cancelled",
        Booking.date >= start_date,
        Booking.date <= end_date,
    ).all()

    slots: dict = {}
    current = start_date
    while current <= end_date:
        day_js = js_day_of_week(current)
        day_slots = set()

        for rep in reps:
            wh = next(
                (w for w in working_hours if str(w.user_id) == str(rep.id) and w.day_of_week == day_js),
                None,
            )
            if not wh:
                continue

            is_blocked = any(
                str(b.user_id) == str(rep.id) and b.block_date == current
                for b in blocked_dates
            )
            if is_blocked:
                continue

            slot_start = wh.start_time
            slot_end_limit = wh.end_time

            while slot_start < slot_end_limit:
                slot_end = add_minutes(slot_start, SLOT_DURATION)
                if slot_end > slot_end_limit:
                    break

                conflict = any(
                    str(b.assigned_to) == str(rep.id)
                    and b.date == current
                    and b.start_time < slot_end
                    and b.end_time > slot_start
                    for b in existing_bookings
                )

                if not conflict:
                    day_slots.add(slot_start.strftime("%H:%M"))

                slot_start = slot_end

        if day_slots:
            slots[str(current)] = sorted(day_slots)

        current += timedelta(days=1)

    return {"timezone": TIMEZONE, "duration": SLOT_DURATION, "slots": slots}


class BookingBody(BaseModel):
    date: str
    startTime: str
    name: str
    email: EmailStr
    company: str
    phone: Optional[str] = None
    message: Optional[str] = None


@router.post("/", status_code=201)
def create_booking(body: BookingBody, db: Session = Depends(get_db)):
    booking_date = date.fromisoformat(body.date)
    if booking_date < date.today():
        raise HTTPException(status_code=400, detail="Date must be in the future")

    start_t = time.fromisoformat(body.startTime)
    end_t = add_minutes(start_t, SLOT_DURATION)

    rep = assign_rep(db, TENANT_ID, booking_date, start_t, end_t)
    if not rep:
        raise HTTPException(status_code=409, detail="Slot no longer available. Please choose another time.")

    # Default pipeline + first stage
    pipeline = db.query(Pipeline).filter(
        Pipeline.tenant_id == TENANT_ID, Pipeline.is_default == True
    ).first()
    stage = db.query(Stage).filter(
        Stage.pipeline_id == pipeline.id
    ).order_by(Stage.position).first()

    name_parts = body.name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else None

    lead = Lead(
        tenant_id=TENANT_ID,
        first_name=first_name,
        last_name=last_name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        message=body.message,
        source="booking_widget",
        status="new",
        assigned_to=str(rep.id),
        pipeline_id=str(pipeline.id),
        stage_id=str(stage.id),
    )
    db.add(lead)
    db.flush()

    booking = Booking(
        tenant_id=TENANT_ID,
        lead_id=str(lead.id),
        assigned_to=str(rep.id),
        date=booking_date,
        start_time=start_t,
        end_time=end_t,
        duration_minutes=SLOT_DURATION,
        status="confirmed",
        confirmed_at=datetime.utcnow(),
    )
    db.add(booking)
    db.flush()

    db.add(Activity(
        tenant_id=TENANT_ID,
        lead_id=str(lead.id),
        user_id=str(rep.id),
        type="booking_created",
        note=f"Meeting booked for {format_date(booking_date)} at {body.startTime}",
        metadata={"bookingId": str(booking.id), "repId": str(rep.id)},
    ))

    db.commit()

    # Phase 3: calendar, email, SMS integrations go here

    return {
        "success": True,
        "bookingId": str(booking.id),
        "message": "Meeting confirmed",
        "details": {
            "date": body.date,
            "startTime": body.startTime,
            "endTime": end_t.strftime("%H:%M"),
            "timezone": TIMEZONE,
        },
    }
