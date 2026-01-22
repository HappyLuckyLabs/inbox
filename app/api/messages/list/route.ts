import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userId } = await request.json();

    if (!userEmail && !userId) {
      return NextResponse.json({ error: 'userEmail or userId required' }, { status: 400 });
    }

    // Find user
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
    }

    if (!user) {
      return NextResponse.json({ success: true, messages: [] });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });

    // Format messages for the frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      platform: msg.platform,
      platformMessageId: msg.externalId || msg.id,
      from: {
        name: msg.fromName || msg.from || 'Unknown',
        email: msg.from || '',
        avatar: undefined,
        platformId: msg.from || '',
        platform: msg.platform,
      },
      to: {
        name: user.name || 'You',
        email: user.email,
        avatar: undefined,
        platformId: user.email,
        platform: msg.platform,
      },
      subject: msg.subject || undefined,
      snippet: msg.snippet || '',
      body: msg.body,
      priority: msg.priority,
      isRead: msg.isRead,
      sentiment: (msg.priority > 70 ? 'positive' : msg.priority < 30 ? 'negative' : 'neutral') as 'positive' | 'neutral' | 'negative',
      category: 'Uncategorized',
      createdAt: msg.createdAt,
      receivedAt: msg.receivedAt || msg.createdAt,
      conversationId: msg.threadId || msg.id,
    }));

    return NextResponse.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
