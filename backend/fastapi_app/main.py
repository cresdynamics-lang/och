"""
FastAPI application entry point for AI and vector processing services.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers.v1 import recommendations, embeddings, personality, missions, curriculum, coaching, dashboard, profiling
from config import settings

app = FastAPI(
    title="Ongoza CyberHub AI API",
    description="AI, vector processing, and recommendation engine API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with version prefix
app.include_router(recommendations.router, prefix="/api/v1", tags=["recommendations"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["embeddings"])
app.include_router(personality.router, prefix="/api/v1", tags=["personality"])
app.include_router(profiling.router, prefix="/api/v1", tags=["ai-profiling"])
app.include_router(missions.router)
app.include_router(curriculum.router)
app.include_router(coaching.router)
app.include_router(dashboard.router)


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return JSONResponse({
        "status": "healthy",
        "service": "fastapi-ai",
        "version": "v1"
    })


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    """
    from utils.metrics import metrics_endpoint
    return await metrics_endpoint()


@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {
        "message": "Ongoza CyberHub AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }


