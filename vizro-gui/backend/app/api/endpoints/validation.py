from fastapi import APIRouter
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, List, Optional

router = APIRouter()

class ValidationError(BaseModel):
    path: List[str]
    message: str
    type: str

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[ValidationError] = []
    validated_config: Optional[Dict[str, Any]] = None

class ComponentTree(BaseModel):
    """Frontend tree state - dynamic structure based on schema"""
    components: Dict[str, Any] = {}

class ComponentProperties(BaseModel):
    """Frontend property state - dynamic structure based on schema"""
    properties: Dict[str, Any] = {}

@router.post("/validate")
async def validate_dashboard(
    tree_state: ComponentTree,
    property_state: ComponentProperties
) -> ValidationResult:
    """
    Combine frontend states and validate via Pydantic
    
    This is where the real-time validation happens:
    1. Combine tree_state + property_state into complete dashboard config
    2. Validate via Pydantic Dashboard.model_validate
    3. Return validation result with detailed errors or validated config
    """
    
    try:
        # For now, return a basic validation result
        # TODO: Implement actual Pydantic validation with Vizro Dashboard model
        
        combined_config = {
            "dashboard": {
                "title": "Generated Dashboard",
                "pages": []
            }
        }
        
        # Basic validation - check if we have components
        if not tree_state.components and not property_state.properties:
            return ValidationResult(
                is_valid=False,
                errors=[ValidationError(
                    path=["dashboard"],
                    message="Dashboard must have at least one component",
                    type="required"
                )]
            )
        
        return ValidationResult(
            is_valid=True,
            validated_config=combined_config
        )
    
    except Exception as e:
        return ValidationResult(
            is_valid=False,
            errors=[ValidationError(
                path=["validation"],
                message=f"Validation failed: {str(e)}",
                type="validation_error"
            )]
        )

@router.get("/")
async def validation_info():
    """Get validation endpoint information"""
    return {
        "endpoint": "/api/v1/validation/validate",
        "method": "POST",
        "description": "Real-time validation of frontend form states",
        "input": {
            "tree_state": "ComponentTree - hierarchy structure",
            "property_state": "ComponentProperties - component properties"
        },
        "output": {
            "is_valid": "boolean",
            "errors": "List of validation errors",
            "validated_config": "Complete Vizro dashboard config if valid"
        }
    }