"""Pydantic models for schema analysis data structures."""

from typing import Any, Dict, List, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field


class FieldType(str, Enum):
    """JSON Schema field types."""
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"
    NULL = "null"


class FieldCategory(str, Enum):
    """Categories for field usage in forms."""
    STRUCTURAL = "structural"  # For tree building (parent-child relationships)
    PROPERTY = "property"      # For property editing (regular fields)
    METADATA = "metadata"      # System fields (id, type, etc.)


class ValidationRule(BaseModel):
    """Validation rules for a field."""
    required: bool = False
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    minimum: Optional[Union[int, float]] = None
    maximum: Optional[Union[int, float]] = None
    pattern: Optional[str] = None
    enum_values: Optional[List[str]] = None
    min_items: Optional[int] = None
    max_items: Optional[int] = None
    const_value: Optional[str] = None


class FieldReference(BaseModel):
    """Reference to another component definition."""
    ref_path: str = Field(..., description="JSON Schema $ref path")
    component_type: Optional[str] = Field(None, description="Referenced component type")


class FieldDefinition(BaseModel):
    """Definition of a component field."""
    name: str = Field(..., description="Field name")
    title: Optional[str] = Field(None, description="Human-readable title")
    description: Optional[str] = Field(None, description="Field description")
    field_type: FieldType = Field(..., description="JSON Schema type")
    category: FieldCategory = Field(..., description="Field category for form generation")
    validation: ValidationRule = Field(default_factory=ValidationRule, description="Validation rules")
    default_value: Optional[Any] = Field(None, description="Default value")
    
    # Array-specific properties
    array_item_type: Optional[FieldType] = Field(None, description="Type of array items")
    array_item_ref: Optional[FieldReference] = Field(None, description="Reference for array items")
    
    # Object-specific properties
    object_properties: Optional[Dict[str, "FieldDefinition"]] = Field(None, description="Object properties")
    additional_properties: bool = Field(False, description="Allow additional properties")
    
    # Union/OneOf properties
    union_types: Optional[List[FieldReference]] = Field(None, description="Union type references")
    discriminator_property: Optional[str] = Field(None, description="Discriminator property name")
    discriminator_mapping: Optional[Dict[str, str]] = Field(None, description="Discriminator mapping")


class ComponentDefinition(BaseModel):
    """Definition of a Vizro component."""
    component_type: str = Field(..., description="Component type name")
    title: Optional[str] = Field(None, description="Human-readable title")
    description: Optional[str] = Field(None, description="Component description")
    fields: Dict[str, FieldDefinition] = Field(..., description="Component fields")
    required_fields: List[str] = Field(default_factory=list, description="Required field names")
    structural_fields: List[str] = Field(default_factory=list, description="Fields that contain child components")
    is_root_component: bool = Field(False, description="Can be used as root component")
    is_child_component: bool = Field(True, description="Can be used as child component")


class HierarchyRelationship(BaseModel):
    """Relationship between parent and child components."""
    parent_type: str = Field(..., description="Parent component type")
    child_types: List[str] = Field(..., description="Allowed child component types")
    field_name: str = Field(..., description="Field name that contains children")
    is_array: bool = Field(..., description="Whether field contains array of children")
    min_children: Optional[int] = Field(None, description="Minimum number of children")
    max_children: Optional[int] = Field(None, description="Maximum number of children")


class SchemaAnalysis(BaseModel):
    """Complete analysis of a Vizro JSON schema."""
    schema_version: str = Field(..., description="Schema version")
    components: Dict[str, ComponentDefinition] = Field(..., description="All component definitions")
    hierarchies: List[HierarchyRelationship] = Field(..., description="Parent-child relationships")
    root_components: List[str] = Field(..., description="Components that can be used as roots")
    
    # Statistics
    total_components: int = Field(..., description="Total number of components")
    total_fields: int = Field(..., description="Total number of fields across all components")
    structural_field_count: int = Field(..., description="Number of structural fields")
    property_field_count: int = Field(..., description="Number of property fields")


class ComponentListItem(BaseModel):
    """Simplified component info for listing."""
    component_type: str = Field(..., description="Component type name")
    title: Optional[str] = Field(None, description="Human-readable title")
    description: Optional[str] = Field(None, description="Component description")
    field_count: int = Field(..., description="Number of fields")
    is_root_component: bool = Field(..., description="Can be used as root component")
    has_children: bool = Field(..., description="Has structural fields for children")


class ComponentList(BaseModel):
    """List of available components."""
    schema_version: str = Field(..., description="Schema version")
    components: List[ComponentListItem] = Field(..., description="Component list")
    total_count: int = Field(..., description="Total number of components")


# Update forward references
FieldDefinition.model_rebuild()