'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DailySummaryCardProps {
  userId?: string;
}

export function DailySummaryCard({ userId = 'demo-user' }: DailySummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    messageCount: number;
    unreadCount: number;
    priorityCount: number;
  } | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch('/api/summary/daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[hsl(250,35%,92%)] via-[hsl(200,35%,92%)] to-[hsl(150,25%,92%)] rounded-2xl p-6 flex items-center justify-center border border-white/60 shadow-sm">
        <Loader2 className="animate-spin text-[hsl(250,40%,60%)] mr-3" size={20} />
        <span className="text-[hsl(25,15%,35%)] font-medium text-sm">Generating your daily summary...</span>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-[hsl(250,35%,92%)] via-[hsl(200,35%,92%)] to-[hsl(150,25%,92%)] rounded-2xl p-6 border border-white/60 shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="text-[hsl(250,40%,60%)]" size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[hsl(25,20%,20%)] text-base">Your Daily Summary</h3>
            {stats && (
              <div className="flex gap-2 text-xs">
                <span className="px-2.5 py-1 bg-white/80 text-[hsl(200,50%,45%)] rounded-xl font-semibold shadow-sm">
                  {stats.messageCount} messages
                </span>
                {stats.priorityCount > 0 && (
                  <span className="px-2.5 py-1 bg-white/80 text-[hsl(10,65%,50%)] rounded-xl font-semibold shadow-sm">
                    {stats.priorityCount} urgent
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-[hsl(25,15%,30%)] whitespace-pre-wrap leading-relaxed">
            {summary}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
