"""Application settings, loaded and validated from environment variables / .env."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration lives here. Values come from the environment or backend/.env.

    pydantic-settings matches environment variables to field names case-insensitively,
    e.g. AI_API_KEY -> ai_api_key.
    """

    # extra="ignore": unknown variables in .env do not crash the app.
    # NOTE: ".env" is resolved relative to the folder you start uvicorn from (backend/).
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Social Media Post Generator API"
    environment: Literal["development", "production"] = "development"
    frontend_origin: str = "http://localhost:3000"

    # SECRETS: no defaults on purpose. The app refuses to start if they are missing.
    app_secret_key: str = Field(min_length=16)
    ai_api_key: str = Field(min_length=1)

    # Groq exposes an OpenAI-compatible API. Keep the fast planner and the
    # quality-focused writer configurable so providers/models can be swapped
    # without changing application code.
    ai_model: str = "openai/gpt-oss-120b"
    ai_fast_model: str = "openai/gpt-oss-20b"
    ai_base_url: str = "https://api.groq.com/openai/v1"

    # Optional research provider. Empty values mean "use the labeled fallback".
    tavily_api_key: str = ""
    research_api_key: str = ""
    research_api_url: str = ""

    # Input limits (enforced by Pydantic schemas, see schemas/post.py).
    max_topic_length: int = Field(default=500, ge=10, le=5000)
    max_audience_length: int = Field(default=300, ge=10, le=2000)
    max_tone_length: int = Field(default=100, ge=5, le=500)
    max_goal_length: int = Field(default=100, ge=5, le=500)
    max_research_results: int = Field(default=5, ge=1, le=10)

    @field_validator("frontend_origin")
    @classmethod
    def clean_origin(cls, value: str) -> str:
        """CORS origins must be exact and must not end with a slash. Never allow '*'."""
        value = value.strip().rstrip("/")
        if value == "*" or not value:
            raise ValueError("FRONTEND_ORIGIN must be one explicit origin, not '*'.")
        return value

    @model_validator(mode="after")
    def validate_production(self) -> "Settings":
        """Fail fast on unsafe production settings."""
        if self.environment == "production":
            if self.app_secret_key.startswith("replace-with"):
                raise ValueError("Set a real APP_SECRET_KEY before running in production.")
            if not self.frontend_origin.startswith("https://"):
                raise ValueError("FRONTEND_ORIGIN must use https:// in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    """Create the settings once and reuse them (also usable as a FastAPI dependency)."""
    return Settings()  # type: ignore[call-arg]  # required fields come from the environment
