"""
Lightweight auth dependency for document routes.

Re-uses the JWT_SECRET / JWT_ALGORITHM already in Settings.
Provides ``get_optional_current_user`` (unauthenticated requests allowed)
and ``get_current_user`` (requires a valid Bearer token).

NOTE: Full user CRUD lives in Tatvik's scope.  This module only decodes the
token and returns a minimal payload dict.  It does NOT create new users or
sessions.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

try:
    from jose import JWTError, jwt  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    raise RuntimeError("Install 'python-jose[cryptography]' for JWT auth support.")

_bearer = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict[str, Any]]:
    """Return decoded token payload or None if no credentials supplied."""
    if credentials is None:
        return None
    return _decode_token(credentials.credentials)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict[str, Any]:
    """Require a valid Bearer token; raise 401 otherwise."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _decode_token(credentials.credentials)
