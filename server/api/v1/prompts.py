"""
默认提示词配置（用户侧）
"""
from fastapi import APIRouter, Depends
from ...models import DefaultPromptConfig
from ...core.security import get_current_user_id

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/defaults")
async def get_default_prompts(user_id: int = Depends(get_current_user_id)):
    record = await DefaultPromptConfig.first()
    return {"prompts": record.prompts_json if record else {}}
