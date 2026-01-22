# Gmail Integration Setup Guide

Complete guide to setting up Gmail OAuth2 integration for Kinso.

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: "Kinso"
   - Click "Create"

3. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to: APIs & Services → OAuth consent screen

2. **Choose User Type**
   - Select "External" (for testing with any Google account)
   - Click "Create"

3. **Fill App Information**
   - App name: `Kinso`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"

4. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` - Read emails
     - `https://www.googleapis.com/auth/gmail.send` - Send emails
     - `https://www.googleapis.com/auth/gmail.modify` - Mark as read, archive, etc.
     - `https://www.googleapis.com/auth/userinfo.profile` - Get user profile
     - `https://www.googleapis.com/auth/userinfo.email` - Get user email
   - Click "Update" → "Save and Continue"

5. **Add Test Users** (for External apps in testing)
   - Add your Gmail address
   - Click "Save and Continue"

## Step 3: Create OAuth Credentials

1. **Go to Credentials**
   - Navigate to: APIs & Services → Credentials

2. **Create OAuth Client ID**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Kinso Web Client"

3. **Configure Authorized URLs**
   - Authorized JavaScript origins:
     - `http://localhost:3003`
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3003/api/auth/gmail/callback`
     - `http://localhost:3000/api/auth/gmail/callback`
   - Click "Create"

4. **Save Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Click "OK"

## Step 4: Add to Environment Variables

1. **Update `.env` file**:
   ```bash
   # Gmail OAuth
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3003/api/auth/gmail/callback"
   ```

2. **Update `.env.example`**:
   ```bash
   # Gmail OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3003/api/auth/gmail/callback"
   ```

## Step 5: Install Dependencies

```bash
npm install googleapis @google-cloud/local-auth
```

## Step 6: Test the Integration

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Connect Gmail**:
   - Go to: http://localhost:3003/inbox
   - Click "Connect Gmail" button
   - Sign in with Google
   - Grant permissions
   - You'll be redirected back with messages!

## OAuth Flow Diagram

```
User clicks "Connect Gmail"
         ↓
Redirect to Google OAuth
         ↓
User signs in & grants permissions
         ↓
Google redirects to /api/auth/gmail/callback
         ↓
Exchange code for access token
         ↓
Store tokens in database
         ↓
Fetch user's Gmail messages
         ↓
Process through AI pipeline
         ↓
Display in inbox!
```

## Scopes Explained

- **gmail.readonly**: Read email messages and settings
- **gmail.send**: Send email on user's behalf
- **gmail.modify**: Mark as read, archive, star, etc.
- **userinfo.profile**: Get user's name and profile picture
- **userinfo.email**: Get user's email address

## Security Notes

1. **Never commit credentials**
   - `.env` is in `.gitignore`
   - Always use environment variables

2. **Token Storage**
   - Access tokens expire after 1 hour
   - Refresh tokens allow getting new access tokens
   - Store encrypted in database

3. **Production Setup**
   - Submit app for OAuth verification
   - Use proper domain (not localhost)
   - Implement token rotation
   - Add rate limiting

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that redirect URI in Google Cloud matches exactly
- Include both http://localhost:3000 and :3003

### Error: "invalid_grant"
- Refresh token expired or revoked
- User needs to re-authenticate

### Error: "insufficient_permissions"
- Check that all required scopes are added
- User needs to re-grant permissions

## Rate Limits

**Gmail API Quotas** (Free tier):
- 1 billion quota units per day
- Read: 5 units per request
- Send: 100 units per request
- Typical usage: ~250,000 API calls/day

**Best Practices**:
- Use batch requests when possible
- Implement exponential backoff
- Cache responses
- Use webhooks (push notifications) for real-time updates

## Next Steps

After basic integration works:
1. Add background sync (fetch new messages every 5 min)
2. Implement webhook push notifications
3. Add batch operations
4. Support multiple Gmail accounts
5. Add other platforms (Outlook, Slack, etc.)

## References

- Gmail API Docs: https://developers.google.com/gmail/api
- OAuth 2.0 Guide: https://developers.google.com/identity/protocols/oauth2
- Node.js Quickstart: https://developers.google.com/gmail/api/quickstart/nodejs
