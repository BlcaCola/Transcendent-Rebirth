"""
用户 API 配置
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, Optional

from ...models import UserAPIConfig
from ...core.security import get_current_user_id


router = APIRouter(prefix="/user", tags=["user-config"])


class UserAPIConfigPayload(BaseModel):
    config: Dict[str, Any]


@router.get("/api-config")
async def get_user_api_config(user_id: int = Depends(get_current_user_id)):
    """获取用户 API 配置"""
    record = await UserAPIConfig.get_or_none(user_id=user_id)
    if not record:
        return {"config": None}
    return {"config": record.config}


@router.put("/api-config", status_code=status.HTTP_200_OK)
async def save_user_api_config(
    payload: UserAPIConfigPayload,
    user_id: int = Depends(get_current_user_id)
):
    """保存/更新用户 API 配置"""
    record = await UserAPIConfig.get_or_none(user_id=user_id)
    if record:
        record.config = payload.config
        await record.save()
    else:
        await UserAPIConfig.create(user_id=user_id, config=payload.config)
    return {"message": "保存成功"}


@router.delete("/api-config", status_code=status.HTTP_204_NO_CONTENT)
async def clear_user_api_config(user_id: int = Depends(get_current_user_id)):
    """清空用户 API 配置"""
    record = await UserAPIConfig.get_or_none(user_id=user_id)
    if record:
        await record.delete()
    return None
