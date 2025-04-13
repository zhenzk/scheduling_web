import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, CheckConstraint, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import sqlalchemy

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    role = Column(String(20), CheckConstraint("role IN ('admin', 'day_shift', 'night_shift')"))
    is_trainee = Column(Boolean, default=False)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    trainee_end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # 关系
    trainees = relationship("User", foreign_keys=[mentor_id])
    shifts = relationship("ScheduleAssignment", back_populates="user")
    requested_swaps = relationship("ShiftSwapRequest", foreign_keys="ShiftSwapRequest.requester_id", back_populates="requester")
    targeted_swaps = relationship("ShiftSwapRequest", foreign_keys="ShiftSwapRequest.target_id", back_populates="target")
    notifications = relationship("Notification", back_populates="user")


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    shift_type = Column(
        String(20), 
        CheckConstraint("shift_type IN ('DAY_WORKDAY', 'DAY_HOLIDAY', 'NIGHT_WORKDAY', 'NIGHT_HOLIDAY')"),
        nullable=False
    )
    required_mentors = Column(Integer, default=0)
    required_staff = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    assignments = relationship("ScheduleAssignment", back_populates="shift")


class ScheduleAssignment(Base):
    __tablename__ = "schedule_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    user = relationship("User", back_populates="shifts")
    shift = relationship("Shift", back_populates="assignments")
    requester_swaps = relationship("ShiftSwapRequest", foreign_keys="ShiftSwapRequest.requester_shift_id", back_populates="requester_shift")
    target_swaps = relationship("ShiftSwapRequest", foreign_keys="ShiftSwapRequest.target_shift_id", back_populates="target_shift")

    __table_args__ = (
        # 确保用户和班次的组合是唯一的
        sqlalchemy.UniqueConstraint(user_id, shift_id),
    )


class ShiftSwapRequest(Base):
    __tablename__ = "shift_swap_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requester_shift_id = Column(UUID(as_uuid=True), ForeignKey("schedule_assignments.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_shift_id = Column(UUID(as_uuid=True), ForeignKey("schedule_assignments.id", ondelete="CASCADE"), nullable=True)
    status = Column(
        String(20), 
        CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'approved', 'cancelled')"),
        default="pending"
    )
    reason = Column(Text)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    requester = relationship("User", foreign_keys=[requester_id], back_populates="requested_swaps")
    target = relationship("User", foreign_keys=[target_id], back_populates="targeted_swaps")
    requester_shift = relationship("ScheduleAssignment", foreign_keys=[requester_shift_id], back_populates="requester_swaps")
    target_shift = relationship("ScheduleAssignment", foreign_keys=[target_shift_id], back_populates="target_swaps")
    admin = relationship("User", foreign_keys=[admin_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(
        String(20), 
        CheckConstraint("type IN ('system', 'shift_change', 'swap_request', 'approval')"),
        nullable=False
    )
    related_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    user = relationship("User", back_populates="notifications")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(String, nullable=False)  # 使用String而不是JSONB，因为SQLAlchemy对JSONB的支持可能需要额外配置
    description = Column(Text)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    updater = relationship("User")
