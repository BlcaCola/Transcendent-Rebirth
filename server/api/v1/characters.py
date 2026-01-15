"""
角色管理路由
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional

from ...models import Character, User
from ...core.security import get_current_user_id


router = APIRouter(prefix="/characters", tags=["角色管理"])


class CharacterCreate(BaseModel):
    char_name: str
    world_id: Optional[int] = None
    save_data: dict


class CharacterOut(BaseModel):
    id: int
    char_name: str
    world_id: Optional[int]
    save_data: dict
    is_active: bool
    created_at: str
    updated_at: str


@router.post("/create")
async def create_character(
    data: CharacterCreate,
    user_id: int = Depends(get_current_user_id)
):
    """创建角色"""
    character = await Character.create(
        user_id=user_id,
        char_name=data.char_name,
        world_id=data.world_id,
        save_data=data.save_data
    )
    
    return {
        "message": "角色创建成功",
        "character_id": character.id
    }


@router.get("/{char_id}", response_model=CharacterOut)
async def get_character(
    char_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """获取角色详情"""
    character = await Character.filter(id=char_id, user_id=user_id).first()
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )
    
    return CharacterOut(
        id=character.id,
        char_name=character.char_name,
        world_id=character.world_id,
        save_data=character.save_data,
        is_active=character.is_active,
        created_at=character.created_at.isoformat(),
        updated_at=character.updated_at.isoformat()
    )


@router.put("/{char_id}/save")
async def update_character_save(
    char_id: int,
    save_data: dict,
    user_id: int = Depends(get_current_user_id)
):
    """更新角色存档"""
    character = await Character.filter(id=char_id, user_id=user_id).first()
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )
    
    character.save_data = save_data
    await character.save()
    
    return {"message": "存档更新成功"}
