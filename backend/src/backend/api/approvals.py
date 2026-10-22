from typing import Literal
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/approvals",
    tags=["approvals"],
)

class ApprovalDecision(BaseModel):
    decision: Literal["approve", "reject"]
    comments: str | None = None

@router.get("")
def list_approvals(
    status: Literal["pending", "approved", "rejected"] ="pending",
    limit: int = Query(10, gt=0, le=100),
    skip: int = Query(0, ge=0)
):
    return {
        "items": [],
        "total": 0,
        "skip": skip,
        "limit": limit,
        "status_filter": status,
    }


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