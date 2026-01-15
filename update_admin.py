import asyncio
import sys
sys.path.insert(0, '.')

from server.core.config import settings
from server.core.security import get_password_hash
from server.database.config import init_db, close_db
from server.models import User

async def update_admin_password():
    await init_db()
    
    admin = await User.filter(user_name=settings.ADMIN_USERNAME).first()
    if admin:
        hashed = get_password_hash(settings.ADMIN_PASSWORD)
        admin.password_hash = hashed
        await admin.save()
        print(f"✅ 管理员密码已更新!")
        print(f"   用户名: {settings.ADMIN_USERNAME}")
        print(f"   新密码: {settings.ADMIN_PASSWORD}")
    else:
        print(f"❌ 管理员账号不存在")
    
    await close_db()

asyncio.run(update_admin_password())
