'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Hash, Linkedin, MessageCircle, Instagram, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface NotificationCardProps {
  name: string;
  avatar: string;
  message: string;
  time: string;
  platform: string;
  isRead?: boolean;
}

const PlatformIconSmall = ({ platform }: { platform: string }) => {
  const iconProps = { size: 14, className: "text-white" };

  switch (platform) {
    case 'gmail':
    case 'outlook':
      return <Mail {...iconProps} />;
    case 'slack':
      return <Hash {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    case 'whatsapp':
      return <MessageCircle {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    default:
      return <Mail {...iconProps} />;
  }
};

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    gmail: 'bg-red-500',
    outlook: 'bg-blue-600',
    slack: 'bg-purple-600',
    linkedin: 'bg-blue-700',
    whatsapp: 'bg-green-500',
    instagram: 'bg-pink-500'
  };
  return colors[platform] || 'bg-gray-500';
};

export function NotificationCard({ name, avatar, message, time, platform, isRead = false }: NotificationCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors relative"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${getPlatformColor(platform)}`}>
          <PlatformIconSmall platform={platform} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900">{name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">{time}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{message}</p>
      </div>

      {!isRead && (
        <Circle className="w-2 h-2 fill-blue-600 text-blue-600 flex-shrink-0 mt-2" />
      )}
    </motion.div>
  );
}
