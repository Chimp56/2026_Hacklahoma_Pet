"""DigitalOcean Spaces storage (S3-compatible). Migrate from local for production."""

from urllib.parse import quote

from app.config import get_settings
from app.services.storage.base import FileStorage


class DigitalOceanSpacesStorage(FileStorage):
    """Store files in DO Spaces via boto3 S3 client."""

    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.do_spaces_bucket
        self.region = settings.do_spaces_region
        self.endpoint = settings.do_spaces_endpoint
        self._client = None

    def _get_client(self):
        if self._client is None:
            import boto3
            from botocore.config import Config
            settings = get_settings()
            self._client = boto3.client(
                "s3",
                region_name=settings.do_spaces_region,
                endpoint_url=settings.do_spaces_endpoint,
                aws_access_key_id=settings.do_spaces_key,
                aws_secret_access_key=settings.do_spaces_secret,
                config=Config(signature_version="s3v4"),
            )
        return self._client

    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        extra = {"ContentType": content_type} if content_type else {}
        self._get_client().put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            **extra,
        )
        return key

    def read(self, key: str) -> bytes:
        resp = self._get_client().get_object(Bucket=self.bucket, Key=key)
        return resp["Body"].read()

    def delete(self, key: str) -> None:
        self._get_client().delete_object(Bucket=self.bucket, Key=key)

    def get_url(self, key: str) -> str | None:
        """Public URL if bucket is public; otherwise None (use signed URL in real impl)."""
        # Example: https://bucket.nyc3.digitaloceanspaces.com/key
        base = self.endpoint.replace("https://", f"https://{self.bucket}.")
        return f"{base}/{quote(key)}"
