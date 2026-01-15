import asyncio
import sys
sys.path.insert(0, '.')

from server.core.config import settings
from server.core.security import get_password_hash
from server.database.config import init_db, close_db
from server.models import User

async def create_admin():
    await init_db()
    
    # 检查是否存在
    admin = await User.filter(user_name=settings.ADMIN_USERNAME).first()
    if admin:
        print(f"✅ 管理员账号已存在: {settings.ADMIN_USERNAME}")
        print(f"   密码: {settings.ADMIN_PASSWORD}")
    else:
        # 创建管理员
        hashed = get_password_hash(settings.ADMIN_PASSWORD)
        admin = await User.create(
            user_name=settings.ADMIN_USERNAME,
            password_hash=hashed,
            email=settings.ADMIN_EMAIL,
            is_admin=True,
            travel_points=9999
        )
        print(f"✅ 管理员账号创建成功!")
        print(f"   用户名: {settings.ADMIN_USERNAME}")
        print(f"   密码: {settings.ADMIN_PASSWORD}")
    
    await close_db()

asyncio.run(create_admin())
