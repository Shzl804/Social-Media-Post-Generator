# Social Media Post Generator

Research-aware social media post generation with a Next.js frontend and FastAPI backend.
The demo is stateless: generated content is returned to the browser and is not stored.

## Local setup

1. Install Python 3.11+ and Node.js 20+.
2. Create the backend environment and install dependencies:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r ../requirements.txt
   cp .env.example .env
   ```

   Set your Groq `AI_API_KEY` and a long `APP_SECRET_KEY` in `backend/.env`.

   The default configuration uses Groq's OpenAI-compatible endpoint with
   `openai/gpt-oss-20b` for the fast creative brief and `openai/gpt-oss-120b`
   for final copy. You can override `AI_FAST_MODEL`, `AI_MODEL`, and
   `AI_BASE_URL` in `.env` if needed.

3. Start the API from `backend/`:

   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. In another terminal, start the frontend:

   ```bash
   cd frontend
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```

Open http://localhost:3000. Without a research provider, generated posts clearly use the labeled fallback mode.

See [IMPLEMENTATION_GUIDE_CLAUDE.md](IMPLEMENTATION_GUIDE_CLAUDE.md) for the full architecture, security checklist, provider integration notes, and deployment requirements.
