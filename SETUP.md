# Setup Guide - Deals Pipeline Workspace

## Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd lad-feature-deals-pipeline
npm install
```

### Step 2: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Default settings work for local development
# Edit .env if you need custom database settings
```

### Step 3: Start PostgreSQL (if not running)

**Option A: Using Docker (Recommended)**
```bash
docker run -d \
  --name lad-dev-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lad_dev_mock \
  -p 5432:5432 \
  postgres:14
```

**Option B: Using Local PostgreSQL**
```bash
# Create database
createdb lad_dev_mock

# Or using psql
psql -U postgres -c "CREATE DATABASE lad_dev_mock;"
```

### Step 4: Start Development Server
```bash
npm run dev
```

You should see:
```
🚀 Deals Pipeline Development Server
=====================================
📡 Server running at: http://localhost:3004
📋 API Base Path: http://localhost:3004/api/deals-pipeline
💚 Health Check: http://localhost:3004/health
```

### Step 5: Test It Works
```bash
# Health check
curl http://localhost:3004/health

# Get pipeline board
curl http://localhost:3004/api/deals-pipeline/pipeline/board

# List stages
curl http://localhost:3004/api/deals-pipeline/stages
```

## Detailed Setup

### Database Setup

The workspace uses PostgreSQL for data storage. You have several options:

#### 1. Docker (Easiest)
```bash
# Start PostgreSQL container
docker run -d \
  --name lad-dev-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lad_dev_mock \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  postgres:14

# Check it's running
docker ps | grep lad-dev-postgres

# View logs
docker logs lad-dev-postgres
```

#### 2. Local PostgreSQL Installation

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb lad_dev_mock
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-14
sudo systemctl start postgresql
sudo -u postgres createdb lad_dev_mock
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer
- Create database using pgAdmin

### Environment Variables

The `.env` file controls your development environment:

```bash
# Server
NODE_ENV=development    # development, production, test
PORT=3004              # Server port

# Database
DB_HOST=localhost      # Database host
DB_PORT=5432          # Database port
DB_NAME=lad_dev_mock  # Database name
DB_USER=postgres      # Database user
DB_PASSWORD=postgres  # Database password

# JWT (for mocks)
JWT_SECRET=mock-secret-for-dev-only

# Feature
FEATURE_KEY=deals-pipeline
FEATURE_VERSION=2.0.0
```

### Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**With custom port:**
```bash
PORT=4000 npm run dev
```

### Available npm Scripts

```bash
npm run dev       # Start development server
npm start         # Start production server
npm test          # Run tests
npm run validate  # Check LAD compliance
npm run lint      # Lint code
npm run format    # Format code with Prettier
```

## Testing Your Setup

### 1. Health Check
```bash
curl http://localhost:3004/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "deals-pipeline",
  "version": "2.0.0",
  "timestamp": "2025-12-22T10:00:00.000Z"
}
```

### 2. List Stages
```bash
curl http://localhost:3004/api/deals-pipeline/stages
```

### 3. Get Pipeline Board
```bash
curl http://localhost:3004/api/deals-pipeline/pipeline/board
```

Expected response:
```json
{
  "stages": [],
  "leads": [],
  "leadsByStage": {}
}
```

### 4. Create a Lead
```bash
curl -X POST http://localhost:3004/api/deals-pipeline/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "company": "Test Company",
    "value": 50000,
    "stage": "new",
    "status": "active"
  }'
```

## Troubleshooting

### Server won't start

**Error: "Cannot find module 'express'"**
```bash
# Install dependencies
npm install
```

**Error: "EADDRINUSE: address already in use ::3004"**
```bash
# Port is already in use, try different port
PORT=4000 npm run dev

# Or kill the process using port 3004
lsof -ti:3004 | xargs kill -9
```

### Database connection fails

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If using Docker, start container
docker start lad-dev-postgres

# Check Docker logs
docker logs lad-dev-postgres
```

**Error: "database 'lad_dev_mock' does not exist"**
```bash
# Create database
createdb lad_dev_mock

# Or using Docker
docker exec -it lad-dev-postgres psql -U postgres -c "CREATE DATABASE lad_dev_mock;"
```

### Module not found errors

**Error: "Cannot find module '../shared/database/connection'"**
```bash
# Check file structure
ls -la backend/shared/database/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Validation fails

```bash
# Run validation to see specific errors
./scripts/validate.sh

# Check file sizes
find backend -name "*.js" -exec wc -l {} + | sort -rn

# Check for cross-feature imports
grep -r "require.*features/" backend --include="*.js"
```

## Docker Compose (Optional)

For easier setup, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: lad_dev_mock
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres-data:
```

Then run:
```bash
docker-compose up
```

## Next Steps

After setup is complete:

1. ✅ Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for API endpoints
2. ✅ Review [contracts/api.md](contracts/api.md) for detailed API docs
3. ✅ Check [contracts/feature-rules.md](contracts/feature-rules.md) for coding standards
4. ✅ Start building!

## Getting Help

- **Setup issues?** Check this guide
- **API questions?** See [contracts/api.md](contracts/api.md)
- **Code questions?** See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Validation errors?** Run `./scripts/validate.sh`

---

**Setup time:** ~5 minutes  
**Requirements:** Node 18+, PostgreSQL 14+  
**Status:** Ready to develop! 🚀
