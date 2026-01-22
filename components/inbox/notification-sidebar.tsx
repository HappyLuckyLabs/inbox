'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationCard } from "./notification-card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  platform: string;
  isRead?: boolean;
}

interface NotificationSidebarProps {
  notifications: Notification[];
  onClose?: () => void;
}

export function NotificationSidebar({ notifications, onClose }: NotificationSidebarProps) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* Smart Previews */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: getPlatformBg(notification.platform)
                }}>
                  {getPlatformIcon(notification.platform)}
                </div>
                <span className="font-semibold text-gray-900">{notification.name}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function getPlatformBg(platform: string): string {
  const colors: Record<string, string> = {
    'gmail': '#FEE',
    'whatsapp': '#E8F8ED',
    'slack': '#F4ECF7',
  };
  return colors[platform] || '#F5F5F5';
}

function getPlatformIcon(platform: string) {
  const iconProps = { size: 14 };
  if (platform === 'whatsapp') return <span style={{color: '#25D366'}}>💬</span>;
  if (platform === 'slack') return <span style={{color: '#4A154B'}}>#</span>;
  return <span style={{color: '#EA4335'}}>📧</span>;
}
