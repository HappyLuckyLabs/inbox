'use client';

import { Mail, Hash, Linkedin, MessageCircle, Instagram, Search, Settings, CheckCircle2, Target, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

interface InboxSidebarProps {
  activePlatform?: string;
  onPlatformChange?: (platform: string) => void;
}

const platforms = [
  { id: 'gmail', name: 'Gmail', icon: Mail, color: '#EA4335', bgColor: '#FEE' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', bgColor: '#FFE5EB' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', bgColor: '#E7F3FF' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366', bgColor: '#E8F8ED' },
  { id: 'slack', name: 'Slack', icon: Hash, color: '#4A154B', bgColor: '#F4ECF7' },
  { id: 'outlook', name: 'Outlook', icon: Mail, color: '#0078D4', bgColor: '#E5F2FF' },
];

export function InboxSidebar({ activePlatform = 'all', onPlatformChange }: InboxSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const aiFeatures = [
    { id: 'todos', name: 'Action Items', icon: CheckCircle2, path: '/inbox/todos', color: 'text-violet-600' },
    { id: 'goals', name: 'Goals', icon: Target, path: '/inbox/goals', color: 'text-blue-600' },
    { id: 'topics', name: 'Topics', icon: MessageSquare, path: '/inbox/topics', color: 'text-green-600' },
  ];

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 h-screen">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">K</span>
        </div>
      </div>

      {/* Platform Icons */}
      <div className="flex-1 flex flex-col gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isActive = activePlatform === platform.id && pathname === '/inbox';

          return (
            <motion.button
              key={platform.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (pathname !== '/inbox') {
                  router.push('/inbox');
                }
                onPlatformChange?.(platform.id);
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group ${
                isActive ? 'shadow-md' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: isActive ? platform.bgColor : '#F5F5F5'
              }}
              title={platform.name}
            >
              <Icon
                size={22}
                style={{ color: platform.color }}
              />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-1 h-8 rounded-r-full" style={{ backgroundColor: platform.color }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push('/inbox/settings')}
        className="w-12 h-12 rounded-2xl hover:bg-gray-100 mt-4"
      >
        <Settings size={20} className="text-gray-600" />
      </Button>
    </div>
  );
}
