from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import os

router = APIRouter()

@router.get("/{version}")
async def get_schema(version: str) -> Dict[str, Any]:
    """Get Vizro JSON schema for a specific version"""
    try:
        # Look for schema file in the schema directory
        schema_path = f"/app/schemas/{version}.json"
        if not os.path.exists(schema_path):
            # Fallback to relative path for development
            schema_path = f"../schema/{version}.json"
        
        if not os.path.exists(schema_path):
            raise HTTPException(
                status_code=404, 
                detail=f"Schema version {version} not found"
            )
        
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        return {
            "version": version,
            "schema": schema,
            "component_count": len(schema.get("$defs", {})),
        }
    
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, 
            detail=f"Schema version {version} not found"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, 
            detail=f"Invalid JSON in schema file for version {version}"
        )

@router.get("/")
async def list_schemas():
    """List available schema versions"""
    return {
        "available_versions": ["0.1.43"],
        "current_version": "0.1.43",
        "endpoint": "/api/v1/schema/{version}"
    }