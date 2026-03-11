from datetime import date, time
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models import User, Availability, Booking


def assign_rep(db: Session, tenant_id: str, booking_date: date, start_time: time, end_time: time):
    """Return the first available rep for the given slot, by priority."""
    reps = (
        db.query(User)
        .filter(User.tenant_id == tenant_id, User.is_active == True)
        .order_by(User.priority.asc())
        .all()
    )

    day_of_week = booking_date.weekday()
    # Python weekday(): Mon=0 ... Sun=6  — JS getDay(): Sun=0 ... Sat=6
    # Convert: Sun=0 in JS → 6 in Python → map to 0
    js_day = (day_of_week + 1) % 7

    for rep in reps:
        # Check working hours for this day
        wh = db.query(Availability).filter(
            Availability.user_id == str(rep.id),
            Availability.day_of_week == js_day,
            Availability.is_blocked == False,
        ).first()
        if not wh:
            continue

        # Slot must be within working hours
        if not (start_time >= wh.start_time and end_time <= wh.end_time):
            continue

        # Check if date is blocked
        blocked = db.query(Availability).filter(
            Availability.user_id == str(rep.id),
            Availability.block_date == booking_date,
            Availability.is_blocked == True,
        ).first()
        if blocked:
            continue

        # Check booking conflict
        conflict = db.query(Booking).filter(
            Booking.assigned_to == str(rep.id),
            Booking.date == booking_date,
            Booking.status != "cancelled",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        ).first()
        if conflict:
            continue

        return rep

    return None
