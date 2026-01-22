import { EventEmitter } from 'events';

/**
 * Simple in-memory job queue using EventEmitter
 * For production, consider Bull, BullMQ, or similar with Redis
 */

export type JobType =
  | 'extract_todos'
  | 'extract_topics'
  | 'extract_goals'
  | 'generate_embedding'
  | 'generate_daily_summary'
  | 'run_learning';

export interface Job {
  id?: string;
  type: JobType;
  messageId?: string;
  userId: string;
  data: any;
  retries?: number;
  createdAt?: Date;
}

class JobQueue extends EventEmitter {
  private queue: Job[] = [];
  private processing = false;
  private maxConcurrent = 3; // Process up to 3 jobs concurrently
  private activeJobs = 0;
  private maxRetries = 3;

  constructor() {
    super();
    this.startProcessing();
  }

  /**
   * Add job to queue
   */
  enqueue(job: Job): void {
    const jobWithMeta: Job = {
      ...job,
      id: this.generateJobId(),
      retries: 0,
      createdAt: new Date(),
    };

    this.queue.push(jobWithMeta);
    this.emit('job:enqueued', jobWithMeta);

    // Trigger processing if not already running
    this.processNext();
  }

  /**
   * Add multiple jobs at once
   */
  enqueueBatch(jobs: Job[]): void {
    jobs.forEach(job => this.enqueue(job));
  }

  /**
   * Start processing jobs from queue
   */
  private startProcessing(): void {
    this.processing = true;

    // Process jobs as they arrive
    this.on('job:enqueued', () => {
      this.processNext();
    });

    // Handle job completion
    this.on('job:completed', () => {
      this.activeJobs--;
      this.processNext();
    });

    // Handle job failure
    this.on('job:failed', (job: Job, error: Error) => {
      this.activeJobs--;

      // Retry logic
      if (job.retries! < this.maxRetries) {
        console.log(`[JobQueue] Retrying job ${job.id} (attempt ${job.retries! + 1}/${this.maxRetries})`);
        job.retries!++;
        this.queue.unshift(job); // Add back to front of queue
      } else {
        console.error(`[JobQueue] Job ${job.id} failed after ${this.maxRetries} retries:`, error);
      }

      this.processNext();
    });
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    if (!this.processing) return;
    if (this.activeJobs >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    this.activeJobs++;
    this.emit('job:started', job);

    try {
      await this.executeJob(job);
      this.emit('job:completed', job);
    } catch (error) {
      this.emit('job:failed', job, error);
    }

    // Process more jobs if capacity available
    if (this.activeJobs < this.maxConcurrent && this.queue.length > 0) {
      this.processNext();
    }
  }

  /**
   * Execute a job based on its type
   */
  private async executeJob(job: Job): Promise<void> {
    console.log(`[JobQueue] Processing job ${job.id} (${job.type})`);

    // Import processor dynamically to avoid circular dependencies
    const { processBackgroundJob } = await import('@/lib/processing/message-processor');

    await processBackgroundJob(job);
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queuedJobs: number;
    activeJobs: number;
    processing: boolean;
  } {
    return {
      queuedJobs: this.queue.length,
      activeJobs: this.activeJobs,
      processing: this.processing,
    };
  }

  /**
   * Clear all jobs from queue
   */
  clear(): void {
    this.queue = [];
    console.log('[JobQueue] Queue cleared');
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.processing = false;
    console.log('[JobQueue] Processing paused');
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.processing = true;
    console.log('[JobQueue] Processing resumed');
    this.processNext();
  }

  /**
   * Wait for all jobs to complete
   */
  async drain(): Promise<void> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.queue.length === 0 && this.activeJobs === 0) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };

      checkQueue();
    });
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();

// Export for testing or manual control
export { JobQueue };
