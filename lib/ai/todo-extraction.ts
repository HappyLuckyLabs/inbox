import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ExtractedTodo {
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  priority: number; // 1-10
  confidence: number; // 0-1
  snippet: string;
}

export async function extractTodos(
  messageBody: string,
  messageSubject?: string,
  senderName?: string
): Promise<ExtractedTodo[]> {
  if (!process.env.OPENAI_API_KEY) {
    return []; // Return empty if no API key
  }

  try {
    const prompt = `Extract action items from this message.

MESSAGE:
From: ${senderName || 'Unknown'}
Subject: ${messageSubject || 'N/A'}
Body: ${messageBody}

TASK: Find tasks, action items, or to-dos for the recipient (the person reading this message).

CRITERIA:
- Only extract items that require the RECIPIENT's action
- Assign priority 1-10 based on urgency (1=low, 10=critical)
- Extract due dates if mentioned (use ISO format YYYY-MM-DD)
- Provide confidence 0.0-1.0 (how certain you are this is an action item)
- Include a snippet showing where in the message this todo was found

OUTPUT (JSON):
{
  "todos": [
    {
      "title": "Review Q3 budget proposal",
      "description": "Sarah asked you to review the budget and provide feedback",
      "dueDate": "2026-01-25",
      "priority": 8,
      "confidence": 0.9,
      "snippet": "Can you review the budget by Friday?"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You extract action items from messages. Be conservative - only extract clear action items, not general discussions.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"todos":[]}');
    return result.todos || [];
  } catch (error) {
    console.error('Error extracting todos:', error);
    return [];
  }
}

// Fallback regex-based todo extraction (no API required)
export function extractTodosWithRegex(text: string): ExtractedTodo[] {
  const todos: ExtractedTodo[] = [];

  // Pattern 1: "Can you [action]"
  const canYouPattern = /can you ([^.?!]+)[.?!]/gi;
  let match;
  while ((match = canYouPattern.exec(text)) !== null) {
    todos.push({
      title: match[1].trim(),
      priority: 6,
      confidence: 0.6,
      snippet: match[0],
    });
  }

  // Pattern 2: "Please [action]"
  const pleasePattern = /please ([^.?!]+)[.?!]/gi;
  while ((match = pleasePattern.exec(text)) !== null) {
    todos.push({
      title: match[1].trim(),
      priority: 7,
      confidence: 0.7,
      snippet: match[0],
    });
  }

  // Pattern 3: "Need to [action]" or "need you to [action]"
  const needPattern = /need (?:you )?to ([^.?!]+)[.?!]/gi;
  while ((match = needPattern.exec(text)) !== null) {
    todos.push({
      title: match[1].trim(),
      priority: 7,
      confidence: 0.65,
      snippet: match[0],
    });
  }

  return todos.slice(0, 5); // Limit to 5 todos
}
