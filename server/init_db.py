"""
初始化数据库并创建测试数据
"""
import asyncio
from server.database.config import init_db
from server.models import World, TalentTier, Origin, SpiritRoot, Talent
from server.core.security import get_password_hash
from server.models import User


async def init_test_data():
    """初始化测试数据"""
    print("🔄 初始化数据库...")
    await init_db()
    print("✅ 数据库初始化完成")
    
    # 检查是否已有数据
    world_count = await World.all().count()
    if world_count > 0:
        print("ℹ️  数据库已有数据，跳过初始化")
        return
    
    print("📝 创建测试数据...")
    
    # 创建世界
    worlds_data = [
        {"name": "九寰仙岛", "description": "修仙者的起始之地，灵气充沛", "order": 1},
        {"name": "幽荒界", "description": "传说中的上古界域", "order": 2},
        {"name": "蓬莱界", "description": "真正的仙人居所", "order": 3},
    ]
    for data in worlds_data:
        await World.create(**data)
    print("✅ 世界数据创建完成")
    
    # 创建天资等级
    tiers_data = [
        {"name": "凡品", "description": "普通资质", "multiplier": 1.0, "order": 1},
        {"name": "良品", "description": "良好资质", "multiplier": 1.2, "order": 2},
        {"name": "上品", "description": "优秀资质", "multiplier": 1.5, "order": 3},
        {"name": "极品", "description": "卓越资质", "multiplier": 2.0, "order": 4},
        {"name": "天品", "description": "天才资质", "multiplier": 3.0, "order": 5},
    ]
    for data in tiers_data:
        await TalentTier.create(**data)
    print("✅ 天资等级创建完成")
    
    # 创建出身
    origins_data = [
        {"name": "平民", "description": "普通百姓出身", "effects": {}, "order": 1},
        {"name": "世家", "description": "修仙世家出身", "effects": {"initial_resources": 1000}, "order": 2},
        {"name": "宗门", "description": "大宗门弟子", "effects": {"initial_cultivation": 100}, "order": 3},
    ]
    for data in origins_data:
        await Origin.create(**data)
    print("✅ 出身数据创建完成")
    
    # 创建灵根
    spirit_roots_data = [
        {"name": "金灵根", "description": "纯金属性灵根", "elements": {"金": 100}, "order": 1},
        {"name": "木灵根", "description": "纯木属性灵根", "elements": {"木": 100}, "order": 2},
        {"name": "水灵根", "description": "纯水属性灵根", "elements": {"水": 100}, "order": 3},
        {"name": "火灵根", "description": "纯火属性灵根", "elements": {"火": 100}, "order": 4},
        {"name": "土灵根", "description": "纯土属性灵根", "elements": {"土": 100}, "order": 5},
        {"name": "五行灵根", "description": "五行俱全的灵根", "elements": {"金": 20, "木": 20, "水": 20, "火": 20, "土": 20}, "order": 6},
    ]
    for data in spirit_roots_data:
        await SpiritRoot.create(**data)
    print("✅ 灵根数据创建完成")
    
    # 创建天赋
    tier = await TalentTier.filter(name="上品").first()
    talents_data = [
        {"name": "悟性超凡", "description": "修炼速度提升30%", "talent_cost": 2, "rarity": 3, "tier_id": tier.id},
        {"name": "天生神力", "description": "力量属性提升20点", "talent_cost": 1, "rarity": 2, "tier_id": tier.id},
        {"name": "灵气亲和", "description": "吸收灵气速度提升50%", "talent_cost": 3, "rarity": 4, "tier_id": tier.id},
    ]
    for data in talents_data:
        await Talent.create(**data)
    print("✅ 天赋数据创建完成")
    
    print("🎉 测试数据初始化完成！")


if __name__ == "__main__":
    asyncio.run(init_test_data())
