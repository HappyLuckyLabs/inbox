import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface MessageSummary {
  from: string;
  subject?: string;
  snippet: string;
  priority: number;
}

export interface TopicSummary {
  name: string;
  messageCount: number;
}

export interface TodoSummary {
  title: string;
  dueDate?: string;
}

export async function generateDailySummary(
  messages: MessageSummary[],
  topics: TopicSummary[],
  todos: TodoSummary[],
  userName: string = 'there'
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return generateBasicSummary(messages, topics, todos, userName);
  }

  try {
    const highPriorityMsgs = messages.filter(m => m.priority > 70);
    const unreadCount = messages.length;

    const prompt = `Generate a personalized daily inbox summary for the user.

TODAY'S STATS:
- Total messages: ${messages.length}
- High priority: ${highPriorityMsgs.length}

TOP MESSAGES:
${highPriorityMsgs.slice(0, 5).map(m =>
  `- [${m.priority}] ${m.from}: ${m.subject || m.snippet}`
).join('\n')}

ACTIVE TOPICS:
${topics.slice(0, 5).map(t => `- ${t.name} (${t.messageCount} messages)`).join('\n')}

ACTION ITEMS:
${todos.slice(0, 5).map(t =>
  `- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`
).join('\n')}

TASK: Write a concise, personalized summary in 2-3 paragraphs.

STYLE:
- Friendly but professional
- Address user by name if known: "${userName}"
- Highlight what needs attention TODAY
- Mention patterns (e.g., "lots of sales discussions today")
- End with 1-2 actionable next steps with emoji
- Keep it under 150 words

EXAMPLE:
"Good morning, Sarah! You have 12 new messages with 3 requiring immediate attention. Sarah Chen reached out about the Q4 product launch timeline, and there's a contract waiting for your review from Brightstone Realty.

Most of today's conversations revolve around sales and project planning. The team has been active on Slack discussing the marketing campaign launch.

🎯 Top priorities: Review the Brightstone contract (due today) and respond to Sarah's launch timeline question."`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You write personalized daily summaries that are warm, actionable, and concise.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    return response.choices[0].message.content || generateBasicSummary(messages, topics, todos, userName);
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return generateBasicSummary(messages, topics, todos, userName);
  }
}

// Fallback basic summary (no API required)
export function generateBasicSummary(
  messages: MessageSummary[],
  topics: TopicSummary[],
  todos: TodoSummary[],
  userName: string = 'there'
): string {
  const highPriority = messages.filter(m => m.priority > 70).length;

  const greeting = userName !== 'there' ? `Good morning, ${userName}!` : 'Good morning!';

  const messageSummary = messages.length === 0
    ? 'Your inbox is clear.'
    : `You have ${messages.length} message${messages.length !== 1 ? 's' : ''}${highPriority > 0 ? ` with ${highPriority} requiring immediate attention` : ''}.`;

  const topicSummary = topics.length > 0
    ? `\n\nActive conversations: ${topics.slice(0, 3).map(t => t.name).join(', ')}.`
    : '';

  const todoSummary = todos.length > 0
    ? `\n\n🎯 Action items: ${todos.slice(0, 3).map(t => t.title).join(', ')}.`
    : '';

  return `${greeting} ${messageSummary}${topicSummary}${todoSummary}`;
}
