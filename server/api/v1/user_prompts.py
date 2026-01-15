"""
用户提示词配置
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict

from ...models import UserPromptConfig
from ...core.security import get_current_user_id

router = APIRouter(prefix="/user", tags=["user-prompts"])


class UserPromptsPayload(BaseModel):
    prompts: Dict[str, str]


@router.get("/prompts")
async def get_user_prompts(user_id: int = Depends(get_current_user_id)):
    record = await UserPromptConfig.get_or_none(user_id=user_id)
    return {"prompts": record.prompts_json if record else {}}


@router.put("/prompts", status_code=status.HTTP_200_OK)
async def save_user_prompts(
    payload: UserPromptsPayload,
    user_id: int = Depends(get_current_user_id)
):
    if not isinstance(payload.prompts, dict):
        raise HTTPException(status_code=400, detail="prompts 必须为JSON对象")

    record = await UserPromptConfig.get_or_none(user_id=user_id)
    if record:
        record.prompts_json = payload.prompts
        await record.save()
    else:
        await UserPromptConfig.create(user_id=user_id, prompts_json=payload.prompts)

    return {"message": "保存成功"}


@router.delete("/prompts", status_code=status.HTTP_204_NO_CONTENT)
async def clear_user_prompts(user_id: int = Depends(get_current_user_id)):
    record = await UserPromptConfig.get_or_none(user_id=user_id)
    if record:
        await record.delete()
    return None
