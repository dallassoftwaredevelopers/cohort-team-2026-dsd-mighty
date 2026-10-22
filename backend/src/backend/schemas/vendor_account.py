
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VendorAccountCreate(BaseModel):

    model_config = ConfigDict(extra="forbid")

    property_id: UUID
    vendor_id: UUID
    account_number: str = Field(min_length=1, max_length=100)
    account_type: str = Field(min_length=1)
    payment_method: str = Field(min_length=1)
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
    payment_method: str | None = Field(default=None, min_length=1)
    portal_url: str | None = None
    status: str | None = None


class VendorAccountRead(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID
    vendor_id: UUID
    account_number: str
    account_type: str
    payment_method: str
    portal_url: str | None = None
    status: str
    created_at: datetime


class PageVendorAccountRead(BaseModel):

    items: list[VendorAccountRead]
    total: int
    skip: int = 0
    limit: int = 25
