import { prisma } from '@/lib/prisma';
import { learnPriorityPatterns } from '@/lib/ai/priority-learning';
import { updateLearnedPatterns } from '@/lib/scoring/priority-scorer';

/**
 * Incremental learning system that updates user preferences
 * based on interactions without retraining from scratch
 */
export class PreferenceLearner {
  private userId: string;
  private learningRate = 0.1; // How fast to adapt to new patterns

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Run full learning pipeline
   */
  async learn(): Promise<void> {
    console.log(`[Learning] Starting for user ${this.userId}`);

    try {
      // Get recent interactions (last 7 days)
      const interactions = await prisma.userInteraction.findMany({
        where: {
          userId: this.userId,
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: 'desc' },
        take: 500,
      });

      if (interactions.length < 10) {
        console.log(`[Learning] Not enough interactions yet (${interactions.length})`);
        return;
      }

      // Learn from different interaction types
      await this.learnFromReadPatterns(interactions);
      await this.learnFromReplyPatterns(interactions);
      await this.learnFromPriorityOverrides(interactions);

      // Run AI-powered pattern learning (every few runs)
      await this.runAIPatternsLearning(interactions);

      // Update last learning run
      await prisma.userPreference.upsert({
        where: { userId: this.userId },
        create: {
          userId: this.userId,
          lastLearningRun: new Date(),
          samplesAnalyzed: interactions.length,
        },
        update: {
          lastLearningRun: new Date(),
          samplesAnalyzed: { increment: interactions.length },
        },
      });

      console.log(`[Learning] Complete for user ${this.userId} - analyzed ${interactions.length} interactions`);
    } catch (error) {
      console.error(`[Learning] Error for user ${this.userId}:`, error);
    }
  }

