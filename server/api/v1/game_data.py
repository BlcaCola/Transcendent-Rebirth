"""
游戏数据路由 - 世界、天赋、灵根等
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional

from ...models import World, TalentTier, Origin, SpiritRoot, Talent
from ...core.security import require_admin


router = APIRouter(tags=["游戏数据"])


# === 世界相关 ===
class WorldOut(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    order: int
    
    class Config:
        from_attributes = True


@router.get("/worlds/", response_model=List[WorldOut])
async def list_worlds():
    """获取世界列表"""
    worlds = await World.filter(is_active=True).order_by("order")
    return [WorldOut.model_validate(w) for w in worlds]


# === 天资等级相关 ===
class TalentTierOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    multiplier: float
    order: int
    
    class Config:
        from_attributes = True


@router.get("/talent_tiers/", response_model=List[TalentTierOut])
async def list_talent_tiers():
    """获取天资等级列表"""
    tiers = await TalentTier.all().order_by("order")
    return [TalentTierOut.model_validate(t) for t in tiers]


# === 出身相关 ===
class OriginOut(BaseModel):
    id: int
    name: str
    description: str
    effects: Optional[dict]
    is_active: bool
    order: int
    
    class Config:
        from_attributes = True


@router.get("/origins/", response_model=List[OriginOut])
async def list_origins():
    """获取出身列表"""
    origins = await Origin.filter(is_active=True).order_by("order")
    return [OriginOut.model_validate(o) for o in origins]


# === 灵根相关 ===
class SpiritRootOut(BaseModel):
    id: int
    name: str
    description: str
    elements: dict
    is_active: bool
    order: int
    
    class Config:
        from_attributes = True


@router.get("/spirit_roots/", response_model=List[SpiritRootOut])
async def list_spirit_roots():
    """获取灵根列表"""
    roots = await SpiritRoot.filter(is_active=True).order_by("order")
    return [SpiritRootOut.model_validate(r) for r in roots]


# === 天赋相关 ===
class TalentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    talent_cost: int
    rarity: int
    tier_id: Optional[int]
    source: Optional[str]
    effects: Optional[dict]
    is_active: bool
    
    class Config:
        from_attributes = True


@router.get("/talents/", response_model=List[TalentOut])
async def list_talents():
    """获取天赋列表"""
    talents = await Talent.filter(is_active=True).prefetch_related("tier")
    result = []
    for t in talents:
        tier_id = t.tier.id if t.tier else None
        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "talent_cost": t.talent_cost,
            "rarity": t.rarity,
            "tier_id": tier_id,
            "source": t.source,
            "effects": t.effects,
            "is_active": t.is_active
        })
    return result
