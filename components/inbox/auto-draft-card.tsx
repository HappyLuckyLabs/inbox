'use client';

import { motion } from 'framer-motion';
import { Wand2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoDraftCardProps {
  draftText: string;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  isGenerating?: boolean;
}

export function AutoDraftCard({
  draftText,
  onAccept,
  onReject,
  onEdit,
  isGenerating = false
}: AutoDraftCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-[hsl(250,35%,92%)] to-[hsl(250,30%,88%)] rounded-2xl p-5 border border-[hsl(250,25%,80%)] shadow-md"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-white/80">
          <Wand2 className="w-4 h-4 text-[hsl(250,40%,60%)]" />
        </div>
        <span className="text-sm font-semibold text-[hsl(25,20%,25%)]">AI-Suggested Reply</span>
      </div>

      {isGenerating ? (
        <div className="flex items-center gap-3 py-4">
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(250,40%,60%)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(250,40%,60%)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(250,40%,60%)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-sm text-[hsl(25,12%,45%)]">Crafting your reply...</span>
        </div>
      ) : (
        <>
          <div className="bg-white/80 rounded-xl p-4 mb-4">
            <p className="text-sm text-[hsl(25,15%,30%)] leading-relaxed">
              {draftText}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onAccept}
              size="sm"
              className="bg-[hsl(250,40%,60%)] hover:bg-[hsl(250,40%,55%)] text-white rounded-xl px-4 h-9 text-sm font-medium shadow-sm"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Use This Reply
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="border-[hsl(250,25%,75%)] bg-white/80 hover:bg-white text-[hsl(25,15%,30%)] rounded-xl px-4 h-9 text-sm font-medium"
            >
              Edit
            </Button>
            <Button
              onClick={onReject}
              variant="ghost"
              size="sm"
              className="text-[hsl(25,10%,55%)] hover:text-[hsl(25,15%,35%)] hover:bg-white/60 rounded-xl h-9 px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
