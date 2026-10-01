import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.routers import (
    auth_router,
    users_router,
    contacts_router,
    conversations_router,
    messages_router,
    ws_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on application launch
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Real-Time Mobile Number Chat Application Backend (FastAPI + WebSocket + SQLAlchemy)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(contacts_router, prefix=settings.API_V1_STR)
app.include_router(conversations_router, prefix=settings.API_V1_STR)
app.include_router(messages_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Mount Frontend (Prioritize built React App in frontend/dist)
frontend_dist_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
frontend_static_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
)

target_frontend = frontend_dist_path if os.path.isdir(frontend_dist_path) else frontend_static_path

if os.path.isdir(target_frontend):
    assets_dir = os.path.join(target_frontend, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    app.mount("/static", StaticFiles(directory=target_frontend), name="static")

    @app.get("/{full_path:path}", tags=["Frontend"])
    def serve_frontend_spa(full_path: str):
        # Allow API and docs routes to pass through
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json", "health"]:
            return None
        
        # Check if file exists directly (e.g. logo.png, favicon.ico)
        direct_file = os.path.join(target_frontend, full_path)
        if os.path.isfile(direct_file):
            return FileResponse(direct_file)
            
        index_file = os.path.join(target_frontend, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "ChatConnect API is running. Visit /docs for Swagger UI."}
