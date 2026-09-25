import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrintCounter1782900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "print_counter" (
        "id" integer PRIMARY KEY,
        "counter" integer NOT NULL DEFAULT 0,
        "legacyImported" boolean NOT NULL DEFAULT false,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      INSERT INTO "print_counter" ("id", "counter")
      VALUES (1, 0)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "print_counter"`);
  }
}
