import { NextRequest, NextResponse } from 'next/server';
import { generateMissingEmbeddings } from '@/lib/embeddings/embedding-generator';

/**
 * Generate embeddings for messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, limit = 100 } = body;

    const results = await generateMissingEmbeddings(userId, limit);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}
