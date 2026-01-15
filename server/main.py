"""
FastAPI 主应用
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from loguru import logger

from .core.config import settings
from .database.config import init_db, close_db
from .api.v1 import api_v1_router
from .models import User


# 配置日志
os.makedirs("logs", exist_ok=True)
logger.add(
    settings.LOG_FILE,
    rotation="100 MB",
    retention="30 days",
    level=settings.LOG_LEVEL
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("🚀 正在初始化数据库...")
    await init_db()
    logger.info("✅ 数据库初始化完成")
    
    # 创建默认管理员账号（使用异步方式避免密码哈希问题）
    try:
        from .core.security import get_password_hash
        import random
        admin = await User.filter(user_name=settings.ADMIN_USERNAME).first()
        if not admin:
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin_account_id = random.randint(100000000, 999999999)  # 生成9位随机账号ID
            logger.info(f"正在创建管理员账号，账号ID: {admin_account_id}")
            await User.create(
                user_name=settings.ADMIN_USERNAME,
                account_id=admin_account_id,
                password_hash=hashed_password,
                email=settings.ADMIN_EMAIL,
                is_admin=True,
                travel_points=9999
            )
            logger.info(f"✅ 已创建默认管理员账号: {settings.ADMIN_USERNAME}, 账号ID: {admin_account_id}")
        else:
            logger.info(f"📝 管理员账号已存在: {settings.ADMIN_USERNAME}")
    except Exception as e:
        import traceback
        logger.error(f"⚠️ 管理员账号创建失败: {e}")
        logger.error(traceback.format_exc())
    
    logger.info(f"🎮 {settings.APP_NAME} v{settings.APP_VERSION} 启动成功")
    logger.info(f"📍 服务地址: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"📖 API文档: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info(f"🎨 管理后台: http://{settings.HOST}:{settings.PORT}/admin")
    
    yield
    
    # 关闭时
    logger.info("👋 正在关闭数据库连接...")
    await close_db()
    logger.info("✅ 数据库连接已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="超凡新生后端 API",
    lifespan=lifespan
)


# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 静态文件
os.makedirs("server/static", exist_ok=True)
os.makedirs("server/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="server/static"), name="static")


# 注册路由
app.include_router(api_v1_router)


# 版本查询
@app.get("/api/v1/version")
async def get_version():
    """获取后端版本"""
    return {
        "version": settings.APP_VERSION,
        "app_name": settings.APP_NAME
    }


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "version": settings.APP_VERSION}


# 管理后台首页
@app.get("/admin", response_class=HTMLResponse)
async def admin_panel():
    """管理后台"""
    with open("server/templates/admin.html", "r", encoding="utf-8") as f:
        return f.read()


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"欢迎使用{settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "admin": "/admin"
    }
