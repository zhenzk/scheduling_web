from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.api.auth import get_current_active_user
from app.db.session import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationUpdate, Notification as NotificationSchema

router = APIRouter()


@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    db: Session = Depends(get_db),
    is_read: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取当前用户的通知列表，可按已读状态筛选
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    # 应用筛选条件
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    # 按创建时间倒序排序
    query = query.order_by(Notification.created_at.desc())
    
    notifications = query.all()
    return notifications


@router.patch("/{notification_id}/read", response_model=NotificationSchema)
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    标记通知为已读
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    # 检查通知是否属于当前用户
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/read-all", response_model=List[NotificationSchema])
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    标记所有通知为已读
    """
    notifications = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).all()
    
    for notification in notifications:
        notification.is_read = True
        db.add(notification)
    
    db.commit()
    
    # 刷新所有对象以获取完整数据
    for notification in notifications:
        db.refresh(notification)
    
    return notifications
