from uuid import UUID

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


def get_editable_draft(
    client: Client,
    bill_id: UUID,
    user_id: str,
) -> dict | None:
    response = (
        client.table("bills")
        .select("bill_id,status,document_path")
        .eq("bill_id", str(bill_id))
        .eq("submitted_by", user_id)
        .eq("status", "draft")
        .maybe_single()
        .execute()
    )

    return response.data if response else None


def attach_document(
    client: Client,
    bill_id: UUID,
    user_id: str,
    storage_path: str,
) -> dict | None:
    response = (
        client.table("bills")
        .update({"document_path": storage_path})
        .eq("bill_id", str(bill_id))
        .eq("submitted_by", user_id)
        .eq("status", "draft")
        .is_("document_path", "null")
        .select("bill_id,status,document_path")
        .execute()
    )

    rows = response.data or []

    return rows[0] if len(rows) == 1 else None
