import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessagePriority } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, subject, senderName } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeMessagePriority(content, subject, senderName);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in prioritize API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
