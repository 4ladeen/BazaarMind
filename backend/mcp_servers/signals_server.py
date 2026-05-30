"""BazaarMind — Commerce Signals MCP Server
Custom MCP server exposing hyper-local signal tools for Bangladesh.
Tools: get_mfs_payday_cycle, get_regional_weather_disruption,
       get_political_event_status, get_cod_failure_matrix
"""
from __future__ import annotations
from typing import Optional, Dict, Any, List
from datetime import date
from backend.services.demo_data import demo_data


class SignalsMCPServer:
    """
    MCP Server: bd-commerce-signals
    Exposes hyper-local signal monitoring tools for Bangladeshi commerce.
    """

    def __init__(self):
        self.name = "bd-commerce-signals"
        self.tools = {
            "get_mfs_payday_cycle": self.get_mfs_payday_cycle,
            "get_regional_weather_disruption": self.get_regional_weather_disruption,
            "get_political_event_status": self.get_political_event_status,
            "get_cod_failure_matrix": self.get_cod_failure_matrix,
        }

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "get_mfs_payday_cycle",
                "description": "Get mobile financial service (bKash/Nagad/Rocket) payday cycles to predict local liquidity",
                "parameters": {
                    "region": {"type": "string", "required": False},
                    "provider": {"type": "string", "required": False},
                }
            },
            {
                "name": "get_regional_weather_disruption",
                "description": "Get current and forecasted weather disruptions affecting supply chains",
                "parameters": {
                    "region": {"type": "string", "required": False},
                }
            },
            {
                "name": "get_political_event_status",
                "description": "Get political event statuses (hartals, elections, holidays) that may disrupt commerce",
                "parameters": {
                    "region": {"type": "string", "required": False},
                }
            },
            {
                "name": "get_cod_failure_matrix",
                "description": "Get cash-on-delivery failure rates and analysis by region",
                "parameters": {
                    "region": {"type": "string", "required": False},
                }
            },
        ]

    async def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name not in self.tools:
            return {"error": f"Unknown tool: {tool_name}"}
        return await self.tools[tool_name](**params)

    async def get_mfs_payday_cycle(
        self,
        region: Optional[str] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get MFS payday cycles — predicts liquidity spikes"""
        cycles = demo_data.get_mfs_payday_cycles(region)

        if provider:
            cycles = [c for c in cycles if c.provider.lower() == provider.lower()]

        nearest = min(cycles, key=lambda c: c.days_until_payday) if cycles else None

        return {
            "generated_at": date.today().isoformat(),
            "cycles": [c.model_dump() for c in cycles],
            "nearest_payday": {
                "provider": nearest.provider,
                "date": nearest.next_payday.isoformat(),
                "days_away": nearest.days_until_payday,
                "expected_spike": nearest.expected_liquidity_spike_pct,
            } if nearest else None,
            "recommendation": (
                f"📈 {nearest.provider} payday in {nearest.days_until_payday} days. "
                f"Expect {nearest.expected_liquidity_spike_pct}% liquidity spike. "
                f"Stock up on high-demand items!"
            ) if nearest else "No upcoming payday cycles found.",
        }

    async def get_regional_weather_disruption(
        self,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get weather disruption matrix for supply chain planning"""
        disruptions = demo_data.get_weather_disruptions(region)

        critical = [d for d in disruptions if d.severity.value in ["high", "critical"]]

        return {
            "generated_at": date.today().isoformat(),
            "disruptions": [d.model_dump() for d in disruptions],
            "critical_alerts": len(critical),
            "overall_risk_level": "high" if critical else "moderate" if disruptions else "low",
            "summary": {
                "total_active": len(disruptions),
                "affected_regions": list(set(d.region for d in disruptions)),
                "avg_impact_score": round(
                    sum(d.supply_chain_impact_score for d in disruptions) / max(len(disruptions), 1), 1
                ),
            },
        }

    async def get_political_event_status(
        self,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get political event statuses affecting commerce"""
        events = demo_data.get_political_events(region)

        high_risk = [e for e in events if e.disruption_probability > 0.5]

        return {
            "generated_at": date.today().isoformat(),
            "events": [e.model_dump() for e in events],
            "high_risk_events": len(high_risk),
            "market_closures_expected": len([e for e in events if e.market_closure_expected]),
            "recommended_buffer_days": max(
                (e.recommended_stock_buffer_days for e in events), default=0
            ),
        }

    async def get_cod_failure_matrix(
        self,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get COD failure analysis by region"""
        matrices = demo_data.get_cod_failure_matrix(region)

        avg_failure = sum(m.failure_rate_pct for m in matrices) / max(len(matrices), 1)
        worst = max(matrices, key=lambda m: m.failure_rate_pct) if matrices else None

        return {
            "generated_at": date.today().isoformat(),
            "matrices": [m.model_dump() for m in matrices],
            "summary": {
                "avg_failure_rate": round(avg_failure, 1),
                "worst_region": worst.region if worst else None,
                "worst_rate": worst.failure_rate_pct if worst else 0,
                "total_regions_analyzed": len(matrices),
            },
            "recommendation": (
                f"⚠️ {worst.region} has the highest COD failure rate at "
                f"{worst.failure_rate_pct}%. {worst.recommendation}"
            ) if worst else "No COD data available.",
        }


signals_mcp = SignalsMCPServer()
