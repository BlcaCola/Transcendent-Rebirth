"""
管理员路由 - 用户管理、数据管理等
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ...models import User, Character, World, Talent, Origin, SpiritRoot, TalentTier, UserLocalData, DefaultPromptConfig, UserPromptConfig
from ...core.security import require_admin, get_password_hash
import json
from urllib.parse import quote


router = APIRouter(prefix="/admin", tags=["管理员"])


# === 用户管理 ===
class UserListItem(BaseModel):
    id: int
    account_id: Optional[int]
    user_name: str
    email: Optional[str]
    is_admin: bool
    is_active: bool
    travel_points: int
    created_at: str
    last_login: Optional[str]


@router.get("/users", response_model=List[UserListItem], dependencies=[Depends(require_admin)])
async def list_users():
    """获取用户列表"""
    users = await User.all().order_by("-created_at")
    return [
        UserListItem(
            id=u.id,
            account_id=u.account_id,
            user_name=u.user_name,
            email=u.email,
            is_admin=u.is_admin,
            is_active=u.is_active,
            travel_points=u.travel_points,
            created_at=u.created_at.isoformat(),
            last_login=u.last_login.isoformat() if u.last_login else None
        )
        for u in users
    ]


class UserUpdateRequest(BaseModel):
    user_name: str
    account_id: Optional[int] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_admin: bool
    travel_points: Optional[int] = None


class DefaultPromptsPayload(BaseModel):
    prompts: Dict[str, str]


class UserPromptListItem(BaseModel):
    user_id: int
    user_name: str
    created_at: str
    updated_at: str


@router.put("/users/{user_id}", dependencies=[Depends(require_admin)])
async def update_user(user_id: int, data: UserUpdateRequest):
    """更新用户信息"""
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 检查用户名是否已被其他用户使用
    if data.user_name != user.user_name:
        existing = await User.filter(user_name=data.user_name).first()
        if existing:
            raise HTTPException(status_code=400, detail="该用户名已被占用")
    
    # 检查账号ID是否已被其他用户使用
    if data.account_id is not None and data.account_id != user.account_id:
        existing = await User.filter(account_id=data.account_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="该账号ID已被占用")
    
    user.user_name = data.user_name
    user.account_id = data.account_id
    user.email = data.email
    user.is_admin = data.is_admin
    if data.travel_points is not None:
        if data.travel_points < 0:
            raise HTTPException(status_code=400, detail="穿越点数不能为负数")
        user.travel_points = data.travel_points
    
    if data.password:
        user.password_hash = get_password_hash(data.password)
    
    await user.save()
    return {"message": "更新成功"}


@router.put("/users/{user_id}/travel_points", dependencies=[Depends(require_admin)])
async def update_user_travel_points(user_id: int, points: int):
    """更新用户穿越点数"""
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user.travel_points = points
    await user.save()
    return {"message": "更新成功", "travel_points": user.travel_points}


@router.put("/users/{user_id}/active", dependencies=[Depends(require_admin)])
async def toggle_user_active(user_id: int, is_active: bool):
    """启用/禁用用户"""
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user.is_active = is_active
    await user.save()
    return {"message": "更新成功", "is_active": user.is_active}


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: int):
    """删除用户"""
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 删除用户的所有角色/存档
    await Character.filter(user_id=user_id).delete()
    
    # 删除用户
    await user.delete()
    return {"message": "删除成功"}


# === 存档管理 ===
class SaveListItem(BaseModel):
    id: int
    user_name: str
    char_name: str
    world_id: Optional[int]
    is_active: bool
    created_at: str
    updated_at: str


class LocalDataListItem(BaseModel):
    user_id: int
    user_name: str
    created_at: str
    updated_at: str


@router.get("/saves", response_model=List[SaveListItem], dependencies=[Depends(require_admin)])
async def list_saves(
    user_name: str = "",
    char_name: str = "",
    is_active: bool = None,
    skip: int = 0,
    limit: int = 100
):
    """获取存档列表（支持搜索和筛选）"""
    query = Character.all().prefetch_related("user")
    
    # 按玩家名搜索
    if user_name.strip():
        query = query.filter(user__user_name__icontains=user_name.strip())
    
    # 按角色名搜索
    if char_name.strip():
        query = query.filter(char_name__icontains=char_name.strip())
    
    # 按激活状态筛选
    if is_active is not None:
        query = query.filter(is_active=is_active)
    
    # 排序、分页
    query = query.order_by("-updated_at").offset(skip).limit(limit)
    characters = await query
    
    return [
        SaveListItem(
            id=c.id,
            user_name=c.user.user_name,
            char_name=c.char_name,
            world_id=c.world_id,
            is_active=c.is_active,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat()
        )
        for c in characters
    ]


@router.get("/saves/{save_id}", dependencies=[Depends(require_admin)])
async def get_save_detail(save_id: int):
    """获取单个存档的详细信息（含存档JSON）"""
    character = await Character.filter(id=save_id).prefetch_related("user").first()
    if not character:
        raise HTTPException(status_code=404, detail="存档不存在")
    return {
        "id": character.id,
        "user_id": character.user_id,
        "user_name": character.user.user_name if character.user_id else None,
        "char_name": character.char_name,
        "world_id": character.world_id,
        "is_active": character.is_active,
        "created_at": character.created_at.isoformat(),
        "updated_at": character.updated_at.isoformat(),
        "save_data": character.save_data or {}
    }


@router.get("/saves/{save_id}/download", dependencies=[Depends(require_admin)])
async def download_save(save_id: int):
    """下载存档JSON文件"""
    character = await Character.filter(id=save_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="存档不存在")
    filename = f"save_{save_id}_{(character.char_name or 'character').replace(' ', '_')}\.json"
    content = json.dumps(character.save_data or {}, ensure_ascii=False, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
    )


@router.put("/saves/{save_id}", dependencies=[Depends(require_admin)])
async def update_save(save_id: int, payload: Dict[str, Any]):
    """修改存档（替换为提供的JSON）"""
    character = await Character.filter(id=save_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="存档不存在")
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="请求体必须为JSON对象")
    character.save_data = payload
    await character.save()
    return {"message": "更新成功"}


@router.delete("/saves/{save_id}", dependencies=[Depends(require_admin)])
async def delete_save(save_id: int):
    """删除存档"""
    character = await Character.filter(id=save_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="存档不存在")
    
    await character.delete()
    return {"message": "删除成功"}


# === 本地存档数据管理（角色列表/存档JSON） ===
@router.get("/local-data", response_model=List[LocalDataListItem], dependencies=[Depends(require_admin)])
async def list_local_data(
    user_name: str = "",
    skip: int = 0,
    limit: int = 100
):
    query = UserLocalData.all().prefetch_related("user")
    if user_name.strip():
        query = query.filter(user__user_name__icontains=user_name.strip())
    query = query.order_by("-updated_at").offset(skip).limit(limit)
    items = await query
    return [
        LocalDataListItem(
            user_id=item.user_id,
            user_name=item.user.user_name if item.user_id else "",
            created_at=item.created_at.isoformat(),
            updated_at=item.updated_at.isoformat(),
        )
        for item in items
    ]


@router.get("/local-data/{user_id}", dependencies=[Depends(require_admin)])
async def get_local_data_detail(user_id: int):
    record = await UserLocalData.get_or_none(user_id=user_id).prefetch_related("user")
    if not record:
        raise HTTPException(status_code=404, detail="本地存档数据不存在")
    return {
        "user_id": record.user_id,
        "user_name": record.user.user_name if record.user_id else None,
        "created_at": record.created_at.isoformat(),
        "updated_at": record.updated_at.isoformat(),
        "characters": record.characters_json or {},
        "saves": record.saves_json or {},
    }


@router.put("/local-data/{user_id}", dependencies=[Depends(require_admin)])
async def update_local_data(user_id: int, payload: Dict[str, Any]):
    record = await UserLocalData.get_or_none(user_id=user_id)
    if not record:
        raise HTTPException(status_code=404, detail="本地存档数据不存在")
    characters = payload.get("characters")
    saves = payload.get("saves")
    if not isinstance(characters, dict) or not isinstance(saves, dict):
        raise HTTPException(status_code=400, detail="characters/saves 必须为JSON对象")
    record.characters_json = characters
    record.saves_json = saves
    await record.save()
    return {"message": "更新成功"}


@router.get("/local-data/{user_id}/download", dependencies=[Depends(require_admin)])
async def download_local_data(user_id: int, type: str = "characters"):
    record = await UserLocalData.get_or_none(user_id=user_id).prefetch_related("user")
    if not record:
        raise HTTPException(status_code=404, detail="本地存档数据不存在")
    if type not in {"characters", "saves"}:
        raise HTTPException(status_code=400, detail="type 必须为 characters 或 saves")

    data = record.characters_json if type == "characters" else record.saves_json
    filename = f"local_{type}_user_{user_id}.json"
    content = json.dumps(data or {}, ensure_ascii=False, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
    )


@router.delete("/local-data/{user_id}", dependencies=[Depends(require_admin)])
async def delete_local_data(user_id: int):
    record = await UserLocalData.get_or_none(user_id=user_id)
    if not record:
        raise HTTPException(status_code=404, detail="本地存档数据不存在")
    await record.delete()
    return {"message": "删除成功"}


# === 默认提示词配置（管理员） ===
@router.get("/default-prompts", dependencies=[Depends(require_admin)])
async def get_default_prompts():
    record = await DefaultPromptConfig.first()
    return {"prompts": record.prompts_json if record else {}}


@router.put("/default-prompts", dependencies=[Depends(require_admin)])
async def update_default_prompts(payload: DefaultPromptsPayload):
    if not isinstance(payload.prompts, dict):
        raise HTTPException(status_code=400, detail="prompts 必须为JSON对象")
    record = await DefaultPromptConfig.first()
    if record:
        record.prompts_json = payload.prompts
        await record.save()
    else:
        await DefaultPromptConfig.create(prompts_json=payload.prompts)
    return {"message": "更新成功"}


# === 用户提示词配置（管理员） ===
@router.get("/user-prompts", response_model=List[UserPromptListItem], dependencies=[Depends(require_admin)])
async def list_user_prompts(user_name: str = "", skip: int = 0, limit: int = 100):
    query = UserPromptConfig.all().prefetch_related("user")
    if user_name.strip():
        query = query.filter(user__user_name__icontains=user_name.strip())
    query = query.order_by("-updated_at").offset(skip).limit(limit)
    items = await query
    return [
        UserPromptListItem(
            user_id=item.user_id,
            user_name=item.user.user_name if item.user_id else "",
            created_at=item.created_at.isoformat(),
            updated_at=item.updated_at.isoformat(),
        )
        for item in items
    ]


@router.get("/user-prompts/{user_id}", dependencies=[Depends(require_admin)])
async def get_user_prompts_detail(user_id: int):
    record = await UserPromptConfig.get_or_none(user_id=user_id).prefetch_related("user")
    if not record:
        raise HTTPException(status_code=404, detail="用户提示词不存在")
    return {
        "user_id": record.user_id,
        "user_name": record.user.user_name if record.user_id else None,
        "created_at": record.created_at.isoformat(),
        "updated_at": record.updated_at.isoformat(),
        "prompts": record.prompts_json or {},
    }


@router.put("/user-prompts/{user_id}", dependencies=[Depends(require_admin)])
async def update_user_prompts(user_id: int, payload: DefaultPromptsPayload):
    record = await UserPromptConfig.get_or_none(user_id=user_id)
    if not record:
        raise HTTPException(status_code=404, detail="用户提示词不存在")
    if not isinstance(payload.prompts, dict):
        raise HTTPException(status_code=400, detail="prompts 必须为JSON对象")
    record.prompts_json = payload.prompts
    await record.save()
    return {"message": "更新成功"}


@router.delete("/user-prompts/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user_prompts(user_id: int):
    record = await UserPromptConfig.get_or_none(user_id=user_id)
    if not record:
        raise HTTPException(status_code=404, detail="用户提示词不存在")
    await record.delete()
    return {"message": "删除成功"}


# === 游戏数据管理 ===
@router.post("/worlds", dependencies=[Depends(require_admin)])
async def create_world(name: str, description: str, order: int = 0):
    """创建世界"""
    world = await World.create(name=name, description=description, order=order)
    return {"message": "创建成功", "id": world.id}


@router.put("/worlds/{world_id}", dependencies=[Depends(require_admin)])
async def update_world(world_id: int, name: str, description: str, is_active: bool, order: int):
    """更新世界"""
    world = await World.filter(id=world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="世界不存在")
    
    world.name = name
    world.description = description
    world.is_active = is_active
    world.order = order
    await world.save()
    return {"message": "更新成功"}


@router.delete("/worlds/{world_id}", dependencies=[Depends(require_admin)])
async def delete_world(world_id: int):
    """删除世界"""
    world = await World.filter(id=world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="世界不存在")
    
    await world.delete()
    return {"message": "删除成功"}
