from fastapi import APIRouter, Depends

from backend.auth import CurrentUser, require_active
from backend.schemas.user import UserRead, UserRole
from backend.services.user_repository import get_users
from backend.supabase_client import get_admin_supabase

router = APIRouter(
    prefix="/admin/users",
    tags=["users"],
)

_users: list[UserRead] = []


# @router.get("", response_model=list[UserRead])
# def get_app_users(
# ) -> list[dict]:
#     return get_users(
#         client=get_admin_supabase(),

#     )
# @router.get("", response_model=list[UserRead])
# def list_users(
#     user: CurrentUser = Depends(require_active(UserRole.admin)),
# ) -> list[UserRead]:

#     users = get_users(
#         client=get_admin_supabase(),
#     )

#     return users


@router.get("", response_model=list[UserRead])
def list_users(
    _user: CurrentUser = Depends(require_active(UserRole.admin)),
) -> list[UserRead]:
    return get_users(client=get_admin_supabase())
