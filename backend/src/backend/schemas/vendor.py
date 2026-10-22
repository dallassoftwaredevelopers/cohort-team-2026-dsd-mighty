from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from backend.schemas.common import PaymentMethod

class VendorCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    address: str | None = None
    phone_number: str | None = None
    email: str | None = None
    default_payment_method:str | None = None

class VendorRead(VendorCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    default_payment_method: PaymentMethod | None = None
    created_at: datetime

class VendorUpdate(BaseModel):

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_email: str | None = None
    contact_phone: str | None = None
    default_payment_method: PaymentMethod | None = None
