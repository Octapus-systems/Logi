import { NextRequest, NextResponse } from 'next/server';
import { processLifeDeductions } from '@/lib/lives/deductionJob';
import connectDB from '@/lib/db';

/**
 * POST /api/v1/lives/cron
 * Internal endpoint triggered by cron job to process life deductions
 * Should be protected by cron secret or internal network only
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Process deductions
    const result = await processLifeDeductions();

    return NextResponse.json({
      success: true,
      message: 'Life deduction job completed',
      data: {
        processed: result.processed,
        deducted: result.deducted,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      },
      details: result.details,
    });
  } catch (error) {
    console.error('[Cron] Fatal error in lives deduction cron:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Cron job failed', 
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/lives/cron
 * Health check endpoint for the cron job
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Lives cron endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
