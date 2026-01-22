import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check Gmail connection
    const connection = await prisma.connectedPlatform.findFirst({
      where: {
        platform: 'gmail',
        isActive: true,
      },
    });

    // Count messages
    const messageCount = await prisma.message.count({
      where: { platform: 'gmail' },
    });

    // Get user
    const user = await prisma.user.findFirst({
      where: { email: { contains: '@' } },
    });

    return NextResponse.json({
      connection: connection ? {
        id: connection.id,
        userId: connection.userId,
        email: connection.platformUsername,
        hasTokens: !!connection.accessToken,
        expiresAt: connection.expiresAt,
      } : null,
      messageCount,
      user: user ? {
        id: user.id,
        email: user.email,
      } : null,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug failed' },
      { status: 500 }
    );
  }
}
