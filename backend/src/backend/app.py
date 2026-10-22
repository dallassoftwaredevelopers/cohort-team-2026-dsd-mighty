from fastapi import FastAPI

from backend.api.bills import router as bills_router
from backend.api.approvals import router as approvals_router

app = FastAPI( title="Property Bill Automation API",
    version="0.1.0",)

app.include_router(bills_router)
app.include_router(approvals_router)

@app.get("/")
def read_root():
    return {"message": "API is running"}