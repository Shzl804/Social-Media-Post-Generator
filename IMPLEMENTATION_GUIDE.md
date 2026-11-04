# Research-Based Social Media Post Generator

This guide builds a secure, understandable MVP with:

- Next.js frontend
- FastAPI/Python backend
- SQLite database
- SQLAlchemy ORM
- OpenAI-compatible AI generation
- A replaceable research provider
- Platform-specific post generation
- Hashtags, content ideas, and image prompts

The application flow is:

```text
User idea
   ↓
FastAPI validates the request
   ↓
Research provider collects current information and sources
   ↓
AI converts research into structured social content
   ↓
SQLite saves the generated post
   ↓
Next.js displays editable results
```

## 1. Prerequisites

Install the following:

- Node.js 20 or newer
- Python 3.11 or newer
- Git
- An API key for your selected AI provider
- A search/research API key if you want live web research

This guide uses an OpenAI-compatible Python SDK and a generic research provider interface. This keeps the application easy to adapt to your preferred provider.

## 2. Create the project

From the project directory:

```bash
mkdir -p frontend backend
```

The final structure will look like this:

```text
Social-Media-Post-Generator/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── lib/
│   ├── .env.local.example
│   └── package.json
└── IMPLEMENTATION_GUIDE.md
```

## 3. Backend installation

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

On Windows PowerShell, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Create `backend/requirements.txt`:

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
pydantic-settings==2.7.1
httpx==0.28.1
openai==1.59.7
python-dotenv==1.0.1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## 4. Backend environment variables

Create `backend/.env.example`:

```env
# Never commit a real .env file or API keys to Git.
APP_NAME=Social Media Post Generator API
ENVIRONMENT=development

# Only allow your frontend origin. Do not use * in production.
FRONTEND_ORIGIN=http://localhost:3000

# Use a strong random value in production.
APP_SECRET_KEY=replace-this-with-a-long-random-secret

# AI provider settings.
AI_API_KEY=replace-with-your-ai-api-key
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

# Optional research provider. The MVP also supports a safe mock provider.
RESEARCH_API_KEY=
RESEARCH_API_URL=

# Limits protect your API from accidental or abusive large requests.
MAX_TOPIC_LENGTH=500
MAX_AUDIENCE_LENGTH=300
MAX_RESEARCH_RESULTS=5
```

Copy it to `.env` and replace the values:

```bash
cp .env.example .env
```

Security rules:

- Never put `AI_API_KEY` in the Next.js frontend.
- Never commit `.env` to Git.
- Use separate development and production keys.
- Rotate keys immediately if they are exposed.

## 5. Backend configuration

Create `backend/app/core/config.py`:

```python
"""Central application configuration.

All secrets and environment-dependent values are loaded here instead of being
hard-coded throughout the application.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated settings loaded from environment variables."""

    app_name: str = "Social Media Post Generator API"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    app_secret_key: str = Field(min_length=32)

    ai_api_key: str = Field(min_length=1)
    ai_model: str = "gpt-4o-mini"
    ai_base_url: str = "https://api.openai.com/v1"

    research_api_key: str | None = None
    research_api_url: str | None = None

    max_topic_length: int = 500
    max_audience_length: int = 300
    max_research_results: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cache settings so the .env file is read once per process."""

    return Settings()
```

## 6. Database setup

Create `backend/app/database.py`:

