import { RetellService, RetellCallAnalytics } from './retell.service';
import { db } from '../lib/firebase';
import logger from '../utils/logger';

export interface SyncJob {
  id: string;
  userId?: string; // If undefined, sync all users
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalCalls: number;
  processedCalls: number;
  enrichedCalls: number;
  failedCalls: number;
  errors: string[];
  metadata?: {
    batchSize: number;
    delayBetweenCalls: number;
    retryAttempts: number;
  };
}

export class RetellSyncService {
  private retellService: RetellService;
  private isRunning: boolean = false;
  private currentJobId?: string;

  constructor() {
    this.retellService = new RetellService();
  }

  /**
   * Start a background sync job to enrich existing calls with Retell data
   */
  async startSyncJob(options: {
    userId?: string;
    batchSize?: number;
    delayBetweenCalls?: number;
    retryAttempts?: number;
    dateRange?: { start: Date; end: Date };
  } = {}): Promise<string> {
    if (this.isRunning) {
      throw new Error('Another sync job is already running');
    }

    const {
      userId,
      batchSize = 10,
      delayBetweenCalls = 1000, // 1 second delay between API calls
      retryAttempts = 3,
      dateRange
    } = options;

    // Create sync job record
    const jobId = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const job: SyncJob = {
      id: jobId,
      userId,
      status: 'pending',
      startTime: new Date(),
      totalCalls: 0,
      processedCalls: 0,
      enrichedCalls: 0,
      failedCalls: 0,
      errors: [],
      metadata: {
        batchSize,
        delayBetweenCalls,
        retryAttempts
      }
    };

    // Store job in Firebase
    await db.collection('sync_jobs').doc(jobId).set(job);

    // Start the sync process asynchronously
    this.runSyncJob(jobId, { userId, batchSize, delayBetweenCalls, retryAttempts, dateRange })
      .catch(error => {
        logger.error('Sync job failed', { jobId, error });
      });

    return jobId;
  }

  /**
   * Get the status of a sync job
   */
  async getSyncJobStatus(jobId: string): Promise<SyncJob | null> {
    try {
      const doc = await db.collection('sync_jobs').doc(jobId).get();
      return doc.exists ? doc.data() as SyncJob : null;
    } catch (error) {
      logger.error('Failed to get sync job status', { jobId, error });
      return null;
    }
  }

