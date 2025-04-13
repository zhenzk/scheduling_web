from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.auth import get_current_active_user, get_current_admin_user
from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def get_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    获取用户列表，仅管理员可访问
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=UserSchema)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取当前登录用户信息
    """
    return current_user


@router.get("/{user_id}", response_model=UserSchema)
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取指定用户信息，管理员可查看任何用户，普通用户只能查看自己
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if current_user.role != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user


@router.post("/", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    创建新用户，仅管理员可访问
    """
    # 检查用户名是否已存在
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    # 检查邮箱是否已存在
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )
    # 如果是新人且指定了师傅，检查师傅是否存在
    if user_in.is_trainee and user_in.mentor_id:
        mentor = db.query(User).filter(User.id == user_in.mentor_id).first()
        if not mentor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mentor not found",
            )
    
    # 创建新用户
    user = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        role=user_in.role,
        is_trainee=user_in.is_trainee,
        mentor_id=user_in.mentor_id,
        trainee_end_date=user_in.trainee_end_date,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新用户信息，管理员可更新任何用户，普通用户只能更新自己
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if current_user.role != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # 更新用户信息
    update_data = user_in.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    # 如果是普通用户，不允许修改角色和激活状态
    if current_user.role != "admin":
        update_data.pop("role", None)
        update_data.pop("is_active", None)
    
    # 更新用户对象
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserSchema)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    删除用户，仅管理员可访问
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    # 不允许删除自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )
    
    db.delete(user)
    db.commit()
    return user


@router.patch("/{user_id}/activate", response_model=UserSchema)
def activate_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    is_active: bool,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    激活/禁用用户，仅管理员可访问
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    # 不允许禁用自己
    if user.id == current_user.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself",
        )
    
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/trainees", response_model=List[UserSchema])
def get_trainees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取所有新人列表
    """
    trainees = db.query(User).filter(User.is_trainee == True).all()
    return trainees


@router.get("/mentors", response_model=List[UserSchema])
def get_mentors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取所有师傅列表
    """
    # 师傅可以是任何非新人的用户
    mentors = db.query(User).filter(User.is_trainee == False).all()
    return mentors


@router.post("/{trainee_id}/assign-mentor/{mentor_id}", response_model=UserSchema)
def assign_mentor(
    *,
    db: Session = Depends(get_db),
    trainee_id: str,
    mentor_id: str,
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    为新人分配师傅，仅管理员可访问
    """
    trainee = db.query(User).filter(User.id == trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found",
        )
    if not trainee.is_trainee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a trainee",
        )
    
    mentor = db.query(User).filter(User.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
    if mentor.is_trainee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mentor cannot be a trainee",
        )
    
    trainee.mentor_id = mentor.id
    db.add(trainee)
    db.commit()
    db.refresh(trainee)
    return trainee
