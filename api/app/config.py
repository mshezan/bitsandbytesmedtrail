from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://medtrail:medtrail@db:5432/medtrail"
    minio_endpoint: str = "minio:9000"
    minio_root_user: str = "medtrail"
    minio_root_password: str = "medtrailsecret"
    minio_bucket: str = "medtrail"
    minio_use_ssl: bool = False
    file_encryption_key: str = "change-me-32-byte-key-for-demo!!"
    jwt_secret: str = "change-me-demo-jwt-secret"
    jwt_expire_minutes: int = 1440
    demo_mode: bool = True
    demo_otp: str = "123456"
    anthropic_api_key: str = ""
    cors_origins: str = "http://localhost:3000"


settings = Settings()
