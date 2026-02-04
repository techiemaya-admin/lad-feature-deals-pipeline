# Universal LAD Feature Development Server

## Overview
This `server.js` is a **reusable development server** designed to work across all LAD feature repositories. It automatically detects your feature and loads the appropriate routes.

## Features
- ✅ **Auto-detection**: Reads feature name from `package.json`
- ✅ **Dynamic routing**: Loads feature routes automatically
- ✅ **Database authentication**: Real user authentication with token store
- ✅ **Multi-tenancy**: Full tenant context in all requests
- ✅ **CORS enabled**: Ready for frontend development
- ✅ **File uploads**: Static file serving configured
- ✅ **LAD compliant**: Follows LAD architecture patterns

## How to Use in Any Feature Repo

### 1. Copy Files
Copy these files to your feature repo root:
```bash
server.js
backend/shared/database/connection.js
backend/shared/utils/logger.js
backend/shared/utils/schemaHelper.js
```

### 2. Directory Structure
Ensure your feature follows this structure:
```
your-feature-repo/
├── server.js                          # This universal server
├── package.json                       # Must include "lad-feature-FEATURENAME"
├── .env                              # Database and config
└── backend/
    ├── shared/
    │   ├── database/
    │   │   └── connection.js
    │   └── utils/
    │       ├── logger.js
    │       └── schemaHelper.js
    └── features/
        └── YOUR-FEATURE/              # Auto-detected from package.json
            ├── routes.js or routes/index.js
            ├── controllers/
            ├── services/
            └── repositories/
```

### 3. Package.json Naming
Your `package.json` name must follow the pattern:
```json
{
  "name": "lad-feature-YOUR-FEATURE-NAME",
  "version": "1.0.0"
}
```

The server will extract `YOUR-FEATURE-NAME` and:
- Load routes from `./backend/features/YOUR-FEATURE-NAME/routes`
- Expose API at `/api/YOUR-FEATURE-NAME/*`

### 4. Environment Variables
Create a `.env` file:
```env
NODE_ENV=development
PORT=3004
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=lad_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_SCHEMA=lad_dev

# Optional overrides
FEATURE_NAME=your-feature      # Override auto-detection
FEATURE_PATH=./backend/features/your-feature  # Override feature path
```

### 5. Run the Server
```bash
npm run dev
# or
node server.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with database user (email/password)
- `POST /api/auth/dev-login` - Quick dev login (no auth required)
- `GET /api/auth/me` - Get current user (requires Bearer token)
- `POST /api/auth/logout` - Logout

### Feature Routes
- `GET /health` - Health check with feature name
- `/api/YOUR-FEATURE/*` - Your feature routes (auto-loaded)
- `/uploads/*` - Static file serving

## Examples

### Example 1: Deals Pipeline Feature
```json
// package.json
{
  "name": "lad-feature-deals-pipeline"
}
```
- Routes loaded from: `./backend/features/deals-pipeline/routes`
- API available at: `/api/deals-pipeline/*`

### Example 2: Voice Agent Feature
```json
// package.json
{
  "name": "lad-feature-voice-agent"
}
```
- Routes loaded from: `./backend/features/voice-agent/routes`
- API available at: `/api/voice-agent/*`

### Example 3: Apollo Leads Feature
```json
// package.json
{
  "name": "lad-feature-apollo-leads"
}
```
- Routes loaded from: `./backend/features/apollo-leads/routes`
- API available at: `/api/apollo-leads/*`

## Authentication Flow

### 1. Login
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Response:
```json
{
  "success": true,
  "token": "Bearer dev-token-1234567890",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "user",
    "tenant_id": "tenant-uuid",
    "role": "admin"
  }
}
```

### 2. Use Token
```bash
curl http://localhost:3004/api/YOUR-FEATURE/endpoint \
  -H "Authorization: Bearer dev-token-1234567890"
```

## Customization

### Override Feature Name
```bash
FEATURE_NAME=my-custom-feature npm run dev
```

### Override Feature Path
```bash
FEATURE_PATH=./custom/path/to/feature npm run dev
```

### Change Port
```bash
PORT=5000 npm run dev
```

## Development vs Production

### Development (this server)
- In-memory token store
- Any password accepted (dev mode)
- CORS allows all origins
- Detailed error logging

### Production (main LAD backend)
- CoreApplication architecture
- Redis token store
- JWT with Secret Manager
- Password hashing with bcrypt
- Restricted CORS
- Feature flags
- Notification listeners

## Troubleshooting

### Routes not loading?
Check:
1. Feature name in `package.json` matches directory: `lad-feature-XXXXX`
2. Routes file exists: `./backend/features/XXXXX/routes.js` or `./backend/features/XXXXX/routes/index.js`
3. Routes file exports Express router

### Database connection failed?
Check:
1. `.env` has correct `POSTGRES_*` variables
2. PostgreSQL is running
3. Database and schema exist
4. User has correct permissions

### Authentication not working?
Check:
1. Token format: `Authorization: Bearer dev-token-XXXXX`
2. User exists in database: `SELECT * FROM lad_dev.users WHERE email = 'your@email.com'`
3. User has `tenant_id` set

## Integration Checklist

Before pushing to main LAD backend:
- [ ] Feature routes follow LAD architecture (Repository → Service → Controller)
- [ ] All SQL queries include `tenant_id` filtering
- [ ] No SQL in controllers (only in repositories)
- [ ] All endpoints require authentication
- [ ] Feature has `index.js` and `manifest.js`
- [ ] Tested with real database data
- [ ] No hardcoded tenant IDs or user IDs

## Support

For issues with this universal server, check:
1. This README
2. LAD Architecture documentation
3. Feature-specific README in your feature repo
