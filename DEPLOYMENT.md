# Kinso Deployment Guide

## Quick Deploy to Vercel + Neon

### 1. Push to GitHub (Already Done ✅)
```bash
git remote -v
# Should show: https://github.com/HappyLuckyLabs/inbox
```

### 2. Connect to Vercel

**Go to**: https://vercel.com/new

1. Click "Import Project"
2. Select GitHub repository: `HappyLuckyLabs/inbox`
3. Vercel will auto-detect Next.js
4. **Don't deploy yet** - set up environment variables first

### 3. Add Neon Integration

**In Vercel Dashboard**:
1. Go to your project
2. Settings → Integrations → Browse Marketplace
3. Search "Neon"
4. Click "Add Integration"
5. Follow prompts to create Neon database
6. It will automatically set `DATABASE_URL` environment variable

### 4. Set Environment Variables

**In Vercel Dashboard** → Settings → Environment Variables:

Add these secrets:

```
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
NEXTAUTH_SECRET=generate-random-32-char-string
```

**For NEXTAUTH_SECRET**, generate one:
```bash
openssl rand -base64 32
```

### 5. Update Google OAuth Redirect URIs

**Google Cloud Console** → APIs & Services → Credentials:

Add authorized redirect URI:
```
https://your-app.vercel.app/api/auth/gmail/callback
```

### 6. Deploy!

```bash
# Commit any final changes
git add .
git commit -m "Production ready"
git push origin main
```

Vercel will automatically deploy when you push to main!

### 7. Run Database Migration

After first deploy, you need to push the Prisma schema:

**Option A: Via Vercel Dashboard**
1. Go to your project
2. Settings → Environment Variables
3. Add temporary variable: `SHOULD_MIGRATE=true`
4. Redeploy

**Option B: Manually via CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migration
vercel env pull .env.production
npx prisma db push
```

---

## Post-Deployment Checklist

- [ ] Vercel project created
- [ ] Neon integration added
- [ ] Environment variables set
- [ ] Google OAuth redirect URI updated
- [ ] First deployment successful
- [ ] Database schema pushed (`prisma db push`)
- [ ] Test Gmail OAuth connection
- [ ] Test message sync

---

## Environment Variables Reference

### Required
```
DATABASE_URL=postgresql://...              # Auto-set by Neon integration
OPENAI_API_KEY=sk-...                      # OpenAI API key
GOOGLE_CLIENT_ID=...                       # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...                   # Google OAuth client secret
NEXTAUTH_SECRET=...                        # Random 32-char string
```

### Optional (for Gmail push notifications)
```
GMAIL_WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/gmail
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_PUBSUB_TOPIC=projects/.../topics/gmail-notifications
```

---

## Updating Schema

When you change `prisma/schema.prisma`:

```bash
# Local development
npx prisma db push

# Production (after deploying code)
# Vercel will auto-run: prisma generate
# Then manually push schema:
npx prisma db push --accept-data-loss  # If safe to reset data
```

---

## Monitoring

### Vercel Dashboard
- Build logs
- Runtime logs
- Function logs

### Neon Dashboard
- Database size
- Connection count
- Query performance

---

## Troubleshooting

### Build fails with "prisma generate" error
**Fix**: Make sure `postinstall` script exists in package.json
```json
"postinstall": "prisma generate"
```

### Database connection fails
**Fix**: Check DATABASE_URL is set in Vercel environment variables

### OAuth redirect mismatch
**Fix**: Update Google Cloud Console with your Vercel domain

### Functions timeout
**Fix**: Vercel free tier has 10s timeout. Upgrade to Pro for 60s.

---

Generated: 2026-01-23
