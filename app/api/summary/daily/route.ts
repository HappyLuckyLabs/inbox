import { NextRequest, NextResponse } from 'next/server';
import { generateDailySummary } from '@/lib/ai/daily-summary';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if summary already exists for today
    const existingSummary = await prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (existingSummary) {
      return NextResponse.json({
        summary: existingSummary.summary,
        cached: true,
      });
    }

    // Get today's messages
    const messages = await prisma.message.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
      include: {
        fromContact: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Get active topics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const topics = await prisma.conversationTopic.findMany({
      where: {
        userId,
        lastActivityAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        importance: 'desc',
      },
      take: 5,
    });

    // Get pending todos
    const todos = await prisma.todoItem.findMany({
      where: {
        userId,
        status: 'pending',
      },
      orderBy: {
        priority: 'desc',
      },
      take: 5,
    });

    // Format data for summary generation
    const messageSummaries = messages.map(m => ({
      from: m.fromContact?.name || m.from || 'Unknown',
      subject: m.subject || undefined,
      snippet: m.snippet || m.body.substring(0, 100),
      priority: m.priority,
    }));

    const topicSummaries = topics.map(t => ({
      name: t.name,
      messageCount: t.messageCount,
    }));

    const todoSummaries = todos.map(t => ({
      title: t.title,
      dueDate: t.dueDate?.toISOString().split('T')[0],
    }));

    // Generate summary
    const summaryText = await generateDailySummary(
      messageSummaries,
      topicSummaries,
      todoSummaries,
      user.name || 'there'
    );

    // Save summary
    const savedSummary = await prisma.dailySummary.create({
      data: {
        userId,
        date: today,
        summary: summaryText,
        topMessages: JSON.stringify(messages.slice(0, 5).map(m => m.id)),
        topTopics: JSON.stringify(topics.map(t => t.id)),
        actionItems: JSON.stringify(todos.map(t => t.id)),
        messageCount: messages.length,
        unreadCount: messages.filter(m => !m.isRead).length,
        priorityCount: messages.filter(m => m.priority > 70).length,
      },
    });

    return NextResponse.json({
      summary: savedSummary.summary,
      cached: false,
      stats: {
        messageCount: savedSummary.messageCount,
        unreadCount: savedSummary.unreadCount,
        priorityCount: savedSummary.priorityCount,
      },
    });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
