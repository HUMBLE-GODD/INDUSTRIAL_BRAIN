"""Shared request dependencies for the v1 API."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.database import User

bearer_auth = HTTPBearer(auto_error=False, scheme_name="BearerAuth", description="JWT bearer access token")
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_auth)],
    db: DatabaseSession,
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise APIError(401, "authentication_required", "A bearer access token is required")
    try:
        claims = decode_access_token(credentials.credentials)
    except JWTError as exc:
        raise APIError(401, "invalid_token", "The access token is invalid or expired") from exc

    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise APIError(401, "invalid_token", "The access token is invalid or expired")

    result = await db.execute(select(User).where(User.id == subject))
    user = result.scalar_one_or_none()
    if user is None:
        raise APIError(401, "invalid_token", "The access token is invalid or expired")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
