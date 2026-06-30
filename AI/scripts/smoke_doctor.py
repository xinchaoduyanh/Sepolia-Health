"""Smoke test data bác sĩ + agent end-to-end (bridge thật + Ollama thật).

Mô phỏng câu hỏi: "thứ 7 tuần này có bác sĩ nào ở cơ sở Hoài Đức không".

Cần CHẠY TRƯỚC:
  - Be/ listen ở AI_BE_BRIDGE_BASE_URL (mặc định :8000), DB đã seed.
  - Ollama có qwen2.5:3b + bge-m3 (AI_OLLAMA_BASE_URL).
  - AI/.env AI_INTERNAL_SHARED_SECRET == Be/.env AI_INTERNAL_TOKEN.

Chạy:  AI/.venv/Scripts/python.exe -m scripts.smoke_doctor
"""
import asyncio
import json
import sys

# Console Windows mặc định cp1252 -> in tiếng Việt sẽ crash. Ép UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.config import get_settings
from app.deps import (
    build_agent_for_user,
    get_bridge,
    get_emergency_detector,
    get_knowledge_policy,
    get_provider,
    get_registry,
    get_retriever,
)
from app.session.models import SessionState
from app.tools.be_bridge import BridgeError
from app.tools.registry import ToolRegistry

USER_ID = 1  # user thật trong DB (FK). Đổi nếu cần.
LOCATION = "Hoài Đức"
QUESTION = "thứ 7 tuần này có bác sĩ nào ở cơ sở Hoài Đức không"


def _short(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)[:600]


async def main() -> None:
    s = get_settings()
    print(f"bridge={s.be_bridge_base_url}  ollama={s.ollama_base_url}")
    bridge = get_bridge().with_acting_user(USER_ID)

    # ---- Part A: bridge DATA trực tiếp (deterministic, không qua LLM) ----
    print("=" * 70, "\n[A] Bridge data trực tiếp")
    reg = ToolRegistry(bridge)
    sat = await reg.execute("resolve_date", {"weekday": "sat", "week_offset": 0}, session_id="smoke")
    date = sat.get("iso_date")
    print(f"  'thứ 7 tuần này' -> {date} ({sat.get('label')})")
    try:
        clinics = await bridge.search_clinics("", LOCATION)
        print(f"  search_clinics(location={LOCATION!r}): {_short(clinics)}")
        avail = await bridge.find_available_doctors(date, None, None)
        print(f"  find_available_doctors({date}): {_short(avail)}")
    except BridgeError as exc:
        print(f"  !! Bridge lỗi: {exc}")
        print("  Gợi ý: Be đã chạy ở đúng port chưa? Token 2 đầu khớp chưa?")
        return

    # ---- Part B: agent end-to-end (LLM tự chọn tool) ----
    print("=" * 70, "\n[B] Agent end-to-end (Ollama thật)")
    agent = build_agent_for_user(
        USER_ID,
        get_provider(),
        get_bridge(),
        get_registry(),
        s,
        retriever=get_retriever(),
        emergency_detector=get_emergency_detector(),
        knowledge_policy=get_knowledge_policy(),
    )
    session = SessionState(session_id="smoke_doc", user_id=USER_ID)
    r = await agent.handle_turn(session, QUESTION, "tr_doc")
    print(f"  state={session.agent_state.value}")
    print(f"  tools={[(x.name, x.ok, x.error_code) for x in r.tool_results_summary]}")
    print(f"  message={r.message!r}")


if __name__ == "__main__":
    asyncio.run(main())
