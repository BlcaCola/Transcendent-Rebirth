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
        {"name": "霓虹城", "description": "赛博行动者的起始城区，数据流密集", "order": 1},
        {"name": "黑域堆栈", "description": "传说中的禁区节点", "order": 2},
        {"name": "极光穹顶", "description": "高阶组织的核心栖所", "order": 3},
    ]
    for data in worlds_data:
        await World.create(**data)
    print("✅ 世界数据创建完成")
    
    # 创建天资等级
    tiers_data = [
        {"name": "基础级", "description": "基础模块阶位", "multiplier": 1.0, "order": 1},
        {"name": "改良级", "description": "改良模块阶位", "multiplier": 1.2, "order": 2},
        {"name": "精良级", "description": "精良模块阶位", "multiplier": 1.5, "order": 3},
        {"name": "高级", "description": "高阶模块阶位", "multiplier": 2.0, "order": 4},
        {"name": "顶级", "description": "顶级模块阶位", "multiplier": 3.0, "order": 5},
    ]
    for data in tiers_data:
        await TalentTier.create(**data)
    print("✅ 天资等级创建完成")
    
    # 创建出身
    origins_data = [
        {"name": "街区平民", "description": "普通街区出身", "effects": {}, "order": 1},
        {"name": "企业家族", "description": "企业家族出身", "effects": {"initial_resources": 1000}, "order": 2},
        {"name": "组织成员", "description": "核心组织成员", "effects": {"initial_training": 100}, "order": 3},
    ]
    for data in origins_data:
        await Origin.create(**data)
    print("✅ 出身数据创建完成")
    
    # 创建改造
    spirit_roots_data = [
        {"name": "合金核心", "description": "高强度合金改造核心", "elements": {"合金": 100}, "order": 1},
        {"name": "生物核心", "description": "生体兼容改造核心", "elements": {"生物": 100}, "order": 2},
        {"name": "液冷核心", "description": "液冷稳定改造核心", "elements": {"液冷": 100}, "order": 3},
        {"name": "等离子核心", "description": "高能输出改造核心", "elements": {"等离子": 100}, "order": 4},
        {"name": "地质核心", "description": "地质防护改造核心", "elements": {"地质": 100}, "order": 5},
        {"name": "复合核心", "description": "多模块协同改造核心", "elements": {"合金": 20, "生物": 20, "液冷": 20, "等离子": 20, "地质": 20}, "order": 6},
    ]
    for data in spirit_roots_data:
        await SpiritRoot.create(**data)
    print("✅ 改造核心数据创建完成")
    
    # 创建天赋
    tier = await TalentTier.filter(name="精良级").first()
    talents_data = [
        {"name": "算法直觉", "description": "训练速度提升30%", "talent_cost": 2, "rarity": 3, "tier_id": tier.id},
        {"name": "动力强化", "description": "力量属性提升20点", "talent_cost": 1, "rarity": 2, "tier_id": tier.id},
        {"name": "能源亲和", "description": "能量吸收速度提升50%", "talent_cost": 3, "rarity": 4, "tier_id": tier.id},
    ]
    for data in talents_data:
        await Talent.create(**data)
    print("✅ 天赋数据创建完成")
    
    print("🎉 测试数据初始化完成！")


if __name__ == "__main__":
    asyncio.run(init_test_data())
