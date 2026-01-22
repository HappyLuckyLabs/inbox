import { NextRequest, NextResponse } from 'next/server';
import { extractTodos, extractTodosWithRegex } from '@/lib/ai/todo-extraction';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'messageId and userId are required' },
        { status: 400 }
      );
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { fromContact: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Extract todos
    const todos = await extractTodos(
      message.body,
      message.subject || undefined,
      message.fromContact.name
    );

    // Fallback to regex if API fails
    const finalTodos = todos.length > 0
      ? todos
      : extractTodosWithRegex(message.body + ' ' + (message.subject || ''));

    // Save todos to database
    const savedTodos = await Promise.all(
      finalTodos.map(todo =>
        prisma.todoItem.create({
          data: {
            userId,
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            priority: todo.priority,
            extractedFrom: messageId,
            messageSnippet: todo.snippet,
            confidence: todo.confidence,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      todos: savedTodos,
      count: savedTodos.length,
    });
  } catch (error) {
    console.error('Error in todo extraction API:', error);
    return NextResponse.json(
      { error: 'Failed to extract todos' },
      { status: 500 }
    );
  }
}
