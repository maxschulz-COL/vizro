# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Vizro GUI Builder project.

## Project Overview

The Vizro GUI Builder is a new application that provides a form-based interface for creating Vizro dashboards. This replaces the need for manual JSON/YAML configuration with an intuitive form-driven interface.

**Key Goals:**
- Form-based dashboard creation without coding
- Two-state interface: component tree building + property editing
- Real-time validation: debounced backend validation on every form change with visual indicators
- Generate valid Vizro JSON from validated backend response
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
- Form Handling: React Hook Form + real-time backend validation (debounced)
- Build Tool: Vite

**Backend:**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy
- Redis (caching, sessions)
- Pydantic (Dashboard.model_validate for backend validation)
- Celery + Redis (async tasks)

### Core Components

1. **Top Navigation Bar**: Login, user account, save/load, export options
2. **Tree Builder Form** (Left Panel): Schema-driven form for building component hierarchy
3. **Central Preview**: JSON/YAML output view (future: live dashboard preview via WebAssembly iframe)
4. **Property Editor Form** (Right Panel): Schema-driven form for editing selected component properties (non-children)
5. **User Account Management**: Dashboard library, dataset management, account settings
6. **Data Upload System**: CSV/Excel file upload with size limits and dataset naming
7. **Config Import System**: Parse and load existing Vizro JSON/YAML configurations
8. **History Management**: Undo/redo functionality with configuration snapshots
9. **Template System**: Pre-built dashboard templates
10. **Schema Form Engine**: Custom form generation from JSON Schema definitions
11. **Future: GenAI Assistant**: AI-powered suggestions with preview/accept/revert workflow

### Key Files

- `architecture-deep-dive.md`: Detailed technical architecture
- `vizro-schema-analysis.md`: Analysis of Vizro schema for GUI generation

## Development Commands

This project uses Docker-based development for consistency and easy deployment.

### Primary Commands (via Makefile)
```bash
make up              # Start all services (docker-compose up)
make down            # Stop all services
make build           # Build all containers
make logs            # View all logs
make logs-frontend   # View frontend logs only
make logs-backend    # View backend logs only

# Development
make shell-frontend  # Shell into frontend container
make shell-backend   # Shell into backend container
make shell-db        # Connect to PostgreSQL
make test            # Run all tests
make test-frontend   # Run frontend tests only
make test-backend    # Run backend tests only

# Database
make migrate         # Run database migrations
make seed            # Seed database with sample data
make db-reset        # Reset database (drop/create/migrate)

# Production
make build-prod      # Build production images
make deploy-staging  # Deploy to staging
make deploy-prod     # Deploy to production
```

### Direct Docker Commands (if needed)
```bash
docker-compose up -d              # Start all services
docker-compose logs -f frontend   # Follow frontend logs
docker-compose exec backend bash  # Shell into backend
```

## Schema Integration

The GUI builder leverages the existing Vizro JSON schema (`vizro-core/schemas/`) to:
- Generate dynamic property forms
- Validate dashboard configurations
- Ensure 100% compatibility with Vizro runtime
- Provide real-time validation feedback

## Development Focus Areas

1. **Dynamic Schema Form Engine**: Generate forms from ANY schema version (no hardcoding)
2. **Component Field Registry**: Specific components (Graph, Table) + generic fallbacks (string, number)
3. **Tree Builder**: Schema-driven form for component hierarchy creation
4. **Property Editor**: Schema-driven form for component detail editing  
5. **User Data Management**: Dataset upload, naming, and dashboard library
6. **Config Import/Export**: Parse existing Vizro configs and build form state
7. **History & Undo/Redo**: Version control for dashboard configurations
8. **Backend Validation**: Send two frontend states to backend for Pydantic validation
9. **Two-State Management**: Tree building mode vs. component detail editing mode
10. **Configuration Display**: Show validated JSON/YAML output from backend
11. **Future: GenAI Assistance**: AI-powered dashboard creation and editing suggestions
12. **Future Phase**: Live preview via WebAssembly + iframe integration

## Key Design Principles

- **Schema-Driven**: All forms generated from Vizro JSON schema
- **Zero Hardcoding**: NO field names or components hardcoded - everything derived from schema
- **Version Agnostic**: Works with any schema version (0.1.43 → 0.1.44 → future versions)
- **Component Mapping**: Specific field components + generic fallbacks for standard types
- **Form-Based**: Clean form interface over drag-and-drop complexity
- **Dual-Mode**: Tree building (hierarchy) vs. Property editing (details)
- **Backend Validation**: Frontend sends raw states, backend validates via Pydantic
- **Custom Forms**: Avoid limiting JSON form libraries, build tailored forms
- **Phased Approach**: Start with forms + validation, add preview later
- **Future-Ready**: Architecture prepared for WebAssembly preview integration