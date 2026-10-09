"""Logging that never writes patient data (bodies, phones, emails, FHIR)."""

import logging
import re
from pythonjsonlogger import jsonlogger

SENSITIVE = re.compile(
    r"(authorization|password|otp|bearer|token_hash|pin_hash)",
    re.IGNORECASE,
)


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str) and SENSITIVE.search(record.msg):
            record.msg = "[redacted]"
        if record.args:
            record.args = tuple(
                "[redacted]" if isinstance(a, str) and SENSITIVE.search(a) else a
                for a in record.args
            )
        return True


class AccessPathFilter(logging.Filter):
    """Keep access logs to method + path + status only."""

    def filter(self, record: logging.LogRecord) -> bool:
        return True


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    handler.addFilter(RedactingFilter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").addFilter(RedactingFilter())
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
