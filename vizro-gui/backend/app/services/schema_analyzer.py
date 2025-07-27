"""Schema analysis service for parsing Vizro JSON schemas."""

import json
import os
from typing import Dict, Any, List, Optional, Set, Union
from pathlib import Path

from app.models.schema_analysis import (
    FieldType, FieldCategory, ValidationRule, FieldReference, FieldDefinition,
    ComponentDefinition, HierarchyRelationship, SchemaAnalysis,
    ComponentListItem, ComponentList
)


class SchemaAnalyzer:
    """Service for analyzing Vizro JSON schemas."""
    
    def __init__(self, schema_dir: Optional[str] = None):
        """Initialize schema analyzer.
        
        Args:
            schema_dir: Directory containing schema files. Defaults to 'schemas' relative to app.
        """
        if schema_dir is None:
            # Default to schemas directory relative to the app
            current_dir = Path(__file__).parent.parent.parent
            self.schema_dir = current_dir / "schemas"
        else:
            self.schema_dir = Path(schema_dir)
    
    def load_schema(self, version: str) -> Dict[str, Any]:
        """Load JSON schema file.
        
        Args:
            version: Schema version to load
            
        Returns:
            Parsed JSON schema
            
        Raises:
            FileNotFoundError: If schema file doesn't exist
            json.JSONDecodeError: If schema file is invalid JSON
        """
        schema_path = self.schema_dir / f"{version}.json"
        
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in schema file {schema_path}: {e}", "", 0)
    
    def _extract_field_type(self, field_schema: Dict[str, Any]) -> FieldType:
        """Extract field type from JSON schema field definition.
        
        Args:
            field_schema: JSON schema field definition
            
        Returns:
            Field type enum value
        """
        if "type" in field_schema:
            field_type = field_schema["type"]
            if isinstance(field_type, list):
                # Handle union types - return the first non-null type
                non_null_types = [t for t in field_type if t != "null"]
                if non_null_types:
                    field_type = non_null_types[0]
                else:
                    field_type = "null"
            
            try:
                return FieldType(field_type)
            except ValueError:
                return FieldType.STRING  # Default fallback
        
        # Handle special cases
        if "const" in field_schema:
            return FieldType.STRING
        if "enum" in field_schema:
            return FieldType.STRING
        if "$ref" in field_schema:
            return FieldType.OBJECT
        if "oneOf" in field_schema or "anyOf" in field_schema:
            return FieldType.OBJECT
        if "items" in field_schema:
            return FieldType.ARRAY
        
        return FieldType.STRING  # Default fallback
    
    def _extract_validation_rules(self, field_schema: Dict[str, Any]) -> ValidationRule:
        """Extract validation rules from JSON schema field definition.
        
        Args:
            field_schema: JSON schema field definition
            
        Returns:
            Validation rules
        """
        return ValidationRule(
            required=False,  # Will be set at component level
            min_length=field_schema.get("minLength"),
            max_length=field_schema.get("maxLength"),
            minimum=field_schema.get("minimum"),
            maximum=field_schema.get("maximum"),
            pattern=field_schema.get("pattern"),
            enum_values=field_schema.get("enum"),
            min_items=field_schema.get("minItems"),
            max_items=field_schema.get("maxItems"),
            const_value=field_schema.get("const")
        )
    
    def _extract_field_references(self, field_schema: Dict[str, Any]) -> Optional[List[FieldReference]]:
        """Extract component references from field schema.
        
        Args:
            field_schema: JSON schema field definition
            
        Returns:
            List of field references if any
        """
        refs = []
        
        # Direct reference
        if "$ref" in field_schema:
            ref_path = field_schema["$ref"]
            component_type = self._extract_component_type_from_ref(ref_path)
            refs.append(FieldReference(ref_path=ref_path, component_type=component_type))
        
        # OneOf/AnyOf references
        for union_key in ["oneOf", "anyOf"]:
            if union_key in field_schema:
                for item in field_schema[union_key]:
                    if "$ref" in item:
                        ref_path = item["$ref"]
                        component_type = self._extract_component_type_from_ref(ref_path)
                        refs.append(FieldReference(ref_path=ref_path, component_type=component_type))
        
        return refs if refs else None
    
    def _extract_component_type_from_ref(self, ref_path: str) -> Optional[str]:
        """Extract component type from JSON schema reference path.
        
        Args:
            ref_path: JSON schema $ref path like "#/$defs/ComponentName"
            
        Returns:
            Component type name or None
        """
        if ref_path.startswith("#/$defs/"):
            return ref_path.replace("#/$defs/", "")
        return None
    
    def _categorize_field(self, field_name: str, field_schema: Dict[str, Any], 
                         component_type: str) -> FieldCategory:
        """Categorize field based on its purpose and structure.
        
        Args:
            field_name: Name of the field
            field_schema: JSON schema field definition
            component_type: Name of the component containing this field
            
        Returns:
            Field category
        """
        # Metadata fields
        metadata_fields = {"id", "type"}
        if field_name in metadata_fields:
            return FieldCategory.METADATA
        
        # Structural fields (contain child components)
        structural_indicators = {
            "components", "controls", "pages", "actions", "layout", "children",
            "nav_selector", "tabs", "items"
        }
        
        if field_name in structural_indicators:
            return FieldCategory.STRUCTURAL
        
        # Check if field contains component references
        refs = self._extract_field_references(field_schema)
        if refs:
            # If field references other components, it's likely structural
            for ref in refs:
                if ref.component_type and ref.component_type != component_type:
                    return FieldCategory.STRUCTURAL
        
        # Check array items for component references
        if field_schema.get("type") == "array" and "items" in field_schema:
            item_refs = self._extract_field_references(field_schema["items"])
            if item_refs:
                for ref in item_refs:
                    if ref.component_type and ref.component_type != component_type:
                        return FieldCategory.STRUCTURAL
        
        # Default to property field
        return FieldCategory.PROPERTY
    
    def _parse_field_definition(self, field_name: str, field_schema: Dict[str, Any], 
                              component_type: str) -> FieldDefinition:
        """Parse a single field definition from JSON schema.
        
        Args:
            field_name: Name of the field
            field_schema: JSON schema field definition
            component_type: Name of the component containing this field
            
        Returns:
            Parsed field definition
        """
        field_type = self._extract_field_type(field_schema)
        category = self._categorize_field(field_name, field_schema, component_type)
        validation = self._extract_validation_rules(field_schema)
        refs = self._extract_field_references(field_schema)
        
        # Extract discriminator info
        discriminator_property = None
        discriminator_mapping = None
        if "discriminator" in field_schema:
            disc = field_schema["discriminator"]
            discriminator_property = disc.get("propertyName")
            discriminator_mapping = disc.get("mapping")
        
        field_def = FieldDefinition(
            name=field_name,
            title=field_schema.get("title"),
            description=field_schema.get("description"),
            field_type=field_type,
            category=category,
            validation=validation,
            default_value=field_schema.get("default"),
            union_types=refs,
            discriminator_property=discriminator_property,
            discriminator_mapping=discriminator_mapping
        )
        
        # Handle array-specific properties
        if field_type == FieldType.ARRAY and "items" in field_schema:
            items_schema = field_schema["items"]
            field_def.array_item_type = self._extract_field_type(items_schema)
            item_refs = self._extract_field_references(items_schema)
            if item_refs and len(item_refs) == 1:
                field_def.array_item_ref = item_refs[0]
        
        # Handle object-specific properties
        if field_type == FieldType.OBJECT and "properties" in field_schema:
            object_props = {}
            for prop_name, prop_schema in field_schema["properties"].items():
                object_props[prop_name] = self._parse_field_definition(
                    prop_name, prop_schema, component_type
                )
            field_def.object_properties = object_props
            field_def.additional_properties = field_schema.get("additionalProperties", False)
        
        return field_def
    
    def _parse_component_definition(self, component_type: str, 
                                  component_schema: Dict[str, Any]) -> ComponentDefinition:
        """Parse a component definition from JSON schema.
        
        Args:
            component_type: Name of the component type
            component_schema: JSON schema component definition
            
        Returns:
            Parsed component definition
        """
        # Parse all fields
        fields = {}
        properties = component_schema.get("properties", {})
        for field_name, field_schema in properties.items():
            fields[field_name] = self._parse_field_definition(field_name, field_schema, component_type)
        
        # Extract required fields
        required_fields = component_schema.get("required", [])
        
        # Identify structural fields
        structural_fields = [
            name for name, field_def in fields.items() 
            if field_def.category == FieldCategory.STRUCTURAL
        ]
        
        # Determine if this can be a root component
        # Components with minimal dependencies and structural capabilities are typically roots
        is_root_component = component_type in {"Dashboard", "Page"} or len(structural_fields) > 0
        
        return ComponentDefinition(
            component_type=component_type,
            title=component_schema.get("title"),
            description=component_schema.get("description"),
            fields=fields,
            required_fields=required_fields,
            structural_fields=structural_fields,
            is_root_component=is_root_component,
            is_child_component=True  # Most components can be children
        )
    
    def _extract_hierarchy_relationships(self, components: Dict[str, ComponentDefinition]) -> List[HierarchyRelationship]:
        """Extract parent-child relationships between components.
        
        Args:
            components: Dictionary of parsed component definitions
            
        Returns:
            List of hierarchy relationships
        """
        relationships = []
        
        for component_type, component_def in components.items():
            for field_name, field_def in component_def.fields.items():
                if field_def.category != FieldCategory.STRUCTURAL:
                    continue
                
                child_types = []
                is_array = field_def.field_type == FieldType.ARRAY
                
                # Extract child types from references
                if field_def.union_types:
                    for ref in field_def.union_types:
                        if ref.component_type:
                            child_types.append(ref.component_type)
                
                if field_def.array_item_ref and field_def.array_item_ref.component_type:
                    child_types.append(field_def.array_item_ref.component_type)
                
                if child_types:
                    relationship = HierarchyRelationship(
                        parent_type=component_type,
                        child_types=child_types,
                        field_name=field_name,
                        is_array=is_array,
                        min_children=field_def.validation.min_items,
                        max_children=field_def.validation.max_items
                    )
                    relationships.append(relationship)
        
        return relationships
    
    def analyze_schema(self, version: str) -> SchemaAnalysis:
        """Analyze a complete JSON schema.
        
        Args:
            version: Schema version to analyze
            
        Returns:
            Complete schema analysis
            
        Raises:
            FileNotFoundError: If schema file doesn't exist
            json.JSONDecodeError: If schema file is invalid JSON
        """
        schema = self.load_schema(version)
        
        # Parse all component definitions
        components = {}
        defs = schema.get("$defs", {})
        
        for component_type, component_schema in defs.items():
            # Skip non-component definitions (functions, types, etc.)
            if not isinstance(component_schema, dict) or "properties" not in component_schema:
                continue
            
            components[component_type] = self._parse_component_definition(component_type, component_schema)
        
        # Extract hierarchy relationships
        hierarchies = self._extract_hierarchy_relationships(components)
        
        # Identify root components
        root_components = [
            comp_type for comp_type, comp_def in components.items()
            if comp_def.is_root_component
        ]
        
        # Calculate statistics
        total_fields = sum(len(comp.fields) for comp in components.values())
        structural_field_count = sum(
            len(comp.structural_fields) for comp in components.values()
        )
        property_field_count = sum(
            len([f for f in comp.fields.values() if f.category == FieldCategory.PROPERTY])
            for comp in components.values()
        )
        
        return SchemaAnalysis(
            schema_version=version,
            components=components,
            hierarchies=hierarchies,
            root_components=root_components,
            total_components=len(components),
            total_fields=total_fields,
            structural_field_count=structural_field_count,
            property_field_count=property_field_count
        )
    
    def get_component_list(self, version: str) -> ComponentList:
        """Get a simplified list of available components.
        
        Args:
            version: Schema version
            
        Returns:
            Component list
        """
        analysis = self.analyze_schema(version)
        
        components = []
        for comp_type, comp_def in analysis.components.items():
            components.append(ComponentListItem(
                component_type=comp_type,
                title=comp_def.title,
                description=comp_def.description,
                field_count=len(comp_def.fields),
                is_root_component=comp_def.is_root_component,
                has_children=len(comp_def.structural_fields) > 0
            ))
        
        # Sort by component type for consistent ordering
        components.sort(key=lambda x: x.component_type)
        
        return ComponentList(
            schema_version=version,
            components=components,
            total_count=len(components)
        )