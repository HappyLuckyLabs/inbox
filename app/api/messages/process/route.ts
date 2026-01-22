import { NextRequest, NextResponse } from 'next/server';
import { processNewMessage, batchProcessMessages } from '@/lib/processing/message-processor';
import { jobQueue } from '@/lib/queue/job-queue';

/**
 * Process a new message through the three-tier system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batch, ...messageData } = body;

    if (batch && Array.isArray(batch)) {
      // Batch processing
      await batchProcessMessages(batch);
      return NextResponse.json({
        success: true,
        message: `Processed ${batch.length} messages`,
      });
    }

    // Single message processing
    const { userId, fromContactId, platform, subject, body: messageBody } = messageData;

    if (!userId || !fromContactId || !platform || !messageBody) {
      return NextResponse.json(
        { error: 'userId, fromContactId, platform, and body are required' },
        { status: 400 }
      );
    }

    const result = await processNewMessage({
      userId,
      fromContactId,
      platform,
      subject,
      body: messageBody,
    });

    return NextResponse.json({
      success: true,
      message: result,
      queueStatus: jobQueue.getStatus(),
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Get job queue status
 */
export async function GET() {
  try {
    const status = jobQueue.getStatus();

    return NextResponse.json({
      success: true,
      queueStatus: status,
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
