import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/gmail/gmail-client';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId passed in state
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/inbox?error=${encodeURIComponent('Gmail connection failed')}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/inbox?error=missing_params', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user info from Gmail
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const gmailEmail = userInfo.data.email;
    const gmailName = userInfo.data.name;

    if (!gmailEmail) {
      throw new Error('Could not get user email from Gmail');
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email: gmailEmail },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: gmailEmail,
          name: gmailName || gmailEmail.split('@')[0],
          password: '', // No password for OAuth users
        },
      });
    }

    // Check if Gmail connection already exists
    let connection = await prisma.connectedPlatform.findFirst({
      where: {
        userId: user.id,
        platform: 'gmail',
      },
    });

    if (connection) {
      // Update existing connection
      await prisma.connectedPlatform.update({
        where: { id: connection.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || connection.refreshToken, // Keep old refresh token if not provided
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          platformUserId: userInfo.data.id || null,
          platformUsername: gmailEmail,
        },
      });
    } else {
      // Create new connection
      connection = await prisma.connectedPlatform.create({
        data: {
          userId: user.id,
          platform: 'gmail',
          accountId: userInfo.data.id || gmailEmail, // Use email as fallback
          accountName: gmailName || gmailEmail,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          platformUserId: userInfo.data.id || null,
          platformUsername: gmailEmail,
        },
      });
    }

    console.log(`✅ Gmail connected for user: ${user.email}`);

    // Trigger initial sync in background (don't wait for it)
    fetch(`${request.nextUrl.origin}/api/gmail/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    }).catch(err => console.error('Background sync error:', err));

    // Redirect to inbox with success message
    return NextResponse.redirect(
      new URL('/inbox?connected=gmail', request.url)
    );
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/inbox?error=${encodeURIComponent('Failed to connect Gmail')}`, request.url)
    );
  }
}
