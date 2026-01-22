'use client';

import { InboxSidebar } from '@/components/inbox/inbox-sidebar';
import { useState } from 'react';

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePlatform, setActivePlatform] = useState('all');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <InboxSidebar
        activePlatform={activePlatform}
        onPlatformChange={setActivePlatform}
      />
      {children}
    </div>
  );
}
