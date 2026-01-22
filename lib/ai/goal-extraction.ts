import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ExtractedGoal {
  goal: string;
  category: 'work' | 'personal' | 'learning' | 'relationship' | 'financial';
  priority: number; // 1-10
  confidence: number; // 0-1
  keywords: string[];
  evidence: string;
}

export async function extractUserGoals(
  messagesText: string,
  existingGoals: string[]
): Promise<ExtractedGoal[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const existingGoalsText = existingGoals.length > 0
      ? existingGoals.map(g => `- ${g}`).join('\n')
      : 'None yet';

    const prompt = `You are analyzing a user's messages to understand their goals and priorities.

EXISTING GOALS:
${existingGoalsText}

RECENT MESSAGES:
${messagesText}

TASK: Extract concrete goals, intentions, or priorities the user mentions.

CRITERIA:
- Only extract specific, actionable goals
- Categorize as: work, personal, learning, relationship, financial
- Assign priority 1-10 based on urgency/emphasis in messages
- Provide confidence 0.0-1.0 (how certain you are)
- Extract keywords that signal this goal
- Provide evidence from messages

OUTPUT FORMAT (JSON):
{
  "goals": [
    {
      "goal": "Close Q1 sales deals with enterprise clients",
      "category": "work",
      "priority": 9,
      "confidence": 0.85,
      "keywords": ["Q1", "sales", "deals", "enterprise", "close"],
      "evidence": "User discussed Q1 targets in 3 messages and emphasized urgency"
    }
  ]
}

Only include NEW goals not already in the existing list.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You extract user goals from conversations. Be specific and look for clear goals, not vague intentions.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"goals":[]}');
    return result.goals || [];
  } catch (error) {
    console.error('Error extracting goals:', error);
    return [];
  }
}
