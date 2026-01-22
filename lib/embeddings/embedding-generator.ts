import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Vector embeddings for semantic message search
 * Uses OpenAI text-embedding-3-small model
 * Cost: ~$0.00002 per 1K tokens
 */

export interface EmbeddingResult {
  messageId: string;
  embedding: number[];
  model: string;
}

/**
 * Generate embedding for a message
 */
export async function generateMessageEmbedding(
  messageId: string,
  text: string
): Promise<EmbeddingResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Embeddings] OpenAI API key not configured');
    return null;
  }

  try {
    // Clean and prepare text
    const cleanText = cleanTextForEmbedding(text);

    if (cleanText.length < 10) {
      console.log(`[Embeddings] Text too short for message ${messageId}`);
      return null;
    }

    // Generate embedding using OpenAI
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions, $0.02 per 1M tokens
      input: cleanText,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;

    return {
      messageId,
      embedding,
      model: 'text-embedding-3-small',
    };
  } catch (error) {
    console.error(`[Embeddings] Error generating embedding for message ${messageId}:`, error);
    return null;
  }
}

/**
 * Generate and save embedding for a message
 */
export async function generateAndSaveEmbedding(
  messageId: string,
  text: string
): Promise<boolean> {
  const result = await generateMessageEmbedding(messageId, text);

  if (!result) {
    return false;
  }

  try {
    // Save to database
    await prisma.messageEmbedding.upsert({
      where: { messageId },
      create: {
        messageId,
        embedding: JSON.stringify(result.embedding),
        model: result.model,
      },
      update: {
        embedding: JSON.stringify(result.embedding),
        model: result.model,
      },
    });

    return true;
  } catch (error) {
    console.error(`[Embeddings] Error saving embedding for message ${messageId}:`, error);
    return false;
  }
}

/**
 * Batch generate embeddings for multiple messages
 */
export async function batchGenerateEmbeddings(
  messages: Array<{ id: string; text: string }>
): Promise<{ succeeded: number; failed: number }> {
  const results = {
    succeeded: 0,
    failed: 0,
  };

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    const promises = batch.map(msg => generateAndSaveEmbedding(msg.id, msg.text));
    const batchResults = await Promise.all(promises);

    batchResults.forEach(success => {
      if (success) {
        results.succeeded++;
      } else {
        results.failed++;
      }
    });

    // Small delay between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar messages using embeddings
 */
export async function findSimilarMessages(
  messageId: string,
  limit: number = 10,
  minSimilarity: number = 0.7
): Promise<Array<{ messageId: string; similarity: number }>> {
  try {
    // Get embedding for source message
    const sourceEmbedding = await prisma.messageEmbedding.findUnique({
      where: { messageId },
    });

    if (!sourceEmbedding) {
      console.log(`[Embeddings] No embedding found for message ${messageId}`);
      return [];
    }

    const sourceVector = JSON.parse(sourceEmbedding.embedding);

    // Get message to determine userId
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { userId: true },
    });

    if (!message) {
      return [];
    }

    // Get all embeddings for this user
    const userEmbeddings = await prisma.messageEmbedding.findMany({
      where: {
        message: {
          userId: message.userId,
        },
        messageId: { not: messageId }, // Exclude source message
      },
      include: {
        message: {
          select: {
            id: true,
            subject: true,
            fromContact: { select: { name: true } },
            receivedAt: true,
          },
        },
      },
    });

    // Calculate similarities
    const similarities = userEmbeddings
      .map(embedding => {
        const targetVector = JSON.parse(embedding.embedding);
        const similarity = cosineSimilarity(sourceVector, targetVector);

        return {
          messageId: embedding.messageId,
          similarity,
        };
      })
      .filter(result => result.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  } catch (error) {
    console.error('[Embeddings] Error finding similar messages:', error);
    return [];
  }
}

/**
 * Search messages by semantic similarity to query text
 */
export async function semanticSearch(
  userId: string,
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.6
): Promise<Array<{ messageId: string; similarity: number; message: any }>> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Embeddings] OpenAI API key not configured');
    return [];
  }

  try {
    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanTextForEmbedding(query),
      encoding_format: 'float',
    });

    const queryVector = response.data[0].embedding;

    // Get all embeddings for this user
    const userEmbeddings = await prisma.messageEmbedding.findMany({
      where: {
        message: {
          userId,
        },
      },
      include: {
        message: {
          include: {
            fromContact: true,
          },
        },
      },
    });

    // Calculate similarities
    const results = userEmbeddings
      .map(embedding => {
        const targetVector = JSON.parse(embedding.embedding);
        const similarity = cosineSimilarity(queryVector, targetVector);

        return {
          messageId: embedding.messageId,
          similarity,
          message: embedding.message,
        };
      })
      .filter(result => result.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('[Embeddings] Error performing semantic search:', error);
    return [];
  }
}

/**
 * Clean text for embedding
 */
function cleanTextForEmbedding(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, '') // Remove special chars
    .trim()
    .slice(0, 8000); // Limit to ~8K characters (~2K tokens)
}

/**
 * Generate embeddings for all messages without embeddings
 */
export async function generateMissingEmbeddings(
  userId?: string,
  limit: number = 100
): Promise<{ generated: number; failed: number }> {
  try {
    // Find messages without embeddings
    const messagesWithoutEmbeddings = await prisma.message.findMany({
      where: {
        ...(userId ? { userId } : {}),
        embedding: null,
      },
      select: {
        id: true,
        subject: true,
        body: true,
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });

    if (messagesWithoutEmbeddings.length === 0) {
      console.log('[Embeddings] No messages need embeddings');
      return { generated: 0, failed: 0 };
    }

    console.log(`[Embeddings] Generating embeddings for ${messagesWithoutEmbeddings.length} messages`);

    const messagesToEmbed = messagesWithoutEmbeddings.map(m => ({
      id: m.id,
      text: `${m.subject || ''}\n\n${m.body}`.trim(),
    }));

    const results = await batchGenerateEmbeddings(messagesToEmbed);

    console.log(`[Embeddings] Complete - generated: ${results.succeeded}, failed: ${results.failed}`);

    return { generated: results.succeeded, failed: results.failed };
  } catch (error) {
    console.error('[Embeddings] Error generating missing embeddings:', error);
    return { generated: 0, failed: 0 };
  }
}
