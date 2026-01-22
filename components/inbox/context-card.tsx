'use client';

import { motion } from 'framer-motion';
import { Link2, Mail, Calendar } from 'lucide-react';

interface RelatedMessage {
  id: string;
  subject: string;
  snippet: string;
  date: Date | string;
  from: string;
}

interface ContextCardProps {
  relatedMessages: RelatedMessage[];
  onMessageClick?: (messageId: string) => void;
}

export function ContextCard({ relatedMessages, onMessageClick }: ContextCardProps) {
  if (relatedMessages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-[hsl(150,20%,90%)] to-[hsl(150,15%,88%)] rounded-2xl p-5 border border-[hsl(150,18%,80%)] shadow-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-white/80">
          <Link2 className="w-4 h-4 text-[hsl(150,30%,45%)]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[hsl(25,20%,25%)]">Related Context</h4>
          <p className="text-xs text-[hsl(25,10%,55%)] mt-0.5">
            {relatedMessages.length} related {relatedMessages.length === 1 ? 'message' : 'messages'} found
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {relatedMessages.slice(0, 3).map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onMessageClick?.(message.id)}
            className="bg-white/80 rounded-xl p-3 cursor-pointer hover:bg-white transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[hsl(150,20%,95%)] group-hover:bg-[hsl(150,25%,90%)] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[hsl(150,30%,45%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-sm font-medium text-[hsl(25,15%,25%)] truncate flex-1">
                    {message.subject}
                  </h5>
                  <div className="flex items-center gap-1 text-xs text-[hsl(25,10%,55%)] flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(message.date)}
                  </div>
                </div>
                <p className="text-xs text-[hsl(25,10%,55%)] mb-1">From: {message.from}</p>
                <p className="text-xs text-[hsl(25,10%,50%)] line-clamp-2 leading-relaxed">
                  {message.snippet}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {relatedMessages.length > 3 && (
        <button className="w-full mt-3 text-sm text-[hsl(150,30%,45%)] hover:text-[hsl(150,35%,40%)] font-medium py-2 rounded-lg hover:bg-white/50 transition-colors">
          View {relatedMessages.length - 3} more related messages
        </button>
      )}
    </motion.div>
  );
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
