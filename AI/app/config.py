"""Cấu hình service, đọc từ env (prefix AI_) hoặc .env."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE = Path(__file__).resolve().parents[1]
_UNSAFE_SECRETS = frozenset({"", "changeme", "change-me", "secret", "password"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_", env_file=".env", extra="ignore")

    # development | production | test — production fail-fast secret yếu.
    env: str = "development"
    port: int = 8088
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/sepolia"

    ollama_base_url: str = "http://127.0.0.1:11434"
    default_model_decision: str = "qwen2.5:3b-instruct-q4_K_M"
    default_model_response: str = "qwen2.5:3b-instruct-q4_K_M"
    default_model_summarization: str = "qwen2.5:3b-instruct-q4_K_M"
    embedding_model: str = "bge-m3"

    # Gemini (cloud) — nếu bật (api_key HOẶC use_vertex), chat/tool-calling dùng
    # Gemini thay Ollama (xem deps.get_provider + ModelRouter). Embedding/RAG vẫn local.
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com"
    gemini_model: str = "gemini-2.0-flash"
    # Vertex AI: tiêu credit Google Cloud thay vì ví prepay AI Studio. Cần project +
    # location + service account JSON (google_credentials trống -> dùng ADC).
    gemini_use_vertex: bool = False
    gemini_project: str = ""
    gemini_location: str = "us-central1"
    google_credentials: str = ""  # path tới service account JSON

    @property
    def gemini_enabled(self) -> bool:
        return self.gemini_use_vertex or bool(self.gemini_api_key)

    @property
    def is_production(self) -> bool:
        return self.env.lower() in {"production", "prod"}

    be_bridge_base_url: str = "http://127.0.0.1:3000"
    # Shared secret dùng 2 chiều: AI/ kiểm tra X-Internal-Token đến từ Be/,
    # và BeBridgeClient gửi kèm khi gọi ngược Be/.
    internal_shared_secret: str = "changeme"

    # Conversation memory: số lượt (user+assistant) gần nhất nhồi lại vào prompt.
    # Gemini context lớn nên 6 lượt thoải mái; tăng nếu cần nhớ xa hơn (đổi cost/latency).
    ai_history_max_turns: int = 6

    # Session mở trên channel chỉ được reconnect trong khoảng này; cũ hơn thì mở
    # session mới (state/requirement cũ nhiều ngày trước chỉ gây kẹt và nhiễu).
    session_reconnect_max_age_minutes: int = 120

    # Readiness: require non-empty RAG collection (manifest + chroma count).
    # Default false for local/dev; set true (or AI_ENV=production) in deploy.
    rag_require_index: bool = False
    max_message_chars: int = 2000

    # Rate limits (per acting user_id). 0 = disabled.
    rate_limit_per_minute: int = 30
    rate_limit_per_day: int = 500

    # Circuit breaker for Be bridge HTTP (AI_BRIDGE_CIRCUIT_*).
    # failures: số lỗi liên tiếp trước khi open; 0 = tắt breaker.
    # recovery_sec: thời gian open trước khi half-open probe.
    bridge_circuit_failures: int = 5
    bridge_circuit_recovery_sec: float = 60.0
    provider_circuit_failures: int = 5
    provider_circuit_recovery_sec: float = 60.0


    # Privacy: auto-close sessions older than N days when purge runs.
    session_retention_days: int = 30
    turn_retention_days: int = 30

    prompts_dir: str = str(_BASE / "prompts")
    knowledge_dir: str = str(_BASE / "knowledge")
    chroma_dir: str = str(_BASE / "data" / "chroma")


    @field_validator("internal_shared_secret")
    @classmethod
    def _secret_not_blank(cls, v: str) -> str:
        if v is None or not str(v).strip():
            raise ValueError("AI_INTERNAL_SHARED_SECRET must not be empty")
        return str(v)

    def validate_for_runtime(self) -> None:
        """Fail-fast production checks (secrets, vertex config)."""
        if not self.is_production:
            return
        secret = (self.internal_shared_secret or "").strip().lower()
        if secret in _UNSAFE_SECRETS or len(self.internal_shared_secret) < 32:
            raise RuntimeError(
                "AI_INTERNAL_SHARED_SECRET must be a strong random secret "
                "(>=32 chars, not 'changeme') when AI_ENV=production"
            )
        if self.gemini_use_vertex and not self.gemini_project:
            raise RuntimeError("AI_GEMINI_PROJECT is required when AI_GEMINI_USE_VERTEX=true")
        if self.gemini_use_vertex and self.google_credentials and not Path(
            self.google_credentials
        ).is_file():
            raise RuntimeError("AI_GOOGLE_CREDENTIALS points to a missing file")
        if not self.rag_require_index:
            raise RuntimeError(
                "AI_RAG_REQUIRE_INDEX=true is required in production"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
