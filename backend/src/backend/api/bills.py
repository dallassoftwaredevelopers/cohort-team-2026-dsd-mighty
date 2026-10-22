from datetime import datetime, timezone
from uuid import UUID, uuid4
from fastapi import APIRouter, status
from backend.schemas.bill import BillCreate, BillRead

router = APIRouter(
    prefix="/bills",
    tags=["bills"],
)

_bills: list[BillRead] = []

@router.post("", response_model=BillRead, status_code=status.HTTP_201_CREATED)
def create_bill(bill: BillCreate) -> BillRead:
    new_bill = BillRead(
        **bill.model_dump(),
        id=uuid4(),
        status="draft",
        created_at=datetime.now(timezone.utc),
    )

    _bills.append(new_bill)
    return new_bill

@router.get("", response_model=list[BillRead])
def list_bills() -> list[BillRead]:
    return _bills