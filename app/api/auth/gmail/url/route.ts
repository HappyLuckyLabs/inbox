import { NextRequest, NextResponse } from 'next/server';
import { getGmailAuthUrl } from '@/lib/gmail/gmail-client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const url = getGmailAuthUrl(userId);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
