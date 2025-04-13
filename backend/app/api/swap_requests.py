from typing import Any, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.api.auth import get_current_active_user, get_current_admin_user
from app.db.session import get_db
from app.models.models import ShiftSwapRequest, ScheduleAssignment, User, Notification
from app.schemas.schemas import ShiftSwapRequestCreate, ShiftSwapRequestUpdate, ShiftSwapRequest as ShiftSwapRequestSchema

router = APIRouter()


@router.get("/", response_model=List[ShiftSwapRequestSchema])
def get_swap_requests(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取调班申请列表，可按状态筛选
    管理员可查看所有申请，普通用户只能查看与自己相关的申请
    """
    query = db.query(ShiftSwapRequest)
    
    # 应用筛选条件
    if status:
        query = query.filter(ShiftSwapRequest.status == status)
    
    # 非管理员只能查看与自己相关的申请
    if current_user.role != "admin":
        query = query.filter(
            or_(
                ShiftSwapRequest.requester_id == current_user.id,
                ShiftSwapRequest.target_id == current_user.id
            )
        )
    
    requests = query.all()
    return requests


@router.get("/{request_id}", response_model=ShiftSwapRequestSchema)
def get_swap_request_by_id(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取指定调班申请详情
    管理员可查看任何申请，普通用户只能查看与自己相关的申请
    """
    request = db.query(ShiftSwapRequest).filter(ShiftSwapRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found",
        )
    
    # 检查权限
    if current_user.role != "admin" and current_user.id != request.requester_id and current_user.id != request.target_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return request


@router.post("/", response_model=ShiftSwapRequestSchema)
def create_swap_request(
    *,
    db: Session = Depends(get_db),
    request_in: ShiftSwapRequestCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建调班申请
    """
    # 检查申请人是否为当前用户
    if current_user.id != request_in.requester_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only create swap requests for yourself",
        )
    
    # 检查申请人和目标人是否存在
    requester = db.query(User).filter(User.id == request_in.requester_id).first()
    if not requester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requester not found",
        )
    
    target = db.query(User).filter(User.id == request_in.target_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found",
        )
    
    # 检查申请人的班次是否存在
    requester_shift = db.query(ScheduleAssignment).filter(ScheduleAssignment.id == request_in.requester_shift_id).first()
    if not requester_shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requester shift not found",
        )
    
    # 检查申请人的班次是否属于申请人
    if requester_shift.user_id != request_in.requester_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requester shift does not belong to requester",
        )
    
    # 检查目标人的班次是否存在（如果提供）
    if request_in.target_shift_id:
        target_shift = db.query(ScheduleAssignment).filter(ScheduleAssignment.id == request_in.target_shift_id).first()
        if not target_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target shift not found",
            )
        
        # 检查目标人的班次是否属于目标人
        if target_shift.user_id != request_in.target_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target shift does not belong to target",
            )
    
    # 检查是否已存在相同的申请
    existing = db.query(ShiftSwapRequest).filter(
        and_(
            ShiftSwapRequest.requester_id == request_in.requester_id,
            ShiftSwapRequest.requester_shift_id == request_in.requester_shift_id,
            ShiftSwapRequest.target_id == request_in.target_id,
            ShiftSwapRequest.status == "pending"
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Similar swap request already exists",
        )
    
    # 检查每月调班次数限制（每人每月最多3次）
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(microseconds=1)
    
    monthly_requests = db.query(ShiftSwapRequest).filter(
        and_(
            ShiftSwapRequest.requester_id == request_in.requester_id,
            ShiftSwapRequest.created_at >= month_start,
            ShiftSwapRequest.created_at <= month_end
        )
    ).count()
    
    if monthly_requests >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly swap request limit reached (3 per month)",
        )
    
    # 创建调班申请
    swap_request = ShiftSwapRequest(
        requester_id=request_in.requester_id,
        requester_shift_id=request_in.requester_shift_id,
        target_id=request_in.target_id,
        target_shift_id=request_in.target_shift_id,
        reason=request_in.reason,
        status="pending"
    )
    db.add(swap_request)
    db.commit()
    db.refresh(swap_request)
    
    # 创建通知
    notification = Notification(
        user_id=request_in.target_id,
        title="新的调班申请",
        content=f"{requester.name}向您发起了调班申请，请查看并处理。",
        type="swap_request",
        related_id=swap_request.id
    )
    db.add(notification)
    db.commit()
    
    return swap_request


@router.patch("/{request_id}/respond", response_model=ShiftSwapRequestSchema)
def respond_to_swap_request(
    *,
    db: Session = Depends(get_db),
    request_id: str,
    response: str,  # "accepted" or "rejected"
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    响应调班申请（接受/拒绝）
    """
    # 检查申请是否存在
    swap_request = db.query(ShiftSwapRequest).filter(ShiftSwapRequest.id == request_id).first()
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found",
        )
    
    # 检查是否为目标人
    if current_user.id != swap_request.target_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the target user can respond to this request",
        )
    
    # 检查申请状态
    if swap_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot respond to a request with status '{swap_request.status}'",
        )
    
    # 检查响应是否有效
    if response not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Response must be 'accepted' or 'rejected'",
        )
    
    # 更新申请状态
    swap_request.status = response
    db.add(swap_request)
    db.commit()
    db.refresh(swap_request)
    
    # 创建通知
    requester = db.query(User).filter(User.id == swap_request.requester_id).first()
    target = db.query(User).filter(User.id == swap_request.target_id).first()
    
    notification = Notification(
        user_id=swap_request.requester_id,
        title="调班申请回复",
        content=f"{target.name}已{response == 'accepted' and '接受' or '拒绝'}您的调班申请。",
        type="swap_request",
        related_id=swap_request.id
    )
    db.add(notification)
    
    # 如果接受，还需要管理员审批
    if response == "accepted":
        # 通知管理员
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            admin_notification = Notification(
                user_id=admin.id,
                title="调班申请等待审批",
                content=f"{requester.name}和{target.name}的调班申请等待您的审批。",
                type="approval",
                related_id=swap_request.id
            )
            db.add(admin_notification)
    
    db.commit()
    
    return swap_request


