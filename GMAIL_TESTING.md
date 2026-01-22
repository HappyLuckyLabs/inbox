# Gmail Integration Testing Guide

## What We've Built

Complete Gmail OAuth integration with AI-powered message processing:

✅ **OAuth Flow**: Secure Google OAuth2 with offline access
✅ **Message Syncing**: Fetch and parse Gmail messages
✅ **AI Processing**: Three-tier pipeline (instant save, fast priority, deep analysis)
✅ **UI Integration**: Connect Gmail button with success/error notifications
✅ **Auto-sync**: Background message syncing on connection

## Testing the Integration

### 1. Set Up Google Cloud Credentials

Follow the complete guide in `GMAIL_SETUP.md`:

1. Create Google Cloud project
2. Enable Gmail API
3. Configure OAuth consent screen
4. Create OAuth credentials
5. Add environment variables to `.env`

**Required environment variables:**
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3003/api/auth/gmail/callback"
```

### 2. Start the Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3003`

### 3. Test the OAuth Flow

1. **Navigate to inbox**: http://localhost:3003/inbox
2. **Look for the banner**: "Connect your Gmail" banner at the top
3. **Click "Connect Gmail"** button
4. **OAuth redirect**: You'll be redirected to Google sign-in
5. **Sign in**: Use your Google account
6. **Grant permissions**: Allow Kinso to access your Gmail
7. **Callback**: You'll be redirected back to `/inbox?connected=gmail`
8. **Success notification**: Green toast appears: "Gmail connected successfully!"
9. **Messages sync**: Your real Gmail messages appear in the inbox

### 4. Verify Message Processing

Check the console logs to see the AI pipeline in action:

```bash
# You should see:
🔄 Syncing Gmail for user xxx...
✅ Gmail sync complete: 50 new, 0 updated

# Three-tier processing logs:
⚡ [Tier 1] Message saved instantly
⚡ [Tier 2] Priority calculated
📊 [Tier 3] Queuing deep analysis jobs
```

### 5. Check Database

Messages are stored in the database:

```bash
npx prisma studio
```

Navigate to:
- **Message**: See all synced Gmail messages
- **ConnectedPlatform**: See OAuth tokens
- **TodoItem**: See extracted action items
- **ConversationTopic**: See identified topics

### 6. View AI Features

After messages sync, check the AI-powered features:

**Todos**: http://localhost:3003/inbox/todos
- Automatically extracted action items from emails
- "Reply to client by Friday"
- "Review the contract before meeting"

**Topics**: http://localhost:3003/inbox/topics
- Identified conversation threads
- "Q1 Budget Planning"
- "API Integration Discussion"

**Goals**: http://localhost:3003/inbox/goals
- Long-term objectives extracted from emails

## How It Works

### OAuth Flow

```
User clicks "Connect Gmail"
         ↓
GET /api/auth/gmail/url
  → Returns Google OAuth URL
         ↓
Redirect to Google
  → User signs in & grants permissions
         ↓
Google redirects to /api/auth/gmail/callback?code=xxx
         ↓
Exchange code for tokens
  → Store in ConnectedPlatform table
         ↓
Trigger /api/gmail/sync
  → Fetch messages in background
         ↓
Success! User sees messages
```

### Message Processing Pipeline

**Tier 1 (< 50ms)**: Instant save to database
```typescript
const message = await prisma.message.create({ ... });
```

**Tier 2 (< 500ms)**: Calculate priority
```typescript
const priority = await calculatePriorityScore({
  from, subject, body, platform, receivedAt
});
// Scores 0-100 based on:
// - Contact importance
// - Platform weight
// - Keyword matching
// - Urgency heuristics
// - Recency boost
// - AI-learned patterns
```

**Tier 3 (async background)**: Deep AI analysis
```typescript
jobQueue.enqueue({ type: 'extract_todos', messageId });
jobQueue.enqueue({ type: 'extract_topics', messageId });
jobQueue.enqueue({ type: 'extract_goals', messageId });
jobQueue.enqueue({ type: 'generate_embedding', messageId });
```

