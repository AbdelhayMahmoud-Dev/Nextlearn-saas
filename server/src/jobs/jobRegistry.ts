/**
 * In-memory registry of scheduled jobs and their last execution result.
 * Powers the operational dashboard's job-health view. (In-process only —
 * resets on restart, which is acceptable for at-a-glance ops monitoring.)
 */

export type JobRunStatus = 'idle' | 'running' | 'success' | 'failed';

export interface JobInfo {
  name: string;
  schedule: string;
  description: string;
  status: JobRunStatus;
  lastRunAt: Date | null;
  lastDurationMs: number | null;
  lastError: string | null;
  runCount: number;
  failureCount: number;
}

const registry = new Map<string, JobInfo>();

/** Registers a job's metadata (called once at startup). */
export function registerJob(name: string, schedule: string, description: string): void {
  registry.set(name, {
    name,
    schedule,
    description,
    status: 'idle',
    lastRunAt: null,
    lastDurationMs: null,
    lastError: null,
    runCount: 0,
    failureCount: 0,
  });
}

/** Runs `fn`, recording timing + success/failure against the named job. */
export async function runTracked(name: string, fn: () => Promise<void>): Promise<void> {
  const info = registry.get(name);
  const started = Date.now();
  if (info) {
    info.status = 'running';
    info.lastRunAt = new Date();
  }
  try {
    await fn();
    if (info) {
      info.status = 'success';
      info.lastError = null;
      info.lastDurationMs = Date.now() - started;
      info.runCount += 1;
    }
  } catch (err) {
    if (info) {
      info.status = 'failed';
      info.lastError = err instanceof Error ? err.message : 'Unknown error';
      info.lastDurationMs = Date.now() - started;
      info.runCount += 1;
      info.failureCount += 1;
    }
    throw err;
  }
}

/** Snapshot of all registered jobs for the ops dashboard. */
export function listJobs(): JobInfo[] {
  return [...registry.values()];
}
