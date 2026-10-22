from datetime import datetime, date
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field

class BillCreate(BaseModel):
    account_number_raw: str
    due_date: date
    amount: Decimal = Field(gt=0)

    vendor_name_raw: str | None = None
    invoice_number: str | None = None
    invoice_date: date | None = None
    prev_payments: Decimal | None = None
    description: str | None = None
    processing_notes: str | None = None

class BillRead(BillCreate):
    id: UUID
    status: Literal["draft"] = "draft"
    created_at: datetime

