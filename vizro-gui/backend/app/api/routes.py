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
            "schema_analysis": "/api/v1/schema/analysis/{version}",
            "components": "/api/v1/schema/components/{version}",
            "component_detail": "/api/v1/schema/components/{version}/{component_type}",
            "hierarchy": "/api/v1/schema/hierarchy/{version}",
            "validation": "/api/v1/validation",
            "docs": "/docs"
        }
    }