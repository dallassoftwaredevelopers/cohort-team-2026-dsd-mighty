from backend.schemas.bill import BillDraftCreate
from supabase import Client


def create_draft(
    client: Client,
    draft: BillDraftCreate,
    user_id: str,
) -> dict:
    payload = draft.model_dump(
        mode="json",
        exclude_none=True,
    )

    payload["submitted_by"] = user_id
    payload["status"] = "draft"

    response = (
        client.table("bills")
        .insert(payload)
        .select("bill_id,status,document_path")
        .single()
        .execute()
    )

    row = response.data
    if not isinstance(row, dict):
        kind = type(row).__name__
        raise RuntimeError(f"Expected one bill row from insert, got {kind}")

    return row