  /**
   * Learn from message read patterns
   */
  private async learnFromReadPatterns(interactions: any[]): Promise<void> {
    const readEvents = interactions.filter(i => i.eventType === 'message_read' && i.messageId);

    if (readEvents.length === 0) return;

    // Get messages that were read
    const messageIds = readEvents.map(e => e.messageId!);
    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
      include: { fromContact: true },
    });

    // Calculate time to read for each message
    const readTimes: Record<string, number> = {};
    readEvents.forEach(event => {
      const message = messages.find(m => m.id === event.messageId);
      if (message) {
        const timeToRead = event.timestamp.getTime() - message.createdAt.getTime();
        readTimes[event.messageId!] = timeToRead;
      }
    });

    // Messages read quickly (< 5 min) are important
    const quickReads = Object.entries(readTimes)
      .filter(([_, time]) => time < 5 * 60 * 1000)
      .map(([id]) => id);

    // Boost importance of contacts whose messages are read quickly
    for (const messageId of quickReads) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        await this.updateContactImportance(message.fromContactId, 0.2);
      }
    }
  }

  /**
   * Learn from reply patterns
   */
  private async learnFromReplyPatterns(interactions: any[]): Promise<void> {
    const replyEvents = interactions.filter(i => i.eventType === 'message_replied' && i.contactId);

    if (replyEvents.length === 0) return;

    // Contacts user replies to frequently are important
    const contactReplyCounts: Record<string, number> = {};
    replyEvents.forEach(event => {
      if (event.contactId) {
        contactReplyCounts[event.contactId] = (contactReplyCounts[event.contactId] || 0) + 1;
      }
    });

    // Update importance for frequently replied contacts
    for (const [contactId, count] of Object.entries(contactReplyCounts)) {
      const boost = Math.min(count * 0.1, 1.0); // Cap at +1.0
      await this.updateContactImportance(contactId, boost);
    }
  }

  /**
   * Learn from priority overrides
   */
  private async learnFromPriorityOverrides(interactions: any[]): Promise<void> {
    const overrideEvents = interactions.filter(i =>
      (i.eventType === 'priority_increased' || i.eventType === 'priority_decreased') &&
      i.messageId
    );

    if (overrideEvents.length === 0) return;

    // Get messages that had priority overridden
    const messageIds = overrideEvents.map(e => e.messageId!);
    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
      include: { fromContact: true },
    });

    // Update preferences based on overrides
    const prefs = await this.getOrCreatePreferences();
    const keywordWeights = JSON.parse(prefs.keywordImportance || '{}');
    const platformWeights = JSON.parse(prefs.platformPreferences || '{}');

    overrideEvents.forEach(event => {
      const message = messages.find(m => m.id === event.messageId);
      if (!message) return;

      const delta = event.eventType === 'priority_increased' ? 0.05 : -0.05;

      // Update platform weight
      const currentPlatformWeight = platformWeights[message.platform] || 0.5;
      platformWeights[message.platform] = Math.max(0, Math.min(1, currentPlatformWeight + delta));

      // Extract and update keyword weights
      const keywords = this.extractKeywords(message.body + ' ' + (message.subject || ''));
      keywords.forEach(keyword => {
        const currentWeight = keywordWeights[keyword] || 0.5;
        keywordWeights[keyword] = Math.max(0, Math.min(1, currentWeight + delta));
      });
    });

    // Save updated preferences
    await prisma.userPreference.update({
      where: { userId: this.userId },
      data: {
        keywordImportance: JSON.stringify(keywordWeights),
        platformPreferences: JSON.stringify(platformWeights),
      },
    });
  }

  /**
   * Update contact importance with exponential moving average
   */
  private async updateContactImportance(contactId: string, delta: number): Promise<void> {
    try {
      const importance = await prisma.contactImportance.findUnique({
        where: { userId_contactId: { userId: this.userId, contactId } },
      });

      if (importance) {
        const newScore = Math.max(0, Math.min(10,
          importance.importanceScore + delta * this.learningRate
        ));

        await prisma.contactImportance.update({
          where: { id: importance.id },
          data: {
            importanceScore: newScore,
            interactionCount: { increment: 1 },
          },
        });
      } else {
        // Create new importance record
        await prisma.contactImportance.create({
          data: {
            userId: this.userId,
            contactId,
            importanceScore: Math.max(0, Math.min(10, 5.0 + delta)),
            interactionCount: 1,
          },
        });
      }
    } catch (error) {
      console.error('Error updating contact importance:', error);
    }
  }

  /**
   * Get or create user preferences
   */
  private async getOrCreatePreferences() {
    let prefs = await prisma.userPreference.findUnique({
      where: { userId: this.userId },
    });

    if (!prefs) {
      prefs = await prisma.userPreference.create({
        data: {
          userId: this.userId,
          keywordImportance: '{}',
          platformPreferences: '{}',
          senderPreferences: '{}',
        },
      });
    }

    return prefs;
  }

  /**
   * Extract keywords from text (simplified)
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Run AI-powered pattern learning
   * Uses OpenAI to discover complex patterns in interactions
   */
  private async runAIPatternsLearning(interactions: any[]): Promise<void> {
    try {
      // Only run AI learning if we have enough data
      if (interactions.length < 50) return;

      // Get recent messages for context
      const messages = await prisma.message.findMany({
        where: { userId: this.userId },
        orderBy: { receivedAt: 'desc' },
        take: 100,
        include: { fromContact: true },
      });

      // Call AI pattern learning
      console.log(`[Learning] Running AI pattern discovery for user ${this.userId}`);
      const patterns = await learnPriorityPatterns(interactions, messages);

      // Update learned patterns in priority scorer
      await updateLearnedPatterns(this.userId, patterns);

      console.log(`[Learning] AI patterns updated - discovered ${patterns.patterns.length} patterns`);
    } catch (error) {
      console.error('[Learning] Error running AI pattern learning:', error);
      // Don't throw - learning failures shouldn't break the app
    }
  }
}

/**
 * Run learning for a user
 */
export async function runLearningPipeline(userId: string): Promise<void> {
  const learner = new PreferenceLearner(userId);
  await learner.learn();
}

/**
 * Run learning for all active users
 */
export async function runLearningForAllUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  console.log(`[Learning] Running for ${users.length} users`);

  for (const user of users) {
    await runLearningPipeline(user.id);
  }

  console.log(`[Learning] Complete for all users`);
}
