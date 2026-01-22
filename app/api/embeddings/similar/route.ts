import { NextRequest, NextResponse } from 'next/server';
import { findSimilarMessages } from '@/lib/embeddings/embedding-generator';

/**
 * Find similar messages to a given message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, limit = 10, minSimilarity = 0.7 } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    const results = await findSimilarMessages(messageId, limit, minSimilarity);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error finding similar messages:', error);
    return NextResponse.json(
      { error: 'Failed to find similar messages' },
      { status: 500 }
    );
  }
}
