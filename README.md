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

### Docker Deployment

To build and run the entire stack in a single container:

```bash
docker build -t bazaarmind .
docker run -p 8080:8080 bazaarmind
```

Access the application at `http://localhost:8080`.

## License
Proprietary / Delta V © 2026
