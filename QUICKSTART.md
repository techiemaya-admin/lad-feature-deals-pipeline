# Quick Start Guide - Follow-Up Calls System

Get the follow-up call system running in 5 minutes.

## Prerequisites

- PostgreSQL database
- GCP project with Cloud Tasks API enabled
- Node.js and npm
- Existing voice-agent feature running

## Step 1: Install Dependencies (1 min)

```bash
cd backend/features/deals-pipeline
npm install
```

## Step 2: Database Migration (1 min)

```bash
# Connect to your database
psql -d your_database_name -U your_username

# Run migration
\i migrations/001_add_followup_task_columns.sql

# Verify columns added
\d lead_bookings

# Should see new columns:
# - task_name
# - task_scheduled_at
# - task_status
# - executed_at
# - execution_attempts
# - last_execution_error
# - idempotency_key
```

## Step 3: Create Cloud Tasks Queue (1 min)

```bash
# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# Create queue
gcloud tasks queues create follow-up-calls \
  --location=us-central1 \
  --max-attempts=5 \
  --max-retry-duration=1h \
  --max-concurrent-dispatches=100

# Verify queue created
gcloud tasks queues describe follow-up-calls --location=us-central1
```

## Step 4: Configure Environment (1 min)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimum required:**
```bash
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
FOLLOWUP_EXECUTION_ENDPOINT=https://your-api.com/api/deals-pipeline/bookings/execute-followup
CLOUD_TASKS_SECRET=generate-random-secret-here
VOICE_AGENT_BASE_URL=http://localhost:3000
```

**Generate secret:**
```bash
# Generate a random secret
openssl rand -base64 32
# Copy output to CLOUD_TASKS_SECRET
```

## Step 5: Register Routes (1 min)

Add to your main `app.js` or `server.js`:

```javascript
// Import deals-pipeline feature
const { setupBookingsRoutes } = require('./features/deals-pipeline');

// Register routes
app.use('/api/deals-pipeline/bookings', setupBookingsRoutes(db));

console.log('Follow-up calls system initialized');
```

## Step 6: Test (1 min)

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

### Test 2: Manual Execution (simulates Cloud Tasks)
```bash
curl -X POST http://localhost:3000/api/deals-pipeline/bookings/test-123/execute-followup \
  -H "X-CloudTasks-Secret: your-secret-from-env" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "bookingId": "test-123",
    "leadId": "test-lead",
    "idempotencyKey": "followup:test-tenant:test-123:2026-01-05T10:00:00Z"
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Booking not found or tenant mismatch"
}
```
(This is expected since test-123 doesn't exist. It means authentication worked!)

### Test 3: Create Real Booking with Follow-Up

```javascript
// In your bookings creation code
const { FollowUpSchedulerService } = require('./features/deals-pipeline');
const scheduler = new FollowUpSchedulerService(db);

// After creating a booking
const booking = await createBooking({
  tenantId: 'tenant-123',
  leadId: 'lead-456',
  assignedUserId: 'user-789',
  scheduledAt: new Date('2026-01-10T14:00:00Z'),
  bookingType: 'follow-up',
  status: 'scheduled'
});

// Schedule follow-up call
const result = await scheduler.scheduleFollowUpCall({
  tenantId: 'tenant-123',
  bookingId: booking.id,
  leadId: booking.lead_id,
  assignedUserId: booking.assigned_user_id,
  scheduledAt: booking.scheduled_at,
  bookingType: booking.booking_type,
  schema: 'lad_dev'
});

console.log('Follow-up scheduled:', result);
// {
//   success: true,
//   scheduled: true,
//   taskName: 'projects/.../tasks/...',
//   scheduleTime: '2026-01-10T14:00:00.000Z'
// }
```

## Verification Checklist

- [ ] Database columns added successfully
- [ ] Cloud Tasks queue created
- [ ] Environment variables set
- [ ] Routes registered in app
- [ ] Manual execution endpoint responds (even with error is OK)
- [ ] Logs show proper structured logging (no console.log)
- [ ] GCP Cloud Tasks dashboard shows queue

## View Cloud Tasks

```bash
# List tasks in queue
gcloud tasks list --queue=follow-up-calls --location=us-central1

# View task details
gcloud tasks describe TASK_NAME --queue=follow-up-calls --location=us-central1
```

## Troubleshooting

### "Queue not found"
```bash
# Check queue exists
gcloud tasks queues list --location=us-central1

# If not found, create it (see Step 3)
```

### "Unauthorized" on execution endpoint
```bash
# Verify secret matches
echo $CLOUD_TASKS_SECRET

# Test with correct secret
curl -H "X-CloudTasks-Secret: $CLOUD_TASKS_SECRET" ...
```

### "Database error"
```bash
# Verify migration ran
psql -d your_db -c "SELECT task_status FROM lead_bookings LIMIT 1;"

# If error, run migration (see Step 2)
```

### Task not executing
```bash
# Check execution endpoint is publicly accessible
curl -I https://your-api.com/api/deals-pipeline/bookings/test/execute-followup

# Should return 401 Unauthorized (good!)
# If timeout or connection error, check firewall/load balancer
```

### Voice agent not called
```bash
# Check voice agent is running
curl http://localhost:3000/health

# Check VOICE_AGENT_BASE_URL is correct
echo $VOICE_AGENT_BASE_URL

# Check logs for voice agent errors
tail -f logs/app.log | grep "voice agent"
```

## Next Steps

1. **Integrate with existing bookings service** - See `examples/bookingsServiceIntegration.js`
2. **Set up monitoring** - Configure alerts for failed tasks
3. **Test end-to-end** - Create booking → verify task scheduled → wait for execution
4. **Configure production OIDC** - Replace shared secret with OIDC token validation

## Support

- 📖 Full documentation: [README.md](README.md)
- 🏗️ Architecture details: [ARCHITECTURE_COMPLIANCE.md](ARCHITECTURE_COMPLIANCE.md)
- 📝 Implementation notes: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- 💡 Integration example: [examples/bookingsServiceIntegration.js](examples/bookingsServiceIntegration.js)

## Production Checklist

Before deploying to production:

- [ ] Use OIDC authentication instead of shared secret
- [ ] Set up monitoring and alerts
- [ ] Configure proper retry limits
- [ ] Test failover scenarios
- [ ] Document runbook procedures
- [ ] Set up log aggregation
- [ ] Configure backup queue (optional)
- [ ] Load test with expected volume

---

**Time to complete:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Database, GCP account, Node.js
