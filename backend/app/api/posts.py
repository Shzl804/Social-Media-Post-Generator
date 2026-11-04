"""Stateless HTTP route for generating social-media posts."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.schemas.post import PostGenerateRequest, PostRead
from app.services.ai_service import AIGenerationError, generate_post_content
from app.services.research_service import run_research

router = APIRouter(tags=["posts"])
AppSettings = Annotated[Settings, Depends(get_settings)]


@router.post("/api/posts/generate", response_model=PostRead, status_code=201)
@router.post("/api/index", response_model=PostRead, status_code=201)
async def generate_post(payload: PostGenerateRequest, settings: AppSettings) -> PostRead:
    """Research, generate, and return a post without persisting user content."""
    research = await run_research(payload.topic, payload.platform, settings)

    try:
        generated = await generate_post_content(payload, research, settings)
    except AIGenerationError:
        raise HTTPException(
            status_code=502,
            detail="The post could not be generated right now. Please try again later.",
        )

    # Keep the existing frontend response contract. id=0 and created_at are
    # response metadata only; no user content is written to disk or a database.
    return PostRead(
        id=0,
        topic=payload.topic,
        platform=payload.platform,
        audience=payload.audience,
        tone=payload.tone,
        goal=payload.goal,
        title=generated.title,
        hook=generated.hook,
        body=generated.body,
        call_to_action=generated.call_to_action,
        hashtags=generated.hashtags,
        niche_hashtags=generated.niche_hashtags,
        content_ideas=generated.content_ideas,
        image_prompt=generated.image_prompt if payload.include_image_prompt else "",
        sources=generated.sources,
        research_mode=research.mode,
        created_at=datetime.now(timezone.utc),
    )
