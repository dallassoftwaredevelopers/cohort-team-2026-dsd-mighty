from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from backend.services.bill_storage import validate_pdf


@pytest.mark.asyncio
async def test_valid_pdf():
    file = UploadFile(
        file=BytesIO(b"%PDF-1.4\nsample content"),
        filename="invoice.pdf",
        headers=Headers(
            {
                "content-type": "application/pdf",
            }
        ),
    )

    contents = await validate_pdf(file)

    assert contents.startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_rejects_non_pdf():
    file = UploadFile(
        file=BytesIO(b"This is not a PDF document"),
        filename="invoice.pdf",
        headers=Headers(
            {
                "content-type": "application/pdf",
            }
        ),
    )

    with pytest.raises(HTTPException) as exc:
        await validate_pdf(file)

    assert exc.value.status_code == 400
