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
      from: {
        name: msg.fromName || msg.from || 'Unknown',
        email: msg.from || '',
        avatar: undefined,
      },
      subject: msg.subject || undefined,
      snippet: msg.snippet || '',
      body: msg.body,
      priority: msg.priority,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      receivedAt: msg.receivedAt || msg.createdAt,
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
