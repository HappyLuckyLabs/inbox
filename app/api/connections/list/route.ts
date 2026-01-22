import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userId } = await request.json();

    if (!userEmail && !userId) {
      return NextResponse.json({ error: 'userEmail or userId required' }, { status: 400 });
    }

    // Find user
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
    }

    if (!user) {
      return NextResponse.json({ success: true, connections: [] });
    }

    // Get all connections
    const connections = await prisma.connectedPlatform.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      connections: connections.map(c => ({
        id: c.id,
        platform: c.platform,
        platformUsername: c.platformUsername || c.accountName || 'Unknown',
        isActive: c.isActive,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
