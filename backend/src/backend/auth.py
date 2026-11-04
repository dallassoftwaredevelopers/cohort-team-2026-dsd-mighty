from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_auth.errors import AuthApiError

from backend.supabase_client import get_admin_supabase, get_supabase

bearer = HTTPBearer(auto_error=False)


def require_active_analyst(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    supabase = get_supabase()

    try:
        auth_response = supabase.auth.get_user(credentials.credentials)
    except AuthApiError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
        ) from exc

    user = auth_response.user if auth_response else None

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid access token",
        )

    admin = get_admin_supabase()

    result = (
        admin.table("app_users")
        .select("role,status")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )

    # maybe_single() returns None (not an empty result) when no row matches.
    app_user = result.data if result is not None else None

    if (
        not isinstance(app_user, dict)
        or app_user.get("status") != "active"
        or app_user.get("role") != "analyst"
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create bills",
        )

    return str(user.id)
