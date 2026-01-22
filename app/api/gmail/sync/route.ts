import { NextRequest, NextResponse } from 'next/server';
import { fetchGmailMessages, parseGmailMessage } from '@/lib/gmail/gmail-client';
import { prisma } from '@/lib/prisma';
import { processNewMessage } from '@/lib/processing/message-processor';

export async function POST(request: NextRequest) {
  try {
    const { userId, maxResults = 50 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if user has Gmail connected
    const connection = await prisma.connectedPlatform.findFirst({
      where: {
        userId,
        platform: 'gmail',
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    console.log(`🔄 Syncing Gmail for user ${userId}...`);

    // Fetch Gmail messages
    const gmailMessages = await fetchGmailMessages(userId, maxResults);

    let newCount = 0;
    let updatedCount = 0;

    for (const gmailMessage of gmailMessages) {
      try {
        const parsed = parseGmailMessage(gmailMessage);

        // Check if message already exists
        const existing = await prisma.message.findFirst({
          where: {
            userId,
            platform: 'gmail',
            externalId: parsed.externalId,
          },
        });

        if (existing) {
          console.log(`Skipping existing message: ${parsed.subject?.substring(0, 30)}`);
          // Update if read status changed
          if (existing.isRead !== parsed.isRead) {
            await prisma.message.update({
              where: { id: existing.id },
              data: { isRead: parsed.isRead },
            });
            updatedCount++;
          }
          continue;
        }

        // Use the three-tier processing system
        // This handles: instant save, priority scoring, and background AI jobs
        const processed = await processNewMessage({
          userId,
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

        newCount++;
        console.log(
          `✅ Processed message: ${parsed.subject?.substring(0, 50) || 'No subject'} ` +
          `(priority: ${processed.priority})`
        );
      } catch (error) {
        console.error(`Error processing message:`, error);
        // Continue with next message
      }
    }

    console.log(`✅ Gmail sync complete: ${newCount} new, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      synced: gmailMessages.length,
      new: newCount,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
