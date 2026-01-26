"""
Progress schemas matching Django serializers.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Literal
from typing_extensions import Annotated


class ProgressBase(BaseModel):
    """
    Base progress schema matching Django ProgressBaseSchema.
    """
    content_id: str
    content_type: str
    status: Literal["not_started", "in_progress", "completed", "paused"]
    completion_percentage: int = 0
    score: Optional[float] = None
    metadata: Dict = {}


class ProgressResponse(ProgressBase):
    """
    Progress response schema matching Django ProgressResponseSchema.
    """
    id: int
    user_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
    }


