/**
 * Lives System Cron Scheduler
 * 
 * This module provides cron scheduling for the Lives System.
 * It runs every minute to check for life deductions.
 * 
 * Usage:
 * - Standalone: Run `npm run cron:lives` or `tsx lib/lives/cron.ts`
 * - Integrated: Import and call `startLivesCron()` in your server startup
 */

import { processLifeDeductions } from './deductionJob';
import { processDailyReset } from './dailyResetJob';

// Cron interval in milliseconds (1 minute)
const CRON_INTERVAL_MS = 60 * 1000;

// Track if cron is running
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let lastResetDate: string | null = null;

/**
 * Main execution function for all cron jobs
 */
async function executeCronJobs(): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString();

  // 1. Life Deduction Job (Runs every minute)
  await executeDeductionJob();

  // 2. Daily Reset Job (Runs at 12:00 AM IST = 18:30 UTC)
  const currentHourUTC = now.getUTCHours();
  const currentMinuteUTC = now.getUTCMinutes();
  const currentDateKey = now.getUTCDate().toString() + now.getUTCMonth().toString() + now.getUTCFullYear().toString();

  if (currentHourUTC === 18 && currentMinuteUTC === 30 && lastResetDate !== currentDateKey) {
    console.log(`[LivesCron] [${timestamp}] Triggering daily reset (12:00 AM IST)...`);
    try {
      const result = await processDailyReset();
      lastResetDate = currentDateKey;
      console.log(`[LivesCron] [${timestamp}] Daily reset completed successfully:`, result);
    } catch (error) {
      console.error(`[LivesCron] [${timestamp}] Daily reset failed:`, error);
    }
  }
}

/**
 * Execute the life deduction job
 */
async function executeDeductionJob(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[LivesCron] [${timestamp}] Running life deduction check...`);

  try {
    const result = await processLifeDeductions();
    
    console.log(`[LivesCron] [${timestamp}] Check completed:`);
    console.log(`  - Processed: ${result.processed} staff members`);
    console.log(`  - Deducted: ${result.deducted} lives`);
    console.log(`  - Errors: ${result.errors}`);
    
    if (result.details.length > 0) {
      console.log(`[LivesCron] [${timestamp}] Details:`);
      result.details.forEach((detail) => {
        console.log(`    - User ${detail.userId}: ${detail.previousLives} → ${detail.newLives} (${detail.reason})`);
      });
    }
  } catch (error) {
    console.error(`[LivesCron] [${timestamp}] Error executing deduction job:`, error);
  }
}

/**
 * Start the Lives System cron job
 * Runs every minute to check for life deductions
 */
export function startLivesCron(): void {
  if (isRunning) {
    console.log('[LivesCron] Cron job is already running');
    return;
  }

  console.log('[LivesCron] Starting Lives System cron job...');
  console.log(`[LivesCron] Interval: ${CRON_INTERVAL_MS / 1000} seconds`);
  
  // Run immediately on start
  executeCronJobs();
  
  // Schedule recurring runs
  intervalId = setInterval(executeCronJobs, CRON_INTERVAL_MS);
  isRunning = true;
  
  console.log('[LivesCron] Cron job started successfully');
}

/**
 * Stop the Lives System cron job
 */
export function stopLivesCron(): void {
  if (!isRunning || !intervalId) {
    console.log('[LivesCron] Cron job is not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  
  console.log('[LivesCron] Cron job stopped');
}

/**
 * Check if the cron job is running
 */
export function isLivesCronRunning(): boolean {
  return isRunning;
}

/**
 * Run a single deduction check (for manual triggering or testing)
 */
export async function runSingleCheck(): Promise<ReturnType<typeof processLifeDeductions>> {
  console.log('[LivesCron] Running single deduction check...');
  return processLifeDeductions();
}

// If this file is run directly, start the cron job
if (require.main === module) {
  console.log('[LivesCron] Starting standalone Lives System cron...');
  startLivesCron();
  
  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log('\n[LivesCron] Received SIGINT, shutting down...');
    stopLivesCron();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n[LivesCron] Received SIGTERM, shutting down...');
    stopLivesCron();
    process.exit(0);
  });
}
