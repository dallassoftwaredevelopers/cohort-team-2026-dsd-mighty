import os

from dotenv import load_dotenv

from supabase import Client, create_client

load_dotenv()


def _env(name: str) -> str:
    """Return a required backend setting (see backend/.env.example).

    Backend settings use backend-only names. There are deliberately no
    fallbacks to the frontend's `NEXT_*` names: a secret under a `NEXT_` name
    looks like frontend config, and one slip to `NEXT_PUBLIC_` would ship it
    to the browser.
    """
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(
            f"Missing environment variable {name}; see backend/.env.example"
        )
    return value


def get_supabase() -> Client:
    return create_client(_env("SUPABASE_URL"), _env("SUPABASE_PUBLISHABLE_KEY"))


def get_admin_supabase() -> Client:
    return create_client(_env("SUPABASE_URL"), _env("SUPABASE_SECRET_KEY"))
