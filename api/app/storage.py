import logging

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import settings

log = logging.getLogger(__name__)


def minio_client():
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.minio_use_ssl else 'http'}://{settings.minio_endpoint}",
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket() -> None:
    client = minio_client()
    try:
        client.head_bucket(Bucket=settings.minio_bucket)
    except ClientError:
        client.create_bucket(Bucket=settings.minio_bucket)
        log.info("object_store_bucket_ready")
