"""Replaceable research layer.

IMPORTANT - READ THIS:
* Use OFFICIAL platform APIs or LICENSED data/search providers.
* Do NOT scrape sites without permission, bypass logins, ignore terms of service,
  or collect private user data.
* Never pass off the fallback below as live research. It performs NO research.
"""

import logging
import re
from typing import Protocol

import httpx

from app.core.config import Settings
from app.schemas.post import ResearchResult, SourceItem

logger = logging.getLogger(__name__)

# Explicit timeouts on every external request: total 10s, connecting 5s.
REQUEST_TIMEOUT = httpx.Timeout(10.0, connect=5.0)

_STOPWORDS = {
    "about", "after", "also", "been", "from", "have", "into", "just", "more", "that",
    "their", "them", "then", "they", "this", "what", "when", "where", "which", "with",
    "your", "how", "can", "for", "and", "the", "use", "using", "are", "you",
}


class ResearchError(Exception):
    """Raised internally when a provider fails or returns unusable data."""


class ResearchProvider(Protocol):
    """Any research backend must implement this one method."""

    async def research(self, topic: str, platform: str) -> ResearchResult: ...


def _extract_keywords(text: str, limit: int = 8) -> list[str]:
    """Naive keywords taken ONLY from the user's own text (not from research)."""
    words = re.findall(r"[A-Za-z][A-Za-z'\-]{3,}", text.lower())
    keywords: list[str] = []
    for word in words:
        if word not in _STOPWORDS and word not in keywords:
            keywords.append(word)
    return keywords[:limit]


class FallbackResearchProvider:
    """Used when no research API is configured or the provider fails.

    It returns NO sources, NO trends, NO hashtags. Its summary says so plainly, and the
    result is marked mode="fallback" so the UI and the AI prompt both know.
    """

    async def research(self, topic: str, platform: str) -> ResearchResult:
        return ResearchResult(
            mode="fallback",
            summary=(
                "No live research was performed. Nothing in this result is verified "
                "or current. Treat all trend, hashtag, and audience ideas as creative suggestions."
            ),
            keywords=_extract_keywords(topic),
            hashtags=[],
            sources=[],
        )


class TavilyResearchProvider:
    """Research provider backed by Tavily's web search API."""

    API_URL = "https://api.tavily.com/search"

    def __init__(self, api_key: str, max_results: int) -> None:
        self.api_key = api_key  # SECRET: never log this value.
        self.max_results = max_results

    async def research(self, topic: str, platform: str) -> ResearchResult:
        query = f"{topic} {platform} social media content trends audience"

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                self.API_URL,
                json={
                    "api_key": self.api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": self.max_results,
                    "include_answer": True,
                    "include_raw_content": False,
                },
            )
            response.raise_for_status()
            data = response.json()

        return self._normalize(data, topic)

    def _normalize(self, data: object, topic: str) -> ResearchResult:
        """Convert Tavily results into the app's provider-neutral format."""
        results = data.get("results") if isinstance(data, dict) else None
        if not isinstance(results, list):
            raise ResearchError("Unexpected Tavily response shape")

        sources: list[SourceItem] = []
        for item in results[: self.max_results]:
            if not isinstance(item, dict):
                continue
            url = item.get("url")
            title = str(item.get("title") or url or "").strip()[:300]
            snippet = str(item.get("content") or "").strip()[:500]
            try:
                sources.append(SourceItem(title=title, url=url, summary=snippet))
            except ValueError:
                continue

        if not sources:
            raise ResearchError("Tavily returned no usable results")

        answer = data.get("answer") if isinstance(data, dict) else None
        answer_text = str(answer).strip() if answer else ""
        summary_parts = [answer_text] if answer_text else []
        summary_parts.extend(source.summary for source in sources if source.summary)

        return ResearchResult(
            mode="live",
            summary=" ".join(summary_parts)[:1500],
            keywords=_extract_keywords(topic),
            hashtags=[],
            sources=sources,
        )


class HttpResearchProvider:
    """Template for a REAL licensed search/research API that returns JSON over HTTPS.

    >>> ADAPT THIS CLASS to your provider. <<<
    Providers differ in: HTTP method (GET vs POST), authentication (header name, token
    format), request body or query parameters, and response shape. The request and the
    parsing below are a GENERIC EXAMPLE, not any specific vendor's real API. Read your
    provider's documentation and change:
      1. the request (method, headers, body/params) in research(),
      2. the field names read in _normalize() (here: "results", "title", "url", "content").
    If the response does not look as expected we raise ResearchError and the caller
    falls back, labeled as "fallback". We never fabricate results.

    Platform-specific hashtag volume or trend data generally requires an official platform
    API or a licensed analytics vendor. A general web-search API will not provide it, so
    hashtags stay empty here.
    """

    def __init__(self, api_url: str, api_key: str, max_results: int) -> None:
        self.api_url = api_url
        self.api_key = api_key  # SECRET: never log this value.
        self.max_results = max_results

    async def research(self, topic: str, platform: str) -> ResearchResult:
        query = f"{topic} {platform} social media"

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            # ADAPT: request shape for your provider goes here.
            response = await client.post(
                self.api_url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": query, "max_results": self.max_results},
            )
            # Raises httpx.HTTPStatusError for 4xx/5xx responses.
            response.raise_for_status()
            data = response.json()

        return self._normalize(data, topic)

    def _normalize(self, data: object, topic: str) -> ResearchResult:
        """Convert the provider's JSON into our ResearchResult.

        SECURITY: everything in `data` is UNTRUSTED. Web pages can contain text such as
        "ignore your instructions...". That is prompt injection. We truncate fields here,
        and ai_service.py passes research to the model as clearly marked data.
        """
        results = data.get("results") if isinstance(data, dict) else None  # ADAPT field name
        if not isinstance(results, list):
            raise ResearchError("Unexpected provider response shape")

        sources: list[SourceItem] = []
        for item in results[: self.max_results]:
            if not isinstance(item, dict):
                continue
            url = item.get("url")  # ADAPT
            title = str(item.get("title") or url or "").strip()[:300]  # ADAPT
            snippet = str(item.get("content") or item.get("snippet") or "").strip()[:500]  # ADAPT
            try:
                sources.append(SourceItem(title=title, url=url, summary=snippet))
            except ValueError:
                continue  # skip entries with a missing/invalid URL or empty title

        if not sources:
            raise ResearchError("Provider returned no usable results")

        summary = " ".join(s.summary for s in sources if s.summary)[:1500]
        return ResearchResult(
            mode="live",
            summary=summary,
            keywords=_extract_keywords(topic),
            hashtags=[],
            sources=sources,
        )


def get_research_provider(settings: Settings) -> ResearchProvider:
    """Pick a provider from settings. Add new providers here."""
    if settings.tavily_api_key:
        return TavilyResearchProvider(
            api_key=settings.tavily_api_key,
            max_results=settings.max_research_results,
        )
    if settings.research_api_key and settings.research_api_url:
        return HttpResearchProvider(
            api_url=settings.research_api_url,
            api_key=settings.research_api_key,
            max_results=settings.max_research_results,
        )
    return FallbackResearchProvider()


async def run_research(topic: str, platform: str, settings: Settings) -> ResearchResult:
    """Run research; on any provider failure, degrade to the labeled fallback."""
    provider = get_research_provider(settings)
    try:
        return await provider.research(topic, platform)
    except (httpx.HTTPError, ResearchError, ValueError) as exc:
        # Log only the exception TYPE. Provider error text can contain URLs or keys.
        logger.warning("Research provider failed: %s", type(exc).__name__)
        return await FallbackResearchProvider().research(topic, platform)
