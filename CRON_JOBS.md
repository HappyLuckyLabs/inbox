# Cron Jobs Documentation

Kinso uses Vercel Cron Jobs to run automated background tasks for AI personalization and learning.

## Configured Cron Jobs

### 1. Daily Summary Generation
- **Path**: `/api/cron/daily-summary`
- **Schedule**: `0 6 * * *` (Every day at 6:00 AM)
- **Purpose**: Generates personalized daily inbox summaries for all users
- **What it does**:
  - Fetches today's messages for each user
  - Gathers conversation topics and pending todos
  - Calls OpenAI to generate a personalized summary
  - Saves summary to database for display in inbox

### 2. Preference Learning
- **Path**: `/api/cron/learning`
- **Schedule**: `0 2 * * *` (Every day at 2:00 AM)
- **Purpose**: Runs incremental learning to update user preferences
- **What it does**:
  - Analyzes last 7 days of interactions for each user
  - Learns from read patterns (messages read quickly = important)
  - Learns from reply patterns (frequently replied contacts = important)
  - Learns from priority overrides (manual adjustments)
  - Updates contact importance, keyword weights, platform preferences
  - Runs AI pattern discovery to find complex patterns

### 3. Topic Extraction
- **Path**: `/api/cron/topics`
- **Schedule**: `0 */6 * * *` (Every 6 hours)
- **Purpose**: Extracts conversation topics from recent messages
- **What it does**:
  - Gets last 24 hours of messages
  - Groups messages by contact (conversation threads)
  - Uses AI to identify topics, categories, and action items
  - Creates or updates conversation topics in database
  - Links topics to related contacts

## Setup Instructions

### For Vercel Deployment

1. **Set Environment Variable**:
   ```bash
   # Generate a secure secret
   openssl rand -base64 32

   # Add to Vercel environment variables
   vercel env add CRON_SECRET production
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Verify Cron Jobs**:
   - Go to Vercel Dashboard → Your Project → Settings → Crons
   - You should see all 3 cron jobs listed
   - Check "Recent Executions" to verify they're running

### For Local Development

Vercel cron jobs only work in production. For local testing:

1. **Manual Trigger**:
   ```bash
   # Generate daily summary
   curl -X GET http://localhost:3000/api/cron/daily-summary \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

   # Run learning
   curl -X GET http://localhost:3000/api/cron/learning \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

   # Extract topics
   curl -X GET http://localhost:3000/api/cron/topics \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Alternative: node-cron**:
   If you need scheduled execution locally, install node-cron:
   ```bash
   npm install node-cron @types/node-cron
   ```

   Create `lib/cron/scheduler.ts`:
   ```typescript
   import cron from 'node-cron';

   export function startCronJobs() {
     // Daily summary at 6 AM
     cron.schedule('0 6 * * *', async () => {
       console.log('[Cron] Running daily summary');
       // Call your cron endpoints internally
     });

     // Learning at 2 AM
     cron.schedule('0 2 * * *', async () => {
       console.log('[Cron] Running learning');
     });

     // Topics every 6 hours
     cron.schedule('0 */6 * * *', async () => {
       console.log('[Cron] Extracting topics');
     });
   }
   ```

## Security

- All cron endpoints check for `Authorization: Bearer ${CRON_SECRET}` header
- Returns 401 Unauthorized if secret doesn't match
- Never expose CRON_SECRET in client code
- Rotate CRON_SECRET if compromised

## Monitoring

### Check Cron Execution Logs

1. **Vercel Dashboard**:
   - Project → Deployments → Select deployment → Functions
   - View logs for each cron function

2. **Manual Check**:
   ```bash
   # Check if summaries are being generated
   SELECT * FROM DailySummary ORDER BY createdAt DESC LIMIT 10;

   # Check learning runs
   SELECT userId, lastLearningRun, samplesAnalyzed
   FROM UserPreference
   WHERE lastLearningRun IS NOT NULL;

   # Check topics
   SELECT * FROM ConversationTopic
   WHERE isActive = true
   ORDER BY lastMentioned DESC;
   ```

## Cost Optimization

- **Daily Summary**: Uses gpt-4o (~$0.005/summary)
  - 100 users = $0.50/day = ~$15/month
- **Learning**: Uses gpt-4o only when > 50 interactions
  - 100 users × 50% eligible = $2.50/day = ~$75/month
- **Topics**: Uses gpt-4o-mini (~$0.0001/extraction)
  - 100 users × 5 topics/day = $0.05/day = ~$1.50/month

**Total**: ~$92/month for 100 users = ~$0.92/user/month

### Reduce Costs

1. **Cache aggressively**: Don't regenerate if content hasn't changed
2. **Sample users**: Run expensive operations on subset of users
3. **Conditional execution**: Skip learning if < X interactions
4. **Use gpt-4o-mini**: For non-critical tasks
5. **Batch processing**: Group similar operations

## Troubleshooting

### Cron not executing
- Check CRON_SECRET is set in Vercel environment
- Verify cron schedule syntax in vercel.json
- Check function logs for errors
- Ensure functions complete within 10s (Hobby plan limit)

### High costs
- Check OpenAI usage at https://platform.openai.com/usage
- Add more aggressive caching
- Reduce frequency of expensive operations
- Use gpt-4o-mini for suitable tasks

### Missing data
- Verify database has sufficient data (messages, interactions)
- Check minimum thresholds (10 interactions, 2 messages, etc.)
- Look for errors in function logs
