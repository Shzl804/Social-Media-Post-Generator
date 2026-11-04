"""FastAPI application factory and entry point."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.posts import router as posts_router
from app.core.config import get_settings

# NOTE: never log full prompts, API keys, or user content that may be sensitive.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    is_production = settings.environment == "production"

    app = FastAPI(
        title=settings.app_name,
        # Hide interactive docs in production.
        docs_url=None if is_production else "/docs",
        redoc_url=None,
        openapi_url=None if is_production else "/openapi.json",
    )

    # CORS: only our frontend origin, only the methods and headers we need.
    # CORS only tells BROWSERS which sites may call this API. It is NOT authentication:
    # curl, scripts, and other servers ignore it completely.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=False,  # no cookies yet; enable only together with real auth
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
        # Full details go to server logs; the client only sees a generic message.
        logger.error("Unhandled error: %s", type(exc).__name__, exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    @app.get("/health", tags=["health"])
    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(posts_router)
    return app


app = create_app()
