from typing import Literal
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from backend.schemas.approval import ApprovalDecision, ApprovalRead, ApprovalStatus, ApprovalDecisionType

router = APIRouter(
    prefix="/approvals",
    tags=["approvals"],
)

@router.get("", response_model=list[ApprovalRead])
def list_approvals(
    status_filter: ApprovalStatus = Query(default=ApprovalStatus.pending, alias="status"),
    bill_id: UUID | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
) -> list[ApprovalRead]:
    items = [a for a in _approvals if a.status == status_filter]
    if bill_id is not None:
        items = [a for a in items if a.bill_id == bill_id]
    items.sort(key=lambda a: a.requested_at)
    return items[skip : skip + limit]


@router.post("/{approval_id}/decision")
def make_approval_decision(
    approval_id: UUID,
    decision: ApprovalDecision
):
    if decision.decision == "reject" and not (
        decision.comments and decision.comments.strip()
    ):
        raise HTTPException(
            status_code=422,
            detail="A comment is required when rejecting an approval.",
        )

    return {
        "approval_id": str(approval_id),
        "decision": decision.decision,
        "comments": decision.comments,
        "message": "Prototype only: decision not persisted.",
    }