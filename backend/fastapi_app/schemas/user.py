"""
User schemas matching Django serializers.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """
    Base user schema matching Django UserBaseSchema.
    """
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """
    User response schema matching Django UserResponseSchema.
    """
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
    }


