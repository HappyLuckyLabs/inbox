'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, TrendingUp, Briefcase, Heart, BookOpen, DollarSign, Users, Check, X, Sparkles, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  goal: string;
  category: string;
  priority: number;
  status: 'active' | 'achieved' | 'abandoned';
  confidence: number;
  extractedFrom?: string;
  keywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

type FilterCategory = 'all' | 'work' | 'personal' | 'learning' | 'financial' | 'relationship';
type FilterStatus = 'all' | 'active' | 'achieved' | 'abandoned';

const categoryIcons = {
  work: Briefcase,
  personal: Heart,
  learning: BookOpen,
  financial: DollarSign,
  relationship: Users,
};

const categoryColors = {
  work: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  personal: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'text-pink-600' },
  learning: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
  financial: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
  relationship: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'demo@kinso.ai' }),
      });

      const data = await response.json();
      if (data.success) {
        setGoals(data.goals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalStatus = async (goalId: string, status: 'achieved' | 'abandoned') => {
    try {
      const response = await fetch('/api/goals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, status }),
      });

      const data = await response.json();
      if (data.success) {
        setGoals(goals.map(goal =>
          goal.id === goalId ? { ...goal, status, updatedAt: new Date() } : goal
        ));
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Filter goals
  const filteredGoals = goals
    .filter(goal => filterCategory === 'all' || goal.category === filterCategory)
    .filter(goal => filterStatus === 'all' || goal.status === filterStatus)
    .sort((a, b) => b.priority - a.priority);

  // Statistics
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    achieved: goals.filter(g => g.status === 'achieved').length,
    byCategory: {
      work: goals.filter(g => g.category === 'work').length,
      personal: goals.filter(g => g.category === 'personal').length,
      learning: goals.filter(g => g.category === 'learning').length,
      financial: goals.filter(g => g.category === 'financial').length,
      relationship: goals.filter(g => g.category === 'relationship').length,
    },
  };

  return (
    <div className="flex flex-col h-screen flex-1">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
              <p className="text-sm text-slate-600">AI-discovered goals and priorities from your conversations</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex gap-4 mt-4">
            <StatCard
              label="Active"
              value={stats.active}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label="Achieved"
              value={stats.achieved}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              label="Total"
              value={stats.total}
              color="text-slate-600"
              bgColor="bg-slate-50"
            />
          </div>
        </div>

        {/* Filters */}
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
                active={filterCategory === 'personal'}
                onClick={() => setFilterCategory('personal')}
                label="Personal"
                count={stats.byCategory.personal}
              />
              <FilterButton
                active={filterCategory === 'learning'}
                onClick={() => setFilterCategory('learning')}
                label="Learning"
                count={stats.byCategory.learning}
              />
              <FilterButton
                active={filterCategory === 'financial'}
                onClick={() => setFilterCategory('financial')}
                label="Financial"
                count={stats.byCategory.financial}
              />
              <FilterButton
                active={filterCategory === 'relationship'}
                onClick={() => setFilterCategory('relationship')}
                label="Relationship"
                count={stats.byCategory.relationship}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex gap-2">
              <FilterButton
                active={filterStatus === 'all'}
                onClick={() => setFilterStatus('all')}
                label="All"
              />
              <FilterButton
                active={filterStatus === 'active'}
                onClick={() => setFilterStatus('active')}
                label="Active"
                count={stats.active}
              />
              <FilterButton
                active={filterStatus === 'achieved'}
                onClick={() => setFilterStatus('achieved')}
                label="Achieved"
                count={stats.achieved}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No goals found
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                AI will automatically discover your goals from your messages and conversations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAchieve={() => updateGoalStatus(goal.id, 'achieved')}
                  onAbandon={() => updateGoalStatus(goal.id, 'abandoned')}
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
          ? 'bg-blue-600 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
      }`}
    >
      {label} {count !== undefined && count > 0 && <span className="ml-1">({count})</span>}
    </button>
  );
}

function GoalCard({ goal, onAchieve, onAbandon }: {
  goal: Goal;
  onAchieve: () => void;
  onAbandon: () => void;
}) {
  const colors = categoryColors[goal.category as keyof typeof categoryColors] || categoryColors.personal;
  const Icon = categoryIcons[goal.category as keyof typeof categoryIcons] || Target;
  const keywords = goal.keywords ? JSON.parse(goal.keywords) : [];

  return (
    <div
      className={`p-4 rounded-xl border-2 bg-white hover:shadow-lg transition-all ${
        goal.status === 'achieved'
          ? 'border-green-200 bg-green-50'
          : goal.status === 'abandoned'
          ? 'opacity-60 border-slate-200 bg-slate-50'
          : colors.border + ' ' + colors.bg
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${goal.status === 'active' ? colors.bg : 'bg-slate-100'}`}>
          <Icon className={`w-5 h-5 ${goal.status === 'active' ? colors.icon : 'text-slate-400'}`} />
        </div>

        {goal.status === 'achieved' && (
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <Check className="w-4 h-4" />
            Achieved
          </div>
        )}

        {goal.status === 'abandoned' && (
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <X className="w-4 h-4" />
            Abandoned
          </div>
        )}
      </div>

      {/* Goal */}
      <h3 className={`font-semibold text-slate-900 mb-2 ${goal.status !== 'active' ? 'line-through' : ''}`}>
        {goal.goal}
      </h3>

      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
          {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
        </span>
      </div>

      {/* Priority Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
          <span>Priority</span>
          <span className="font-medium">{goal.priority}/10</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              goal.priority >= 8 ? 'bg-red-500' :
              goal.priority >= 5 ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${goal.priority * 10}%` }}
          />
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 3).map((keyword: string, idx: number) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{Math.round(goal.confidence * 100)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      {goal.status === 'active' && (
        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button
            size="sm"
            variant="outline"
            onClick={onAchieve}
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
          >
            <Check className="w-4 h-4 mr-1" />
            Achieved
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onAbandon}
            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
          >
            <X className="w-4 h-4 mr-1" />
            Abandon
          </Button>
        </div>
      )}
    </div>
  );
}
