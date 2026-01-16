"""
数据库模型 - 游戏数据模块
"""
from tortoise import fields
from tortoise.models import Model


class World(Model):
    """世界/地图模型"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, description="世界名称")
    description = fields.TextField(description="世界描述")
    is_active = fields.BooleanField(default=True, description="是否启用")
    order = fields.IntField(default=0, description="排序")
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        table = "worlds"


class TalentTier(Model):
    """天资等级模型"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50, description="等级名称")
    description = fields.TextField(null=True, description="等级描述")
    multiplier = fields.FloatField(default=1.0, description="倍率")
    order = fields.IntField(default=0, description="排序")
    
    class Meta:
        table = "talent_tiers"


class Origin(Model):
    """出身模型"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, description="出身名称")
    description = fields.TextField(description="出身描述")
    effects = fields.JSONField(null=True, description="效果数据")
    is_active = fields.BooleanField(default=True, description="是否启用")
    order = fields.IntField(default=0, description="排序")
    
    class Meta:
        table = "origins"


class SpiritRoot(Model):
    """改造核心模型"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, description="改造核心名称")
    description = fields.TextField(description="改造核心描述")
    elements = fields.JSONField(description="元素组成")
    is_active = fields.BooleanField(default=True, description="是否启用")
    order = fields.IntField(default=0, description="排序")
    
    class Meta:
        table = "spirit_roots"


class Talent(Model):
    """天赋模型"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, description="天赋名称")
    description = fields.TextField(null=True, description="天赋描述")
    talent_cost = fields.IntField(default=1, description="天赋消耗")
    rarity = fields.IntField(default=1, description="稀有度")
    tier = fields.ForeignKeyField("models.TalentTier", related_name="talents", null=True)
    source = fields.CharField(max_length=50, null=True, description="来源")
    effects = fields.JSONField(null=True, description="效果数据")
    is_active = fields.BooleanField(default=True, description="是否启用")
    
    class Meta:
        table = "talents"


class Character(Model):
    """角色模型"""
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="characters")
    char_name = fields.CharField(max_length=100, description="角色名称")
    world = fields.ForeignKeyField("models.World", related_name="characters", null=True)
    save_data = fields.JSONField(description="存档数据")
    is_active = fields.BooleanField(default=True, description="是否激活")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    class Meta:
        table = "characters"


class WorldInstance(Model):
    """世界实例模型（用于联机）"""
    id = fields.IntField(pk=True)
    owner = fields.ForeignKeyField("models.User", related_name="world_instances")
    world = fields.ForeignKeyField("models.World", related_name="instances")
    visibility_mode = fields.CharField(max_length=20, default="private", description="可见性：private/public/friends")
    allow_offline_travel = fields.BooleanField(default=False, description="允许离线穿越")
    offline_agent_prompt = fields.TextField(null=True, description="离线代理提示词")
    instance_data = fields.JSONField(default=dict, description="实例数据")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    class Meta:
        table = "world_instances"


class TravelSession(Model):
    """穿越会话模型"""
    id = fields.IntField(pk=True)
    traveler = fields.ForeignKeyField("models.User", related_name="travel_sessions")
    target_user = fields.ForeignKeyField("models.User", related_name="received_travels")
    world_instance = fields.ForeignKeyField("models.WorldInstance", related_name="sessions")
    status = fields.CharField(max_length=20, default="active", description="状态：active/ended")
    session_data = fields.JSONField(default=dict, description="会话数据")
    started_at = fields.DatetimeField(auto_now_add=True)
    ended_at = fields.DatetimeField(null=True)
    
    class Meta:
        table = "travel_sessions"
