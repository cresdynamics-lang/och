"""
Base Pydantic schemas shared across the application.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class BaseSchema(BaseModel):
    """
    Base schema with common configuration.
    """
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        str_strip_whitespace=True,
    )


class TimestampSchema(BaseSchema):
    """
    Base schema with timestamp fields.
    """
    created_at: datetime
    updated_at: datetime


