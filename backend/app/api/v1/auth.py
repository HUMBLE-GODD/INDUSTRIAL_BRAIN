"""Registration and login endpoints."""

from fastapi import APIRouter, Body, Depends, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas import APIErrorResponse, LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.core.config import get_settings
from app.core.errors import APIError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.database import User, UserRole

router = APIRouter(prefix="/auth", tags=["authentication"])


def _token_response(user: User) -> TokenResponse:
    settings = get_settings()
    return TokenResponse(
        access_token=create_access_token(user.id),
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a user",
    description="Creates a viewer account and returns a bearer access token.",
    responses={
        409: {"model": APIErrorResponse, "description": "Email is already registered"},
        422: {"model": APIErrorResponse, "description": "Invalid request"},
    },
)
async def register(
    payload: RegisterRequest = Body(
        openapi_examples={
            "technician": {
                "summary": "Create an account",
                "value": {"email": "tech@example.com", "password": "replace-with-a-strong-password"},
            }
        }
    ),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    existing = await db.execute(select(User.id).where(func.lower(User.email) == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise APIError(409, "email_already_registered", "An account with this email already exists")

    user = User(email=payload.email, hashed_password=hash_password(payload.password), role=UserRole.VIEWER)
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError as exc:
        await db.rollback()
        raise APIError(409, "email_already_registered", "An account with this email already exists") from exc
    return _token_response(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in",
    description="Verifies JSON credentials and returns a bearer access token.",
    responses={
        401: {"model": APIErrorResponse, "description": "Email or password is incorrect"},
        422: {"model": APIErrorResponse, "description": "Invalid request"},
    },
)
async def login(
    payload: LoginRequest = Body(
        openapi_examples={
            "technician": {
                "summary": "Log in",
                "value": {"email": "tech@example.com", "password": "replace-with-a-strong-password"},
            }
        }
    ),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(select(User).where(func.lower(User.email) == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise APIError(401, "invalid_credentials", "Email or password is incorrect")
    return _token_response(user)
