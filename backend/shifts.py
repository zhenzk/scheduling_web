from typing import Any, List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.api.auth import get_current_active_user, get_current_admin_user
from app.db.session import get_db
from app.models.models import Shift, ScheduleAssignment, User
from app.schemas.schemas import ShiftCreate, ShiftUpdate, Shift as ShiftSchema
from app.schemas.schemas import ScheduleAssignmentCreate, ScheduleAssignment as ScheduleAssignmentSchema

router = APIRouter()


@router.get("/", response_model=List[ShiftSchema])
def get_shifts(
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    shift_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取班次列表，可按日期范围和类型筛选
    """
    query = db.query(Shift)
    
    # 应用筛选条件
    if start_date:
        query = query.filter(Shift.start_time >= start_date)
    if end_date:
        query = query.filter(Shift.end_time <= end_date)
    if shift_type:
        query = query.filter(Shift.shift_type == shift_type)
    
    shifts = query.all()
    return shifts


@router.get("/{shift_id}", response_model=ShiftSchema)
def get_shift_by_id(
    shift_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取指定班次信息
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )
    return shift


@router.post("/", response_model=ShiftSchema)
def create_shift(
    *,
    db: Session = Depends(get_db),
    shift_in: ShiftCreate,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    创建新班次，仅管理员可访问
    """
    # 检查时间范围是否有效
    if shift_in.start_time >= shift_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )
    
    # 创建新班次
    shift = Shift(
        start_time=shift_in.start_time,
        end_time=shift_in.end_time,
        shift_type=shift_in.shift_type,
        required_mentors=shift_in.required_mentors,
        required_staff=shift_in.required_staff,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.put("/{shift_id}", response_model=ShiftSchema)
def update_shift(
    *,
    db: Session = Depends(get_db),
    shift_id: str,
    shift_in: ShiftUpdate,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    更新班次信息，仅管理员可访问
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )
    
    # 更新班次信息
    update_data = shift_in.dict(exclude_unset=True)
    
    # 如果更新了时间，检查时间范围是否有效
    if "start_time" in update_data and "end_time" in update_data:
        if update_data["start_time"] >= update_data["end_time"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time",
            )
    elif "start_time" in update_data and update_data["start_time"] >= shift.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time",
        )
    elif "end_time" in update_data and shift.start_time >= update_data["end_time"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )
    
    # 更新班次对象
    for field, value in update_data.items():
        setattr(shift, field, value)
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.delete("/{shift_id}", response_model=ShiftSchema)
def delete_shift(
    *,
    db: Session = Depends(get_db),
    shift_id: str,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    删除班次，仅管理员可访问
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )
    
    # 检查是否有关联的排班
    assignments = db.query(ScheduleAssignment).filter(ScheduleAssignment.shift_id == shift_id).all()
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete shift with existing assignments",
        )
    
    db.delete(shift)
    db.commit()
    return shift


