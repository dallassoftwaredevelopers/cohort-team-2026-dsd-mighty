"""`require_active_analyst`: who gets in, and what a failure looks like."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

import httpx
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError, AuthRetryableError

from backend.app import app
from backend.auth import require_active_analyst

USER_ID = str(uuid4())
TOKEN = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")


def auth_client(user=SimpleNamespace(id=USER_ID), error=None):
    client = MagicMock()
    if error is not None:
        client.auth.get_user.side_effect = error
    else:
        client.auth.get_user.return_value = SimpleNamespace(user=user)
    return client


def admin_client(row=None, *, error=None, no_match=False):
    """`app_users` lookup returning `row`, nothing, or raising `error`."""
    client = MagicMock()
    lookup = client.table.return_value.select.return_value.eq.return_value
    execute = lookup.maybe_single.return_value.execute
    if error is not None:
        execute.side_effect = error
    elif no_match:
        execute.return_value = None  # supabase-py's maybe_single() on no row
    else:
        execute.return_value = SimpleNamespace(data=row)
    return client


def check(auth=None, admin=None, credentials=TOKEN):
    with (
        patch("backend.auth.get_supabase", return_value=auth or auth_client()),
        patch("backend.auth.get_admin_supabase", return_value=admin or admin_client()),
    ):
        return require_active_analyst(credentials)


def status_of(**kwargs) -> int:
    with pytest.raises(HTTPException) as exc:
        check(**kwargs)
    return exc.value.status_code


def test_active_analyst_gets_their_user_id():
    admin = admin_client({"role": "analyst", "status": "active"})

    assert check(admin=admin) == USER_ID


def test_missing_token_is_401():
    assert status_of(credentials=None) == 401


def test_routes_reject_a_request_without_a_token():
    assert TestClient(app).get("/bills/dashboard").status_code == 401


def test_invalid_token_is_401():
    error = AuthApiError("invalid JWT", 401, None)

    assert status_of(auth=auth_client(error=error)) == 401


@pytest.mark.parametrize(
    "error",
    [
        httpx.ConnectError("connection refused"),
        AuthRetryableError("Auth unavailable", 503),
    ],
    ids=["connect-error", "retryable-error"],
)
def test_unreachable_supabase_auth_is_503_not_500(error):
    with pytest.raises(HTTPException) as exc:
        check(auth=auth_client(error=error))

    assert exc.value.status_code == 503
    assert exc.value.detail == "Unable to verify account."


def test_token_without_a_user_is_401():
    assert status_of(auth=auth_client(user=None)) == 401


@pytest.mark.parametrize(
    "row",
    [
        {"role": "analyst", "status": "inactive"},
        {"role": "admin", "status": "active"},
        {"role": "approver", "status": "active"},
    ],
    ids=["inactive-analyst", "admin", "approver"],
)
def test_users_who_are_not_active_analysts_are_403(row):
    assert status_of(admin=admin_client(row)) == 403


def test_user_without_an_app_users_row_is_403():
    assert status_of(admin=admin_client(no_match=True)) == 403


def test_account_lookup_failure_is_503_not_500():
    admin = admin_client(error=RuntimeError("connection refused"))

    with pytest.raises(HTTPException) as exc:
        check(admin=admin)

    assert exc.value.status_code == 503
    assert exc.value.detail == "Unable to verify account."
