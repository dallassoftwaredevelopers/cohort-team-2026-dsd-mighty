import os

from dotenv import load_dotenv

from supabase import Client, create_client

load_dotenv()


def _env(*names: str) -> str:
    """Return the first set variable among `names`.

    The repo-root `.env` is shared with the Next.js frontend, so each backend
    setting also accepts the frontend's `NEXT_*` name as a fallback.
    """
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    raise RuntimeError(f"Missing environment variable: set one of {', '.join(names)}")


def _supabase_url() -> str:
    return _env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")


def get_supabase() -> Client:
    key = _env("SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    return create_client(_supabase_url(), key)


def get_admin_supabase() -> Client:
    key = _env("SUPABASE_SECRET_KEY", "NEXT_SUPABASE_SECRET_KEY")
    return create_client(_supabase_url(), key)
