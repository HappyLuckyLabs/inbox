import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Update topic (mark as inactive)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, isActive } = body;

    if (!topicId || isActive === undefined) {
      return NextResponse.json(
        { error: 'topicId and isActive are required' },
        { status: 400 }
      );
    }

    // Update topic
    const updatedTopic = await prisma.conversationTopic.update({
      where: { id: topicId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      topic: updatedTopic,
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}
