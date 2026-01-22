import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractConversationTopic } from '@/lib/ai/topic-extraction';

/**
 * Vercel Cron: Extract conversation topics
 * Runs every 6 hours
 */
export async function GET(request: NextRequest) {
  // Verify this is a valid Vercel Cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting topic extraction');

    // Get all active users
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    const results = {
      total: users.length,
      topicsExtracted: 0,
      errors: 0,
    };

    for (const user of users) {
      try {
        const extracted = await extractTopicsForUser(user.id);
        results.topicsExtracted += extracted;
      } catch (error) {
        console.error(`[Cron] Failed to extract topics for user ${user.id}:`, error);
        results.errors++;
      }
    }

    console.log('[Cron] Topic extraction complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Topic extraction complete',
      results,
    });
  } catch (error) {
    console.error('[Cron] Error extracting topics:', error);
    return NextResponse.json(
      { error: 'Failed to extract topics' },
      { status: 500 }
    );
  }
}

/**
 * Extract topics for a user
 */
async function extractTopicsForUser(userId: string): Promise<number> {
  // Get recent messages grouped by contact
  const recentMessages = await prisma.message.findMany({
    where: {
      userId,
      receivedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    },
    include: {
      fromContact: true,
    },
    orderBy: { receivedAt: 'desc' },
  });

  if (recentMessages.length === 0) {
    return 0;
  }

  // Group messages by contact
  const messagesByContact: Record<string, any[]> = {};
  recentMessages.forEach(msg => {
    const contactId = msg.fromContactId || 'unknown';
    if (!messagesByContact[contactId]) {
      messagesByContact[contactId] = [];
    }
    messagesByContact[contactId].push(msg);
  });

  let topicsExtracted = 0;

  // Extract topics for each conversation
  for (const [contactId, messages] of Object.entries(messagesByContact)) {
    if (messages.length < 2) continue; // Need multiple messages for conversation

    const messagesForAnalysis = messages.map(m => ({
      from: m.fromContact?.name || m.from || 'Unknown',
      body: m.body,
      subject: m.subject,
    }));

    const topic = await extractConversationTopic(messagesForAnalysis);

    if (topic && topic.importance > 5) {
      // Check if topic already exists
      const existingTopic = await prisma.conversationTopic.findFirst({
        where: {
          userId,
          name: topic.name,
        },
      });

      if (existingTopic) {
        // Update existing topic
        await prisma.conversationTopic.update({
          where: { id: existingTopic.id },
          data: {
            lastActivityAt: new Date(),
            importance: Math.max(existingTopic.importance, topic.importance || 5),
            messageCount: { increment: messages.length },
          },
        });
      } else {
        // Create new topic
        await prisma.conversationTopic.create({
          data: {
            userId,
            name: topic.name,
            description: topic.description,
            category: topic.category || 'general',
            importance: topic.importance || 5,
            participantIds: JSON.stringify([contactId]),
            lastActivityAt: new Date(),
            messageCount: messages.length,
          },
        });

        topicsExtracted++;
      }
    }
  }

  return topicsExtracted;
}
