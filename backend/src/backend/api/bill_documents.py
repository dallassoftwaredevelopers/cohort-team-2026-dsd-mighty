from uuid import UUID

from fastapi import (
    APIRouter,
    File,
    UploadFile,
    status,
)

from backend.services.bill_storage import validate_pdf

router = APIRouter(
    prefix="/bills",
    tags=["bill documents"],
)


@router.post(
    "/{bill_id}/document",
    status_code=status.HTTP_201_CREATED,
)
async def upload_bill_document(
    bill_id: UUID,
    file: UploadFile = File(...),
):
    contents = await validate_pdf(file)

    return {
        "bill_id": str(bill_id),
        "validated_size": len(contents),
    }
