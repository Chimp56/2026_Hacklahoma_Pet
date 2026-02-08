"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from environment and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Pet API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (must use asyncpg; plain postgresql:// is normalized to postgresql+asyncpg://)
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/pet_db"
    # Set True to disable SSL cert verification (e.g. self-signed certs; use only when needed)
    database_ssl_no_verify: bool = False

    @property
    def database_url_asyncpg(self) -> str:
        """URL with asyncpg driver so SQLAlchemy never falls back to psycopg2."""
        url = self.database_url.strip()
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Security
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # When set (e.g. 1), all authenticated users see this user's data (pets, events, etc.). Use with seeded demo data.
    demo_user_id: int | None = None

    # AI: Gemini (use GEMINI_API_KEY and optionally GEMINI_API_KEY2, GEMINI_API_KEY3 for rotation on rate limit)
    gemini_api_key: str = ""
    gemini_api_key2: str = ""
    gemini_api_key3: str = ""
    gemini_model: str = "gemini-1.5-flash"

    @property
    def gemini_api_keys_list(self) -> List[str]:
        """Non-empty Gemini API keys for rotation when rate limited."""
        return [k for k in (self.gemini_api_key, self.gemini_api_key2, self.gemini_api_key3) if (k and k.strip())]

    # AI: Llama (meta-llama/Llama-3.2-1B-Instruct, text-only; Transformers pipeline only)
    hf_token: str = ""  # Optional: for gated model download
    hf_llama_model: str = "meta-llama/Llama-3.2-1B-Instruct"
    # AI: Llama Vision (meta-llama/Llama-3.2-11B-Vision-Instruct, image analysis alternative to Gemini)
    hf_llama_vision_model: str = "meta-llama/Llama-3.2-11B-Vision-Instruct"

    # File storage: "local" | "digitalocean"
    storage_backend: str = "local"
    storage_local_path: str = "./storage"
    # DigitalOcean Spaces (S3-compatible)
    do_spaces_key: str = ""
    do_spaces_secret: str = ""
    do_spaces_region: str = "nyc3"
    do_spaces_bucket: str = ""
    do_spaces_endpoint: str = "https://nyc3.digitaloceanspaces.com"

    # Notifications: Slack
    slack_webhook_url: str = ""
    slack_default_channel: str = ""

    # Notification flags: comma-separated event types that trigger Slack (e.g. milestone,health_alert,anomaly)
    notification_flag_events: str = "milestone,health_alert,anomaly"

    # API public URL (e.g. https://api.quantara.co). Used for pet share links so QR points to this host.
    api_base_url: str = "https://api.quantara.co"
    # QR code: base URL for pet profile links (e.g. https://myapp.com or http://localhost:3000)
    pet_profile_base_url: str = "http://localhost:3000"
    # Optional: qr-code-generator.com API token (if set, use their API with preset logo; else generate locally with pet photo or paw)
    qr_code_api_access_token: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def flagged_events_set(self) -> set[str]:
        return {e.strip() for e in self.notification_flag_events.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
