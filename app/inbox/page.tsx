'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageList } from '@/components/inbox/message-list';
import { NotificationSidebar } from '@/components/inbox/notification-sidebar';
import { SmartNotificationContainer } from '@/components/inbox/smart-notification';
import { mockMessages } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  platform: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject?: string;
  snippet: string;
  body: string;
  priority: number;
  isRead: boolean;
  createdAt: Date;
  receivedAt: Date;
}

export default function InboxPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [loading, setLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [smartNotifications, setSmartNotifications] = useState([
    {
      id: '1',
      title: 'High Priority',
      message: '3 urgent messages require your attention from investors and key clients.',
      type: 'insight' as const
    },
    {
      id: '2',
      title: 'Meeting Follow-up',
      message: 'Sarah mentioned action items in the standup. Draft a response?',
      type: 'suggestion' as const
    }
  ]);

  useEffect(() => {
    // Check for OAuth callback success/error
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'gmail') {
      setNotificationType('success');
      setNotificationMessage('Gmail connected successfully! Syncing messages...');
      setShowNotification(true);
      setGmailConnected(true);

      // Fetch real messages
      fetchMessages();

      // Hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    } else if (error) {
      setNotificationType('error');
      setNotificationMessage(decodeURIComponent(error));
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }

    // Check if Gmail is already connected
    checkGmailConnection();
  }, [searchParams]);

  const checkGmailConnection = async () => {
    try {
      // Check for james@happyluckydesigns.com first (real Gmail user)
      let response = await fetch('/api/messages/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'james@happyluckydesigns.com' }),
      });

      let data = await response.json();

      // If no messages from james, try demo user
      if (!data.success || data.messages.length === 0) {
        response = await fetch('/api/messages/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: 'demo@kinso.ai' }),
        });
        data = await response.json();
      }

      if (data.success && data.messages.length > 0) {
        const hasGmail = data.messages.some((m: Message) => m.platform === 'gmail');
        setGmailConnected(hasGmail);

        // Mix real messages with mock messages
        setMessages([...data.messages, ...mockMessages]);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Try james@happyluckydesigns.com first
      let response = await fetch('/api/messages/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'james@happyluckydesigns.com' }),
      });

      let data = await response.json();

      // Fallback to demo user if no messages
      if (!data.success || data.messages.length === 0) {
        response = await fetch('/api/messages/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: 'demo@kinso.ai' }),
        });
        data = await response.json();
      }

      if (data.success) {
        // Mix real messages with mock messages for now
        setMessages([...data.messages, ...mockMessages]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setLoading(true);
    try {
      // Get or create demo user first
      const userResponse = await fetch('/api/users/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@kinso.ai', name: 'Demo User' }),
      });

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error('Failed to get user');
      }

      // Get OAuth URL
      const response = await fetch('/api/auth/gmail/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user.id }),
      });

      const data = await response.json();
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setNotificationType('error');
      setNotificationMessage('Failed to connect Gmail');
      setShowNotification(true);
      setLoading(false);
    }
  };

  // Generate notifications from recent high-priority messages
  const notifications = useMemo(() => {
    return messages
      .filter(msg => msg.priority > 60)
      .slice(0, 10)
      .map(msg => ({
        id: msg.id,
        name: msg.from.name,
        avatar: msg.from.avatar,
        message: `${msg.subject ? msg.subject + ': ' : ''}${msg.snippet}`,
        time: getTimeAgo(msg.createdAt),
        platform: msg.platform,
        isRead: msg.isRead
      }));
  }, [messages]);

  const handleDismissSmartNotification = (id: string) => {
    setSmartNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Smart Notifications - Top Right */}
      <SmartNotificationContainer
        notifications={smartNotifications}
        onDismiss={handleDismissSmartNotification}
      />

      {/* Smart Notification Toast */}
      {showNotification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-sm ${
            notificationType === 'success'
              ? 'bg-gradient-to-br from-[hsl(150,25%,90%)] to-[hsl(150,20%,88%)] border-[hsl(150,20%,80%)]'
              : 'bg-gradient-to-br from-[hsl(10,80%,88%)] to-[hsl(10,75%,85%)] border-[hsl(10,70%,75%)]'
          }`}>
            {notificationType === 'success' ? (
              <div className="p-2 rounded-xl bg-white/80">
                <CheckCircle2 className="w-5 h-5 text-[hsl(150,35%,45%)]" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-white/80">
                <AlertCircle className="w-5 h-5 text-[hsl(10,65%,50%)]" />
              </div>
            )}
            <span className="font-semibold text-sm text-[hsl(25,20%,25%)]">{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Connect Gmail Banner */}
      {!gmailConnected && (
        <div className="border-b border-[hsl(30,12%,90%)] bg-gradient-to-r from-[hsl(250,35%,96%)] via-[hsl(200,35%,96%)] to-[hsl(150,25%,96%)]">
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm ring-1 ring-[hsl(30,12%,90%)]">
                <Mail className="w-5 h-5 text-[hsl(250,40%,60%)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(25,20%,25%)] text-base">Connect your Gmail</h3>
                <p className="text-sm text-[hsl(25,12%,45%)] mt-0.5">
                  Get AI-powered prioritization and smart replies for your real emails
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnectGmail}
              disabled={loading}
              className="bg-gradient-to-r from-[hsl(250,40%,60%)] to-[hsl(200,45%,55%)] hover:from-[hsl(250,40%,55%)] hover:to-[hsl(200,45%,50%)] text-white rounded-xl shadow-md px-6 h-11 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        onMessageClick={(message) => setSelectedMessage(message)}
      />
      <NotificationSidebar notifications={notifications} />

      {/* Message Detail Side Panel */}
      {selectedMessage && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-[hsl(25,15%,20%)]/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedMessage(null)}
          />

          {/* Side Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[650px] bg-[hsl(30,18%,98%)] z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[hsl(30,12%,90%)] bg-white">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${
                      selectedMessage.platform === 'gmail' ? 'bg-[hsl(0,70%,95%)] text-[hsl(0,65%,45%)]' :
                      selectedMessage.platform === 'outlook' ? 'bg-[hsl(210,60%,95%)] text-[hsl(210,60%,45%)]' :
                      selectedMessage.platform === 'slack' ? 'bg-[hsl(280,40%,95%)] text-[hsl(280,45%,45%)]' :
                      selectedMessage.platform === 'linkedin' ? 'bg-[hsl(200,60%,95%)] text-[hsl(200,60%,40%)]' :
                      'bg-[hsl(30,18%,92%)] text-[hsl(30,20%,40%)]'
                    }`}>
                      <Mail className="w-3 h-3 mr-1" />
                      {selectedMessage.platform.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${
                      selectedMessage.priority >= 70 ? 'bg-[hsl(10,80%,88%)] text-[hsl(10,65%,45%)]' :
                      selectedMessage.priority >= 40 ? 'bg-[hsl(40,70%,90%)] text-[hsl(40,60%,40%)]' :
                      'bg-[hsl(150,25%,88%)] text-[hsl(150,35%,40%)]'
                    }`}>
                      Priority {selectedMessage.priority}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[hsl(25,20%,20%)] mb-4 break-words leading-tight">
                    {selectedMessage.subject || '(No Subject)'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-[hsl(30,18%,96%)] rounded-2xl px-4 py-2.5 ring-1 ring-[hsl(30,12%,92%)]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(250,40%,65%)] to-[hsl(200,45%,60%)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {selectedMessage.from.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[hsl(25,20%,25%)] text-sm">{selectedMessage.from.name}</span>
                        <span className="text-[hsl(25,12%,50%)] text-xs">{selectedMessage.from.email}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[hsl(25,10%,55%)] font-medium">
                      {new Date(selectedMessage.receivedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-shrink-0 p-2.5 hover:bg-[hsl(30,18%,95%)] rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-[hsl(25,15%,45%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[hsl(30,12%,92%)]">
                <div className="text-[hsl(25,15%,30%)] leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.body}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-[hsl(30,12%,90%)] bg-white flex gap-3">
              <button className="flex-1 px-5 py-3 bg-gradient-to-r from-[hsl(250,40%,60%)] to-[hsl(200,45%,55%)] text-white rounded-xl hover:from-[hsl(250,40%,55%)] hover:to-[hsl(200,45%,50%)] transition-all font-semibold shadow-md flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
              <button className="px-5 py-3 bg-white border border-[hsl(30,12%,88%)] text-[hsl(25,15%,35%)] rounded-xl hover:bg-[hsl(30,18%,97%)] transition-colors font-medium text-sm">
                Archive
              </button>
              <button className="px-5 py-3 bg-white border border-[hsl(30,12%,88%)] text-[hsl(25,15%,35%)] rounded-xl hover:bg-[hsl(30,18%,97%)] transition-colors font-medium text-sm">
                {selectedMessage.isRead ? 'Mark Unread' : 'Mark Read'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}
