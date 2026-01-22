'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Hash, Linkedin, MessageCircle, Instagram, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface ConnectedPlatform {
  id: string;
  platform: string;
  platformUsername: string;
  isActive: boolean;
  expiresAt: string | null;
}

const platformConfig = {
  gmail: {
    name: 'Gmail',
    icon: Mail,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Connect your Gmail account to sync emails',
  },
  outlook: {
    name: 'Outlook',
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Connect your Outlook account to sync emails',
  },
  slack: {
    name: 'Slack',
    icon: Hash,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Connect Slack to sync channels and DMs',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Connect LinkedIn to sync messages',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Connect WhatsApp Business to sync messages',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'Connect Instagram Business to sync DMs',
  },
};

export default function SettingsPage() {
  const [connections, setConnections] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: 'james@happyluckydesigns.com' }),
      });

      const data = await response.json();
      if (data.success) {
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    if (platform === 'gmail') {
      setLoading(true);
      try {
        const userResponse = await fetch('/api/users/get-or-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'james@happyluckydesigns.com', name: 'James Riddell' }),
        });

        const userData = await userResponse.json();
        if (!userData.success) {
          throw new Error('Failed to get user');
        }

        const response = await fetch('/api/auth/gmail/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.user.id }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('Error connecting:', error);
        setLoading(false);
      }
    } else {
      alert(`${platformConfig[platform as keyof typeof platformConfig].name} integration coming soon!`);
    }
  };

  const handleSync = async (platform: string, connectionId: string) => {
    setSyncing(platform);
    try {
      // Get user by email
      const userResponse = await fetch('/api/users/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'james@happyluckydesigns.com' }),
      });

      const userData = await userResponse.json();
      if (!userData.success) {
        alert('Failed to get user');
        setSyncing(null);
        return;
      }

      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user.id }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Synced ${data.new} new messages, ${data.updated} updated!`);
        // Refresh the page to show new messages
        window.location.href = '/inbox';
      } else {
        alert(`Error: ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (connectionId: string, platform: string) => {
    if (!confirm(`Disconnect ${platformConfig[platform as keyof typeof platformConfig].name}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConnections();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const getConnection = (platform: string) => {
    return connections.find(c => c.platform === platform && c.isActive);
  };

  return (
    <div className="flex flex-col h-screen flex-1 bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your connected platforms and integrations</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Connections Section */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Connected Platforms</h2>
              <p className="text-sm text-slate-600 mt-1">Connect your communication platforms to sync messages</p>
            </div>

            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                Object.entries(platformConfig).map(([platformId, config]) => {
                  const connection = getConnection(platformId);
                  const Icon = config.icon;

                  return (
                    <div
                      key={platformId}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        connection ? `${config.bgColor} ${config.borderColor}` : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${config.bgColor}`}>
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{config.name}</h3>
                            {connection && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{config.description}</p>
                          {connection && (
                            <p className="text-xs text-slate-500 mt-1">
                              Account: {connection.platformUsername}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {connection ? (
                          <>
                            {platformId === 'gmail' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(platformId, connection.id)}
                                disabled={syncing === platformId}
                              >
                                {syncing === platformId ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Syncing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Sync Now
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnect(platformId)}
                            >
                              Reconnect
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnect(connection.id, platformId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleConnect(platformId)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Preferences */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">AI Preferences</h2>
              <p className="text-sm text-slate-600 mt-1">Configure how AI processes your messages</p>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-500">AI preference settings coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