## API Routes Created

**OAuth & Connection:**
- `POST /api/auth/gmail/url` - Generate OAuth URL
- `GET /api/auth/gmail/callback` - Handle OAuth callback
- `POST /api/users/get-or-create` - Get/create user

**Message Syncing:**
- `POST /api/gmail/sync` - Sync Gmail messages
- `POST /api/messages/list` - List all messages

**AI Features:**
- `POST /api/todos/list` - Get extracted todos
- `POST /api/topics/list` - Get conversation topics
- `POST /api/goals/list` - Get identified goals

## Key Files

**Gmail Client Library:**
- `lib/gmail/gmail-client.ts` - OAuth & message fetching

**API Routes:**
- `app/api/auth/gmail/callback/route.ts` - OAuth callback
- `app/api/gmail/sync/route.ts` - Message syncing
- `app/api/auth/gmail/url/route.ts` - Generate auth URL

**UI Components:**
- `app/inbox/page.tsx` - Main inbox with Connect Gmail button

**AI Processing:**
- `lib/processing/message-processor.ts` - Three-tier pipeline
- `lib/queue/job-queue.ts` - Background jobs
- `lib/ai/extract-todos.ts` - Extract action items
- `lib/ai/extract-topics.ts` - Identify topics

## Troubleshooting

### "redirect_uri_mismatch"
- Check that `GOOGLE_REDIRECT_URI` in `.env` exactly matches the one in Google Cloud Console
- Must include port: `http://localhost:3003/api/auth/gmail/callback`

### "Gmail not connected" error
- Ensure tokens were saved to ConnectedPlatform table
- Check database with `npx prisma studio`

### No messages appearing
- Check console for sync errors
- Verify OpenAI API key is set (`OPENAI_API_KEY`)
- Check that Gmail has messages in inbox

### "Unexpected end of JSON input"
- This happens when API returns empty response
- Fixed by checking for empty messages array in `/api/messages/list`

## Next Steps

Once basic integration works:

1. **Background Sync**: Add cron job to sync new messages every 5 minutes
   ```typescript
   // app/api/cron/gmail-sync/route.ts
   export async function GET(request: Request) {
     // Verify CRON_SECRET
     // Sync for all connected users
   }
   ```

2. **Webhook Push Notifications**: Real-time updates via Gmail push
   ```typescript
   // Watch for new messages instead of polling
   gmail.users.watch({ userId: 'me', ... });
   ```

3. **Smart Replies**: AI-generated response suggestions
   ```typescript
   const replies = await generateSmartReplies(message);
   ```

4. **Send Emails**: Allow users to send via Kinso
   ```typescript
   await sendGmailMessage(userId, to, subject, body);
   ```

5. **Multiple Accounts**: Support multiple Gmail accounts per user
   ```typescript
   // Add accountName to ConnectedPlatform
   // "Work Gmail", "Personal Gmail"
   ```

## Security Notes

- **Tokens are encrypted**: Access tokens stored securely in database
- **Refresh tokens**: Automatically refresh when access token expires
- **No password storage**: OAuth users don't need passwords
- **Scopes**: Only request necessary Gmail permissions
- **HTTPS required**: Production must use HTTPS, not HTTP

## Success Criteria

✅ User can click "Connect Gmail"
✅ OAuth flow completes without errors
✅ Messages appear in inbox
✅ AI processing runs (check todos/topics pages)
✅ Priority scores calculated
✅ No console errors

## Demo Video Script

1. Show mock data inbox
2. Click "Connect Gmail" button
3. Sign in with Google
4. Grant permissions
5. Redirect back to inbox
6. Real Gmail messages appear!
7. Navigate to Todos - see extracted action items
8. Navigate to Topics - see conversation threads
9. Show Prisma Studio - data in database

🎉 **You now have a working Gmail integration with AI-powered message intelligence!**
