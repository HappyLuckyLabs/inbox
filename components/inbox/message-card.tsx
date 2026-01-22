'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MockMessage, getPlatformColor } from "@/lib/mock-data";
import { Mail, Hash, Linkedin, MessageCircle, Instagram, Star } from "lucide-react";
import { motion } from "framer-motion";

interface MessageCardProps {
  message: MockMessage;
  onClick?: () => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const iconProps = { size: 14, className: 'opacity-60' };

  switch (platform) {
    case 'gmail':
    case 'outlook':
      return <Mail {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
    case 'slack':
      return <Hash {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
    case 'linkedin':
      return <Linkedin {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
    case 'whatsapp':
      return <MessageCircle {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
    case 'instagram':
      return <Instagram {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
    default:
      return <Mail {...iconProps} style={{ color: getPlatformColor(platform as any) }} />;
  }
};

export function MessageCard({ message, onClick }: MessageCardProps) {
  const initials = message.from.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = getTimeAgo(message.createdAt);

  // Priority-based styling
  const isPriorityHigh = message.priority >= 70;
  const isPriorityMedium = message.priority >= 40 && message.priority < 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !message.isRead ? 'bg-gray-50/50' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={message.from.avatar} alt={message.from.name} />
        <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold text-base ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
            {message.from.name}
          </span>
          <span className="text-sm text-gray-500">{timeAgo}</span>
        </div>

        <div className="text-sm text-gray-600 line-clamp-1">
          {message.snippet}
        </div>
      </div>

      {/* Platform icon on right */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
          backgroundColor: getPlatformBgColor(message.platform)
        }}>
          <PlatformIcon platform={message.platform} />
        </div>
      </div>
    </motion.div>
  );
}

function getPlatformBgColor(platform: string): string {
  const colors: Record<string, string> = {
    'gmail': '#FEE',
    'instagram': '#FFE5EB',
    'linkedin': '#E7F3FF',
    'whatsapp': '#E8F8ED',
    'slack': '#F4ECF7',
    'outlook': '#E5F2FF',
  };
  return colors[platform] || '#F5F5F5';
}

function getTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return dateObj.toLocaleDateString();
}
