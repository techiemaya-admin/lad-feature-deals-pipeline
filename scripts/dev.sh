#!/bin/bash
# Development Server Script

echo "🚀 Starting Deals Pipeline Development Server..."

# Set environment variables
export NODE_ENV=development
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=lad_dev_mock
export DB_USER=postgres
export DB_PASSWORD=postgres
export PORT=3004

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo "⚠️  PostgreSQL is not running. Starting Docker container..."
  docker run -d \
    --name lad-dev-postgres \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=$DB_NAME \
    -p $DB_PORT:5432 \
    postgres:14
  
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 5
fi

# Initialize database schema
echo "📦 Initializing database schema..."
node -e "require('./mocks/db.mock').initSchema().then(() => process.exit(0))"

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
fi

# Start the server
echo "🎯 Starting Express server on port $PORT..."
npm start
