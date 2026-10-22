
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from backend.schemas.common import ActiveStatus, PaymentMethod


class VendorAccountCreate(BaseModel):

    model_config = ConfigDict(extra="forbid")

    property_id: UUID
    vendor_id: UUID
    account_number: str = Field(min_length=1, max_length=100)
    account_type: str = Field(min_length=1)
    payment_method: PaymentMethod
    portal_url: str | None = None
    status: str = "active"


class VendorAccountUpdate(BaseModel):

    model_config = ConfigDict(extra="forbid")

    property_id: UUID | None = None
    vendor_id: UUID | None = None
    account_number: str | None = Field(
        default=None, min_length=1, max_length=100
    )
    account_type: str | None = Field(default=None, min_length=1)
    payment_method: PaymentMethod | None = Field(default=None, min_length=1)
    portal_url: str | None = None
    status: ActiveStatus | None = None


class VendorAccountRead(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID
    vendor_id: UUID
    account_number: str
    account_type: str
    payment_method: PaymentMethod
    portal_url: str | None = None
    status: ActiveStatus
    created_at: datetime


class PageVendorAccountRead(BaseModel):

    items: list[VendorAccountRead]
    total: int
    skip: int = 0
    limit: int = 25
