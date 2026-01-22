'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, TrendingUp, Users, Hash, Calendar, Sparkles, ChevronRight } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description?: string;
  category: string;
  importance: number;
  lastActivityAt: Date;
  firstSeenAt: Date;
  messageCount: number;
}

type SortBy = 'importance' | 'recency' | 'messages';
type FilterCategory = 'all' | 'work' | 'personal' | 'project' | 'event' | 'question';

const categoryColors = {
  work: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  personal: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500' },
  project: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  event: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  question: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('recency');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'demo@kinso.ai' }),
      });

      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };


  // Filter and sort topics
  const filteredTopics = topics
    .filter(topic => filterCategory === 'all' || topic.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'importance':
          return b.importance - a.importance;
        case 'recency':
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        case 'messages':
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

  // Statistics
  const stats = {
    total: topics.length,
    highImportance: topics.filter(t => t.importance >= 8).length,
    active: topics.filter(t => {
      const daysSinceLastMention = (Date.now() - new Date(t.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastMention < 7;
    }).length,
    totalMessages: topics.reduce((sum, t) => sum + t.messageCount, 0),
    byCategory: {
      work: topics.filter(t => t.category === 'work').length,
      personal: topics.filter(t => t.category === 'personal').length,
      project: topics.filter(t => t.category === 'project').length,
      event: topics.filter(t => t.category === 'event').length,
      question: topics.filter(t => t.category === 'question').length,
    },
  };

  return (
    <div className="flex flex-col h-screen flex-1">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Conversation Topics</h1>
              <p className="text-sm text-slate-600">AI-identified topics and themes from your messages</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex gap-4 mt-4">
            <StatCard
              label="Active Topics"
              value={stats.total}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              label="Recent (7d)"
              value={stats.active}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label="High Importance"
              value={stats.highImportance}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <StatCard
              label="Total Messages"
              value={stats.totalMessages}
              color="text-slate-600"
              bgColor="bg-slate-50"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm font-medium text-slate-700">Category:</span>
            <div className="flex gap-2">
              <FilterButton
                active={filterCategory === 'all'}
                onClick={() => setFilterCategory('all')}
                label="All"
              />
              <FilterButton
                active={filterCategory === 'work'}
                onClick={() => setFilterCategory('work')}
                label="Work"
                count={stats.byCategory.work}
              />
              <FilterButton
                active={filterCategory === 'project'}
                onClick={() => setFilterCategory('project')}
                label="Project"
                count={stats.byCategory.project}
              />
              <FilterButton
                active={filterCategory === 'personal'}
                onClick={() => setFilterCategory('personal')}
                label="Personal"
                count={stats.byCategory.personal}
              />
              <FilterButton
                active={filterCategory === 'event'}
                onClick={() => setFilterCategory('event')}
                label="Event"
                count={stats.byCategory.event}
              />
              <FilterButton
                active={filterCategory === 'question'}
                onClick={() => setFilterCategory('question')}
                label="Question"
                count={stats.byCategory.question}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="recency">Most Recent</option>
              <option value="importance">Importance</option>
              <option value="messages">Message Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No topics found
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                AI will automatically identify conversation topics from your messages.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatCard({ label, value, color, bgColor }: { label: string; value: number; color: string; bgColor: string }) {
  return (
    <div className={`px-4 py-2 ${bgColor} rounded-lg`}>
      <p className="text-xs text-slate-600 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
      }`}
    >
      {label} {count !== undefined && count > 0 && <span className="ml-1">({count})</span>}
    </button>
  );
}

function TopicCard({ topic }: {
  topic: Topic;
}) {
  const colors = categoryColors[topic.category as keyof typeof categoryColors] || categoryColors.work;

  const daysSinceLastMention = Math.floor(
    (Date.now() - new Date(topic.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isRecent = daysSinceLastMention < 7;
  const duration = Math.ceil(
    (new Date(topic.lastActivityAt).getTime() - new Date(topic.firstSeenAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`p-4 rounded-lg border-2 bg-white hover:shadow-md transition-shadow ${colors.border} ${colors.bg}`}>
      <div className="flex items-start gap-4">
        {/* Status Indicator */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className={`w-3 h-3 rounded-full ${colors.dot} ${isRecent ? 'animate-pulse' : ''}`} />
          <div className="w-px h-full bg-slate-200" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{topic.name}</h3>
              {topic.description && (
                <p className="text-sm text-slate-600 mb-2">{topic.description}</p>
              )}
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                  {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                </span>
                <span className="text-xs text-slate-600">
                  {topic.messageCount} message{topic.messageCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Importance Badge */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full ${
                topic.importance >= 8 ? 'bg-red-100 text-red-700' :
                topic.importance >= 5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <span className="text-xs font-semibold">
                  {topic.importance >= 8 ? 'High' : topic.importance >= 5 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(topic.firstSeenAt).toLocaleDateString()} - {new Date(topic.lastActivityAt).toLocaleDateString()}
              </span>
            </div>
            <span>•</span>
            <span>{duration} day{duration !== 1 ? 's' : ''}</span>
            {isRecent && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">Active</span>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-600 hover:text-slate-900"
            >
              View all messages →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