```python
"""SQLite and SQLAlchemy setup."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


# SQLite is ideal for the MVP. Move to PostgreSQL later by changing the URL.
DATABASE_URL = "sqlite:///./social_media_generator.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class for all database models."""


def get_db() -> Generator[Session, None, None]:
    """Provide one database session per request and always close it."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## 7. Database model

Create `backend/app/models/post.py`:

```python
"""Database model for generated social-media posts."""

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    topic: Mapped[str] = mapped_column(String(500))
    platform: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(300))
    hook: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    call_to_action: Mapped[str] = mapped_column(String(500))
    hashtags: Mapped[list[str]] = mapped_column(JSON, default=list)
    content_ideas: Mapped[list[str]] = mapped_column(JSON, default=list)
    image_prompt: Mapped[str] = mapped_column(Text)
    sources: Mapped[list[dict]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
```

Create `backend/app/models/__init__.py`:

```python
from app.models.post import Post
```

## 8. Request and response schemas

Create `backend/app/schemas/post.py`:

```python
"""Validated API input and output models."""

from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, field_validator

Platform = Literal["instagram", "linkedin", "tiktok", "x", "facebook"]


class ResearchRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    platform: Platform
    audience: str = Field(default="General audience", max_length=300)
    tone: str = Field(default="Clear and engaging", max_length=100)
    goal: str = Field(default="Engagement", max_length=100)
    include_image_prompt: bool = True

    @field_validator("topic", "audience", "tone", "goal")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("This field cannot be empty")
        return normalized


class Source(BaseModel):
    title: str = Field(max_length=300)
    url: HttpUrl
    summary: str = Field(max_length=1000)


class GeneratedPost(BaseModel):
    title: str
    hook: str
    body: str
    call_to_action: str
    hashtags: list[str]
    content_ideas: list[str]
    image_prompt: str
    sources: list[Source]


class PostResponse(GeneratedPost):
    id: int
    topic: str
    platform: Platform
```

## 9. Research service

Create `backend/app/services/research_service.py`:

```python
"""Research provider abstraction.

The fallback keeps local development working. Replace the provider request
with your selected licensed search or social-media API.
"""

from dataclasses import dataclass
import httpx

from app.core.config import Settings


@dataclass
class ResearchResult:
    summary: str
    keywords: list[str]
    hashtags: list[str]
    sources: list[dict]


async def research_topic(topic: str, platform: str, settings: Settings) -> ResearchResult:
    """Return normalized research data for the AI service."""

    if not settings.research_api_url or not settings.research_api_key:
        return ResearchResult(
            summary=f"Explore the current conversation around '{topic}' on {platform}.",
            keywords=[topic, platform, "social media marketing"],
            hashtags=[f"#{platform}", "#contentmarketing", "#socialmediatips"],
            sources=[],
        )

    headers = {"Authorization": f"Bearer {settings.research_api_key}"}
    payload = {"query": topic, "platform": platform, "limit": settings.max_research_results}

    # Timeout prevents an external provider from keeping the request open forever.
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.research_api_url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    return ResearchResult(
        summary=str(data.get("summary", ""))[:5000],
        keywords=[str(item)[:100] for item in data.get("keywords", [])[:20]],
        hashtags=[str(item)[:100] for item in data.get("hashtags", [])[:30]],
        sources=data.get("sources", [])[: settings.max_research_results],
    )
```

Use official platform APIs or a licensed search provider where possible. Do not depend on unauthorized scraping, login bypasses, or private user data.

## 10. AI generation service

Create `backend/app/services/ai_service.py`:

```python
"""AI generation with validated structured output."""

import json
from openai import AsyncOpenAI

from app.core.config import Settings
from app.schemas.post import GeneratedPost
from app.services.research_service import ResearchResult

SYSTEM_PROMPT = """
You are a careful social-media content strategist.
Create platform-specific content from the supplied research.
Do not invent facts, statistics, quotes, trends, or sources.
If research is incomplete, label creative suggestions as suggestions.
Return only valid JSON matching the requested schema.
"""


async def generate_post(request_data: dict, research: ResearchResult, settings: Settings) -> GeneratedPost:
    client = AsyncOpenAI(api_key=settings.ai_api_key, base_url=settings.ai_base_url)
    user_prompt = f"""
User request: {json.dumps(request_data, ensure_ascii=False)}
Research: {research.summary}
Keywords: {json.dumps(research.keywords)}
Hashtags: {json.dumps(research.hashtags)}
Sources: {json.dumps(research.sources)}

Return only this JSON shape:
{{
  "title": "short concept",
  "hook": "opening sentence",
  "body": "complete ready-to-edit post",
  "call_to_action": "specific CTA",
  "hashtags": ["#example"],
  "content_ideas": ["idea 1", "idea 2", "idea 3"],
  "image_prompt": "detailed visual-generation prompt",
  "sources": [{{"title": "source title", "url": "https://example.com", "summary": "short summary"}}]
}}
"""
    response = await client.chat.completions.create(
        model=settings.ai_model,
        temperature=0.7,
        max_tokens=1800,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("The AI provider returned an empty response")
    return GeneratedPost.model_validate_json(content)
```

## 11. API route and application entry point

Create `backend/app/api/posts.py`:

```python
"""Endpoints for generating and listing saved posts."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import get_db
from app.models.post import Post
from app.schemas.post import GeneratedPost, PostResponse, ResearchRequest
from app.services.ai_service import generate_post
from app.services.research_service import research_topic

router = APIRouter(prefix="/api/posts", tags=["posts"])


def to_response(post: Post) -> PostResponse:
    """Convert a database model into the public response shape."""

    return PostResponse(
        id=post.id,
        topic=post.topic,
        platform=post.platform,
        title=post.title,
        hook=post.hook,
        body=post.body,
        call_to_action=post.call_to_action,
        hashtags=post.hashtags,
        content_ideas=post.content_ideas,
        image_prompt=post.image_prompt,
        sources=post.sources,
    )


@router.post("/generate", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(request: ResearchRequest, db: Session = Depends(get_db)) -> PostResponse:
    """Research a topic, generate content, and save the result."""

    settings = get_settings()
    try:
        research = await research_topic(request.topic, request.platform, settings)
        generated: GeneratedPost = await generate_post(request.model_dump(), research, settings)
    except Exception as exc:
        # Do not expose provider errors, prompts, keys, or stack traces to clients.
        raise HTTPException(
            status_code=502,
            detail="Content generation service is temporarily unavailable.",
        ) from exc

    post = Post(
        topic=request.topic,
        platform=request.platform,
        title=generated.title,
        hook=generated.hook,
        body=generated.body,
        call_to_action=generated.call_to_action,
        hashtags=generated.hashtags,
        content_ideas=generated.content_ideas,
        image_prompt=generated.image_prompt if request.include_image_prompt else "",
        sources=[source.model_dump(mode="json") for source in generated.sources],
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return to_response(post)


@router.get("", response_model=list[PostResponse])
def list_posts(db: Session = Depends(get_db)) -> list[PostResponse]:
    """Return the newest saved posts."""

    posts = db.query(Post).order_by(Post.created_at.desc()).limit(50).all()
    return [to_response(post) for post in posts]
```

Create `backend/app/main.py`:

```python
"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.posts import router as posts_router
from app.core.config import get_settings
from app.database import Base, engine
from app.models import Post  # noqa: F401 - imports model before table creation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create MVP tables when the application starts."""

    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

# CORS is restricted to the known frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Simple health check used during local development and deployment."""

    return {"status": "ok"}


app.include_router(posts_router)
```

Create these empty package files so Python imports work:

```bash
mkdir -p app/api app/core app/models app/schemas app/services
touch app/__init__.py app/api/__init__.py app/core/__init__.py \
  app/models/__init__.py app/schemas/__init__.py app/services/__init__.py
```

Run the backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/docs> to test the API. The SQLite database file is created automatically on startup.

## 12. Frontend installation

From the project root in a second terminal:

```bash
cd frontend
npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir=false --use-npm
npm run dev
```

Create `frontend/.env.local.example`:

```env
# This is safe to expose because it is only the public backend URL.
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Copy it:

```bash
cp .env.local.example .env.local
```

## 13. Frontend API client

Create `frontend/lib/api.ts`:

```typescript
"use client";

export type GenerateRequest = {
  topic: string;
  platform: "instagram" | "linkedin" | "tiktok" | "x" | "facebook";
  audience: string;
  tone: string;
  goal: string;
  include_image_prompt: boolean;
};

export type GeneratedPost = {
  id: number;
  topic: string;
  platform: string;
  title: string;
  hook: string;
  body: string;
  call_to_action: string;
  hashtags: string[];
  content_ideas: string[];
  image_prompt: string;
  sources: { title: string; url: string; summary: string }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function generatePost(payload: GenerateRequest): Promise<GeneratedPost> {
  const response = await fetch(`${API_URL}/api/posts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to generate content. Please try again.");
  }

  return response.json();
}
```

## 14. Frontend page

Replace `frontend/app/page.tsx` with:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { generatePost, GeneratedPost } from "../lib/api";

const initialForm = {
  topic: "",
  platform: "instagram" as const,
  audience: "",
  tone: "Clear and engaging",
  goal: "Engagement",
  include_image_prompt: true,
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      setResult(await generatePost(form));
    } catch (requestError) {
      // Show a safe message instead of internal backend or provider details.
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Social Media Post Generator</h1>
      <p className="mb-8 text-gray-600">Research an idea and turn it into a ready-to-edit post.</p>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border p-6 shadow-sm">
        <label>
          Topic or idea
          <textarea
            required
            minLength={3}
            maxLength={500}
            value={form.topic}
            onChange={(event) => setForm({ ...form, topic: event.target.value })}
            className="mt-1 min-h-28 w-full rounded border p-2"
            placeholder="Example: How small businesses can use AI for customer support"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            Platform
            <select
              value={form.platform}
              onChange={(event) => setForm({ ...form, platform: event.target.value as typeof form.platform })}
              className="mt-1 w-full rounded border p-2"
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="x">X</option>
              <option value="facebook">Facebook</option>
            </select>
          </label>

          <label>
            Audience
            <input
              value={form.audience}
              maxLength={300}
              onChange={(event) => setForm({ ...form, audience: event.target.value })}
              className="mt-1 w-full rounded border p-2"
              placeholder="Example: Startup founders"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            Tone
            <input
              value={form.tone}
              maxLength={100}
              onChange={(event) => setForm({ ...form, tone: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <label>
            Goal
            <input
              value={form.goal}
              maxLength={100}
              onChange={(event) => setForm({ ...form, goal: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
        </div>

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={form.include_image_prompt}
            onChange={(event) => setForm({ ...form, include_image_prompt: event.target.checked })}
          />
          Generate an image prompt
        </label>

        <button disabled={loading} className="rounded bg-black px-4 py-3 text-white disabled:opacity-50">
          {loading ? "Researching and generating..." : "Generate post"}
        </button>
        {error && <p className="text-red-600" role="alert">{error}</p>}
      </form>

      {result && (
        <section className="mt-8 grid gap-4">
          <Output title="Title" value={result.title} />
          <Output title="Hook" value={result.hook} />
          <Output title="Post" value={result.body} />
          <Output title="Call to action" value={result.call_to_action} />
          <Output title="Hashtags" value={result.hashtags.join(" ")} />
          <Output title="Content ideas" value={result.content_ideas.join("\n\n")} />
          {result.image_prompt && <Output title="Image prompt" value={result.image_prompt} />}
          <div className="rounded-xl border p-4">
            <h2 className="mb-2 font-bold">Sources</h2>
            {result.sources.length === 0 ? <p>No live sources configured yet.</p> : result.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mb-2 block text-blue-700 underline">
                {source.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Output({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border p-4">
      <h2 className="mb-2 font-bold">{title}</h2>
      <p className="whitespace-pre-wrap">{value}</p>
    </article>
  );
}
```

