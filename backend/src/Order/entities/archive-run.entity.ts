import { Column, Entity, PrimaryColumn } from 'typeorm';

export type ArchiveRunTrigger = 'startup' | 'cron';
export type ArchiveRunStatus =
  'running' | 'success' | 'partial' | 'failed' | 'interrupted';

@Entity({ name: 'archive_runs' })
export class ArchiveRun {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'varchar', length: 16 })
  trigger: ArchiveRunTrigger;

  @Column({ type: 'varchar', length: 16 })
  status: ArchiveRunStatus;

  @Column({ type: 'int', default: 0 })
  archivedCount: number;

  @Column({ type: 'int', default: 0 })
  skippedCount: number;

  @Column({ type: 'int', default: 0 })
  repairedCount: number;

  @Column({ type: 'text', nullable: true })
  errorSummary: string | null;
}
