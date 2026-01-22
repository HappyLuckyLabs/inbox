import { prisma } from '@/lib/prisma';
import { extractTodos } from '@/lib/ai/todo-extraction';
import { extractConversationTopic } from '@/lib/ai/topic-extraction';
import { jobQueue } from '@/lib/queue/job-queue';
import { calculatePriorityScore } from '@/lib/scoring/priority-scorer';

/**
 * Three-Tier Message Processing System
 *
 * Tier 1: Instant (< 50ms) - Save message, return to user immediately
 * Tier 2: Fast (< 500ms) - Quick priority scoring with heuristics
 * Tier 3: Background (async) - Deep AI analysis, embeddings, topics
 */

export interface NewMessageData {
  userId: string;
  fromContactId?: string;
  platform: string;
  externalId?: string;
  threadId?: string;
  subject?: string;
  body: string;
  snippet?: string;
  from?: string;
  fromName?: string;
  receivedAt?: Date;
  isRead?: boolean;
}

export interface ProcessedMessage {
  id: string;
  priority: number;
  processingTier: 1 | 2 | 3;
}

/**
 * Process new message through all tiers
 */
export async function processNewMessage(data: NewMessageData): Promise<ProcessedMessage> {
  // TIER 1: Instant save (< 50ms)
  const message = await tier1_InstantSave(data);

  // TIER 2: Fast priority scoring (< 500ms)
  const priority = await tier2_FastPriority(message.id, data);

  // Update message with initial priority
  await prisma.message.update({
    where: { id: message.id },
    data: { priority },
  });

  // TIER 3: Queue background jobs for deep analysis
  tier3_QueueDeepAnalysis(message.id, data);

  return {
    id: message.id,
    priority,
    processingTier: 2, // User gets tier 2 results
  };
}

/**
 * TIER 1: Instant save and notify (< 50ms)
 * No AI, no complex logic - just save and return
 */
async function tier1_InstantSave(data: NewMessageData) {
  const message = await prisma.message.create({
    data: {
      userId: data.userId,
      fromContactId: data.fromContactId || undefined,
      platform: data.platform,
      externalId: data.externalId,
      threadId: data.threadId,
      subject: data.subject,
      body: data.body,
      snippet: data.snippet,
      from: data.from,
      fromName: data.fromName,
      priority: 50, // Neutral default
      isRead: data.isRead || false,
      receivedAt: data.receivedAt || new Date(),
    },
  });

  return message;
}

/**
 * TIER 2: Fast priority scoring (< 500ms)
 * Uses advanced priority scorer with learned patterns
 */
async function tier2_FastPriority(messageId: string, data: NewMessageData): Promise<number> {
  try {
    const result = await calculatePriorityScore({
      userId: data.userId,
      fromContactId: data.fromContactId,
      platform: data.platform,
      subject: data.subject,
      body: data.body,
      from: data.from,
      fromName: data.fromName,
      receivedAt: data.receivedAt,
    });

    // Log if high confidence or high/low priority
    if (result.confidence > 0.7 || result.priority > 80 || result.priority < 20) {
      console.log(
        `[Tier 2] Message ${messageId.slice(0, 8)}: priority=${result.priority}, ` +
        `confidence=${result.confidence.toFixed(2)}, ` +
        `reasons: ${result.explanation.join(', ')}`
      );
    }

    return result.priority;
  } catch (error) {
    console.error('[Tier 2] Error calculating priority:', error);
    return 50; // Return neutral on error
  }
}

/**
 * TIER 3: Queue deep analysis jobs (non-blocking)
 * AI analysis, embeddings, topic extraction, goal extraction
 */
function tier3_QueueDeepAnalysis(messageId: string, data: NewMessageData): void {
  // Job 1: Extract todos
  jobQueue.enqueue({
    type: 'extract_todos',
    messageId,
    userId: data.userId,
    data: {
      body: data.body,
      subject: data.subject,
    },
  });

  // Job 2: Extract/update conversation topics
  jobQueue.enqueue({
    type: 'extract_topics',
    messageId,
    userId: data.userId,
    data: {
      contactId: data.fromContactId,
      body: data.body,
      subject: data.subject,
    },
  });

  // Job 3: Check for goal mentions (run less frequently)
  if (Math.random() < 0.1) { // 10% of messages
    jobQueue.enqueue({
      type: 'extract_goals',
      messageId,
      userId: data.userId,
      data: {
        body: data.body,
        subject: data.subject,
      },
    });
  }

  // Job 4: Generate embeddings (when we implement vector search)
  jobQueue.enqueue({
    type: 'generate_embedding',
    messageId,
    userId: data.userId,
    data: {
      text: (data.subject || '') + '\n\n' + data.body,
    },
  });
}

