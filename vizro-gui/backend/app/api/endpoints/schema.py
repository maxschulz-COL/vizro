from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import os

from app.models.schema_analysis import SchemaAnalysis, ComponentDefinition, ComponentList, HierarchyRelationship
from app.services.schema_analyzer import SchemaAnalyzer

router = APIRouter()

# Initialize schema analyzer
schema_analyzer = SchemaAnalyzer()

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


@router.get("/analysis/{version}")
async def get_schema_analysis(version: str) -> SchemaAnalysis:
    """Get complete schema analysis for a specific version.
    
    This endpoint provides a comprehensive analysis of the schema including:
    - All component definitions with their fields
    - Hierarchy relationships between components
    - Field categorization (structural vs property)
    - Validation rules and constraints
    
    Args:
        version: Schema version to analyze (e.g., "0.1.43")
        
    Returns:
        Complete schema analysis with components, hierarchies, and statistics
        
    Raises:
        HTTPException: 404 if schema version not found, 500 for analysis errors
    """
    try:
        return schema_analyzer.analyze_schema(version)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found"
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in schema file for version {version}: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing schema: {str(e)}"
        )


@router.get("/components/{version}")
async def get_components_list(version: str) -> ComponentList:
    """Get simplified list of all available component types.
    
    This endpoint provides a lightweight view of all components suitable for
    UI component selection and overview displays.
    
    Args:
        version: Schema version to analyze (e.g., "0.1.43")
        
    Returns:
        List of components with basic metadata
        
    Raises:
        HTTPException: 404 if schema version not found, 500 for analysis errors
    """
    try:
        return schema_analyzer.get_component_list(version)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found"
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in schema file for version {version}: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting component list: {str(e)}"
        )


@router.get("/components/{version}/{component_type}")
async def get_component_definition(version: str, component_type: str) -> ComponentDefinition:
    """Get detailed definition for a specific component type.
    
    This endpoint provides complete field definitions, validation rules,
    and metadata for a single component type.
    
    Args:
        version: Schema version to analyze (e.g., "0.1.43")
        component_type: Name of the component type (e.g., "Graph", "Page")
        
    Returns:
        Complete component definition with all fields and metadata
        
    Raises:
        HTTPException: 404 if schema version or component not found, 500 for analysis errors
    """
    try:
        analysis = schema_analyzer.analyze_schema(version)
        
        if component_type not in analysis.components:
            raise HTTPException(
                status_code=404,
                detail=f"Component type '{component_type}' not found in schema version {version}"
            )
        
        return analysis.components[component_type]
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found"
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in schema file for version {version}: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting component definition: {str(e)}"
        )


@router.get("/hierarchy/{version}")
async def get_hierarchy_relationships(version: str) -> Dict[str, Any]:
    """Get component hierarchy relationships.
    
    This endpoint provides information about parent-child relationships
    between components, which is essential for building the component tree.
    
    Args:
        version: Schema version to analyze (e.g., "0.1.43")
        
    Returns:
        Dictionary containing hierarchy relationships and root components
        
    Raises:
        HTTPException: 404 if schema version not found, 500 for analysis errors
    """
    try:
        analysis = schema_analyzer.analyze_schema(version)
        
        return {
            "schema_version": version,
            "hierarchies": analysis.hierarchies,
            "root_components": analysis.root_components,
            "total_relationships": len(analysis.hierarchies)
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found"
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in schema file for version {version}: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting hierarchy relationships: {str(e)}"
        )