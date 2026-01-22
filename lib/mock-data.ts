import { faker } from '@faker-js/faker';

export type Platform = 'gmail' | 'outlook' | 'slack' | 'linkedin' | 'whatsapp' | 'instagram';

export interface MockContact {
  name: string;
  email: string;
  avatar: string;
  platformId: string;
  platform: Platform;
}

export interface MockMessage {
  id: string;
  platform: Platform;
  platformMessageId: string;
  from: MockContact;
  to: MockContact;
  subject?: string;
  body: string;
  snippet: string;
  isRead: boolean;
  priority: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  createdAt: Date;
  conversationId: string;
}

const platforms: Platform[] = ['gmail', 'outlook', 'slack', 'linkedin', 'whatsapp', 'instagram'];

const categories = [
  'Sales Contract',
  'Project Update',
  'Team Meeting',
  'Quarterly Spending',
  'Design Review',
  'Marketing Campaign',
  'Client Feedback',
  'Product Launch',
  'Budget Review'
];

const sampleMessages = {
  gmail: [
    {
      subject: 'Sales contract for Brightstone Realty',
      body: 'Hi! I wanted to share a sales contract from Brightstone Realty with all key details included. Please review and let me know if you have any questions.',
      snippet: 'Wants you to share a sales contract from Brightstone Realty with all key details included'
    },
    {
      subject: 'Q3 Budget Breakdown',
      body: 'Here is the Q3 spend breakdown, including a detailed analysis of total expenses and budgets allocated across departments.',
      snippet: 'Know the Q3 spend, including a breakdown of total expenses and budgets'
    }
  ],
  slack: [
    {
      subject: null,
      body: 'Hey team! Just sharing the next month team meet plan, including dates and agenda highlights. Let me know if you can make it!',
      snippet: 'Shares the next month team meet plan, including dates and agenda highlights'
    },
    {
      subject: null,
      body: 'Update on marketing designs, including progress on current campaigns and next steps for the creative team.',
      snippet: 'Provides an update on marketing designs, including progress on current campaigns'
    }
  ],
  whatsapp: [
    {
      subject: null,
      body: 'Hi! Quick question about the project timeline. Are we still on track for the December launch?',
      snippet: 'Asking about project timeline for December launch'
    }
  ],
  linkedin: [
    {
      subject: 'Networking Opportunity',
      body: 'I came across your profile and thought we could connect. I work in product development and would love to discuss potential collaborations.',
      snippet: 'Interested in networking and potential collaborations'
    }
  ],
  outlook: [
    {
      subject: 'Team Sync for ITWA',
      body: 'Looking forward to reviewing the project update for ITWA, including the latest progress and key milestones achieved this sprint.',
      snippet: 'Review project update for ITWA, including latest progress and key milestones'
    }
  ],
  instagram: [
    {
      subject: null,
      body: 'Love your recent post! Would you be interested in collaborating on some content?',
      snippet: 'Interested in content collaboration'
    }
  ]
};

function generateContact(platform: Platform): MockContact {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    avatar: faker.image.avatar(),
    platformId: `${firstName.toLowerCase()}${lastName.toLowerCase()}@${platform}`,
    platform
  };
}

export function generateMockContacts(count: number = 20): MockContact[] {
  const contacts: MockContact[] = [];

  for (let i = 0; i < count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    contacts.push(generateContact(platform));
  }

  return contacts;
}

export function generateMockMessages(contacts: MockContact[], count: number = 50): MockMessage[] {
  const messages: MockMessage[] = [];
  const currentUser: MockContact = {
    name: 'Sarah Chen',
    email: 'sarah.chen@kinso.ai',
    avatar: faker.image.avatar(),
    platformId: 'sarah.chen@kinso',
    platform: 'gmail'
  };

  for (let i = 0; i < count; i++) {
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const platform = contact.platform;
    const templates = sampleMessages[platform] || sampleMessages.gmail;
    const template = templates[Math.floor(Math.random() * templates.length)];

    const createdAt = faker.date.recent({ days: 7 });
    const priority = Math.floor(Math.random() * 100);
    const isRead = Math.random() > 0.4;

    messages.push({
      id: faker.string.uuid(),
      platform,
      platformMessageId: `${platform}-${faker.string.alphanumeric(16)}`,
      from: contact,
      to: currentUser,
      subject: template.subject || undefined,
      body: template.body,
      snippet: template.snippet,
      isRead,
      priority,
      sentiment: priority > 70 ? 'positive' : priority < 30 ? 'negative' : 'neutral',
      category: categories[Math.floor(Math.random() * categories.length)],
      createdAt,
      conversationId: `conv-${faker.string.alphanumeric(12)}`
    });
  }

  // Sort by priority (descending) and date (descending)
  return messages.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    gmail: 'Mail',
    outlook: 'Mail',
    slack: 'Hash',
    linkedin: 'Linkedin',
    whatsapp: 'MessageCircle',
    instagram: 'Instagram'
  };
  return icons[platform];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    gmail: '#EA4335',
    outlook: '#0078D4',
    slack: '#4A154B',
    linkedin: '#0A66C2',
    whatsapp: '#25D366',
    instagram: '#E4405F'
  };
  return colors[platform];
}

// Generate initial data
export const mockContacts = generateMockContacts(20);
export const mockMessages = generateMockMessages(mockContacts, 50);
