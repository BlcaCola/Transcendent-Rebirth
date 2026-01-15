"""
API v1 路由汇总
"""
from fastapi import APIRouter
from .auth import router as auth_router
from .game_data import router as game_data_router
from .characters import router as characters_router
from .admin import router as admin_router
from .invitation import router as invitation_router
from .ai import router as ai_router
from .redemption import router as redemption_router, admin_router as redemption_admin_router
from .user_config import router as user_config_router
from .user_local_data import router as user_local_data_router
from .prompts import router as prompts_router
from .user_prompts import router as user_prompts_router


api_v1_router = APIRouter(prefix="/api/v1")

# 注册所有子路由
api_v1_router.include_router(auth_router)
api_v1_router.include_router(game_data_router)
api_v1_router.include_router(characters_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(invitation_router)
api_v1_router.include_router(redemption_router)
api_v1_router.include_router(redemption_admin_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(user_config_router)
api_v1_router.include_router(user_local_data_router)
api_v1_router.include_router(prompts_router)
api_v1_router.include_router(user_prompts_router)
