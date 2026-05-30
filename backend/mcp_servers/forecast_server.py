"""BazaarMind — Forecast MCP Server
Custom Model Context Protocol server exposing demand forecasting tools.
Tools: get_demand_forecast, calculate_price_elasticity, get_seasonality_index
"""
from __future__ import annotations
from typing import Optional, Dict, Any, List
from datetime import date
from backend.services.demo_data import demo_data


class ForecastMCPServer:
    """
    MCP Server: bazaarmind-forecast
    Exposes predictive commerce tools for demand forecasting and pricing.
    """

    def __init__(self):
        self.name = "bazaarmind-forecast"
        self.tools = {
            "get_demand_forecast": self.get_demand_forecast,
            "calculate_price_elasticity": self.calculate_price_elasticity,
            "get_seasonality_index": self.get_seasonality_index,
        }

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "get_demand_forecast",
                "description": "Get demand forecast for a merchant's products for the next N days",
                "parameters": {
                    "merchant_id": {"type": "string", "required": True},
                    "days_ahead": {"type": "integer", "default": 7},
                    "product_id": {"type": "string", "required": False},
                }
            },
            {
                "name": "calculate_price_elasticity",
                "description": "Calculate price elasticity and optimal price points for products",
                "parameters": {
                    "merchant_id": {"type": "string", "required": True},
                    "product_id": {"type": "string", "required": False},
                }
            },
            {
                "name": "get_seasonality_index",
                "description": "Get seasonality indices for product categories in Bangladesh",
                "parameters": {
                    "category": {"type": "string", "required": False},
                    "month": {"type": "integer", "required": False},
                }
            },
        ]

    async def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name not in self.tools:
            return {"error": f"Unknown tool: {tool_name}"}
        return await self.tools[tool_name](**params)

    async def get_demand_forecast(
        self,
        merchant_id: str,
        days_ahead: int = 7,
        product_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get demand forecast with confidence intervals"""
        forecasts = demo_data.get_demand_forecasts(merchant_id, days_ahead)

        if product_id:
            forecasts = [f for f in forecasts if f.product_id == product_id]

        return {
            "merchant_id": merchant_id,
            "forecast_period_days": days_ahead,
            "generated_at": date.today().isoformat(),
            "forecasts": [f.model_dump() for f in forecasts],
            "summary": {
                "total_products": len(set(f.product_id for f in forecasts)),
                "avg_predicted_demand": round(
                    sum(f.predicted_demand for f in forecasts) / max(len(forecasts), 1), 1
                ),
                "rising_trends": len([f for f in forecasts if f.trend == "rising"]),
                "declining_trends": len([f for f in forecasts if f.trend == "declining"]),
            }
        }

    async def calculate_price_elasticity(
        self,
        merchant_id: str,
        product_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate price elasticity with COGS floor enforcement"""
        elasticities = demo_data.get_price_elasticity(merchant_id)

        if product_id:
            elasticities = [e for e in elasticities if e.product_id == product_id]

        return {
            "merchant_id": merchant_id,
            "generated_at": date.today().isoformat(),
            "elasticities": [e.model_dump() for e in elasticities],
            "summary": {
                "total_products": len(elasticities),
                "avg_elasticity": round(
                    sum(e.elasticity_coefficient for e in elasticities) / max(len(elasticities), 1), 3
                ),
                "products_overpriced": len([e for e in elasticities if e.optimal_price < e.current_price]),
                "products_underpriced": len([e for e in elasticities if e.optimal_price > e.current_price]),
                "total_revenue_opportunity_pct": round(
                    sum(e.expected_revenue_change_pct for e in elasticities) / max(len(elasticities), 1), 1
                ),
            }
        }

    async def get_seasonality_index(
        self,
        category: Optional[str] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get seasonality indices for Bangladesh retail"""
        indices = demo_data.get_seasonality_indices(category)

        if month:
            indices = [i for i in indices if i.month == month]

        return {
            "generated_at": date.today().isoformat(),
            "indices": [i.model_dump() for i in indices],
            "current_month": date.today().month,
            "peak_categories": [
                i.category.value for i in indices
                if i.month == date.today().month and i.index_value > 1.2
            ],
        }


forecast_mcp = ForecastMCPServer()
