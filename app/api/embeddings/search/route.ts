import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/embeddings/embedding-generator';

/**
 * Semantic search using vector embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, limit = 10, minSimilarity = 0.6 } = body;

    if (!userId || !query) {
      return NextResponse.json(
        { error: 'userId and query are required' },
        { status: 400 }
      );
    }

    const results = await semanticSearch(userId, query, limit, minSimilarity);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}
