import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get all topics for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail } = body;

    // Find user by email or ID
    let user;
    if (userEmail) {
      user = await prisma.user.findFirst({
        where: { email: userEmail },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const topics = await prisma.conversationTopic.findMany({
      where: { userId: user.id },
      orderBy: [
        { importance: 'desc' },
        { lastMentioned: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
