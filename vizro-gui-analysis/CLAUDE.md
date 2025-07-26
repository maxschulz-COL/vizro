# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Vizro GUI Builder project.

## Project Overview

The Vizro GUI Builder is a new application that provides a form-based interface for creating Vizro dashboards. This replaces the need for manual JSON/YAML configuration with an intuitive form-driven interface.

**Key Goals:**
- Form-based dashboard creation without coding
- Two-state interface: component tree building + property editing
- Generate valid Vizro JSON from form inputs
- Template system for quick dashboard creation
- Schema-driven form interface for component tree and property editing
- Future: Live preview via WebAssembly + iframe (backend-generated link)

## Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- State Management: Zustand
- UI Framework: shadcn/ui + Tailwind CSS
- Form Generation: Custom forms derived from JSON Schema (avoiding limiting JSON form libraries)
- Form Handling: React Hook Form + JSON Schema validation
- Build Tool: Vite

**Backend:**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy
- Redis (caching, sessions)
- Pydantic (schema validation)
- Celery + Redis (async tasks)

### Core Components

1. **Top Navigation Bar**: Login, user account, save/load, export options
2. **Tree Builder Form** (Left Panel): Schema-driven form for building component hierarchy
3. **Central Preview**: JSON/YAML output view (future: live dashboard preview via WebAssembly iframe)
4. **Property Editor Form** (Right Panel): Schema-driven form for editing selected component properties (non-children)
5. **Template System**: Pre-built dashboard templates
6. **Schema Form Engine**: Custom form generation from JSON Schema definitions

### Key Files

- `architecture-deep-dive.md`: Detailed technical architecture
- `vizro-schema-analysis.md`: Analysis of Vizro schema for GUI generation

## Development Commands

This project is in early development phase. Standard commands will be:

```bash
# Frontend development
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests

# Backend development  
pip install -r requirements.txt
uvicorn main:app --reload    # Start FastAPI server
pytest                       # Run tests

# Full stack
docker-compose up -d         # Start all services
```

## Schema Integration

The GUI builder leverages the existing Vizro JSON schema (`vizro-core/schemas/`) to:
- Generate dynamic property forms
- Validate dashboard configurations
- Ensure 100% compatibility with Vizro runtime
- Provide real-time validation feedback

## Development Focus Areas

1. **Schema Form Engine**: Custom form generation from JSON Schema (avoiding limiting libraries)
2. **Tree Builder**: Left panel form for component hierarchy creation
3. **Property Editor**: Right panel form for component detail editing
4. **JSON Generation**: Combine tree + properties to generate valid Vizro JSON
5. **Two-State Management**: Tree building mode vs. component detail editing mode
6. **Configuration Display**: Show generated JSON/YAML output
7. **Future Phase**: Live preview via WebAssembly + iframe integration

## Key Design Principles

- **Schema-Driven**: All forms generated from Vizro JSON schema
- **Form-Based**: Clean form interface over drag-and-drop complexity
- **Dual-Mode**: Tree building (hierarchy) vs. Property editing (details)
- **JSON-Focused**: Generate valid Vizro JSON from form inputs
- **Custom Forms**: Avoid limiting JSON form libraries, build tailored forms
- **Phased Approach**: Start with forms + JSON output, add preview later
- **Future-Ready**: Architecture prepared for WebAssembly preview integration