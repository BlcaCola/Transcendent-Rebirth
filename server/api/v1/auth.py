"""
认证路由 - 登录、注册、用户信息
"""
from datetime import timedelta, datetime
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from ...models import User, InvitationCode
from ...core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_user_id, get_current_user_info, get_beijing_time
)
from ...core.config import settings


router = APIRouter(prefix="/auth", tags=["认证"])


class RegisterRequest(BaseModel):
    user_name: str
    password: str
    email: Optional[EmailStr] = None
    email_code: Optional[str] = None
    invitation_code: Optional[str] = None
    turnstile_token: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    is_admin: bool = False
    turnstile_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    is_admin: bool


class UserProfile(BaseModel):
    user_id: int
    account_id: int
    user_name: str
    email: Optional[str]
    is_admin: bool
    travel_points: int
    last_login: Optional[str]
    created_at: str


class ConsumeTravelPointsRequest(BaseModel):
    amount: int


class ConsumeTravelPointsResponse(BaseModel):
    travel_points: int


@router.get("/security-settings")
async def get_security_settings():
    """获取安全配置"""
    return {
        "turnstile_enabled": settings.TURNSTILE_ENABLED,
        "turnstile_site_key": settings.TURNSTILE_SITE_KEY if settings.TURNSTILE_ENABLED else "",
        "email_verification_enabled": settings.EMAIL_VERIFICATION_ENABLED
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = await User.filter(user_name=data.user_name).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户名已被占用"
        )
    
    # 检查邮箱是否已存在
    if data.email:
        existing_email = await User.filter(email=data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册"
            )
    
    # 验证邀请码
    if data.invitation_code:
        inv_code = await InvitationCode.filter(code=data.invitation_code).first()
        if not inv_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码无效"
            )
        if not inv_code.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码已禁用"
            )
        if inv_code.max_uses != -1 and inv_code.times_used >= inv_code.max_uses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码已用尽"
            )
        if inv_code.expires_at and inv_code.expires_at < get_beijing_time():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码已过期"
            )
    
    # TODO: 验证 Turnstile token
    # TODO: 验证邮箱验证码
    
    # 创建用户
    import random
    password_hash = get_password_hash(data.password)
    
    # 生成唯一的账号ID
    account_id = None
    for _ in range(10):  # 最多尝试10次
        temp_id = random.randint(100000000, 999999999)  # 9位随机数
        existing = await User.filter(account_id=temp_id).first()
        if not existing:
            account_id = temp_id
            break
    
    user = await User.create(
        user_name=data.user_name,
        account_id=account_id,
        email=data.email,
        password_hash=password_hash,
        is_admin=False,
        travel_points=100  # 新用户赠送100穿越点数
    )
    
    # 更新邀请码使用次数
    if data.invitation_code:
        inv_code.times_used += 1
        await inv_code.save()
    
    return {"message": "注册成功", "user_id": user.id, "account_id": user.account_id}


@router.post("/token", response_model=TokenResponse)
async def login(data: LoginRequest):
    """用户登录"""
    # 查找用户
    user = await User.filter(user_name=data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 验证密码
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 验证是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )
    
    # 管理员登录验证
    if data.is_admin and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有管理员权限"
        )
    
    # 更新最后登录-北京时间时间
    user.last_login = get_beijing_time()
    await user.save()
    
    # TODO: 验证 Turnstile token
    
    # 生成 token
    token_data = {
        "user_id": user.id,
        "user_name": user.user_name,
        "is_admin": user.is_admin
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        user_name=user.user_name,
        is_admin=user.is_admin
    )


@router.get("/me", response_model=UserProfile)
async def get_current_user(user_id: int = Depends(get_current_user_id)):
    """获取当前用户信息"""
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserProfile(
        user_id=user.id,
        account_id=user.id,
        user_name=user.user_name,
        email=user.email,
        is_admin=user.is_admin,
        travel_points=user.travel_points,
        last_login=user.last_login.isoformat() if user.last_login else None,
        created_at=user.created_at.isoformat()
    )


@router.post("/travel-points/consume", response_model=ConsumeTravelPointsResponse)
async def consume_travel_points(
    payload: ConsumeTravelPointsRequest,
    user_id: int = Depends(get_current_user_id)
):
    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="扣减点数必须大于0"
        )

    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    if user.travel_points < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="穿越点数不足"
        )

    user.travel_points -= payload.amount
    await user.save()

    return ConsumeTravelPointsResponse(travel_points=user.travel_points)
