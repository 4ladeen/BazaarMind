# BazaarMind

**AI-Driven Predictive Commerce & Advisory Platform for Bangladesh**

BazaarMind is a WhatsApp-first AI advisory platform engineered specifically for regional and rural merchants in Bangladesh. It bridges the gap between enterprise-grade supply chain analytics and low-bandwidth environments by leveraging a multi-tiered language model topology and edge-based inference.

## Features

- **Demand Forecasting:** ML-powered demand predictions mapped to local seasonality (e.g., Eid, Boishakh).
- **Dynamic Pricing:** Price elasticity modeling with strict COGS protection.
- **Disruption Alerts:** Hyper-local weather, political, and supply chain disruption monitoring.
- **WhatsApp Interface:** Natural Banglish conversational AI (e.g., "kal ki sell hobe?").
- **MFS Payday Cycles:** Liquidity spike tracking for optimal promotion timing.

## Architecture

- **Frontend:** Next.js 14 (React) with rich glassmorphic UI and Tailwind CSS.
- **Backend:** FastAPI (Python) serving REST APIs and managing the AI orchestrator.
- **AI Agents:** LangGraph-based multi-agent supervisor orchestrating Claude, Gemini, and Llama 3.3.
- **Deployment:** Single-container Dockerized application suitable for Google Cloud Run.

## Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- Python (3.12+)
- Docker (optional)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/md-yusuf/BazaarMind.git
   cd BazaarMind
   ```

2. **Backend Setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   cp .env.example .env
   python -m uvicorn backend.main:app --reload
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Supabase Setup

BazaarMind already uses PostgreSQL through SQLAlchemy, so Supabase is the cleanest way to replace the local database with a hosted one.

1. Create a Supabase project.
2. Open **Project Settings -> Database -> Connection string** and copy the connection string.
3. Put the connection string into your `.env` as `DATABASE_URL`.
4. If Supabase gives you a `postgres://` URL, change the scheme to `postgresql+asyncpg://` for the backend.
5. Keep `DATABASE_URL_SYNC` in sync with the same database if you plan to use Alembic migrations.
6. If you later want Supabase Auth or Storage, add the Supabase client only then. The current app does not require it just to use Supabase as the database.

Example:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
DATABASE_URL_SYNC=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

If you want the backend to read Supabase directly from Python code later, the optional values in `.env.example` are already reserved for `SUPABASE_URL` and `SUPABASE_KEY`.

### Docker Deployment

To build and run the entire stack in a single container:

```bash
docker build -t bazaarmind .
docker run -p 8080:8080 bazaarmind
```

Access the application at `http://localhost:8080`.

Live link: https://bazaarmind-fg1j.onrender.com/api


## License
Proprietary / Delta V © 2026
