from fastapi import APIRouter
from app.api.endpoints import schema, validation

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(schema.router, prefix="/schema", tags=["schema"])
api_router.include_router(validation.router, prefix="/validation", tags=["validation"])

@api_router.get("/")
async def api_root():
    return {
        "message": "Vizro GUI Builder API v1",
        "endpoints": {
            "schema": "/api/v1/schema",
            "validation": "/api/v1/validation",
            "docs": "/docs"
        }
    }