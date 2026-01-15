"""
用户本地存档数据（角色列表/存档JSON）
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict

from ...models import UserLocalData
from ...core.security import get_current_user_id


router = APIRouter(prefix="/user", tags=["user-local-data"])


class UserLocalDataPayload(BaseModel):
    characters: Dict[str, Any]
    saves: Dict[str, Any]


@router.get("/local-data")
async def get_user_local_data(user_id: int = Depends(get_current_user_id)):
    record = await UserLocalData.get_or_none(user_id=user_id)
    if not record:
        return {"characters": None, "saves": None}
    return {
        "characters": record.characters_json,
        "saves": record.saves_json,
    }


@router.put("/local-data", status_code=status.HTTP_200_OK)
async def save_user_local_data(
    payload: UserLocalDataPayload,
    user_id: int = Depends(get_current_user_id)
):
    record = await UserLocalData.get_or_none(user_id=user_id)
    if record:
        record.characters_json = payload.characters
        record.saves_json = payload.saves
        await record.save()
    else:
        await UserLocalData.create(
            user_id=user_id,
            characters_json=payload.characters,
            saves_json=payload.saves
        )
    return {"message": "保存成功"}


@router.delete("/local-data", status_code=status.HTTP_204_NO_CONTENT)
async def clear_user_local_data(user_id: int = Depends(get_current_user_id)):
    record = await UserLocalData.get_or_none(user_id=user_id)
    if record:
        await record.delete()
    return None
