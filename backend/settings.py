from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.api.auth import get_current_admin_user
from app.db.session import get_db
from app.models.models import SystemSetting, User
from app.schemas.schemas import SystemSettingCreate, SystemSettingUpdate, SystemSetting as SystemSettingSchema

router = APIRouter()


@router.get("/", response_model=List[SystemSettingSchema])
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    获取系统设置，仅管理员可访问
    """
    settings = db.query(SystemSetting).all()
    return settings


@router.get("/{key}", response_model=SystemSettingSchema)
def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    获取指定键的系统设置，仅管理员可访问
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found",
        )
    return setting


@router.put("/{key}", response_model=SystemSettingSchema)
def update_setting(
    *,
    db: Session = Depends(get_db),
    key: str,
    setting_in: SystemSettingUpdate,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    更新系统设置，仅管理员可访问
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if not setting:
        # 如果设置不存在，创建新设置
        setting = SystemSetting(
            key=key,
            value=setting_in.value,
            description=setting_in.description,
            updated_by=current_user.id
        )
    else:
        # 更新现有设置
        setting.value = setting_in.value
        if setting_in.description:
            setting.description = setting_in.description
        setting.updated_by = current_user.id
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
