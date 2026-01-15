"""
数据库模型 - 默认提示词
"""
from tortoise import fields
from tortoise.models import Model


class DefaultPromptConfig(Model):
    """默认提示词配置"""
    id = fields.IntField(pk=True)
    prompts_json = fields.JSONField(description="默认提示词配置")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "default_prompt_configs"


class UserPromptConfig(Model):
    """用户提示词配置"""
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="prompt_configs", unique=True)
    prompts_json = fields.JSONField(description="用户提示词配置")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "user_prompt_configs"
