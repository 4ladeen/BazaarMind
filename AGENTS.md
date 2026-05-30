# AI Agents & Model Configuration

BazaarMind uses a sophisticated multi-agent orchestration pattern to route requests dynamically and optimize for cost and latency based on the merchant's query intent.

## Topography

1. **Orchestrator Node**
   - **Role:** Supervisor agent using LangGraph. Receives incoming queries and determines intent.
   - **Model:** Llama 3.3 (via Groq) for sub-200ms latency classification.
   - **Logic:** Routes query to specific specialized sub-agents based on the detected intent.

2. **Forecast Agent**
   - **Role:** Predicts demand and calculates price elasticity.
   - **Model:** Gemini 1.5 Flash.
   - **Tools:** Uses the Forecast MCP Server to access product velocity data, seasonality indices, and perform elasticity modeling.

3. **Signal Agent**
   - **Role:** Monitors and reports hyper-local disruptions (weather, political, MFS paydays, COD failure rates).
   - **Model:** Gemini 1.5 Flash.
   - **Tools:** Uses the Signals MCP Server to access regional impact matrices.

4. **Advisory & RAG Agent**
   - **Role:** General product knowledge, strategic advice, and creative marketing copy.
   - **Model:** Claude 3.5 Sonnet (via Anthropic).
   - **Tools:** Semantic Search against vector DB for business strategies and historical insights.

5. **Offline/Edge Fallback**
   - **Role:** Operates when upstream APIs fail or latency is unacceptable (e.g., 2G constrained zones).
   - **Model:** Phi-3 or Gemma 2 (4-bit quantized) running locally via Ollama.

## Prompts & Cultural Calibration

All outputs are calibrated through the `banglish_processor` which forces the LLM to reply using code-mixed Bengali and English written in Latin script (Banglish) to match the exact communication style of our target merchants.

Example Banglish Output: "Apnar Miniket Rice er demand next week e barte pare 📈. Stock clear korar jonno price 1520 rakha bhalo hobe."