@router.patch("/{request_id}/approve", response_model=ShiftSwapRequestSchema)
def approve_swap_request(
    *,
    db: Session = Depends(get_db),
    request_id: str,
    approval: str,  # "approved" or "rejected"
    comment: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    管理员审批调班申请，仅管理员可访问
    """
    # 检查申请是否存在
    swap_request = db.query(ShiftSwapRequest).filter(ShiftSwapRequest.id == request_id).first()
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found",
        )
    
    # 检查申请状态
    if swap_request.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve a request with status '{swap_request.status}'",
        )
    
    # 检查审批是否有效
    if approval not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval must be 'approved' or 'rejected'",
        )
    
    # 更新申请状态
    swap_request.status = approval
    swap_request.admin_id = current_user.id
    swap_request.admin_comment = comment
    db.add(swap_request)
    
    # 如果批准，执行调班操作
    if approval == "approved":
        requester_shift = db.query(ScheduleAssignment).filter(ScheduleAssignment.id == swap_request.requester_shift_id).first()
        
        if swap_request.target_shift_id:
            target_shift = db.query(ScheduleAssignment).filter(ScheduleAssignment.id == swap_request.target_shift_id).first()
            
            # 交换用户ID
            requester_shift.user_id, target_shift.user_id = target_shift.user_id, requester_shift.user_id
            
            db.add(requester_shift)
            db.add(target_shift)
        else:
            # 如果没有目标班次，只需将申请人的班次分配给目标人
            requester_shift.user_id = swap_request.target_id
            db.add(requester_shift)
    
    db.commit()
    db.refresh(swap_request)
    
    # 创建通知
    requester = db.query(User).filter(User.id == swap_request.requester_id).first()
    target = db.query(User).filter(User.id == swap_request.target_id).first()
    
    # 通知申请人
    requester_notification = Notification(
        user_id=swap_request.requester_id,
        title="调班申请审批结果",
        content=f"您与{target.name}的调班申请已被管理员{approval == 'approved' and '批准' or '拒绝'}。{comment or ''}",
        type="approval",
        related_id=swap_request.id
    )
    db.add(requester_notification)
    
    # 通知目标人
    target_notification = Notification(
        user_id=swap_request.target_id,
        title="调班申请审批结果",
        content=f"您与{requester.name}的调班申请已被管理员{approval == 'approved' and '批准' or '拒绝'}。{comment or ''}",
        type="approval",
        related_id=swap_request.id
    )
    db.add(target_notification)
    
    db.commit()
    
    return swap_request


@router.get("/user/{user_id}", response_model=List[ShiftSwapRequestSchema])
def get_user_swap_requests(
    user_id: str,
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取指定用户相关的调班申请
    管理员可查看任何用户，普通用户只能查看自己
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
    
    query = db.query(ShiftSwapRequest).filter(
        or_(
            ShiftSwapRequest.requester_id == user_id,
            ShiftSwapRequest.target_id == user_id
        )
    )
    
    # 应用筛选条件
    if status:
        query = query.filter(ShiftSwapRequest.status == status)
    
    requests = query.all()
    return requests
