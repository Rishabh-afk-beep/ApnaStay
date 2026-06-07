from functools import lru_cache
from typing import List, Set

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="NearMyColleges API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    allowed_origins: str = Field(default="*", alias="ALLOWED_ORIGINS")

    firebase_project_id: str = Field(default="", alias="FIREBASE_PROJECT_ID")
    google_application_credentials: str = Field(default="", alias="GOOGLE_APPLICATION_CREDENTIALS")

    cloudinary_cloud_name: str = Field(default="", alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="", alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="", alias="CLOUDINARY_API_SECRET")

    default_search_radius_km: float = Field(default=2.0, alias="DEFAULT_SEARCH_RADIUS_KM")
    max_page_size: int = Field(default=50, alias="MAX_PAGE_SIZE")

    dev_auth_enabled: bool = Field(default=True, alias="DEV_AUTH_ENABLED")
    dev_auth_secret: str = Field(default="dev-secret-change-me-32-char-minimum", alias="DEV_AUTH_SECRET")

    admin_allowed_emails: str = Field(default="", alias="ADMIN_ALLOWED_EMAILS")

    def cors_origins(self) -> List[str]:
        if self.allowed_origins.strip() == "*":
            return ["*"]
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        # Ensure both www and non-www variants are always included
        expanded: List[str] = []
        for o in origins:
            expanded.append(o)
            if "nearmycolleges.in" in o:
                if "://www." in o:
                    expanded.append(o.replace("://www.", "://"))
                else:
                    expanded.append(o.replace("://", "://www."))
        return list(dict.fromkeys(expanded))  # dedupe while preserving order

    def admin_emails(self) -> Set[str]:
        if not self.admin_allowed_emails.strip():
            return set()
        return {e.strip().lower() for e in self.admin_allowed_emails.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
