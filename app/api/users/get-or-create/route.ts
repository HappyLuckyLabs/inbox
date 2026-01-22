import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find existing user or create new one
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // No password for demo users
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get or create user' },
      { status: 500 }
    );
  }
}