## 15. Run the complete application

Terminal 1:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open <http://localhost:3000>.

## 16. Security checklist

Before deploying:

- Keep all AI and research keys in backend environment variables.
- Add authentication before exposing saved posts to multiple users.
- Add per-user ownership checks to every database query.
- Add rate limiting to `/api/posts/generate`.
- Set a spending limit with your AI provider.
- Keep request lengths and result lengths bounded.
- Use HTTPS in production.
- Restrict CORS to the real frontend domain.
- Never return exception text or stack traces to users.
- Validate AI output with Pydantic before saving it.
- Treat research content as untrusted input; it can contain prompt-injection text.
- Display source links and identify suggestions versus verified facts.
- Add database migrations with Alembic before changing production schemas.
- Use PostgreSQL instead of SQLite when you need multiple workers or many concurrent users.

## 17. Recommended next improvements

1. Replace the fallback research function with a licensed search provider.
2. Add login and user-owned projects.
3. Add edit and delete endpoints.
4. Add a content calendar.
5. Add post variations and repurposing for other platforms.
6. Add automated tests for schemas, API routes, and provider failures.
7. Add background jobs if research takes more than a few seconds.

SQLite is appropriate for this first version. When the application grows, keep the SQLAlchemy models and change the database URL to PostgreSQL, then run migrations.
