import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trackInteraction } from '@/lib/tracking/interaction-tracker';

/**
 * Update todo status (complete or dismiss)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { todoId, status } = body;

    if (!todoId || !status) {
      return NextResponse.json(
        { error: 'todoId and status are required' },
        { status: 400 }
      );
    }

    if (!['completed', 'dismissed', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the todo to track interaction
    const todo = await prisma.todoItem.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // Update todo
    const updatedTodo = await prisma.todoItem.update({
      where: { id: todoId },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
      },
    });

    // Track interaction for learning
    if (status === 'completed') {
      await trackInteraction({
        userId: todo.userId,
        eventType: 'todo_completed',
        metadata: {
          todoId,
          priority: todo.priority,
        },
      });
    } else if (status === 'dismissed') {
      await trackInteraction({
        userId: todo.userId,
        eventType: 'todo_dismissed',
        metadata: {
          todoId,
          priority: todo.priority,
        },
      });
    }

    return NextResponse.json({
      success: true,
      todo: updatedTodo,
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}
