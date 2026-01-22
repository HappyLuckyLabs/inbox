import { NextRequest, NextResponse } from 'next/server';
import { runLearningForAllUsers } from '@/lib/learning/preference-learner';

/**
 * Vercel Cron: Run preference learning for all users
 * Runs at 2 AM daily
 */
export async function GET(request: NextRequest) {
  // Verify this is a valid Vercel Cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting preference learning');

    await runLearningForAllUsers();

    console.log('[Cron] Preference learning complete');

    return NextResponse.json({
      success: true,
      message: 'Preference learning complete',
    });
  } catch (error) {
    console.error('[Cron] Error running learning:', error);
    return NextResponse.json(
      { error: 'Failed to run learning' },
      { status: 500 }
    );
  }
}
