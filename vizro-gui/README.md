# Vizro GUI Builder

A form-based interface for creating Vizro dashboards without coding.

## Quick Start

```bash
make up              # Start all services
make logs            # View logs
make down            # Stop services
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Main Development Commands

### Essential
```bash
make up              # Start all services
make down            # Stop all services
make logs            # View all logs
make build           # Build containers
```

### Development
```bash
make shell-backend   # Shell into backend container
make shell-frontend  # Shell into frontend container
make test            # Run all tests
```

### Database
```bash
make migrate         # Run migrations
make db-reset        # Reset database
```

## Local Development (Alternative to Docker)

```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Documentation

- `CLAUDE.md` - Development guidance and current state
- `DEVELOPMENT.md` - Development history and decisions
- `advanced-context/` - Technical architecture details