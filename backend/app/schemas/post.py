"""Pydantic v2 schemas: API input, AI output validation, research results, API responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.core.config import get_settings

settings = get_settings()

# Restrict platforms to known values. Anything else is rejected with HTTP 422.
Platform = Literal["instagram", "linkedin", "tiktok", "x", "facebook"]
ResearchMode = Literal["live", "fallback"]


class SourceItem(BaseModel):
    """A research source. HttpUrl rejects non-http(s) URLs such as javascript: links."""

    title: str = Field(min_length=1, max_length=300)
    url: HttpUrl
    summary: str = Field(default="", max_length=1000)


class ResearchResult(BaseModel):
    """Normalized output of ANY research provider."""

    mode: ResearchMode
    summary: str = Field(default="", max_length=3000)
    keywords: list[str] = Field(default_factory=list, max_length=20)
    hashtags: list[str] = Field(default_factory=list, max_length=30)
    sources: list[SourceItem] = Field(default_factory=list, max_length=10)


class PostGenerateRequest(BaseModel):
    """What the client may send. Every text field is length-limited (see .env limits)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    topic: str = Field(min_length=3, max_length=settings.max_topic_length)
    platform: Platform
    audience: str = Field(min_length=2, max_length=settings.max_audience_length)
    tone: str = Field(min_length=2, max_length=settings.max_tone_length)
    goal: str = Field(min_length=2, max_length=settings.max_goal_length)
    include_image_prompt: bool = True


class GeneratedPost(BaseModel):
    """The JSON the AI must return. We validate it before saving anything.

    Never trust model output: it can be malformed, too long, or contain surprises.
    """

    title: str = Field(min_length=1, max_length=300)
    hook: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1, max_length=5000)
    call_to_action: str = Field(min_length=1, max_length=500)
    hashtags: list[str] = Field(default_factory=list, max_length=30)
    niche_hashtags: list[str] = Field(default_factory=list, max_length=30)
    content_ideas: list[str] = Field(default_factory=list, max_length=10)
    image_prompt: str = Field(default="", max_length=3000)
    # The AI is told to leave this empty; the server attaches verified sources itself.
    sources: list[SourceItem] = Field(default_factory=list, max_length=10)

    @field_validator("hashtags", "niche_hashtags")
    @classmethod
    def normalize_hashtags(cls, value: list[str]) -> list[str]:
        """Ensure a leading '#', no spaces, sane length, no duplicates."""
        cleaned: list[str] = []
        seen: set[str] = set()
        for raw in value:
            tag = raw.strip().replace(" ", "")
            if not tag.strip("#"):
                continue
            if not tag.startswith("#"):
                tag = "#" + tag
            if len(tag) > 60 or tag.lower() in seen:
                continue
            seen.add(tag.lower())
            cleaned.append(tag)
        return cleaned

    @field_validator("content_ideas")
    @classmethod
    def clean_ideas(cls, value: list[str]) -> list[str]:
        return [idea.strip()[:500] for idea in value if idea.strip()]


class PostRead(BaseModel):
    """What the stateless API returns. Must match frontend/lib/types.ts."""

    model_config = ConfigDict(from_attributes=True)  # lets Pydantic read ORM objects

    id: int
    topic: str
    platform: Platform
    audience: str
    tone: str
    goal: str
    title: str
    hook: str
    body: str
    call_to_action: str
    hashtags: list[str]
    niche_hashtags: list[str]
    content_ideas: list[str]
    image_prompt: str
    sources: list[SourceItem]
    research_mode: ResearchMode
    created_at: datetime
