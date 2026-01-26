"""
Organization schemas matching Django serializers.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OrganizationBase(BaseModel):
    """
    Base organization schema matching Django OrganizationBaseSchema.
    """
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    """
    Organization response schema matching Django OrganizationResponseSchema.
    """
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
    }


