import { prisma } from '@/lib/prisma';
import { learnPriorityPatterns, PriorityPreferences } from '@/lib/ai/priority-learning';

/**
 * Advanced priority scoring using learned preferences
 * Combines heuristics with AI-learned patterns
 */

export interface MessageContext {
  userId: string;
  fromContactId?: string;
  platform: string;
  subject?: string;
  body: string;
  from?: string;
  fromName?: string;
  receivedAt?: Date;
}

export interface ScoringResult {
  priority: number;
  confidence: number;
  factors: {
    contactImportance: number;
    platformWeight: number;
    keywordMatch: number;
    urgencyHeuristic: number;
    recencyBoost: number;
    aiLearned: number;
  };
  explanation: string[];
}

/**
 * Calculate comprehensive priority score
 */
export async function calculatePriorityScore(context: MessageContext): Promise<ScoringResult> {
  const factors = {
    contactImportance: 0,
    platformWeight: 0,
    keywordMatch: 0,
    urgencyHeuristic: 0,
    recencyBoost: 0,
    aiLearned: 0,
  };

  const explanation: string[] = [];
  let baseScore = 50;
  let confidence = 0.5;

  try {
    // Get user preferences and contact importance
    const [prefs, contactImportance] = await Promise.all([
      prisma.userPreference.findUnique({
        where: { userId: context.userId },
      }),
      context.fromContactId ? prisma.contactImportance.findUnique({
        where: {
          userId_contactId: {
            userId: context.userId,
            contactId: context.fromContactId,
          },
        },
      }) : null,
    ]);

    // Factor 1: Contact Importance (weight: 30%)
    if (contactImportance) {
      const contactScore = (contactImportance.importanceScore - 5) * 6; // -30 to +30
      factors.contactImportance = contactScore;
      baseScore += contactScore;

      if (contactImportance.importanceScore > 7) {
        explanation.push(`High-priority contact (importance: ${contactImportance.importanceScore.toFixed(1)})`);
        confidence += 0.2;
      } else if (contactImportance.importanceScore < 3) {
        explanation.push(`Low-priority contact (importance: ${contactImportance.importanceScore.toFixed(1)})`);
        confidence += 0.1;
      }
    }

    // Factor 2: Platform Preferences (weight: 10%)
    if (prefs?.platformPreferences) {
      try {
        const platformWeights = JSON.parse(prefs.platformPreferences);
        const platformWeight = platformWeights[context.platform] || 0.5;
        const platformScore = (platformWeight - 0.5) * 20; // -10 to +10

        factors.platformWeight = platformScore;
        baseScore += platformScore;

        if (platformWeight > 0.7) {
          explanation.push(`Preferred platform: ${context.platform}`);
          confidence += 0.1;
        }
      } catch (e) {
        console.error('Error parsing platform preferences:', e);
      }
    }

    // Factor 3: Keyword Matching (weight: 20%)
    if (prefs?.keywordImportance) {
      try {
        const keywordWeights = JSON.parse(prefs.keywordImportance);
        const text = ((context.subject || '') + ' ' + context.body).toLowerCase();

        let keywordScore = 0;
        const matchedKeywords: string[] = [];

        for (const [keyword, weight] of Object.entries(keywordWeights)) {
          if (text.includes(keyword.toLowerCase())) {
            const contribution = ((weight as number) - 0.5) * 15;
            keywordScore += contribution;
            matchedKeywords.push(keyword);
          }
        }

        factors.keywordMatch = Math.max(-20, Math.min(20, keywordScore));
        baseScore += factors.keywordMatch;

        if (matchedKeywords.length > 0) {
          explanation.push(`Keyword match: ${matchedKeywords.slice(0, 3).join(', ')}`);
          confidence += 0.15;
        }
      } catch (e) {
        console.error('Error parsing keyword importance:', e);
      }
    }

    // Factor 4: Urgency Heuristics (weight: 25%)
    const urgentKeywords = [
      { word: 'urgent', score: 15 },
      { word: 'asap', score: 15 },
      { word: 'immediately', score: 12 },
      { word: 'critical', score: 12 },
      { word: 'emergency', score: 10 },
      { word: 'deadline', score: 10 },
      { word: 'important', score: 8 },
      { word: 'priority', score: 8 },
      { word: 'time-sensitive', score: 10 },
      { word: 'needs attention', score: 8 },
    ];

    const text = ((context.subject || '') + ' ' + context.body).toLowerCase();
    let urgencyScore = 0;

    for (const { word, score } of urgentKeywords) {
      if (text.includes(word)) {
        urgencyScore += score;
      }
    }

    factors.urgencyHeuristic = Math.min(urgencyScore, 25);
    baseScore += factors.urgencyHeuristic;

    if (urgencyScore > 0) {
      explanation.push(`Urgent keywords detected`);
      confidence += 0.2;
    }

    // Factor 5: Recency Boost (weight: 10%)
    if (contactImportance?.lastInteraction) {
      const hoursSinceLastInteraction =
        (Date.now() - contactImportance.lastInteraction.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastInteraction < 2) {
        factors.recencyBoost = 15;
        baseScore += 15;
        explanation.push('Active conversation');
        confidence += 0.15;
      } else if (hoursSinceLastInteraction < 24) {
        factors.recencyBoost = 8;
        baseScore += 8;
        explanation.push('Recent conversation');
        confidence += 0.1;
      }
    }

    // Factor 6: AI-Learned Patterns (weight: 5%)
    // Use cached AI-learned patterns if available
    if (prefs?.senderPreferences && context.fromContactId) {
      try {
        const senderPrefs = JSON.parse(prefs.senderPreferences);
        const senderWeight = senderPrefs[context.fromContactId];

        if (senderWeight) {
          const aiScore = (senderWeight - 0.5) * 10;
          factors.aiLearned = aiScore;
          baseScore += aiScore;
          confidence += 0.05;
        }
      } catch (e) {
        console.error('Error parsing sender preferences:', e);
      }
    }

    // Clamp final score to 0-100
    const finalScore = Math.max(0, Math.min(100, baseScore));

    // Clamp confidence to 0-1
    const finalConfidence = Math.max(0, Math.min(1, confidence));

    return {
      priority: Math.round(finalScore),
      confidence: finalConfidence,
      factors,
      explanation,
    };
  } catch (error) {
    console.error('[Priority Scorer] Error:', error);
    return {
      priority: 50,
      confidence: 0.3,
      factors,
      explanation: ['Default priority (error during scoring)'],
    };
  }
}

