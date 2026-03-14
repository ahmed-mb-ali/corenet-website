from datetime import date, time, datetime, timedelta
from typing import Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User, Availability, Booking, Lead, Pipeline, Stage, Activity, SmsLog
from ..services.assignment import assign_rep
from ..auth import get_current_user
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
    website: Optional[str] = None
    message: Optional[str] = None
    lang: Optional[str] = None


@router.post("", status_code=201)
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
        website=body.website,
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
        meta={"bookingId": str(booking.id), "repId": str(rep.id)},
    ))

    db.commit()

    # ── Google Calendar + Meet ──
    meet_url = None
    from ..services.google_calendar import create_meet_event
    gcal_result = create_meet_event(
        rep_email=rep.email,
        client_name=body.name,
        client_email=body.email,
        booking_date=booking_date,
        start_time=start_t,
        end_time=end_t,
    )
    if gcal_result:
        booking.google_event_id = gcal_result["event_id"]
        booking.google_meet_url = gcal_result.get("meet_url")
        meet_url = booking.google_meet_url
        db.commit()

    # ── Confirmation email ──
    from ..services.email_sender import send_booking_confirmation
    send_booking_confirmation(
        client_email=body.email,
        client_name=body.name,
        booking_date=booking_date,
        start_time=start_t,
        meet_url=meet_url,
        lang_hint=body.lang,
        message=body.message,
    )

    return {
        "success": True,
        "bookingId": str(booking.id),
        "message": "Meeting confirmed",
        "details": {
            "date": body.date,
            "startTime": body.startTime,
            "endTime": end_t.strftime("%H:%M"),
            "timezone": TIMEZONE,
            "meetUrl": meet_url,
        },
    }


# ── Meetings list (authenticated) ──

@router.get("/meetings")
def list_meetings(
    status: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            Booking,
            Lead.first_name.label("lead_first_name"),
            Lead.last_name.label("lead_last_name"),
            Lead.email.label("lead_email"),
            Lead.company.label("lead_company"),
            User.name.label("rep_name"),
        )
        .join(Lead, Booking.lead_id == Lead.id)
        .join(User, Booking.assigned_to == User.id)
        .filter(Booking.tenant_id == current_user.tenant_id)
    )

    if status:
        q = q.filter(Booking.status == status)
    if from_date:
        q = q.filter(Booking.date >= date.fromisoformat(from_date))
    if to_date:
        q = q.filter(Booking.date <= date.fromisoformat(to_date))

    rows = q.order_by(Booking.date.desc(), Booking.start_time.desc()).all()

    meetings = []
    for r in rows:
        b = r.Booking
        meetings.append({
            "id": str(b.id),
            "lead_id": str(b.lead_id),
            "client_name": f"{r.lead_first_name or ''} {r.lead_last_name or ''}".strip(),
            "client_email": r.lead_email,
            "client_company": r.lead_company,
            "date": str(b.date),
            "start_time": str(b.start_time)[:5],
            "end_time": str(b.end_time)[:5],
            "status": b.status,
            "rep_name": r.rep_name,
            "google_meet_url": b.google_meet_url,
        })

    return {"meetings": meetings}


# ── Cancel booking (authenticated) ──

@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tenant_id == current_user.tenant_id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    lead = db.query(Lead).filter(Lead.id == booking.lead_id).first()
    rep = db.query(User).filter(User.id == booking.assigned_to).first()

    # Delete Google Calendar event
    if booking.google_event_id and rep:
        from ..services.google_calendar import delete_event
        delete_event(rep.email, booking.google_event_id)

    old_date = booking.date
    old_time = booking.start_time

    booking.status = "cancelled"
    booking.google_event_id = None
    booking.google_meet_url = None

    db.add(Activity(
        tenant_id=current_user.tenant_id,
        lead_id=str(booking.lead_id),
        user_id=str(current_user.id),
        type="booking_cancelled",
        note=f"Meeting on {format_date(old_date)} cancelled by {current_user.name}",
    ))

    db.commit()

    # Send cancellation email
    if lead:
        client_name = f"{lead.first_name or ''} {lead.last_name or ''}".strip()
        from ..services.email_sender import send_cancellation_email
        send_cancellation_email(
            client_email=lead.email,
            client_name=client_name,
            booking_date=old_date,
            start_time=old_time,
        )

    return {"success": True, "message": "Booking cancelled"}


# ── Reschedule booking (authenticated) ──

class RescheduleBody(BaseModel):
    date: str
    startTime: str


@router.patch("/{booking_id}")
def reschedule_booking(
    booking_id: str,
    body: RescheduleBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tenant_id == current_user.tenant_id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled booking")

    lead = db.query(Lead).filter(Lead.id == booking.lead_id).first()
    rep = db.query(User).filter(User.id == booking.assigned_to).first()

    new_date = date.fromisoformat(body.date)
    new_start = time.fromisoformat(body.startTime)
    new_end = add_minutes(new_start, booking.duration_minutes or SLOT_DURATION)

    old_date = booking.date
    old_time = booking.start_time

    # Update booking fields
    booking.date = new_date
    booking.start_time = new_start
    booking.end_time = new_end

    # Update Google Calendar event
    meet_url = booking.google_meet_url
    if booking.google_event_id and rep:
        client_name = None
        if lead:
            client_name = f"{lead.first_name or ''} {lead.last_name or ''}".strip()
        from ..services.google_calendar import update_event
        result = update_event(
            rep_email=rep.email,
            event_id=booking.google_event_id,
            new_date=new_date,
            new_start=new_start,
            new_end=new_end,
            client_name=client_name,
        )
        if result:
            booking.google_meet_url = result.get("meet_url")
            meet_url = booking.google_meet_url

    db.add(Activity(
        tenant_id=current_user.tenant_id,
        lead_id=str(booking.lead_id),
        user_id=str(current_user.id),
        type="booking_rescheduled",
        note=f"Meeting rescheduled from {format_date(old_date)} to {format_date(new_date)} by {current_user.name}",
    ))

    db.commit()

    # Send reschedule email
    if lead:
        client_name = f"{lead.first_name or ''} {lead.last_name or ''}".strip()
        from ..services.email_sender import send_reschedule_email
        send_reschedule_email(
            client_email=lead.email,
            client_name=client_name,
            old_date=old_date,
            old_time=old_time,
            new_date=new_date,
            new_time=new_start,
            meet_url=meet_url,
        )

    return {
        "success": True,
        "message": "Booking rescheduled",
        "details": {
            "date": str(new_date),
            "startTime": new_start.strftime("%H:%M"),
            "endTime": new_end.strftime("%H:%M"),
            "meetUrl": meet_url,
        },
    }
