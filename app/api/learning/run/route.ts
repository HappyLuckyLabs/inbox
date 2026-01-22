import { NextRequest, NextResponse } from 'next/server';
import { runLearningPipeline, runLearningForAllUsers } from '@/lib/learning/preference-learner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, allUsers } = body;

    if (allUsers) {
      // Run learning for all users (for cron jobs)
      await runLearningForAllUsers();
      return NextResponse.json({
        success: true,
        message: 'Learning complete for all users',
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Run learning for specific user
    await runLearningPipeline(userId);

    return NextResponse.json({
      success: true,
      message: `Learning complete for user ${userId}`,
    });
  } catch (error) {
    console.error('Error running learning:', error);
    return NextResponse.json(
      { error: 'Failed to run learning' },
      { status: 500 }
    );
  }
}
