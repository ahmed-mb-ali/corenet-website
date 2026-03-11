from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Pipeline, Stage, Lead, User, Booking
from ..auth import get_current_user

router = APIRouter()


@router.get("/")
def get_pipeline(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant_id = current_user.tenant_id
    pipeline = db.query(Pipeline).filter(
        Pipeline.tenant_id == tenant_id, Pipeline.is_default == True
    ).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="No pipeline found")

    stages = (
        db.query(Stage)
        .filter(Stage.pipeline_id == pipeline.id)
        .order_by(Stage.position)
        .all()
    )

    lead_rows = (
        db.query(
            Lead, User.name.label("assigned_name"),
            Booking.date.label("booking_date"), Booking.start_time.label("booking_start")
        )
        .outerjoin(User, Lead.assigned_to == User.id)
        .outerjoin(Booking, Booking.lead_id == Lead.id)
        .filter(Lead.tenant_id == tenant_id)
        .all()
    )

    lead_map: dict = {}
    for r in lead_rows:
        lead_map[r.Lead.stage_id] = lead_map.get(r.Lead.stage_id, [])
        lead_map[r.Lead.stage_id].append({
            "id": r.Lead.id,
            "first_name": r.Lead.first_name,
            "last_name": r.Lead.last_name,
            "company": r.Lead.company,
            "stage_id": r.Lead.stage_id,
            "status": r.Lead.status,
            "created_at": r.Lead.created_at,
            "assigned_to_name": r.assigned_name,
            "booking_date": str(r.booking_date) if r.booking_date else None,
            "booking_start": str(r.booking_start) if r.booking_start else None,
        })

    stages_with_leads = [
        {
            "id": s.id, "name": s.name, "color": s.color, "position": s.position,
            "leads": lead_map.get(s.id, []),
        }
        for s in stages
    ]

    return {
        "pipeline": {"id": pipeline.id, "name": pipeline.name},
        "stages": stages_with_leads,
    }
