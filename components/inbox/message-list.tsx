'use client';

import { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCard } from "./message-card";
import { DailySummaryCard } from "./daily-summary-card";
import { MockMessage } from "@/lib/mock-data";
import { ChevronDown, Filter, ArrowUpDown, Search } from 'lucide-react';

interface MessageListProps {
  messages: MockMessage[];
  onMessageClick?: (message: MockMessage) => void;
}

export function MessageList({ messages, onMessageClick }: MessageListProps) {
  const unreadCount = messages.filter(m => !m.isRead).length;
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [activeSort, setActiveSort] = useState('Priority');

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Search Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Start typing to ask or search Kinso"
            className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Inbox Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onClick={() => onMessageClick?.(message)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
