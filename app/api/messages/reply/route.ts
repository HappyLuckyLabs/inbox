import { NextRequest, NextResponse } from 'next/server';
import { generateReply } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, conversationHistory, userWritingStyle } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const reply = await generateReply(content, conversationHistory, userWritingStyle);

    return NextResponse.json(reply);
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
