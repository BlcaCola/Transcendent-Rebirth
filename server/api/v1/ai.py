"""
AI 生成内容保存与兑换码消耗
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Literal, Optional, Dict, Any

from ...models import World, TalentTier, Origin, SpiritRoot, Talent, RedemptionCode
from ...core.security import get_current_user_id, get_beijing_time


router = APIRouter(prefix="/ai", tags=["ai"])


class AISaveRequest(BaseModel):
    code: str
    type: Literal["world", "talent_tier", "origin", "spirit_root", "talent"]
    content: Dict[str, Any]


@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save_ai_content(
    payload: AISaveRequest,
    user_id: int = Depends(get_current_user_id)
):
    """保存 AI 生成内容并消耗兑换码"""
    # 验证兑换码
    code = payload.code.strip()
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码不能为空")

    item = await RedemptionCode.filter(code=code).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="兑换码不存在")

    if item.expires_at and item.expires_at < get_beijing_time():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码已过期")

    if item.max_uses != -1 and item.times_used >= item.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="兑换码已用完")

    content = payload.content or {}
    content_type = payload.type

    if content_type == "world":
        name = str(
            content.get("name")
            or content.get("world_name")
            or content.get("title")
            or content.get("世界名称")
            or ""
        ).strip()
        description = str(
            content.get("description")
            or content.get("desc")
            or content.get("世界描述")
            or content.get("background")
            or ""
        ).strip()
        if not name or not description:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="世界内容缺少 name 或 description")
        order = int(content.get("order", 0) or 0)
        created = await World.create(
            name=name,
            description=description,
            is_active=True,
            order=order
        )
        saved_id = created.id
    elif content_type == "talent_tier":
        name = str(content.get("name", "")).strip()
        if not name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="天资等级缺少 name")
        description = content.get("description")
        multiplier = float(content.get("multiplier", 1.0) or 1.0)
        order = int(content.get("order", 0) or 0)
        created = await TalentTier.create(
            name=name,
            description=description,
            multiplier=multiplier,
            order=order
        )
        saved_id = created.id
    elif content_type == "origin":
        name = str(content.get("name", "")).strip()
        description = str(content.get("description", "")).strip()
        if not name or not description:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="出身内容缺少 name 或 description")
        effects = content.get("effects") if isinstance(content.get("effects"), dict) else None
        order = int(content.get("order", 0) or 0)
        created = await Origin.create(
            name=name,
            description=description,
            effects=effects,
            is_active=True,
            order=order
        )
        saved_id = created.id
    elif content_type == "spirit_root":
        name = str(content.get("name", "")).strip()
        description = str(content.get("description", "")).strip()
        if not name or not description:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="改造核心内容缺少 name 或 description")
        elements = content.get("elements") if isinstance(content.get("elements"), dict) else {}
        order = int(content.get("order", 0) or 0)
        created = await SpiritRoot.create(
            name=name,
            description=description,
            elements=elements,
            is_active=True,
            order=order
        )
        saved_id = created.id
    elif content_type == "talent":
        name = str(content.get("name", "")).strip()
        if not name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="天赋内容缺少 name")
        description = content.get("description")
        talent_cost = int(content.get("talent_cost", 1) or 1)
        rarity = int(content.get("rarity", 1) or 1)
        tier_id = content.get("tier_id")
        tier = None
        if tier_id is not None:
            tier = await TalentTier.filter(id=tier_id).first()
            if not tier:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="天赋 tier_id 不存在")
        source = str(content.get("source", "ai")).strip() or "ai"
        effects = content.get("effects") if isinstance(content.get("effects"), dict) else None
        created = await Talent.create(
            name=name,
            description=description,
            talent_cost=talent_cost,
            rarity=rarity,
            tier=tier,
            source=source,
            effects=effects,
            is_active=True
        )
        saved_id = created.id
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="未知内容类型")

    # 消耗兑换码
    item.times_used += 1
    await item.save()

    return {"message": "保存成功", "saved_id": saved_id}
