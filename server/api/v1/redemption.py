from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from datetime import datetime, timedelta
from server.models.user import RedemptionCode, User
from server.core.security import verify_admin, get_beijing_time
import secrets
import string

router = APIRouter(prefix="/redemption", tags=["redemption"])
admin_router = APIRouter(prefix="/admin/redemption-codes", tags=["redemption-codes"])


def generate_redemption_code(length: int = 12) -> str:
    """生成随机兑换码"""
    characters = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


@router.post("/validate/{code}")
async def validate_redemption_code(code: str):
    """校验兑换码是否有效（不消耗次数）"""
    code = code.strip()
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码不能为空")

    item = await RedemptionCode.get_or_none(code=code)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="兑换码不存在")

    if item.expires_at and item.expires_at < get_beijing_time():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码已过期")

    if item.max_uses >= 0 and item.times_used >= item.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码已用尽")

    return {
        "id": item.id,
        "code": item.code,
        "times_used": item.times_used,
        "max_uses": item.max_uses,
        "expires_at": item.expires_at,
    }


@admin_router.post("", status_code=status.HTTP_201_CREATED)
async def create_redemption_code(
    max_uses: int = 1,
    days_valid: Optional[int] = None,
    custom_code: Optional[str] = None,
    reward_type: str = "ai",
    reward_value: int = 1,
    current_user: User = Depends(verify_admin)
):
    """创建兑换码（管理员）"""
    if custom_code is not None:
        code = custom_code.strip()
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码不能为空")
        if len(code) < 4 or len(code) > 50:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码长度必须在4-50字符之间")
    else:
        code = generate_redemption_code()

    if max_uses == 0 or max_uses < -1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最大使用次数不合法")

    if reward_value <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="奖励数值必须大于0")

    expires_at: Optional[datetime] = None
    if days_valid:
        expires_at = get_beijing_time() + timedelta(days=days_valid)

    existing = await RedemptionCode.filter(code=code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该兑换码已存在")

    item = await RedemptionCode.create(
        code=code,
        reward_type=reward_type,
        reward_value=reward_value,
        max_uses=max_uses,
        times_used=0,
        expires_at=expires_at,
        created_at=get_beijing_time()
    )

    return {
        "id": item.id,
        "code": item.code,
        "reward_type": item.reward_type,
        "reward_value": item.reward_value,
        "max_uses": item.max_uses,
        "times_used": item.times_used,
        "expires_at": item.expires_at,
        "created_at": item.created_at,
        "created_by": current_user.id
    }


@admin_router.get("")
async def list_redemption_codes(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(verify_admin)
):
    """获取兑换码列表（管理员）"""
    items = await RedemptionCode.all().offset(skip).limit(limit)
    total = await RedemptionCode.all().count()

    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "code": item.code,
                "reward_type": item.reward_type,
                "reward_value": item.reward_value,
                "max_uses": item.max_uses,
                "times_used": item.times_used,
                "expires_at": item.expires_at,
                "created_at": item.created_at
            }
            for item in items
        ]
    }


@admin_router.get("/{code_id}")
async def get_redemption_code(
    code_id: int,
    current_user: User = Depends(verify_admin)
):
    """获取单个兑换码信息（管理员）"""
    item = await RedemptionCode.get_or_none(id=code_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="兑换码不存在")

    return {
        "id": item.id,
        "code": item.code,
        "reward_type": item.reward_type,
        "reward_value": item.reward_value,
        "max_uses": item.max_uses,
        "times_used": item.times_used,
        "expires_at": item.expires_at,
        "created_at": item.created_at
    }


@admin_router.patch("/{code_id}")
async def update_redemption_code(
    code_id: int,
    max_uses: Optional[int] = None,
    expires_at: Optional[datetime] = None,
    current_user: User = Depends(verify_admin)
):
    """更新兑换码（管理员）"""
    item = await RedemptionCode.get_or_none(id=code_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="兑换码不存在")

    if max_uses is not None:
        if max_uses == 0 or max_uses < -1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最大使用次数不合法")
        item.max_uses = max_uses

    if expires_at is not None:
        item.expires_at = expires_at

    await item.save()

    return {
        "id": item.id,
        "code": item.code,
        "reward_type": item.reward_type,
        "reward_value": item.reward_value,
        "max_uses": item.max_uses,
        "times_used": item.times_used,
        "expires_at": item.expires_at,
        "created_at": item.created_at
    }


@admin_router.delete("/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_redemption_code(
    code_id: int,
    current_user: User = Depends(verify_admin)
):
    """删除兑换码（管理员）"""
    item = await RedemptionCode.get_or_none(id=code_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="兑换码不存在")

    await item.delete()
