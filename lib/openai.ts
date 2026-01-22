import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

export interface PriorityAnalysis {
  priority: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  reasoning: string;
}

export async function analyzeMessagePriority(
  messageContent: string,
  subject?: string,
  senderName?: string
): Promise<PriorityAnalysis> {
  try {
    const prompt = `Analyze this message and provide a priority score (0-100), sentiment, and category.

Message:
Subject: ${subject || 'N/A'}
From: ${senderName || 'Unknown'}
Content: ${messageContent}

Respond in JSON format:
{
  "priority": <number 0-100>,
  "sentiment": <"positive" | "neutral" | "negative">,
  "category": <brief category like "Sales Contract", "Project Update", etc.>,
  "reasoning": <brief explanation>
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that analyzes business messages to determine their priority, sentiment, and category. Higher priority (70-100) for urgent matters, contracts, deadlines. Medium (40-69) for important updates. Low (0-39) for general info.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      priority: result.priority || 50,
      sentiment: result.sentiment || 'neutral',
      category: result.category || 'General',
      reasoning: result.reasoning || ''
    };
  } catch (error) {
    console.error('Error analyzing message priority:', error);
    // Return default values if API call fails
    return {
      priority: 50,
      sentiment: 'neutral',
      category: 'General',
      reasoning: 'Analysis unavailable'
    };
  }
}

export interface ReplyDraft {
  content: string;
  tone: string;
}

export async function generateReply(
  messageContent: string,
  conversationHistory?: string[],
  userWritingStyle?: string
): Promise<ReplyDraft> {
  try {
    const historyContext = conversationHistory?.join('\n\n') || '';

    const prompt = `Generate a professional reply to this message.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}
Current message to reply to:
${messageContent}

${userWritingStyle ? `User's writing style: ${userWritingStyle}` : 'Use a professional but friendly tone.'}

Generate a concise, appropriate reply.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that helps draft professional email and message replies. Match the user\'s writing style and tone when provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || 'Thank you for your message. I will review and get back to you soon.';

    return {
      content,
      tone: 'professional'
    };
  } catch (error) {
    console.error('Error generating reply:', error);
    return {
      content: 'Thank you for your message. I will review and get back to you soon.',
      tone: 'professional'
    };
  }
}

export async function summarizeConversation(messages: string[]): Promise<string> {
  try {
    const conversation = messages.join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that summarizes conversations concisely. Focus on key points, decisions, and action items.'
        },
        {
          role: 'user',
          content: `Summarize this conversation in 2-3 sentences:\n\n${conversation}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0].message.content || 'Conversation summary unavailable.';
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return 'Conversation summary unavailable.';
  }
}

export async function learnWritingStyle(userMessages: string[]): Promise<string> {
  try {
    const samples = userMessages.slice(0, 10).join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI that analyzes writing style. Describe the user\'s writing style based on their messages, including tone, formality, common phrases, and typical structure.'
        },
        {
          role: 'user',
          content: `Analyze the writing style from these messages:\n\n${samples}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0].message.content || 'Professional and concise';
  } catch (error) {
    console.error('Error learning writing style:', error);
    return 'Professional and concise';
  }
}