/**
 * Process background job (called by job queue)
 */
export async function processBackgroundJob(job: any): Promise<void> {
  try {
    switch (job.type) {
      case 'extract_todos':
        await handleExtractTodos(job);
        break;

      case 'extract_topics':
        await handleExtractTopics(job);
        break;

      case 'extract_goals':
        await handleExtractGoals(job);
        break;

      case 'generate_embedding':
        await handleGenerateEmbedding(job);
        break;

      default:
        console.warn('[Background Job] Unknown job type:', job.type);
    }
  } catch (error) {
    console.error('[Background Job] Error processing job:', job.type, error);
  }
}

/**
 * Job handler: Extract todos from message
 */
async function handleExtractTodos(job: any): Promise<void> {
  const { messageId, userId, data } = job;

  const todos = await extractTodos(data.body, data.subject);

  // Save high-confidence todos
  for (const todo of todos.filter(t => t.confidence > 0.6)) {
    await prisma.todoItem.create({
      data: {
        userId,
        title: todo.title,
        description: todo.description,
        status: 'pending',
        priority: todo.priority,
        dueDate: todo.dueDate,
        extractedFrom: messageId,
        confidence: todo.confidence,
      },
    });
  }
}

/**
 * Job handler: Extract conversation topics
 */
async function handleExtractTopics(job: any): Promise<void> {
  const { messageId, userId, data } = job;

  // Get recent messages from this contact
  const recentMessages = await prisma.message.findMany({
    where: {
      userId,
      fromContactId: data.contactId,
    },
    orderBy: { receivedAt: 'desc' },
    take: 5,
    include: {
      fromContact: true,
    },
  });

  if (recentMessages.length < 2) return; // Need conversation context

  const messagesForAnalysis = recentMessages.map(m => ({
    from: m.fromContact?.name || 'Unknown',
    body: m.body,
    subject: m.subject || undefined,
  }));

  const topic = await extractConversationTopic(messagesForAnalysis);

  if (topic && topic.importance >= 6) {
    // Check if topic already exists
    const existingTopic = await prisma.conversationTopic.findFirst({
      where: {
        userId,
        name: topic.name,
      },
    });

    if (existingTopic) {
      // Update existing topic
      await prisma.conversationTopic.update({
        where: { id: existingTopic.id },
        data: {
          lastActivityAt: new Date(),
          importance: Math.max(existingTopic.importance, topic.importance),
          messageCount: { increment: 1 },
        },
      });
    } else {
      // Create new topic
      await prisma.conversationTopic.create({
        data: {
          userId,
          name: topic.name,
          description: topic.description,
          category: topic.category,
          importance: topic.importance,
          participantIds: JSON.stringify([data.contactId]),
          messageIds: JSON.stringify([data.messageId]),
          platforms: JSON.stringify([data.platform]),
          lastActivityAt: new Date(),
          firstSeenAt: new Date(),
          messageCount: 1,
        },
      });
    }
  }
}

/**
 * Job handler: Extract goals (placeholder - will implement when we add goal extraction)
 */
async function handleExtractGoals(job: any): Promise<void> {
  // TODO: Implement goal extraction from message
  // This would analyze message content for goal mentions
  console.log('[Background Job] Goal extraction not yet implemented');
}

/**
 * Job handler: Generate embedding
 */
async function handleGenerateEmbedding(job: any): Promise<void> {
  const { messageId, data } = job;

  // Import dynamically to avoid circular dependencies
  const { generateAndSaveEmbedding } = await import('@/lib/embeddings/embedding-generator');

  const success = await generateAndSaveEmbedding(messageId, data.text);

  if (success) {
    console.log(`[Background Job] Generated embedding for message ${messageId.slice(0, 8)}`);
  } else {
    console.warn(`[Background Job] Failed to generate embedding for message ${messageId.slice(0, 8)}`);
  }
}

/**
 * Batch process multiple messages (for initial sync)
 */
export async function batchProcessMessages(messages: NewMessageData[]): Promise<void> {
  console.log(`[Batch Processing] Starting for ${messages.length} messages`);

  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    await Promise.all(
      batch.map(msg => processNewMessage(msg))
    );

    console.log(`[Batch Processing] Completed ${Math.min(i + batchSize, messages.length)}/${messages.length}`);
  }

  console.log(`[Batch Processing] Complete`);
}
