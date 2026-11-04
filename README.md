# Social Media Post Generator

Live preview: https://frontend-pi-one-xlnctqa5cj.vercel.app/

A research-aware social media post generator built with a Next.js frontend and a FastAPI backend. It turns a topic, audience, tone, and campaign goal into polished social copy and optional research-backed insights.

This demo is intentionally stateless: generated content is returned to the browser and is not stored in a database.

## Features

- Generate ready-to-use social post copy for multiple content goals
- Research-aware workflow with optional provider-backed research context
- Simple, modern UI built with Next.js and Tailwind-inspired styling
- FastAPI backend with structured validation and CORS-safe API setup
- Safety-conscious configuration and environment-based secrets management

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: FastAPI, Pydantic, Uvicorn
- AI integration: Groq-compatible OpenAI endpoint
- Optional research: Tavily or other configurable research provider

## Project Structure

```text
.
├── backend/
│   ├── app/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.local.example
│   └── package.json
├── README.md
├── requirements.txt
├── pyproject.toml
└── uv.lock
```

## Local Setup

### 1) Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### 2) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `backend/.env` with your values, especially:

```env
APP_SECRET_KEY=replace-with-a-long-random-secret
AI_API_KEY=replace-with-your-groq-api-key
AI_MODEL=openai/gpt-oss-120b
AI_FAST_MODEL=openai/gpt-oss-20b
AI_BASE_URL=https://api.groq.com/openai/v1
```

Optional research keys can also be added if you want research-backed generation instead of the fallback path.

### 3) Run the backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

- http://127.0.0.1:8000
- health check: http://127.0.0.1:8000/health

### 4) Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Then open:

- http://localhost:3000

## Environment Notes

- `frontend/.env.local` exposes only the public API base URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

- Secrets and model configuration stay in the backend environment file.
- If no research provider is configured, the app uses a clearly labeled fallback mode and still produces a usable result.

## Usage

1. Enter a topic or campaign concept.
2. Add the intended audience and communication tone.
3. Provide your goal or objective.
4. Generate the post and review the output.
5. Copy or refine the final result as needed.

## Deployment

The project is configured to run as a standard Next.js frontend + FastAPI backend deployment. The frontend preview link above points to a deployed instance for quick testing.

For production deployment, make sure:

- backend environment variables are configured securely
- CORS origins reflect the actual production frontend URL
- API keys are stored in a secure secret manager rather than committed to source control

## License

This project is intended for personal and demo use unless a separate license is provided in the repository.
