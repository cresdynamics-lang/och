"""
Recommendation service for generating personalized recommendations.
"""
from typing import List, Optional
import httpx
from config import settings
from schemas.recommendation import RecommendationItem
from services.embedding_service import EmbeddingService
from vector_store.pgvector_client import PGVectorClient
from vector_store.pinecone_client import PineconeClient


class RecommendationService:
    """
    Service for generating personalized recommendations.
    """
    
    def __init__(self):
        self.django_api_url = settings.DJANGO_API_URL
        self.embedding_service = EmbeddingService()
        
        # Initialize vector store
        if settings.USE_PINECONE:
            self.vector_store = PineconeClient()
        else:
            self.vector_store = PGVectorClient()
    
    async def get_user_progress(self, user_id: int) -> List[dict]:
        """
        Fetch user progress from Django API.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.django_api_url}/api/v1/progress/",
                params={"user": user_id},
                timeout=settings.DJANGO_API_TIMEOUT,
            )
            response.raise_for_status()
            return response.json()["results"]
    
    async def get_recommendations(
        self,
        user_id: int,
        content_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[RecommendationItem]:
        """
        Generate personalized recommendations for a user.
        
        Pseudocode:
        1. Fetch user progress from Django API
        2. Extract user preferences/interests from progress data
        3. Generate embedding for user profile
        4. Perform similarity search in vector database
        5. Filter and rank results
        6. Return top recommendations
        """
        # TODO: Implement recommendation logic
        # 1. Get user progress
        # progress_data = await self.get_user_progress(user_id)
        
        # 2. Build user profile embedding
        # user_profile_text = self._build_user_profile(progress_data)
        # user_embedding = await self.embedding_service.generate_embeddings([user_profile_text])[0]
        
        # 3. Search similar content
        # similar_items = await self.vector_store.similarity_search(
        #     query_embedding=user_embedding.tolist(),
        #     limit=limit * 2,  # Get more to filter
        #     content_type=content_type,
        # )
        
        # 4. Filter out already completed items
        # recommendations = self._filter_and_rank(similar_items, progress_data, limit)
        
        # Placeholder: return empty recommendations
        return []


