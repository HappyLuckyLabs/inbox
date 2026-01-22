import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Update goal status (achieve or abandon)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, status } = body;

    if (!goalId || !status) {
      return NextResponse.json(
        { error: 'goalId and status are required' },
        { status: 400 }
      );
    }

    if (!['active', 'achieved', 'abandoned'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update goal
    const updatedGoal = await prisma.userGoal.update({
      where: { id: goalId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}
