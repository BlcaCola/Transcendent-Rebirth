"""
数据库模型 - 用户模块
"""
from tortoise import fields
from tortoise.models import Model


class User(Model):
    """用户模型"""
    id = fields.IntField(pk=True)
    account_id = fields.BigIntField(unique=True, null=True, description="账号ID（纯数字，可修改）")
    user_name = fields.CharField(max_length=50, unique=True, index=True, description="用户名")
    email = fields.CharField(max_length=100, null=True, unique=True, description="邮箱")
    password_hash = fields.CharField(max_length=255, description="密码哈希")
    is_admin = fields.BooleanField(default=False, description="是否为管理员")
    is_active = fields.BooleanField(default=True, description="是否激活")
    travel_points = fields.IntField(default=0, description="穿越点数")
    last_login = fields.DatetimeField(null=True, description="最后登录-北京时间时间")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")
    
    class Meta:
        table = "users"
        
    def __str__(self):
        return self.user_name


class UserAPIConfig(Model):
    """用户API配置"""
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="api_configs", unique=True)
    config = fields.JSONField(description="API配置内容")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "user_api_configs"


class UserLocalData(Model):
    """用户本地存档数据（角色列表/存档JSON）"""
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="local_data", unique=True)
    characters_json = fields.JSONField(description="角色列表JSON")
    saves_json = fields.JSONField(description="存档JSON")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "user_local_data"


class EmailVerificationCode(Model):
    """邮箱验证码模型"""
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=100, index=True, description="邮箱")
    code = fields.CharField(max_length=6, description="验证码")
    purpose = fields.CharField(max_length=20, description="用途：register/reset_password")
    is_used = fields.BooleanField(default=False, description="是否已使用")
    expires_at = fields.DatetimeField(description="过期时间")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    
    class Meta:
        table = "email_verification_codes"


class RedemptionCode(Model):
    """兑换码模型"""
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=50, unique=True, index=True, description="兑换码")
    reward_type = fields.CharField(max_length=20, description="奖励类型")
    reward_value = fields.IntField(description="奖励数值")
    max_uses = fields.IntField(default=1, description="最大使用次数")
    times_used = fields.IntField(default=0, description="已使用次数")
    expires_at = fields.DatetimeField(null=True, description="过期时间")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    
    class Meta:
        table = "redemption_codes"


class InvitationCode(Model):
    """邀请码模型"""
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=20, unique=True, index=True, description="邀请码")
    is_active = fields.BooleanField(default=True, description="是否激活")
    max_uses = fields.IntField(default=-1, description="最大使用次数，-1表示无限制")
    times_used = fields.IntField(default=0, description="已使用次数")
    expires_at = fields.DatetimeField(null=True, description="过期时间")
    created_by = fields.IntField(description="创建者用户ID")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    
    class Meta:
        table = "invitation_codes"
