from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime, Date, Time,
    ForeignKey, JSON, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
import uuid

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String)
    role = Column(String, default="rep")  # admin | manager | rep
    priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    gcal_id = Column(String)
    google_access_token = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Pipeline(Base):
    __tablename__ = "pipelines"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    stages = relationship("Stage", back_populates="pipeline", order_by="Stage.position")


class Stage(Base):
    __tablename__ = "stages"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    pipeline_id = Column(UUID(as_uuid=False), ForeignKey("pipelines.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="#335cff")
    position = Column(Integer, default=1)
    pipeline = relationship("Pipeline", back_populates="stages")


class Lead(Base):
    __tablename__ = "leads"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    email = Column(String, nullable=False)
    phone = Column(String)
    company = Column(String, nullable=False)
    message = Column(Text)
    source = Column(String, default="booking_widget")
    status = Column(String, default="new")
    assigned_to = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    pipeline_id = Column(UUID(as_uuid=False), ForeignKey("pipelines.id"))
    stage_id = Column(UUID(as_uuid=False), ForeignKey("stages.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    lead_id = Column(UUID(as_uuid=False), ForeignKey("leads.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(String, default="confirmed")
    sms_sent = Column(Boolean, default=False)
    confirmed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Availability(Base):
    __tablename__ = "availability"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    is_blocked = Column(Boolean, default=False)
    # Working hours fields
    day_of_week = Column(Integer)   # 0=Sun ... 6=Sat
    start_time = Column(Time)
    end_time = Column(Time)
    # Blocked date fields
    block_date = Column(Date)
    block_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Activity(Base):
    __tablename__ = "activities"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    lead_id = Column(UUID(as_uuid=False), ForeignKey("leads.id"), nullable=False)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    type = Column(String, nullable=False)
    note = Column(Text)
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SmsLog(Base):
    __tablename__ = "sms_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    booking_id = Column(UUID(as_uuid=False), ForeignKey("bookings.id"))
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    phone = Column(String)
    message = Column(Text)
    plivo_message_id = Column(String)
    status = Column(String)
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
