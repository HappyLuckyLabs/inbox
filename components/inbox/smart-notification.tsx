'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface SmartNotificationProps {
  title: string;
  message: string;
  type?: 'insight' | 'suggestion' | 'alert';
  onDismiss?: () => void;
}

export function SmartNotification({
  title,
  message,
  type = 'insight',
  onDismiss
}: SmartNotificationProps) {
  const bgColor = type === 'insight'
    ? 'bg-gradient-to-br from-[hsl(10,80%,85%)] to-[hsl(10,70%,78%)]'
    : type === 'suggestion'
    ? 'bg-gradient-to-br from-[hsl(150,20%,90%)] to-[hsl(150,15%,85%)]'
    : 'bg-gradient-to-br from-[hsl(25,80%,92%)] to-[hsl(25,75%,85%)]';

  const iconColor = type === 'insight'
    ? 'text-[hsl(10,65%,50%)]'
    : type === 'suggestion'
    ? 'text-[hsl(150,30%,45%)]'
    : 'text-[hsl(25,70%,55%)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`${bgColor} rounded-2xl p-4 shadow-lg border border-white/60 backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-white/70 ${iconColor}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-[hsl(25,20%,25%)]">{title}</h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[hsl(25,15%,40%)]" />
              </button>
            )}
          </div>
          <p className="text-sm text-[hsl(25,15%,35%)] mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface SmartNotificationContainerProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type?: 'insight' | 'suggestion' | 'alert';
  }>;
  onDismiss?: (id: string) => void;
}

export function SmartNotificationContainer({
  notifications,
  onDismiss
}: SmartNotificationContainerProps) {
  return (
    <div className="fixed top-6 right-6 w-80 z-50 space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <SmartNotification
            key={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
            onDismiss={onDismiss ? () => onDismiss(notification.id) : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
