import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ExtractedTopic {
  name: string;
  description: string;
  category: 'project' | 'relationship' | 'transaction' | 'support' | 'general';
  importance: number; // 1-10
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems?: string[];
}

export async function extractConversationTopic(
  messages: Array<{ from: string; body: string; subject?: string }>
): Promise<ExtractedTopic | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const messagesText = messages
      .map(m => `${m.from}: ${m.subject ? `[${m.subject}] ` : ''}${m.body}`)
      .join('\n\n');

    const prompt = `Analyze this conversation thread and identify the main topic/theme.

CONVERSATION:
${messagesText}

TASK: Extract the core topic, determine its importance, and categorize it.

OUTPUT (JSON):
{
  "name": "Q4 Product Launch Planning",
  "description": "Team discussing launch timeline, marketing strategy, and resource allocation for new product",
  "category": "project",
  "importance": 8,
  "keywords": ["launch", "Q4", "product", "timeline"],
  "sentiment": "positive",
  "actionItems": ["Review budget", "Schedule kickoff meeting"]
}

CATEGORIES:
- project: Work projects, initiatives, launches
- relationship: Building connections, networking, personal relationships
- transaction: Sales, contracts, purchases, agreements
- support: Help requests, troubleshooting, customer support
- general: General discussions, updates, FYI

IMPORTANCE (1-10):
- 9-10: Critical business decisions, urgent matters
- 7-8: Important ongoing work, key relationships
- 5-6: Regular work discussions, moderate importance
- 3-4: General updates, low-priority conversations
- 1-2: Small talk, FYI messages`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You identify conversation topics and themes. Be concise and specific.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    if (result.name && result.description) {
      return result as ExtractedTopic;
    }

    return null;
  } catch (error) {
    console.error('Error extracting topic:', error);
    return null;
  }
}
