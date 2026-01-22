import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailySummary } from '@/lib/ai/daily-summary';

/**
 * Vercel Cron: Generate daily summaries for all users
 * Runs at 6 AM daily
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
    console.log('[Cron] Starting daily summary generation');

    // Get all active users
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
    });

    const results = {
      total: users.length,
      succeeded: 0,
      failed: 0,
    };

    for (const user of users) {
      try {
        await generateDailySummaryForUser(user.id, user.name || 'there');
        results.succeeded++;
      } catch (error) {
        console.error(`[Cron] Failed to generate summary for user ${user.id}:`, error);
        results.failed++;
      }
    }

    console.log('[Cron] Daily summary generation complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Daily summaries generated',
      results,
    });
  } catch (error) {
    console.error('[Cron] Error generating daily summaries:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily summaries' },
      { status: 500 }
    );
  }
}

/**
 * Generate daily summary for a user
 */
async function generateDailySummaryForUser(userId: string, userName: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if summary already exists for today
  const existing = await prisma.dailySummary.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  if (existing) {
    console.log(`[Cron] Summary already exists for user ${userId}`);
    return;
  }

  // Get today's messages
  const messages = await prisma.message.findMany({
    where: {
      userId,
      receivedAt: { gte: today },
    },
    include: {
      fromContact: true,
    },
    orderBy: { priority: 'desc' },
  });

  if (messages.length === 0) {
    console.log(`[Cron] No messages for user ${userId}`);
    return;
  }

  // Get today's topics
  const topics = await prisma.conversationTopic.findMany({
    where: {
      userId,
      lastMentioned: { gte: today },
      isActive: true,
    },
    orderBy: { importance: 'desc' },
  });

  // Get pending todos
  const todos = await prisma.todoItem.findMany({
    where: {
      userId,
      status: 'pending',
    },
    orderBy: { priority: 'desc' },
    take: 10,
  });

  // Generate summary
  const messageSummaries = messages.slice(0, 20).map(m => ({
    from: m.fromContact.name,
    subject: m.subject || undefined,
    body: m.body,
    priority: m.priority,
  }));

  const topicSummaries = topics.map(t => ({
    topic: t.topic,
    importance: t.importance,
    messageCount: t.messageCount,
  }));

  const todoSummaries = todos.map(t => ({
    title: t.title,
    priority: t.priority,
  }));

  const summary = await generateDailySummary(
    messageSummaries,
    topicSummaries,
    todoSummaries,
    userName
  );

  // Save summary
  await prisma.dailySummary.create({
    data: {
      userId,
      date: today,
      summary,
      messageCount: messages.length,
      highPriorityCount: messages.filter(m => m.priority > 70).length,
    },
  });

  console.log(`[Cron] Generated summary for user ${userId} (${messages.length} messages)`);
}
