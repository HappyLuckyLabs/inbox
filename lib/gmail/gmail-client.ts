import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Generate Gmail OAuth URL
 */
export function getGmailAuthUrl(userId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: scopes,
    state: userId, // Pass userId to identify user after callback
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get authenticated Gmail client for a user
 */
export async function getGmailClient(userId: string) {
  // Get user's connected platform
  const connection = await prisma.connectedPlatform.findFirst({
    where: {
      userId,
      platform: 'gmail',
      isActive: true,
    },
  });

  if (!connection || !connection.accessToken) {
    throw new Error('Gmail not connected');
  }

  // Set credentials
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken || undefined,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Update refresh token if new one received
      await prisma.connectedPlatform.update({
        where: { id: connection.id },
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    } else if (tokens.access_token) {
      // Update just access token
      await prisma.connectedPlatform.update({
        where: { id: connection.id },
        data: {
          accessToken: tokens.access_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch Gmail messages
 */
export async function fetchGmailMessages(
  userId: string,
  maxResults: number = 50
) {
  const gmail = await getGmailClient(userId);

  // Get message list
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'in:inbox', // Only inbox messages
  });

  const messages = response.data.messages || [];
  const fullMessages = [];

  // Fetch full message details
  for (const message of messages) {
    try {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });

      fullMessages.push(fullMessage.data);
    } catch (error) {
      console.error(`Error fetching message ${message.id}:`, error);
    }
  }

  return fullMessages;
}

/**
 * Parse Gmail message to our format
 */
export function parseGmailMessage(gmailMessage: any) {
  const headers = gmailMessage.payload?.headers || [];

  const getHeader = (name: string) => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const from = getHeader('From');
  const subject = getHeader('Subject');
  const date = getHeader('Date');

  // Extract email and name from "Name <email@example.com>" format
  const fromMatch = from.match(/(.*?)\s*<(.+?)>/) || [null, from, from];
  const fromName = fromMatch[1]?.trim() || fromMatch[2];
  const fromEmail = fromMatch[2]?.trim() || from;

  // Get message body
  let body = '';

  const getBody = (part: any): string => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf-8');
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        const result = getBody(subPart);
        if (result) return result;
      }
    }

    return '';
  };

  if (gmailMessage.payload) {
    body = getBody(gmailMessage.payload);
  }

  // Create snippet if body is long
  const snippet = body.length > 200
    ? body.substring(0, 200) + '...'
    : body;

  return {
    externalId: gmailMessage.id,
    threadId: gmailMessage.threadId,
    subject: subject || '(No Subject)',
    body: body || snippet || gmailMessage.snippet || '',
    snippet: snippet || gmailMessage.snippet || '',
    from: {
      name: fromName,
      email: fromEmail,
    },
    receivedAt: date ? new Date(date) : new Date(),
    labels: gmailMessage.labelIds || [],
    isRead: !gmailMessage.labelIds?.includes('UNREAD'),
  };
}

/**
 * Mark Gmail message as read
 */
export async function markGmailAsRead(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}

/**
 * Send Gmail message
 */
export async function sendGmailMessage(
  userId: string,
  to: string,
  subject: string,
  body: string
) {
  const gmail = await getGmailClient(userId);

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data;
}