# 排班相关API
@router.get("/schedules", response_model=List[ScheduleAssignmentSchema])
def get_schedules(
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取排班表，可按日期范围筛选
    """
    query = db.query(ScheduleAssignment).join(Shift)
    
    # 应用筛选条件
    if start_date:
        query = query.filter(Shift.start_time >= start_date)
    if end_date:
        query = query.filter(Shift.end_time <= end_date)
    
    # 非管理员只能查看自己的排班
    if current_user.role != "admin":
        query = query.filter(ScheduleAssignment.user_id == current_user.id)
    
    schedules = query.all()
    return schedules


@router.post("/schedules/generate", response_model=List[ScheduleAssignmentSchema])
def generate_schedule(
    *,
    db: Session = Depends(get_db),
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    自动生成排班表，仅管理员可访问
    """
    # 这里应该实现排班算法，根据需求文档中的规则自动生成排班
    # 由于算法复杂度较高，这里只实现一个简单的示例
    
    # 获取指定日期范围内的班次
    shifts = db.query(Shift).filter(
        and_(
            Shift.start_time >= datetime.combine(start_date, datetime.min.time()),
            Shift.end_time <= datetime.combine(end_date, datetime.max.time())
        )
    ).all()
    
    if not shifts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No shifts found in the specified date range",
        )
    
    # 获取所有活跃用户
    users = db.query(User).filter(User.is_active == True).all()
    
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active users found",
        )
    
    # 清除指定日期范围内的现有排班
    existing_assignments = db.query(ScheduleAssignment).join(Shift).filter(
        and_(
            Shift.start_time >= datetime.combine(start_date, datetime.min.time()),
            Shift.end_time <= datetime.combine(end_date, datetime.max.time())
        )
    ).all()
    
    for assignment in existing_assignments:
        db.delete(assignment)
    
    # 简单的排班逻辑：轮流分配用户到班次
    assignments = []
    user_index = 0
    
    for shift in shifts:
        # 根据班次类型和需求分配不同数量的人员
        required_staff = shift.required_staff
        
        for _ in range(required_staff):
            # 确保不超出用户列表范围
            if user_index >= len(users):
                user_index = 0
            
            # 检查用户角色是否符合班次类型
            user = users[user_index]
            
            # 白班只能分配给白班人员，夜班只能分配给夜班人员
            if ("DAY" in shift.shift_type and user.role == "day_shift") or \
               ("NIGHT" in shift.shift_type and user.role == "night_shift") or \
               user.role == "admin":  # 管理员可以被分配到任何班次
                
                # 如果是新人，确保其师傅也被分配到同一班次
                if user.is_trainee and user.mentor_id:
                    mentor = db.query(User).filter(User.id == user.mentor_id).first()
                    if mentor:
                        assignment = ScheduleAssignment(
                            user_id=mentor.id,
                            shift_id=shift.id,
                            is_primary=True
                        )
                        db.add(assignment)
                        assignments.append(assignment)
                
                # 创建排班分配
                assignment = ScheduleAssignment(
                    user_id=user.id,
                    shift_id=shift.id,
                    is_primary=True
                )
                db.add(assignment)
                assignments.append(assignment)
            
            user_index += 1
    
    db.commit()
    
    # 刷新所有对象以获取完整数据
    for assignment in assignments:
        db.refresh(assignment)
    
    return assignments


@router.get("/schedules/user/{user_id}", response_model=List[ScheduleAssignmentSchema])
def get_user_schedule(
    user_id: str,
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取指定用户的排班，管理员可查看任何用户，普通用户只能查看自己
    """
    # 检查权限
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # 检查用户是否存在
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    query = db.query(ScheduleAssignment).filter(ScheduleAssignment.user_id == user_id).join(Shift)
    
    # 应用筛选条件
    if start_date:
        query = query.filter(Shift.start_time >= start_date)
    if end_date:
        query = query.filter(Shift.end_time <= end_date)
    
    schedules = query.all()
    return schedules


@router.post("/schedules/assign", response_model=ScheduleAssignmentSchema)
def assign_schedule(
    *,
    db: Session = Depends(get_db),
    assignment_in: ScheduleAssignmentCreate,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    手动分配排班，仅管理员可访问
    """
    # 检查用户是否存在
    user = db.query(User).filter(User.id == assignment_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # 检查班次是否存在
    shift = db.query(Shift).filter(Shift.id == assignment_in.shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )
    
    # 检查是否已存在相同的排班
    existing = db.query(ScheduleAssignment).filter(
        and_(
            ScheduleAssignment.user_id == assignment_in.user_id,
            ScheduleAssignment.shift_id == assignment_in.shift_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment already exists",
        )
    
    # 创建排班分配
    assignment = ScheduleAssignment(
        user_id=assignment_in.user_id,
        shift_id=assignment_in.shift_id,
        is_primary=assignment_in.is_primary
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/schedules/{assignment_id}", response_model=ScheduleAssignmentSchema)
def delete_schedule_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_id: str,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    删除排班分配，仅管理员可访问
    """
    assignment = db.query(ScheduleAssignment).filter(ScheduleAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    
    db.delete(assignment)
    db.commit()
    return assignment
