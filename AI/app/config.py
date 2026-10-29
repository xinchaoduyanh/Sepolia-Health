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
    # Embedding cho RAG. provider=auto đi theo chat provider (Vertex/Gemini/Ollama);
    # `embedding_model` chỉ dùng cho Ollama, `cloud_embedding_model` cho Vertex/Gemini.
    # Đổi provider/model/dimension => index cũ stale, phải rebuild (xem manifest).
    embedding_provider: str = "auto"
    embedding_model: str = "bge-m3"
    cloud_embedding_model: str = ""  # "" = mặc định theo provider (xem app.rag.embedding)
    embedding_dimension: int = 0  # 0 = mặc định của model

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
    # Số lượt cũ hơn cửa sổ trên được nén thành 1 đoạn digest (0 = tắt).
    ai_history_digest_turns: int = 20
    ai_history_digest_max_chars: int = 600

    # Session mở trên channel chỉ được reconnect trong khoảng này; cũ hơn thì mở
    # session mới (state/requirement cũ nhiều ngày trước chỉ gây kẹt và nhiễu).
    session_reconnect_max_age_minutes: int = 120

    # Chờ tối đa N giây để lấy turn lock của session (turn trước còn chạy);
    # quá hạn -> 409 session_busy thay vì treo connection vô hạn.
    # Giữ < timeout HTTP của BE->AI (70s) để BE nhận 409 chứ không phải timeout.
    session_turn_lock_timeout_sec: float = 60.0

    # Readiness: require non-empty RAG collection (manifest + chroma count).
    # Default false for local/dev; set true (or AI_ENV=production) in deploy.
    rag_require_index: bool = False
    # Tự build index lúc khởi động nếu thiếu/stale (có file lock). Bật ở deploy.
    rag_auto_build: bool = False
    # Ngưỡng cosine similarity tối thiểu cho chunk. <0 = mặc định theo embedding model
    # (đã hiệu chỉnh bằng eval/run_retrieval.py; xem DEFAULT_MIN_SCORE).
    rag_min_score: float = -1.0
    # Trộn dense + BM25 (RRF). Benchmark: Hit@5 96.6% -> 98.3%, MRR 0.927 -> 0.957.
    rag_hybrid: bool = True
    # Chỉ index tài liệu có review_status=reviewed (governance). Bật khi đã có
    # clinical review thật; mặc định tắt vì knowledge seed chưa được duyệt.
    rag_require_reviewed: bool = False
    max_message_chars: int = 2000

    # Rate limits (per acting user_id). 0 = disabled.
    rate_limit_per_minute: int = 30
    rate_limit_per_day: int = 500
    # Rate limits per client IP (AI_IP_RATE_LIMIT_*). 0 = disabled.
    # trust_proxy_headers: chỉ bật khi AI đứng sau proxy tin cậy (dùng X-Forwarded-For hop đầu).
    ip_rate_limit_per_minute: int = 120
    ip_rate_limit_per_day: int = 0
    trust_proxy_headers: bool = False

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
    # Chu kỳ chạy purge nền trong process AI (phút); 0 = tắt (dùng cron gọi
    # /admin/purge-expired). Purge idempotent nên nhiều replica cùng chạy vẫn an toàn.
    retention_purge_interval_minutes: int = 360

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
