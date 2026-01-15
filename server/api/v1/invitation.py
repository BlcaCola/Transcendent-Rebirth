from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from server.models.user import InvitationCode, User
from server.core.security import verify_admin, get_beijing_time
import secrets
import string

router = APIRouter(prefix="/admin/invitation-codes", tags=["invitation-codes"])

class InvitationCodeCreateRequest:
    """创建邀请码请求"""
    max_uses: int = -1  # -1表示无限制
    expires_at: Optional[datetime] = None
    description: Optional[str] = None

class InvitationCodeResponse:
    """邀请码响应"""
    id: int
    code: str
    is_active: bool
    max_uses: int
    times_used: int
    expires_at: Optional[datetime]
    created_at: datetime
    created_by: str
    description: Optional[str]

def generate_invitation_code(length: int = 8) -> str:
    """生成随机邀请码"""
    characters = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_invitation_code(
    max_uses: int = -1,
    days_valid: Optional[int] = None,
    custom_code: Optional[str] = None,
    current_user: User = Depends(verify_admin)
):
    """创建邀请码"""
    # 使用自定义邀请码或生成随机邀请码
    if custom_code:
        code = custom_code.strip()
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码不能为空"
            )
        if len(code) < 4 or len(code) > 32:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码长度必须在4-32字符之间"
            )
    else:
        code = generate_invitation_code()
    
    expires_at = None
    if days_valid:
        expires_at = get_beijing_time() + timedelta(days=days_valid)
    
    # 检查唯一性
    existing = await InvitationCode.filter(code=code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邀请码已存在"
        )
    
    inv_code = await InvitationCode.create(
        code=code,
        is_active=True,
        max_uses=max_uses,
        times_used=0,
        expires_at=expires_at,
        created_by=current_user.id,
        created_at=get_beijing_time()
    )
    
    return {
        "id": inv_code.id,
        "code": inv_code.code,
        "is_active": inv_code.is_active,
        "max_uses": inv_code.max_uses,
        "times_used": inv_code.times_used,
        "expires_at": inv_code.expires_at,
        "created_at": inv_code.created_at,
        "created_by": inv_code.created_by
    }

@router.get("")
async def list_invitation_codes(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(verify_admin)
):
    """获取邀请码列表"""
    codes = await InvitationCode.all().offset(skip).limit(limit)
    total = await InvitationCode.all().count()
    
    return {
        "total": total,
        "items": [
            {
                "id": code.id,
                "code": code.code,
                "is_active": code.is_active,
                "max_uses": code.max_uses,
                "times_used": code.times_used,
                "expires_at": code.expires_at,
                "created_at": code.created_at,
                "created_by": code.created_by
            }
            for code in codes
        ]
    }

@router.get("/{code_id}")
async def get_invitation_code(
    code_id: int,
    current_user: User = Depends(verify_admin)
):
    """获取单个邀请码信息"""
    code = await InvitationCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码不存在"
        )
    
    return {
        "id": code.id,
        "code": code.code,
        "is_active": code.is_active,
        "max_uses": code.max_uses,
        "times_used": code.times_used,
        "expires_at": code.expires_at,
        "created_at": code.created_at,
        "created_by": code.created_by
    }

@router.patch("/{code_id}")
async def update_invitation_code(
    code_id: int,
    is_active: Optional[bool] = None,
    current_user: User = Depends(verify_admin)
):
    """修改邀请码状态"""
    code = await InvitationCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码不存在"
        )
    
    if is_active is not None:
        code.is_active = is_active
        await code.save()
    
    return {
        "id": code.id,
        "code": code.code,
        "is_active": code.is_active,
        "max_uses": code.max_uses,
        "times_used": code.times_used,
        "expires_at": code.expires_at,
        "created_at": code.created_at,
        "created_by": code.created_by
    }

@router.delete("/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation_code(
    code_id: int,
    current_user: User = Depends(verify_admin)
):
    """删除邀请码"""
    code = await InvitationCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="邀请码不存在"
        )
    
    await code.delete()