  /**
   * Get all sync jobs for a user
   */
  async getUserSyncJobs(userId: string): Promise<SyncJob[]> {
    try {
      const snapshot = await db.collection('sync_jobs')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => doc.data() as SyncJob);
    } catch (error) {
      logger.error('Failed to get user sync jobs', { userId, error });
      return [];
    }
  }

  /**
   * Cancel a running sync job
   */
  async cancelSyncJob(jobId: string): Promise<boolean> {
    try {
      if (this.currentJobId === jobId) {
        this.isRunning = false;
        await this.updateJobStatus(jobId, 'failed', ['Job cancelled by user']);
        logger.info('Sync job cancelled', { jobId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to cancel sync job', { jobId, error });
      return false;
    }
  }

  /**
   * Run the actual sync process
   */
  private async runSyncJob(
    jobId: string,
    options: {
      userId?: string;
      batchSize: number;
      delayBetweenCalls: number;
      retryAttempts: number;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<void> {
    const { userId, batchSize, delayBetweenCalls, retryAttempts, dateRange } = options;

    try {
      this.isRunning = true;
      this.currentJobId = jobId;

      await this.updateJobStatus(jobId, 'running');

      logger.info('Starting Retell sync job', { jobId, userId, options });

      // Get all calls that need to be enriched
      const callsToEnrich = await this.getCallsNeedingEnrichment(userId, dateRange);
      logger.info('Found calls to enrich', { jobId, count: callsToEnrich.length });

      await this.updateJobProgress(jobId, { totalCalls: callsToEnrich.length });

      let processedCount = 0;
      let enrichedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process calls in batches
      for (let i = 0; i < callsToEnrich.length; i += batchSize) {
        if (!this.isRunning) {
          logger.info('Sync job cancelled, stopping', { jobId });
          break;
        }

        const batch = callsToEnrich.slice(i, i + batchSize);
        logger.info('Processing batch', { jobId, batchStart: i, batchSize: batch.length });

        for (const call of batch) {
          if (!this.isRunning) break;

          try {
            const success = await this.enrichSingleCall(call, retryAttempts);
            if (success) {
              enrichedCount++;
            } else {
              failedCount++;
              errors.push(`Failed to enrich call ${call.id} after ${retryAttempts} attempts`);
            }
          } catch (error) {
            failedCount++;
            const errorMsg = `Error enriching call ${call.id}: ${(error as Error).message}`;
            errors.push(errorMsg);
            logger.error('Failed to enrich call', { jobId, callId: call.id, error });
          }

          processedCount++;

          // Update progress
          await this.updateJobProgress(jobId, {
            processedCalls: processedCount,
            enrichedCalls: enrichedCount,
            failedCalls: failedCount,
            errors
          });

          // Add delay between API calls to avoid rate limiting
          if (delayBetweenCalls > 0) {
            await this.sleep(delayBetweenCalls);
          }
        }

        logger.info('Batch completed', {
          jobId,
          processed: processedCount,
          enriched: enrichedCount,
          failed: failedCount
        });
      }

      // Mark job as completed
      await this.updateJobStatus(jobId, 'completed');

      logger.info('Sync job completed successfully', {
        jobId,
        totalProcessed: processedCount,
        totalEnriched: enrichedCount,
        totalFailed: failedCount
      });

    } catch (error) {
      logger.error('Sync job failed', { jobId, error });
      await this.updateJobStatus(jobId, 'failed', [(error as Error).message]);
    } finally {
      this.isRunning = false;
      this.currentJobId = undefined;
    }
  }

  /**
   * Get all calls that need Retell data enrichment
   */
  private async getCallsNeedingEnrichment(
    userId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<Array<{ id: string; retellCallId?: string; userId: string }>> {
    try {
      let query = db.collection('voice_calls').select('retellCallId', 'userId');

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (dateRange) {
        query = query.where('startTime', '>=', dateRange.start)
                     .where('startTime', '<=', dateRange.end);
      }

      const snapshot = await query.get();

      // Filter calls that have retellCallId but no retellAnalytics
      const callsNeedingEnrichment: Array<{ id: string; retellCallId?: string; userId: string }> = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Only process calls that have a retellCallId but no retellAnalytics
        if (data.retellCallId && !data.retellAnalytics) {
          callsNeedingEnrichment.push({
            id: doc.id,
            retellCallId: data.retellCallId,
            userId: data.userId
          });
        }
      }

      return callsNeedingEnrichment;
    } catch (error) {
      logger.error('Failed to get calls needing enrichment', { userId, error });
      return [];
    }
  }

  /**
   * Enrich a single call with Retell data
   */
  private async enrichSingleCall(
    call: { id: string; retellCallId?: string; userId: string },
    retryAttempts: number
  ): Promise<boolean> {
    if (!call.retellCallId) {
      return false;
    }

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        logger.info('Enriching call attempt', {
          callId: call.id,
          retellCallId: call.retellCallId,
          attempt
        });

        // Fetch Retell analytics
        const retellAnalytics = await this.retellService.getCallAnalytics(call.retellCallId);

        if (!retellAnalytics) {
          logger.warn('No Retell analytics found for call', {
            callId: call.id,
            retellCallId: call.retellCallId
          });
          return false;
        }

        // Update the call document with Retell analytics
        const updateData: any = {
          retellAnalytics,
          lastSyncedAt: new Date()
        };

        // Also update derived fields if available
        if (retellAnalytics.duration_ms && retellAnalytics.duration_ms > 0) {
          updateData.duration = retellAnalytics.duration_ms;
        }

        if (retellAnalytics.call_status) {
          const statusMapping: Record<string, string> = {
            'ended': 'completed',
            'ongoing': 'initiated',
            'registered': 'connecting'
          };
          updateData.status = statusMapping[retellAnalytics.call_status] || retellAnalytics.call_status;
        }

        // Update transcript if available and current one is empty
        if (retellAnalytics.transcript && retellAnalytics.transcript.length > 0) {
          const callDoc = await db.collection('voice_calls').doc(call.id).get();
          const currentData = callDoc.data();

          if (!currentData?.transcript || currentData.transcript.length === 0) {
            updateData.transcript = retellAnalytics.transcript.map(entry =>
              `${entry.role === 'agent' ? 'AI' : 'User'}: ${entry.content}`
            );
          }
        }

        await db.collection('voice_calls').doc(call.id).update(updateData);

        logger.info('Successfully enriched call', {
          callId: call.id,
          retellCallId: call.retellCallId,
          hasTranscript: !!retellAnalytics.transcript,
          sentiment: retellAnalytics.user_sentiment,
          successful: retellAnalytics.call_successful,
          duration: retellAnalytics.duration_ms
        });

        return true;

      } catch (error) {
        logger.error('Failed to enrich call on attempt', {
          callId: call.id,
          retellCallId: call.retellCallId,
          attempt,
          error
        });

        if (attempt < retryAttempts) {
          // Wait before retrying (exponential backoff)
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    return false;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: SyncJob['status'],
    errors?: string[]
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        endTime: status === 'completed' || status === 'failed' ? new Date() : undefined
      };

      if (errors && errors.length > 0) {
        updateData.errors = errors;
      }

      await db.collection('sync_jobs').doc(jobId).update(updateData);
    } catch (error) {
      logger.error('Failed to update job status', { jobId, status, error });
    }
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(
    jobId: string,
    progress: Partial<Pick<SyncJob, 'totalCalls' | 'processedCalls' | 'enrichedCalls' | 'failedCalls' | 'errors'>>
  ): Promise<void> {
    try {
      await db.collection('sync_jobs').doc(jobId).update(progress);
    } catch (error) {
      logger.error('Failed to update job progress', { jobId, progress, error });
    }
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalCallsProcessed: number;
    totalCallsEnriched: number;
  }> {
    try {
      const snapshot = await db.collection('sync_jobs').get();
      const jobs = snapshot.docs.map(doc => doc.data() as SyncJob);

      return {
        totalJobs: jobs.length,
        runningJobs: jobs.filter(j => j.status === 'running').length,
        completedJobs: jobs.filter(j => j.status === 'completed').length,
        failedJobs: jobs.filter(j => j.status === 'failed').length,
        totalCallsProcessed: jobs.reduce((sum, j) => sum + j.processedCalls, 0),
        totalCallsEnriched: jobs.reduce((sum, j) => sum + j.enrichedCalls, 0)
      };
    } catch (error) {
      logger.error('Failed to get sync statistics', { error });
      return {
        totalJobs: 0,
        runningJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        totalCallsProcessed: 0,
        totalCallsEnriched: 0
      };
    }
  }

  /**
   * Clean up old sync jobs (keep only last 100)
   */
  async cleanupOldSyncJobs(): Promise<number> {
    try {
      const snapshot = await db.collection('sync_jobs')
        .orderBy('startTime', 'desc')
        .offset(100)
        .get();

      let deletedCount = 0;
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        logger.info('Cleaned up old sync jobs', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old sync jobs', { error });
      return 0;
    }
  }
}