/**
 * Marketing Auto-Deploy Scheduler
 * Proprietary scheduling engine for DarkWave Studios
 * Runs on configurable intervals per platform
 */

import { storage } from './storage';
import { deploySocialPost } from './social-connectors';

interface SchedulerState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  lastCheck: Date | null;
}

const schedulerState: SchedulerState = {
  isRunning: false,
  intervalId: null,
  lastCheck: null,
};

const CHECK_INTERVAL_MS = 60_000; // Check every minute

/**
 * Check all platforms and deploy if it's time
 */
async function checkAndDeploy(): Promise<void> {
  schedulerState.lastCheck = new Date();
  
  try {
    const configs = await storage.getMarketingScheduleConfigs();
    
    for (const config of configs) {
      if (!config.isActive) continue;
      
      const now = new Date();
      const lastDeployed = config.lastDeployedAt ? new Date(config.lastDeployedAt) : null;
      const intervalMs = config.intervalMinutes * 60_000;
      
      // Check if enough time has passed since last deploy
      if (lastDeployed) {
        const timeSinceLastDeploy = now.getTime() - lastDeployed.getTime();
        if (timeSinceLastDeploy < intervalMs) {
          continue; // Not time yet
        }
      }
      
      // Get a random unused post for this platform
      const post = await storage.getRandomActivePost(config.platform);
      if (!post) {
        console.log(`[Scheduler] No available posts for ${config.platform}`);
        continue;
      }
      
      // Deploy the post
      console.log(`[Scheduler] Deploying to ${config.platform}: "${post.content.slice(0, 50)}..."`);
      const result = await deploySocialPost(config.platform, post.content, post.imageUrl);
      
      // Log the deployment
      await storage.recordMarketingDeploy({
        postId: post.id,
        platform: config.platform,
        status: result.success ? 'success' : 'failed',
        externalId: result.externalId || null,
        errorMessage: result.error || null,
      });
      
      // Update post usage count
      await storage.markPostUsed(post.id);
      
      // Update config last deployed time
      await storage.updateLastDeployed(config.platform);
      
      if (result.success) {
        console.log(`[Scheduler] Successfully deployed to ${config.platform}`);
      } else {
        console.log(`[Scheduler] Failed to deploy to ${config.platform}: ${result.error}`);
      }
    }
  } catch (error: any) {
    console.error('[Scheduler] Error during check:', error.message);
  }
}

/**
 * Start the scheduler
 */
export function startScheduler(): void {
  if (schedulerState.isRunning) {
    console.log('[Scheduler] Already running');
    return;
  }
  
  console.log('[Scheduler] Starting marketing auto-deploy scheduler');
  schedulerState.isRunning = true;
  
  // Run initial check
  checkAndDeploy();
  
  // Set up interval
  schedulerState.intervalId = setInterval(checkAndDeploy, CHECK_INTERVAL_MS);
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (!schedulerState.isRunning) {
    console.log('[Scheduler] Not running');
    return;
  }
  
  console.log('[Scheduler] Stopping scheduler');
  
  if (schedulerState.intervalId) {
    clearInterval(schedulerState.intervalId);
    schedulerState.intervalId = null;
  }
  
  schedulerState.isRunning = false;
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): { isRunning: boolean; lastCheck: Date | null } {
  return {
    isRunning: schedulerState.isRunning,
    lastCheck: schedulerState.lastCheck,
  };
}

/**
 * Manually trigger a deployment for a platform
 */
export async function triggerDeploy(platform: string, postId?: string): Promise<{
  success: boolean;
  post?: any;
  result?: any;
  error?: string;
}> {
  try {
    // Get specific post or random one
    let post;
    if (postId) {
      post = await storage.getMarketingPost(postId);
    } else {
      post = await storage.getRandomActivePost(platform);
    }
    
    if (!post) {
      return { success: false, error: 'No available posts for this platform' };
    }
    
    // Deploy
    const result = await deploySocialPost(platform, post.content, post.imageUrl);
    
    // Log
    await storage.recordMarketingDeploy({
      postId: post.id,
      platform,
      status: result.success ? 'success' : 'failed',
      externalId: result.externalId || null,
      errorMessage: result.error || null,
    });
    
    // Update usage
    await storage.markPostUsed(post.id);
    
    return { success: result.success, post, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
