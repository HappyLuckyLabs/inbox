'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, XCircle, Calendar, AlertCircle, Sparkles } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'dismissed';
  priority: number;
  dueDate?: Date;
  extractedFrom?: string;
  confidence: number;
  createdAt: Date;
  completedAt?: Date;
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'dismissed';
type SortBy = 'priority' | 'dueDate' | 'createdAt';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [sortBy, setSortBy] = useState<SortBy>('priority');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'demo@kinso.ai' }),
      });

      const data = await response.json();
      if (data.success) {
        setTodos(data.todos);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTodoStatus = async (todoId: string, status: 'completed' | 'dismissed') => {
    try {
      const response = await fetch('/api/todos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, status }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setTodos(todos.map(todo =>
          todo.id === todoId
            ? { ...todo, status, completedAt: status === 'completed' ? new Date() : undefined }
            : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Filter and sort todos
  const filteredTodos = todos
    .filter(todo => filter === 'all' || todo.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  // Statistics
  const stats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    completed: todos.filter(t => t.status === 'completed').length,
    dismissed: todos.filter(t => t.status === 'dismissed').length,
    highPriority: todos.filter(t => t.status === 'pending' && t.priority >= 8).length,
  };

  return (
    <div className="flex flex-col h-screen flex-1">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Action Items</h1>
              <p className="text-sm text-slate-600">AI-extracted todos from your messages</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex gap-4 mt-4">
            <StatCard
              label="Pending"
              value={stats.pending}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label="High Priority"
              value={stats.highPriority}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
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

        {/* Filters and Sort */}
        <div className="px-6 pb-4 flex items-center gap-4">
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="All"
              count={stats.total}
            />
            <FilterButton
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
              label="Pending"
              count={stats.pending}
            />
            <FilterButton
              active={filter === 'completed'}
              onClick={() => setFilter('completed')}
              label="Completed"
              count={stats.completed}
            />
            <FilterButton
              active={filter === 'dismissed'}
              onClick={() => setFilter('dismissed')}
              label="Dismissed"
              count={stats.dismissed}
            />
          </div>

          <div className="ml-auto flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="createdAt">Sort by Created Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {filter === 'pending' ? 'No pending todos' : 'No todos found'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                {filter === 'pending'
                  ? "You're all caught up! AI will automatically extract todos from your incoming messages."
                  : `No ${filter} todos to display.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onComplete={() => updateTodoStatus(todo.id, 'completed')}
                  onDismiss={() => updateTodoStatus(todo.id, 'dismissed')}
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

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-violet-600 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
      }`}
    >
      {label} {count > 0 && <span className="ml-1">({count})</span>}
    </button>
  );
}

function TodoCard({ todo, onComplete, onDismiss }: {
  todo: Todo;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  };

  const priorityLevel = todo.priority >= 8 ? 'high' : todo.priority >= 5 ? 'medium' : 'low';
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();

  return (
    <div
      className={`p-4 rounded-lg border-2 bg-white hover:shadow-md transition-shadow ${
        todo.status === 'completed'
          ? 'opacity-60 border-green-200 bg-green-50'
          : todo.status === 'dismissed'
          ? 'opacity-40 border-slate-200 bg-slate-50'
          : priorityColors[priorityLevel]
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-1">
          {todo.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : todo.status === 'dismissed' ? (
            <XCircle className="w-5 h-5 text-slate-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3
                className={`font-semibold text-slate-900 mb-1 ${
                  todo.status !== 'pending' ? 'line-through' : ''
                }`}
              >
                {todo.title}
              </h3>
              {todo.description && (
                <p className="text-sm text-slate-600 mb-2">{todo.description}</p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {todo.dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Due {new Date(todo.dueDate).toLocaleDateString()}
                      {isOverdue && ' (overdue)'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Priority: {todo.priority}/10</span>
                </div>

                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Confidence: {Math.round(todo.confidence * 100)}%</span>
                </div>

                {todo.completedAt && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed {new Date(todo.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {todo.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onComplete}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDismiss}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Message Link */}
      {todo.extractedFrom && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <button
            onClick={() => window.location.href = `/inbox?message=${todo.extractedFrom}`}
            className="text-xs text-violet-600 hover:text-violet-700 hover:underline"
          >
            View source message →
          </button>
        </div>
      )}
    </div>
  );
}
