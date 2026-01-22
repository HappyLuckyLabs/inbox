import { NextRequest, NextResponse } from 'next/server';
import { trackInteraction, InteractionType } from '@/lib/tracking/interaction-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventType, messageId, contactId, metadata } = body;

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId and eventType are required' },
        { status: 400 }
      );
    }

    await trackInteraction({
      userId,
      eventType: eventType as InteractionType,
      messageId,
      contactId,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}
