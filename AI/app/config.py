"""Cấu hình service, đọc từ env (prefix AI_) hoặc .env."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_", env_file=".env", extra="ignore")

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

    be_bridge_base_url: str = "http://127.0.0.1:3000"
    # Shared secret dùng 2 chiều: AI/ kiểm tra X-Internal-Token đến từ Be/,
    # và BeBridgeClient gửi kèm khi gọi ngược Be/.
    internal_shared_secret: str = "changeme"

    prompts_dir: str = "./prompts"
    knowledge_dir: str = "./knowledge"
    chroma_dir: str = "./data/chroma"


@lru_cache
def get_settings() -> Settings:
    return Settings()
