import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface PriorityPreferences {
  senderWeights: Record<string, number>; // contactId -> weight (0-1)
  keywordWeights: Record<string, number>; // keyword -> weight (0-1)
  platformWeights: Record<string, number>; // platform -> weight (0-1)
  timePreferences: {
    preferredResponseTime: string;
    typicalResponseDelay: string;
  };
  patterns: string[]; // Discovered patterns
}

interface InteractionSummary {
  immediateReads: number;
  quickReplies: number;
  ignored: number;
  topSenders: string[];
  keywords: string[];
}

export async function learnPriorityPatterns(
  interactions: any[],
  messages: any[]
): Promise<PriorityPreferences> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      senderWeights: {},
      keywordWeights: {},
      platformWeights: {},
      timePreferences: {
        preferredResponseTime: 'morning',
        typicalResponseDelay: '1-2 hours',
      },
      patterns: [],
    };
  }

  try {
    const summary = analyzeInteractions(interactions, messages);

    const prompt = `You are learning a user's message priority preferences from their behavior.

USER BEHAVIOR PATTERNS:
- Messages read immediately (< 5 min): ${summary.immediateReads}
- Messages replied to quickly (< 1 hour): ${summary.quickReplies}
- Messages ignored (not opened > 24h): ${summary.ignored}
- Most interacted senders: ${summary.topSenders.join(', ')}
- Common keywords in priority messages: ${summary.keywords.join(', ')}

TASK: Generate priority preferences that can predict future message importance.

OUTPUT (JSON):
{
  "senderWeights": {
    "sender1": 0.9,
    "sender2": 0.7
  },
  "keywordWeights": {
    "urgent": 0.95,
    "contract": 0.85,
    "meeting": 0.75,
    "fyi": 0.3
  },
  "platformWeights": {
    "email": 0.7,
    "slack": 0.9,
    "linkedin": 0.4
  },
  "timePreferences": {
    "preferredResponseTime": "morning|afternoon|evening",
    "typicalResponseDelay": "immediate|1-2 hours|same day|next day"
  },
  "patterns": [
    "User responds fastest to messages containing 'urgent' or 'deadline'",
    "User prioritizes Slack over email",
    "User responds to manager within 30 minutes"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You learn user priority patterns from behavior. Be specific and data-driven.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      senderWeights: result.senderWeights || {},
      keywordWeights: result.keywordWeights || {},
      platformWeights: result.platformWeights || {},
      timePreferences: result.timePreferences || {
        preferredResponseTime: 'morning',
        typicalResponseDelay: '1-2 hours',
      },
      patterns: result.patterns || [],
    };
  } catch (error) {
    console.error('Error learning priority patterns:', error);
    return {
      senderWeights: {},
      keywordWeights: {},
      platformWeights: {},
      timePreferences: {
        preferredResponseTime: 'morning',
        typicalResponseDelay: '1-2 hours',
      },
      patterns: [],
    };
  }
}

function analyzeInteractions(interactions: any[], messages: any[]): InteractionSummary {
  const summary: InteractionSummary = {
    immediateReads: 0,
    quickReplies: 0,
    ignored: 0,
    topSenders: [],
    keywords: [],
  };

  // Count immediate reads (< 5 min)
  interactions.forEach(interaction => {
    if (interaction.eventType === 'message_read' && interaction.messageId) {
      const message = messages.find(m => m.id === interaction.messageId);
      if (message) {
        const timeToRead = interaction.timestamp.getTime() - message.createdAt.getTime();
        if (timeToRead < 5 * 60 * 1000) {
          summary.immediateReads++;
        }
      }
    }

    if (interaction.eventType === 'message_replied' && interaction.messageId) {
      const message = messages.find(m => m.id === interaction.messageId);
      if (message) {
        const timeToReply = interaction.timestamp.getTime() - message.createdAt.getTime();
        if (timeToReply < 60 * 60 * 1000) {
          summary.quickReplies++;
        }
      }
    }
  });

  // Count ignored messages
  const now = Date.now();
  messages.forEach(message => {
    const wasRead = interactions.some(
      i => i.eventType === 'message_read' && i.messageId === message.id
    );
    const age = now - message.createdAt.getTime();

    if (!wasRead && age > 24 * 60 * 60 * 1000) {
      summary.ignored++;
    }
  });

  // Top senders (from reply interactions)
  const senderCounts: Record<string, number> = {};
  interactions
    .filter(i => i.eventType === 'message_replied' && i.contactId)
    .forEach(i => {
      senderCounts[i.contactId!] = (senderCounts[i.contactId!] || 0) + 1;
    });

  summary.topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([contactId]) => contactId);

  // Extract keywords from high-priority messages
  const highPriorityMessages = messages.filter(m => m.priority > 70);
  const allWords = highPriorityMessages
    .map(m => (m.body + ' ' + (m.subject || '')).toLowerCase())
    .join(' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/);

  const wordCounts: Record<string, number> = {};
  allWords.forEach(word => {
    if (word.length > 4) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  summary.keywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return summary;
}
