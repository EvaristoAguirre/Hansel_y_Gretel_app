import { CronJob } from 'cron';
import { EnvNames } from 'src/common/names.env';

export const ARCHIVE_DEFAULTS = {
  cron: '0 14 * * 6',
  timeZone: 'America/Argentina/Buenos_Aires',
  retentionDays: 15,
  startupDelayMs: 60_000,
  advisoryLockKey: 874210,
  staleRunMinutes: 15,
} as const;

export interface ArchiveSettings {
  cron: string;
  timeZone: string;
  retentionDays: number;
  startupDelayMs: number;
  rejected: {
    cron?: string;
    timeZone?: string;
    retentionDays?: string;
    startupDelayMs?: string;
  };
}

export const REQUIRED_ARCHIVE_COLUMNS: Record<string, readonly string[]> = {
  archived_orders: [
    'discountPercent',
    'discountAmount',
    'tip',
    'commandNumber',
    'closedAt',
    'tableName',
    'roomName',
    'dailyCashDate',
    'archivedAt',
    'snapshotSource',
  ],
  archived_order_details: [
    'isActive',
    'toppings',
    'promotionSelections',
    'toppingsExtraCost',
    'productName',
    'productCode',
    'commentOfProduct',
    'categoryNames',
    'snapshotSource',
  ],
  archived_order_payments: ['amount', 'methodOfPayment', 'createdAt'],
  archive_runs: [
    'id',
    'startedAt',
    'finishedAt',
    'trigger',
    'status',
    'archivedCount',
    'skippedCount',
    'repairedCount',
    'errorSummary',
  ],
  archive_order_errors: [
    'id',
    'runId',
    'orderId',
    'attemptedAt',
    'reason',
    'pgCode',
    'message',
  ],
};

export function isControlColumn(qualifiedName: string): boolean {
  return (
    qualifiedName.startsWith('archive_runs.') ||
    qualifiedName.startsWith('archive_order_errors.')
  );
}

export function missingArchiveColumns(
  rows: { table_name: string; column_name: string }[],
): string[] {
  const present = new Set(
    rows.map((row) => `${row.table_name}.${row.column_name}`),
  );
  const missing: string[] = [];
  for (const [table, columns] of Object.entries(REQUIRED_ARCHIVE_COLUMNS)) {
    for (const column of columns) {
      const qualified = `${table}.${column}`;
      if (!present.has(qualified)) missing.push(qualified);
    }
  }
  return missing;
}

export function resolveArchiveSettings(
  read: (key: string) => string | undefined,
): ArchiveSettings {
  const rejected: ArchiveSettings['rejected'] = {};

  const cronRaw = read(EnvNames.ARCHIVE.CRON);
  let cron: string = ARCHIVE_DEFAULTS.cron;
  if (hasValue(cronRaw)) {
    if (isValidCron(cronRaw.trim())) cron = cronRaw.trim();
    else rejected.cron = cronRaw.trim();
  }

  const timeZoneRaw = read(EnvNames.ARCHIVE.TIMEZONE);
  let timeZone: string = ARCHIVE_DEFAULTS.timeZone;
  if (hasValue(timeZoneRaw)) {
    if (isValidTimeZone(timeZoneRaw.trim())) timeZone = timeZoneRaw.trim();
    else rejected.timeZone = timeZoneRaw.trim();
  }

  const retentionRaw = read(EnvNames.ARCHIVE.RETENTION_DAYS);
  let retentionDays: number = ARCHIVE_DEFAULTS.retentionDays;
  if (hasValue(retentionRaw)) {
    const parsed = Number(retentionRaw.trim());
    if (Number.isInteger(parsed) && parsed >= 1) retentionDays = parsed;
    else rejected.retentionDays = retentionRaw.trim();
  }

  const delayRaw = read(EnvNames.ARCHIVE.STARTUP_DELAY_MS);
  let startupDelayMs: number = ARCHIVE_DEFAULTS.startupDelayMs;
  if (hasValue(delayRaw)) {
    const parsed = Number(delayRaw.trim());
    if (Number.isInteger(parsed) && parsed >= 0) startupDelayMs = parsed;
    else rejected.startupDelayMs = delayRaw.trim();
  }

  return { cron, timeZone, retentionDays, startupDelayMs, rejected };
}

export function archiveBackupStamp(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';
  const hour = pick('hour') === '24' ? '00' : pick('hour');
  return `${pick('year')}-${pick('month')}-${pick('day')}T${hour}-${pick('minute')}-${pick('second')}`;
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidCron(expression: string): boolean {
  try {
    CronJob.from({
      cronTime: expression,
      onTick: () => undefined,
      start: false,
    });
    return true;
  } catch {
    return false;
  }
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}
