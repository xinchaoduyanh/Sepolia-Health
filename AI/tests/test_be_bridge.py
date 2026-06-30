import httpx

from app.tools.be_bridge import HttpBridgeClient


async def test_http_bridge_with_acting_user_header():
    seen: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["internal"] = request.headers.get("x-internal-token", "")
        seen["acting"] = request.headers.get("x-acting-user-id", "")
        return httpx.Response(200, json={"patient_profile_id": 1})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    bridge = HttpBridgeClient("http://be", "secret", client=client).with_acting_user(42)

    await bridge.resolve_patient_profile(42)
    await client.aclose()

    assert seen == {"internal": "secret", "acting": "42"}
