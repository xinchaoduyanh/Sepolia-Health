"""Smoke test thật với Ollama local (cần `ollama serve` + qwen2.5:3b).

Chạy: AI/.venv/Scripts/python.exe -m scripts.smoke_ollama
Không thuộc pytest (cần model thật) — dùng để verify tay Phase 02/03/06.
"""
import asyncio
import json
import os

from app.agents.scheduling_agent import SchedulingAgent
from app.prompts.loader import PromptRegistry
from app.providers.ollama_provider import OllamaProvider
from app.session.models import SessionState
from app.tools.registry import ToolRegistry
from tests.fakes import FakeBridge

MODEL = "qwen2.5:3b-instruct-q4_K_M"


async def main() -> None:
    provider = OllamaProvider(os.getenv("AI_OLLAMA_BASE_URL", "http://127.0.0.1:11434"))

    # 1) Tool-calling thô: model có gọi đúng tool không?
    print("=" * 60, "\n[1] Tool-calling test")
    resp = await provider.chat(
        MODEL,
        [{"role": "user", "content": "Tìm phòng khám da liễu ở quận 1"}],
        tools=[{
            "type": "function",
            "function": {
                "name": "search_clinics",
                "description": "Tìm phòng khám theo từ khoá/khu vực",
                "parameters": {"type": "object",
                               "properties": {"q": {"type": "string"}, "location": {"type": "string"}},
                               "required": ["q"]},
            },
        }],
    )
    print(f"  latency={resp.latency_ms}ms  tool_calls={[(t.name, t.arguments) for t in resp.tool_calls]}")
    print(f"  content={resp.content!r}")

    # 2) resolve_date qua registry (deterministic, không phụ thuộc model)
    print("=" * 60, "\n[2] resolve_date qua ToolRegistry")
    reg = ToolRegistry(FakeBridge())
    out = await reg.execute("resolve_date", {"weekday": "tue", "week_offset": 1}, session_id="s")
    print(f"  'thứ 3 tuần sau' -> {out.get('iso_date')} ({out.get('label')})")

    # 3) Agent end-to-end (provider thật + FakeBridge)
    print("=" * 60, "\n[3] Agent end-to-end")
    prompts = PromptRegistry("./prompts")
    prompts.load_all()
    agent = SchedulingAgent(provider, MODEL, ToolRegistry(FakeBridge()), prompts)
    session = SessionState(session_id="smoke1", user_id=7)
    r = await agent.handle_turn(session, "Em muốn đặt khám da liễu với bác sĩ Canh thứ 3 tuần sau lúc 9h", "tr1")
    print(f"  state={session.agent_state.value}  requires_confirm={r.requires_confirmation}")
    print(f"  tools={[(s.name, s.ok) for s in r.tool_results_summary]}")
    print(f"  message={r.message!r}")


if __name__ == "__main__":
    asyncio.run(main())
