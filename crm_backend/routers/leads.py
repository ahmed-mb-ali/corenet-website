from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel

from ..database import get_db
from ..models import Lead, User, Stage, Booking, Activity
from ..auth import get_current_user

router = APIRouter()


def lead_dict(lead: Lead, assigned_name=None, stage_name=None, stage_color=None,
              booking_date=None, booking_start=None, booking_status=None):
    return {
        "id": lead.id,
        "tenant_id": lead.tenant_id,
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "email": lead.email,
        "phone": lead.phone,
        "company": lead.company,
        "website": lead.website,
        "message": lead.message,
        "source": lead.source,
        "status": lead.status,
        "assigned_to": lead.assigned_to,
        "assigned_to_name": assigned_name,
        "pipeline_id": lead.pipeline_id,
        "stage_id": lead.stage_id,
        "stage_name": stage_name,
        "stage_color": stage_color,
        "booking_date": str(booking_date) if booking_date else None,
        "booking_start": str(booking_start) if booking_start else None,
        "booking_status": booking_status,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
    }


@router.get("")
@router.get("/")
def list_leads(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant_id = current_user.tenant_id
    offset = (page - 1) * limit

    q = (
        db.query(Lead, User.name.label("assigned_name"), Stage.name.label("stage_name"), Stage.color.label("stage_color"))
        .outerjoin(User, Lead.assigned_to == User.id)
        .outerjoin(Stage, Lead.stage_id == Stage.id)
        .filter(Lead.tenant_id == tenant_id)
    )

    if search:
        q = q.filter(
            or_(
                Lead.first_name.ilike(f"%{search}%"),
                Lead.last_name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.company.ilike(f"%{search}%"),
            )
        )
    if status:
        q = q.filter(Lead.status == status)
    if assigned_to:
        q = q.filter(Lead.assigned_to == assigned_to)

    total = q.count()
    rows = q.order_by(Lead.created_at.desc()).offset(offset).limit(limit).all()

    leads = [lead_dict(r.Lead, r.assigned_name, r.stage_name, r.stage_color) for r in rows]
    return {"leads": leads, "total": total, "page": page, "limit": limit}


@router.get("/{lead_id}")
def get_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Lead, User.name.label("assigned_name"), Stage.name.label("stage_name"),
                 Stage.color.label("stage_color"), Booking.date.label("booking_date"),
                 Booking.start_time.label("booking_start"), Booking.status.label("booking_status"))
        .outerjoin(User, Lead.assigned_to == User.id)
        .outerjoin(Stage, Lead.stage_id == Stage.id)
        .outerjoin(Booking, Booking.lead_id == Lead.id)
        .filter(Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    activities_rows = (
        db.query(Activity, User.name.label("user_name"))
        .outerjoin(User, Activity.user_id == User.id)
        .filter(Activity.lead_id == lead_id)
        .order_by(Activity.created_at.desc())
        .all()
    )
    activities = [
        {
            "id": a.Activity.id,
            "type": a.Activity.type,
            "note": a.Activity.note,
            "metadata": a.Activity.meta,
            "user_name": a.user_name,
            "created_at": a.Activity.created_at,
        }
        for a in activities_rows
    ]

    return {
        "lead": lead_dict(row.Lead, row.assigned_name, row.stage_name, row.stage_color,
                          row.booking_date, row.booking_start, row.booking_status),
        "activities": activities,
    }


class PatchLeadBody(BaseModel):
    stage_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None


@router.patch("/{lead_id}")
def patch_lead(
    lead_id: str,
    body: PatchLeadBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_stage_id = lead.stage_id

    if body.stage_id is not None:
        lead.stage_id = body.stage_id
    if body.assigned_to is not None:
        lead.assigned_to = body.assigned_to
    if body.status is not None:
        lead.status = body.status

    if body.note:
        db.add(Activity(
            tenant_id=lead.tenant_id,
            lead_id=lead.id,
            user_id=str(current_user.id),
            type="note_added",
            note=body.note,
        ))

    if body.stage_id and body.stage_id != str(old_stage_id):
        stage = db.query(Stage).filter(Stage.id == body.stage_id).first()
        db.add(Activity(
            tenant_id=lead.tenant_id,
            lead_id=lead.id,
            user_id=str(current_user.id),
            type="stage_changed",
            note=f"Moved to {stage.name if stage else body.stage_id}",
            meta={"from": str(old_stage_id), "to": body.stage_id},
        ))

    db.commit()
    db.refresh(lead)
    return lead_dict(lead)
