"""Pipeline E2E: giả lập user nhắn AI → đối chiếu kỳ vọng → báo cáo.

  python -m eval.e2e.run_e2e                      # inproc: app thật + Gemini thật + SimBridge
  python -m eval.e2e.run_e2e --only book-happy --only emergency
  python -m eval.e2e.run_e2e --tag safety --no-judge
  python -m eval.e2e.run_e2e --target http://127.0.0.1:8088   # service đang chạy (bỏ qua check bridge state)
  python -m eval.e2e.run_e2e --fail-under 0.9      # exit 1 nếu pass rate thấp hơn

Hai tầng kiểm tra: (1) deterministic (regex/tool/state/hậu quả trên SimBridge),
(2) LLM-judge (Gemini) cho tiêu chí ngữ nghĩa. Báo cáo ghi vào eval/reports/.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import httpx  # noqa: E402

from eval.e2e import scenarios as SC  # noqa: E402
from eval.e2e.scenarios import Scenario  # noqa: E402
from eval.e2e.sim_bridge import SimBridge  # noqa: E402

TOKEN = "e2e-internal-token"
REPORTS = ROOT / "eval" / "reports"
P = "/internal/ai/chat"


@dataclass
class TurnLog:
    say: str
    reply: str = ""
    tools: list[str] = field(default_factory=list)
    confirm: bool = False
    action: str | None = None
    state: str = ""
    latency: float = 0.0
    fails: list[str] = field(default_factory=list)
    judge: str = ""


@dataclass
class ScenarioResult:
    id: str
    title: str
    ok: bool
    turns: list[TurnLog]
    final_fail: str = ""
    error: str = ""


# ---------------- Live backend (BE + DB thật qua HttpBridgeClient) ----------------
class LiveBackend:
    """Bọc bridge thật: seed/dọn/đọc lịch của 1 user test qua API Be (đi tới DB Neon)."""

    def __init__(self, bridge, user_id: int) -> None:
        self.bridge, self.user_id = bridge.with_acting_user(user_id), user_id
        self.appointments: dict[int, dict] = {}
        self.profile_id = 0

    async def refresh(self) -> None:
        from datetime import datetime
        from eval.e2e.sim_bridge import VN
        r = await self.bridge.get_upcoming_appointments(self.user_id)
        self.appointments = {}
        for a in r.get("appointments", []):
            st = datetime.fromisoformat(a["start_time"].replace("Z", "+00:00")).astimezone(VN)
            self.appointments[a["id"]] = {**a, "start_time": st.isoformat(), "status": a.get("status", "")}

    async def cleanup(self) -> int:
        await self.refresh()
        n = 0
        for aid, a in list(self.appointments.items()):
            if a["status"] not in ("CANCELLED", "COMPLETED"):
                await self.bridge.cancel_appointment(aid)
                n += 1
        await self.refresh()
        return n

    async def seed_appointment(self, doctor_id: int, service_id: int, start_iso: str) -> int:
        import uuid
        prof = await self.bridge.resolve_patient_profile(self.user_id)
        d = await self.bridge.create_booking_draft(prof["patient_profile_id"], doctor_id, service_id, start_iso, "e2e-" + uuid.uuid4().hex)
        c = await self.bridge.confirm_booking(d["draft_id"], "e2e-c-" + uuid.uuid4().hex)
        return c.get("appointment_id", 0)


async def discover_world(lb: "LiveBackend", doc_id: int) -> dict:
    """Chọn bác sĩ + 2 slot sáng còn trống vào thứ Ba tuần sau từ dữ liệu thật."""
    doc = await lb.bridge.get_doctor_detail(doc_id)
    av = await lb.bridge.get_doctor_availability(doc_id, SC.TUE_ISO, None)
    morning = [x for x in av.get("available_slots", []) if "08:00" <= x < "12:00"]
    if len(morning) < 2:
        raise SystemExit(f"Bác sĩ {doc_id} không đủ slot sáng {SC.TUE_ISO}: {av}")
    svc = (doc.get("services") or [{}])[0]
    return {"doc_id": doc_id, "svc_id": svc.get("id"), "doc_full": f"{doc['last_name']} {doc['first_name']}",
            "doc_key": doc["first_name"].split()[-1], "slot1": morning[0], "slot2": morning[1], "live": True}


# ---------------- LLM judge ----------------
async def judge(provider, model: str, transcript: str, criterion: str) -> tuple[bool, str]:
    sys_p = ("Bạn là giám khảo QA cho chatbot đặt lịch khám bệnh. Chỉ trả JSON một dòng: "
             '{"pass": true|false, "reason": "<một câu tiếng Việt>"}. Chấm nghiêm túc, chỉ dựa trên tiêu chí.')
    user = f"HỘI THOẠI:\n{transcript}\n\nTIÊU CHÍ CẦN ĐẠT:\n{criterion}"
    try:
        r = await provider.chat(model, [{"role": "system", "content": sys_p}, {"role": "user", "content": user}],
                                temperature=0.0, max_tokens=4000)
        m = re.search(r"\{.*\}", r.content or "", re.S)
        if not m:
            return False, f"judge_unparseable: {(r.content or '')[:120]!r}"
        d = json.loads(m.group(0))
        return bool(d.get("pass")), str(d.get("reason", ""))[:300]
    except Exception as exc:  # noqa: BLE001
        return False, f"judge_error:{type(exc).__name__}: {exc}"[:300]


def check_turn(exp: dict, resp: dict, tools: list[str]) -> list[str]:
    f: list[str] = []
    reply = resp.get("message", "")
    if exp.get("reply_any") and not any(re.search(p, reply, re.I) for p in exp["reply_any"]):
        f.append(f"reply thiếu một trong {exp['reply_any']}")
    for p in exp.get("reply_all", []):
        if not re.search(p, reply, re.I):
            f.append(f"reply thiếu /{p}/")
    for p in exp.get("reply_none", []):
        if re.search(p, reply, re.I):
            f.append(f"reply chứa cấm /{p}/")
    for t in exp.get("tools", []):
        if t not in tools:
            f.append(f"không gọi tool {t} (đã gọi: {tools})")
    for t in exp.get("no_tools", []):
        if t in tools:
            f.append(f"gọi tool bị cấm {t}")
    if "confirm" in exp and bool(resp.get("requires_confirmation")) != exp["confirm"]:
        f.append(f"requires_confirmation={resp.get('requires_confirmation')} (kỳ vọng {exp['confirm']})")
    if "action" in exp:
        got = (resp.get("proposed_action") or {}).get("kind")
        if got != exp["action"]:
            f.append(f"proposed_action={got} (kỳ vọng {exp['action']})")
    if exp.get("until_state") and resp["session_state"]["agent_state"] != exp["until_state"]:
        f.append(f"sau 3 lần nhắn, agent_state={resp['session_state']['agent_state']} (kỳ vọng {exp['until_state']})")
    if exp.get("state_in") and resp["session_state"]["agent_state"] not in exp["state_in"]:
        f.append(f"agent_state={resp['session_state']['agent_state']} (kỳ vọng một trong {exp['state_in']})")
    if exp.get("state") and resp["session_state"]["agent_state"] != exp["state"]:
        f.append(f"agent_state={resp['session_state']['agent_state']} (kỳ vọng {exp['state']})")
    return f


# ---------------- runner ----------------
async def run_scenario(sc: Scenario, client: httpx.AsyncClient, bridge_holder: dict, *, inproc: bool,
                       provider, model: str, use_judge: bool, user_id: int) -> ScenarioResult:
    res = ScenarioResult(sc.id, sc.title, True, [])
    if bridge_holder.get("live"):
        lb: LiveBackend = bridge_holder["lb"]
        await lb.cleanup()
        if sc.setup:
            await _live_setup(sc, lb)
        await lb.refresh()
    elif inproc:
        b = SimBridge(**sc.sim_kwargs)
        if sc.setup:
            sc.setup(b)
        bridge_holder["b"] = b
    hdr = {"X-Internal-Token": TOKEN}
    try:
        r = await client.post(f"{P}/sessions", json={"user_id": user_id}, headers=hdr)
        r.raise_for_status()
        sid = r.json()["session_id"]
        transcript: list[str] = []
        for turn in sc.turns:
            t0 = time.perf_counter()
            r = await client.post(f"{P}/sessions/{sid}/messages", json={"message": turn.say}, headers=hdr, timeout=120)
            # until_state: user thật nhắn lặp "vâng" tới khi chốt; gửi lại tối đa 3 lần, chỉ chấm trạng thái cuối.
            target = turn.expect.get("until_state")
            for _ in range(2 if target else 0):
                if r.status_code == 200 and r.json()["session_state"]["agent_state"] == target:
                    break
                r = await client.post(f"{P}/sessions/{sid}/messages", json={"message": turn.say}, headers=hdr, timeout=120)
            lat = time.perf_counter() - t0
            if r.status_code != 200:
                res.ok = False
                res.turns.append(TurnLog(turn.say, fails=[f"HTTP {r.status_code}: {r.text[:200]}"], latency=lat))
                break
            d = r.json()
            tools = [c["name"] for c in d.get("tool_calls_audit", [])]
            log = TurnLog(turn.say, d["message"], tools, bool(d.get("requires_confirmation")),
                          (d.get("proposed_action") or {}).get("kind"), d["session_state"]["agent_state"], lat)
            log.fails = check_turn(turn.expect, d, tools)
            transcript += [f"USER: {turn.say}", f"BOT: {d['message']}  [tools={tools}]"]
            if turn.expect.get("judge") and use_judge:
                ok, why = await judge(provider, model, "\n".join(transcript), turn.expect["judge"])
                log.judge = ("PASS: " if ok else "FAIL: ") + why
                if not ok:
                    log.fails.append(f"judge: {why}")
            if log.fails:
                res.ok = False
            res.turns.append(log)
        if bridge_holder.get("live"):
            lb = bridge_holder["lb"]
            await lb.refresh()
            msg = sc.final(lb) if sc.final else None
            if msg:
                res.ok, res.final_fail = False, msg
            await lb.cleanup()
        elif inproc and sc.final:
            msg = sc.final(bridge_holder["b"])
            if msg:
                res.ok, res.final_fail = False, msg
    except Exception as exc:  # noqa: BLE001
        res.ok, res.error = False, f"{type(exc).__name__}: {exc}"
    return res


def dataclasses_replace(sc: Scenario, i: int) -> Scenario:
    import copy
    c = copy.copy(sc)
    c.id = f"{sc.id}#{i + 1}"
    return c


async def _live_setup(sc: Scenario, lb: "LiveBackend") -> None:
    """Setup của kịch bản viết cho SimBridge (seed_appointment đồng bộ) → chạy trên proxy ghi nhận rồi seed thật."""
    seeds: list[tuple] = []

    class _Rec:
        def seed_appointment(self, doctor_id, service_id, start_iso):
            seeds.append((doctor_id, service_id, start_iso))
    sc.setup(_Rec())
    for d, sv, st in seeds:
        await lb.seed_appointment(d, sv, st)


def build_client(target: str | None, live_user: int | None = None):
    """inproc: ASGI vào app thật, provider Gemini thật, store RAM, bridge = SimBridge."""
    from app.config import Settings, get_settings
    from app.deps import get_bridge, get_provider, get_registry, get_retriever, get_store
    from app.main import app
    from app.session.store import InMemorySessionStore

    holder: dict = {}
    if live_user:
        from app.deps import get_bridge as _gb
        s = Settings(rate_limit_per_minute=0, rate_limit_per_day=0)  # secret + BE URL lấy từ AI/.env
        s.internal_shared_secret = s.internal_shared_secret
        global TOKEN
        TOKEN = s.internal_shared_secret
        real = _gb()
        holder.update(live=True, lb=LiveBackend(real, live_user))
        store = InMemorySessionStore()
        app.dependency_overrides[get_settings] = lambda: s
        app.dependency_overrides[get_store] = lambda: store
        app.dependency_overrides[get_bridge] = lambda: real
        app.dependency_overrides[get_retriever] = lambda: None
        provider = get_provider()
        app.dependency_overrides[get_provider] = lambda: provider
        get_registry()
        return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://e2e"), holder, provider, s, True
    if target:
        s = Settings(internal_shared_secret=TOKEN)
        return httpx.AsyncClient(base_url=target), holder, get_provider(), s, False

    store = InMemorySessionStore()
    s = Settings(internal_shared_secret=TOKEN, rate_limit_per_minute=0, rate_limit_per_day=0)
    app.dependency_overrides[get_settings] = lambda: s
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_bridge] = lambda: holder["b"]
    app.dependency_overrides[get_retriever] = lambda: None  # RAG cần Ollama; E2E này tập trung đặt lịch
    provider = get_provider()
    app.dependency_overrides[get_provider] = lambda: provider
    get_registry()
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://e2e"), holder, provider, s, True


def render(results: list[ScenarioResult], secs: float) -> str:
    n_ok = sum(r.ok for r in results)
    out = [f"# E2E report — {datetime.now():%Y-%m-%d %H:%M}", "",
           f"**{n_ok}/{len(results)} scenarios pass** ({secs:.0f}s)", "",
           "| id | kết quả | tiêu đề |", "|---|---|---|"]
    out += [f"| {r.id} | {'PASS' if r.ok else '**FAIL**'} | {r.title} |" for r in results]
    for r in results:
        out += ["", f"## {'✅' if r.ok else '❌'} {r.id} — {r.title}"]
        if r.error:
            out.append(f"- ERROR: `{r.error}`")
        for i, t in enumerate(r.turns, 1):
            out += [f"- **Turn {i}** ({t.latency:.1f}s) user: {t.say}",
                    f"  - bot: {t.reply[:600]}",
                    f"  - tools={t.tools} confirm={t.confirm} action={t.action} state={t.state}"]
            if t.judge:
                out.append(f"  - judge {t.judge}")
            out += [f"  - ✗ {x}" for x in t.fails]
        if r.final_fail:
            out.append(f"- ✗ hậu quả nghiệp vụ: {r.final_fail}")
    return "\n".join(out) + "\n"


async def amain(a: argparse.Namespace) -> int:
    client, holder, provider, settings, inproc = build_client(a.target, a.user_id if a.live else None)
    if a.live:
        SC.configure(**await discover_world(holder["lb"], a.doctor_id))
        print("live world:", {k: v for k, v in SC.W.items()}, flush=True)
    scs = [s for s in SC.build_scenarios()
           if (not (a.only or a.tag) or (a.only and s.id in a.only) or (a.tag and set(a.tag) & set(s.tags)))
           and not (a.live and "sim_only" in s.tags)]
    if a.repeat > 1:  # đo độ ổn định của LLM (flaky)
        import copy
        scs = [dataclasses_replace(s, i) for s in scs for i in range(a.repeat)]
    if not scs:
        print("Không có kịch bản nào khớp.")
        return 2
    from app.routing.model_router import ModelRouter
    model = ModelRouter(settings).select("response")
    sem = asyncio.Semaphore(1 if inproc else a.parallel)  # inproc dùng 1 bridge toàn cục → tuần tự
    t0 = time.perf_counter()

    async def one(sc: Scenario) -> ScenarioResult:
        async with sem:
            r = await run_scenario(sc, client, holder, inproc=inproc, provider=provider, model=model,
                                   use_judge=not a.no_judge, user_id=a.user_id)
            print(f"[{'PASS' if r.ok else 'FAIL'}] {sc.id}", flush=True)
            return r

    async with client:
        results = await asyncio.gather(*(one(s) for s in scs))
    REPORTS.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    md = render(list(results), time.perf_counter() - t0)
    (REPORTS / f"e2e-{stamp}.md").write_text(md, encoding="utf-8")
    (REPORTS / "e2e-latest.md").write_text(md, encoding="utf-8")
    rate = sum(r.ok for r in results) / len(results)
    print(f"\n{sum(r.ok for r in results)}/{len(results)} pass ({rate:.0%}) → eval/reports/e2e-latest.md")
    return 0 if rate >= a.fail_under else 1


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append")
    ap.add_argument("--tag", action="append")
    ap.add_argument("--target", help="URL AI service đang chạy; mặc định chạy inproc")
    ap.add_argument("--repeat", type=int, default=1, help="chạy mỗi kịch bản N lần để đo flaky")
    ap.add_argument("--live", action="store_true", help="dùng BE + DB thật (cần BE chạy ở AI_BE_BRIDGE_BASE_URL)")
    ap.add_argument("--doctor-id", type=int, default=4, help="bác sĩ dùng cho chế độ live")
    ap.add_argument("--no-judge", action="store_true")
    ap.add_argument("--fail-under", type=float, default=1.0)
    ap.add_argument("--parallel", type=int, default=3)
    ap.add_argument("--user-id", type=int, default=121)
    raise SystemExit(asyncio.run(amain(ap.parse_args())))


if __name__ == "__main__":
    main()
