"""Password and JWT helpers used by the auth API."""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_password_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    pbkdf2_sha256__default_rounds=600_000,
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return _password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_context.verify(password, password_hash)
    except (TypeError, ValueError):
        return False


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + (expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES))
    claims: dict[str, Any] = {"sub": subject, "iat": now, "exp": expires_at}
    return jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
