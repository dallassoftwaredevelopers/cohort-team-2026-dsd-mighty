from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel,  ConfigDict, model_validator

ApprovalStatus = Literal["pending", "approved", "rejected"]
ApprovalDecisionType = Literal["approve", "reject"]

class ApprovalDecision(BaseModel):
    decision: ApprovalDecisionType
    comments: str | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_comments(self):
        if self.decision == "reject" and not (
            self.comments and self.comments.strip()
        ):
            raise ValueError(
                "A comment is required when rejecting an approval."
            )

        return self


class ApprovalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bill_id: UUID
    status: ApprovalStatus = "pending"
    reviewer_id: UUID | None = None
    decision: ApprovalDecisionType | None = None
    comments: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None


class PageApprovalRead(BaseModel):
    """Paginated list of approval records."""

    items: list[ApprovalRead]
    total: int
    skip: int = 0
    limit: int = 25