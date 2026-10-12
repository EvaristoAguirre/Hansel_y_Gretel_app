import { CronJob } from 'cron';
import { EnvNames } from 'src/common/names.env';
import {
  ARCHIVE_DEFAULTS,
  archiveBackupStamp,
  missingArchiveColumns,
  REQUIRED_ARCHIVE_COLUMNS,
  resolveArchiveSettings,
} from './archive.config';

describe('resolveArchiveSettings', () => {
  const read = (values: Record<string, string | undefined>) => (key: string) =>
    values[key];

  it('usa sábado 14:00 y 15 días cuando no hay variables', () => {
    const settings = resolveArchiveSettings(read({}));
    expect(settings.cron).toBe('0 14 * * 6');
    expect(settings.timeZone).toBe('America/Argentina/Buenos_Aires');
    expect(settings.retentionDays).toBe(15);
    expect(settings.startupDelayMs).toBe(60_000);
    expect(settings.rejected).toEqual({});
  });

  it('el cron por defecto cae un sábado a las 14 en Argentina', () => {
    const job = CronJob.from({
      cronTime: ARCHIVE_DEFAULTS.cron,
      onTick: () => undefined,
      start: false,
      timeZone: ARCHIVE_DEFAULTS.timeZone,
    });
    const next = job.nextDate();
    expect(next.weekday).toBe(6);
    expect(next.hour).toBe(14);
    expect(next.minute).toBe(0);
    expect(next.zoneName).toBe('America/Argentina/Buenos_Aires');
  });

  it('un cron o una zona inválidos vuelven al default y quedan rechazados', () => {
    const settings = resolveArchiveSettings(
      read({
        [EnvNames.ARCHIVE.CRON]: 'no es cron',
        [EnvNames.ARCHIVE.TIMEZONE]: 'Marte/Olympus',
        [EnvNames.ARCHIVE.RETENTION_DAYS]: '0',
        [EnvNames.ARCHIVE.STARTUP_DELAY_MS]: '-5',
      }),
    );
    expect(settings.cron).toBe(ARCHIVE_DEFAULTS.cron);
    expect(settings.timeZone).toBe(ARCHIVE_DEFAULTS.timeZone);
    expect(settings.retentionDays).toBe(15);
    expect(settings.startupDelayMs).toBe(60_000);
    expect(settings.rejected.cron).toBe('no es cron');
    expect(settings.rejected.timeZone).toBe('Marte/Olympus');
    expect(settings.rejected.retentionDays).toBe('0');
    expect(settings.rejected.startupDelayMs).toBe('-5');
  });

  it('acepta un entero de retención y una espera de cero', () => {
    const settings = resolveArchiveSettings(
      read({
        [EnvNames.ARCHIVE.CRON]: '15 9 * * 1',
        [EnvNames.ARCHIVE.RETENTION_DAYS]: '7',
        [EnvNames.ARCHIVE.STARTUP_DELAY_MS]: '0',
      }),
    );
    expect(settings.cron).toBe('15 9 * * 1');
    expect(settings.retentionDays).toBe(7);
    expect(settings.startupDelayMs).toBe(0);
    expect(settings.rejected).toEqual({});
  });
});

describe('missingArchiveColumns', () => {
  it('no marca faltantes cuando están todas las columnas', () => {
    const rows = Object.entries(REQUIRED_ARCHIVE_COLUMNS).flatMap(
      ([table, columns]) =>
        columns.map((column) => ({ table_name: table, column_name: column })),
    );
    expect(missingArchiveColumns(rows)).toEqual([]);
  });

  it('señala la columna de foto que falta', () => {
    const rows = Object.entries(REQUIRED_ARCHIVE_COLUMNS).flatMap(
      ([table, columns]) =>
        columns
          .filter((column) => column !== 'tableName')
          .map((column) => ({ table_name: table, column_name: column })),
    );
    expect(missingArchiveColumns(rows)).toEqual(['archived_orders.tableName']);
  });
});

describe('archiveBackupStamp', () => {
  it('arma el nombre con hora de Argentina y sin dos puntos', () => {
    const stamp = archiveBackupStamp(
      new Date('2026-10-17T17:00:00.000Z'),
      'America/Argentina/Buenos_Aires',
    );
    expect(stamp).toBe('2026-10-17T14-00-00');
  });
});
