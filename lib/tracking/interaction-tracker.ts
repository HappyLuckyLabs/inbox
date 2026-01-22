import { prisma } from '@/lib/prisma';

export type InteractionType =
  | 'message_opened'
  | 'message_read'
  | 'message_replied'
  | 'message_starred'
  | 'message_archived'
  | 'message_deleted'
  | 'priority_increased'
  | 'priority_decreased'
  | 'contact_clicked'
  | 'todo_completed'
  | 'todo_dismissed';

export interface TrackInteractionParams {
  userId: string;
  eventType: InteractionType;
  messageId?: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track user interactions for learning preferences
 */
export async function trackInteraction(params: TrackInteractionParams): Promise<void> {
  const { userId, eventType, messageId, contactId, metadata } = params;

  try {
    await prisma.userInteraction.create({
      data: {
        userId,
        eventType,
        messageId,
        contactId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date(),
      },
    });

    // Trigger lightweight updates based on interaction type
    if (eventType === 'message_replied' && contactId) {
      await updateContactResponseRate(userId, contactId);
    }

    if (eventType === 'message_read' && messageId) {
      await markMessageAsRead(messageId);
    }

    if (eventType.startsWith('priority_') && messageId) {
      await handlePriorityOverride(userId, messageId, eventType);
    }
  } catch (error) {
    console.error('Error tracking interaction:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Update contact response rate when user replies
 */
async function updateContactResponseRate(userId: string, contactId: string): Promise<void> {
  try {
    const importance = await prisma.contactImportance.findUnique({
      where: { userId_contactId: { userId, contactId } },
    });

    if (importance) {
      // Increment interaction count
      await prisma.contactImportance.update({
        where: { id: importance.id },
        data: {
          interactionCount: { increment: 1 },
          lastInteraction: new Date(),
          // Boost importance score slightly for replies
          importanceScore: Math.min(10, importance.importanceScore + 0.1),
        },
      });
    } else {
      // Create new importance record
      await prisma.contactImportance.create({
        data: {
          userId,
          contactId,
          importanceScore: 6.0, // Start above average for replied contacts
          interactionCount: 1,
          lastInteraction: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating contact response rate:', error);
  }
}

/**
 * Mark message as read
 */
async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

/**
 * Handle priority override interactions for learning
 */
async function handlePriorityOverride(
  userId: string,
  messageId: string,
  eventType: 'priority_increased' | 'priority_decreased'
): Promise<void> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { fromContact: true },
    });

    if (!message) return;

    // Extract keywords from message for learning
    const keywords = extractKeywords(message.body + ' ' + (message.subject || ''));

    // Update preference keywords based on override
    const prefs = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (prefs && prefs.keywordImportance) {
      const weights = JSON.parse(prefs.keywordImportance);
      const delta = eventType === 'priority_increased' ? 0.1 : -0.1;

      keywords.forEach(keyword => {
        const current = weights[keyword] || 0.5;
        weights[keyword] = Math.max(0, Math.min(1, current + delta));
      });

      await prisma.userPreference.update({
        where: { userId },
        data: {
          keywordImportance: JSON.stringify(weights),
          samplesAnalyzed: { increment: 1 },
        },
      });
    }

    // Update contact importance
    const importance = await prisma.contactImportance.findUnique({
      where: { userId_contactId: { userId, contactId: message.fromContactId } },
    });

    if (importance) {
      const delta = eventType === 'priority_increased' ? 0.3 : -0.3;
      await prisma.contactImportance.update({
        where: { id: importance.id },
        data: {
          importanceScore: Math.max(0, Math.min(10, importance.importanceScore + delta)),
        },
      });
    }
  } catch (error) {
    console.error('Error handling priority override:', error);
  }
}

/**
 * Extract important keywords from text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top 10 most frequent words
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Get interaction summary for a user
 */
export async function getInteractionSummary(
  userId: string,
  days: number = 7
): Promise<{
  totalInteractions: number;
  messageReads: number;
  messageReplies: number;
  priorityOverrides: number;
  topContacts: Array<{ contactId: string; count: number }>;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const interactions = await prisma.userInteraction.findMany({
    where: {
      userId,
      timestamp: { gte: since },
    },
  });

  const summary = {
    totalInteractions: interactions.length,
    messageReads: interactions.filter(i => i.eventType === 'message_read').length,
    messageReplies: interactions.filter(i => i.eventType === 'message_replied').length,
    priorityOverrides: interactions.filter(i => i.eventType.startsWith('priority_')).length,
    topContacts: [] as Array<{ contactId: string; count: number }>,
  };

  // Count interactions per contact
  const contactCounts: Record<string, number> = {};
  interactions
    .filter(i => i.contactId)
    .forEach(i => {
      contactCounts[i.contactId!] = (contactCounts[i.contactId!] || 0) + 1;
    });

  summary.topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([contactId, count]) => ({ contactId, count }));

  return summary;
}