/**
 * Recalculate priority for existing message
 */
export async function recalculatePriority(messageId: string): Promise<number> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error(`Message ${messageId} not found`);
  }

  const result = await calculatePriorityScore({
    userId: message.userId,
    fromContactId: message.fromContactId || undefined,
    platform: message.platform,
    subject: message.subject || undefined,
    body: message.body,
    receivedAt: message.receivedAt,
  });

  // Update message with new priority
  await prisma.message.update({
    where: { id: messageId },
    data: { priority: result.priority },
  });

  return result.priority;
}

/**
 * Batch recalculate priorities for user's messages
 */
export async function batchRecalculatePriorities(userId: string): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { userId },
    orderBy: { receivedAt: 'desc' },
    take: 100, // Limit to recent messages
  });

  console.log(`[Priority Scorer] Recalculating priorities for ${messages.length} messages`);

  for (const message of messages) {
    try {
      await recalculatePriority(message.id);
    } catch (error) {
      console.error(`[Priority Scorer] Error recalculating priority for ${message.id}:`, error);
    }
  }

  console.log(`[Priority Scorer] Complete`);
}

/**
 * Update AI-learned patterns (called by learning pipeline)
 */
export async function updateLearnedPatterns(
  userId: string,
  patterns: PriorityPreferences
): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      senderPreferences: JSON.stringify(patterns.senderWeights),
      keywordImportance: JSON.stringify(patterns.keywordWeights),
      platformPreferences: JSON.stringify(patterns.platformWeights),
    },
    update: {
      senderPreferences: JSON.stringify(patterns.senderWeights),
      keywordImportance: JSON.stringify(patterns.keywordWeights),
      platformPreferences: JSON.stringify(patterns.platformWeights),
    },
  });

  console.log(`[Priority Scorer] Updated learned patterns for user ${userId}`);
}
