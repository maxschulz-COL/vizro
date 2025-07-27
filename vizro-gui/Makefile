.PHONY: up down build logs test migrate clean help

# Development commands
up:
	@echo "🚀 Starting all services..."
	docker-compose up -d

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

build:
	@echo "🔨 Building all containers..."
	docker-compose build

rebuild:
	@echo "🔄 Rebuilding all containers from scratch..."
	docker-compose build --no-cache

# Logging
logs:
	@echo "📋 Showing all logs..."
	docker-compose logs -f

logs-frontend:
	@echo "📋 Showing frontend logs..."
	docker-compose logs -f frontend

logs-backend:
	@echo "📋 Showing backend logs..."
	docker-compose logs -f backend

logs-postgres:
	@echo "📋 Showing postgres logs..."
	docker-compose logs -f postgres

logs-redis:
	@echo "📋 Showing redis logs..."
	docker-compose logs -f redis

# Development shells
shell-frontend:
	@echo "🖥️  Opening frontend shell..."
	docker-compose exec frontend sh

shell-backend:
	@echo "🖥️  Opening backend shell..."
	docker-compose exec backend bash

shell-db:
	@echo "🖥️  Opening database shell..."
	docker-compose exec postgres psql -U vizro -d vizro_gui

shell-redis:
	@echo "🖥️  Opening redis shell..."
	docker-compose exec redis redis-cli

# Testing
test:
	@echo "🧪 Running all tests..."
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

test-backend:
	@echo "🧪 Running backend tests..."
	docker-compose exec backend pytest

test-frontend:
	@echo "🧪 Running frontend tests..."
	docker-compose exec frontend npm test

# Database management
migrate:
	@echo "📊 Running database migrations..."
	docker-compose exec backend alembic upgrade head

seed:
	@echo "🌱 Seeding database with sample data..."
	docker-compose exec backend python scripts/seed_db.py

db-reset:
	@echo "🗑️  Resetting database..."
	docker-compose exec postgres psql -U vizro -d vizro_gui -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) migrate

# Production builds
build-prod:
	@echo "🏭 Building production images..."
	docker-compose -f docker-compose.prod.yml build

deploy-staging:
	@echo "🚀 Deploying to staging..."
	docker-compose -f docker-compose.staging.yml up -d

deploy-prod:
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.prod.yml up -d

# Cleanup
clean:
	@echo "🧹 Cleaning up containers, networks, and volumes..."
	docker-compose down -v
	docker system prune -f

clean-all:
	@echo "🧹 Cleaning up everything including images..."
	docker-compose down -v --rmi all
	docker system prune -af

# Development workflow
install:
	@echo "📦 Installing dependencies..."
	docker-compose run --rm frontend npm install
	docker-compose run --rm backend pip install -r requirements.txt

dev-setup: build install migrate
	@echo "✅ Development environment setup complete!"
	@echo "💡 Run 'make up' to start all services"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔗 Backend API: http://localhost:8000"
	@echo "📖 API Docs: http://localhost:8000/docs"

# Status
status:
	@echo "📊 Service status:"
	docker-compose ps

# Help
help:
	@echo "Vizro GUI Builder - Development Commands"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make dev-setup    Setup development environment"
	@echo "  make up           Start all services"
	@echo "  make logs         View all logs"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make build        Build all containers"
	@echo "  make rebuild      Rebuild containers from scratch"
	@echo "  make down         Stop all services"
	@echo "  make status       Show service status"
	@echo ""
	@echo "📋 Logging:"
	@echo "  make logs         All service logs"
	@echo "  make logs-frontend Frontend logs only"
	@echo "  make logs-backend Backend logs only"
	@echo ""
	@echo "🖥️  Shells:"
	@echo "  make shell-frontend Enter frontend container"
	@echo "  make shell-backend  Enter backend container"
	@echo "  make shell-db       Enter database"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test         Run all tests"
	@echo "  make test-frontend Frontend tests only"
	@echo "  make test-backend Backend tests only"
	@echo ""
	@echo "📊 Database:"
	@echo "  make migrate      Run migrations"
	@echo "  make seed         Seed sample data"
	@echo "  make db-reset     Reset database"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean        Clean containers/volumes"
	@echo "  make clean-all    Clean everything"
	@echo ""
	@echo "🌐 URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"