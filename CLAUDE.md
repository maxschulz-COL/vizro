# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**This is a fork focused on developing a new GUI builder feature.** The ultimate goal is to replace the entire monorepo with a single application that provides a visual interface for building Vizro dashboards.

**Current Development Focus**: All new development should be concentrated in the `vizro-gui-analysis/` folder, which contains the architectural outline for the new GUI builder application.

**Legacy Context**: The existing monorepo contains:
- **vizro-core**: Main Python framework for building dashboards (published as `vizro`)
- **vizro-ai**: LLM-powered chart/dashboard generation (published as `vizro_ai`)  
- **vizro-mcp**: Model Context Protocol server for Vizro integration with AI assistants

## Architecture

### Monorepo Structure
- Each package has its own `pyproject.toml`, dependencies, and release cycle
- Root `pyproject.toml` contains shared dev environment configuration
- Common tooling configurations (ruff, mypy, etc.) are in root, extended by packages

### Core Package Architecture (`vizro-core/`)
- **Models** (`src/vizro/models/`): Pydantic models defining dashboard structure
  - `_dashboard.py`: Top-level dashboard configuration
  - `_page.py`: Individual page definitions
  - `_components/`: UI components (graphs, tables, cards, etc.)
  - `_controls/`: Filters and parameters
  - `_navigation/`: Navigation structures (nav bars, accordions)
- **Actions** (`src/vizro/actions/`): Interactive behaviors and callbacks
- **Themes** (`src/vizro/_themes/`): Plotly templates and styling
- **Static Assets** (`src/vizro/static/`): CSS, JS, and image files
- **Integrations** (`src/vizro/integrations/`): External system integrations (Kedro)

### Frontend Technologies
- Built on Dash (Python web framework)
- Uses Dash Bootstrap Components, Dash AG Grid, Dash Mantine Components
- Custom CSS and JavaScript in `static/` directory
- Jest tests for JavaScript components in `tests/js/`

## Development Commands

### Environment Management
Uses Hatch for Python environment management across all packages.

### Vizro Core (`vizro-core/`)
```bash
# Install dependencies and enter environment
hatch shell

# Run unit tests
hatch run test-unit

# Run unit tests with coverage
hatch run test-unit-coverage

# Run JavaScript tests  
hatch run test-js

# Run integration tests
hatch run test-integration

# Run E2E screenshot tests
hatch run test-e2e-vizro-screenshots

# Run linting (ruff, black, etc.)
hatch run lint

# Run specific example
hatch run example [folder_name]  # defaults to scratch_dev

# Generate schema files
hatch run schema

# Check if schema is up to date
hatch run schema-check

# Generate Plotly templates
hatch run templates

# Check if templates are up to date  
hatch run templates-check

# Download latest static files
hatch run download-static-files
```

### Vizro AI (`vizro-ai/`)
```bash
cd vizro-ai
hatch run test-unit          # Unit tests
hatch run test-e2e-plot      # E2E plot tests
hatch run test-e2e-dashboard # E2E dashboard tests
```

### Vizro MCP (`vizro-mcp/`)
```bash
cd vizro-mcp  
hatch run test-unit          # Unit tests
```

### Root Level
```bash
# Lint all packages
hatch run lint-vizro-all

# Check all packages  
hatch run checks-workflows
```

## Testing Strategy

- **Unit tests**: Fast, isolated component testing
- **Integration tests**: Test component interactions
- **E2E tests**: Browser-based testing with Playwright/Selenium
- **JavaScript tests**: Jest for frontend components
- **Screenshot tests**: Visual regression testing across browsers

## Key Conventions

### Code Style
- Uses Ruff for linting and formatting
- Google-style docstrings
- Type hints with mypy checking
- 120 character line length

### File Organization
- Models use Pydantic for validation and configuration
- Components follow factory pattern with `_build_component()` methods
- Tests mirror source structure in parallel directory trees
- Examples are self-contained in their own directories

### Data Flow
- Configuration → Pydantic models → Dash components → Rendered dashboard
- Actions connect user interactions to data transformations
- Data managers handle DataFrame operations and caching

## Development Notes

- The `gui` branch appears to be for GUI-related development
- Schema generation is automated and should be kept in sync
- Static files can be downloaded from external sources
- Pre-commit hooks enforce code quality standards
- Changelog fragments are required for source code changes