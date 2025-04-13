from typing import Optional, List
from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime


# 用户相关模型
class UserBase(BaseModel):
    username: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_trainee: bool = False
    mentor_id: Optional[UUID4] = None
    trainee_end_date: Optional[datetime] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_trainee: Optional[bool] = None
    mentor_id: Optional[UUID4] = None
    trainee_end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password_hash: str


# 班次相关模型
class ShiftBase(BaseModel):
    start_time: datetime
    end_time: datetime
    shift_type: str
    required_mentors: int = 0
    required_staff: int = 1


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    shift_type: Optional[str] = None
    required_mentors: Optional[int] = None
    required_staff: Optional[int] = None


class ShiftInDBBase(ShiftBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Shift(ShiftInDBBase):
    pass


# 排班分配相关模型
class ScheduleAssignmentBase(BaseModel):
    user_id: UUID4
    shift_id: UUID4
    is_primary: bool = True


class ScheduleAssignmentCreate(ScheduleAssignmentBase):
    pass


class ScheduleAssignmentUpdate(BaseModel):
    is_primary: Optional[bool] = None


class ScheduleAssignmentInDBBase(ScheduleAssignmentBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ScheduleAssignment(ScheduleAssignmentInDBBase):
    user: User
    shift: Shift


# 调班申请相关模型
class ShiftSwapRequestBase(BaseModel):
    requester_id: UUID4
    requester_shift_id: UUID4
    target_id: UUID4
    target_shift_id: Optional[UUID4] = None
    reason: Optional[str] = None


class ShiftSwapRequestCreate(ShiftSwapRequestBase):
    pass


class ShiftSwapRequestUpdate(BaseModel):
    status: Optional[str] = None
    admin_id: Optional[UUID4] = None
    admin_comment: Optional[str] = None


class ShiftSwapRequestInDBBase(ShiftSwapRequestBase):
    id: UUID4
    status: str
    admin_id: Optional[UUID4] = None
    admin_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ShiftSwapRequest(ShiftSwapRequestInDBBase):
    requester: User
    target: User
    requester_shift: ScheduleAssignment
    target_shift: Optional[ScheduleAssignment] = None


# 通知相关模型
class NotificationBase(BaseModel):
    user_id: UUID4
    title: str
    content: str
    type: str
    related_id: Optional[UUID4] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    is_read: bool = True


class NotificationInDBBase(NotificationBase):
    id: UUID4
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


class Notification(NotificationInDBBase):
    pass


# 系统设置相关模型
class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None
    updated_by: UUID4


class SystemSettingInDBBase(SystemSettingBase):
    id: UUID4
    updated_by: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class SystemSetting(SystemSettingInDBBase):
    pass


# 令牌相关模型
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
