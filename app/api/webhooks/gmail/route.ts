import { NextRequest, NextResponse } from 'next/server';
import { parseGmailMessage } from '@/lib/gmail/gmail-client';
import { prisma } from '@/lib/prisma';
import { processNewMessage } from '@/lib/processing/message-processor';

/**
 * Gmail Push Notification Webhook
 *
 * Gmail will POST here when new messages arrive (after you set up watch)
 * This allows real-time processing without polling
 *
 * Setup: Call gmail.users.watch() to register this webhook URL
 * Docs: https://developers.google.com/gmail/api/guides/push
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Gmail sends a base64-encoded notification
    const data = body.message?.data;
    if (!data) {
      return NextResponse.json({ error: 'No data in notification' }, { status: 400 });
    }

    // Decode the notification
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString());
    const { emailAddress, historyId } = decoded;

    console.log(`📬 Gmail webhook: New email for ${emailAddress} (history: ${historyId})`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailAddress },
    });

    if (!user) {
      console.warn(`⚠️  User not found for email: ${emailAddress}`);
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    // Check if Gmail is connected
    const connection = await prisma.connectedPlatform.findFirst({
      where: {
        userId: user.id,
        platform: 'gmail',
        isActive: true,
      },
    });

    if (!connection) {
      console.warn(`⚠️  Gmail not connected for user: ${user.id}`);
      return NextResponse.json({ success: true, message: 'Gmail not connected' });
    }

    // Fetch the new messages since last historyId
    // For now, just fetch latest messages (in production, use history API)
    const gmailMessages = await fetchGmailMessages(user.id, 5); // Just fetch last 5

    let processedCount = 0;

    for (const gmailMessage of gmailMessages) {
      try {
        const parsed = parseGmailMessage(gmailMessage);

        // Check if message already exists
        const existing = await prisma.message.findFirst({
          where: {
            userId: user.id,
            platform: 'gmail',
            externalId: parsed.externalId,
          },
        });

        if (existing) {
          console.log(`Skipping existing message: ${parsed.subject?.substring(0, 30)}`);
          continue;
        }

        // Process new message through three-tier system
        const processed = await processNewMessage({
          userId: user.id,
          platform: 'gmail',
          externalId: parsed.externalId,
          threadId: parsed.threadId,
          subject: parsed.subject,
          body: parsed.body,
          snippet: parsed.snippet,
          from: parsed.from.email,
          fromName: parsed.from.name,
          receivedAt: parsed.receivedAt,
          isRead: parsed.isRead,
        });

        processedCount++;
        console.log(
          `✅ Webhook processed: ${parsed.subject?.substring(0, 50) || 'No subject'} ` +
          `(priority: ${processed.priority})`
        );

        // Optionally: send real-time notification to frontend via WebSocket/SSE
        // await notifyFrontend(user.id, processed);

      } catch (error) {
        console.error(`Error processing webhook message:`, error);
        // Continue with next message
      }
    }

    console.log(`✅ Gmail webhook complete: processed ${processedCount} new messages`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
    });

  } catch (error) {
    console.error('Gmail webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}

// Import helper (avoid circular dependency issues)
async function fetchGmailMessages(userId: string, maxResults: number) {
  const { fetchGmailMessages: fetch } = await import('@/lib/gmail/gmail-client');
  return fetch(userId, maxResults);
}
