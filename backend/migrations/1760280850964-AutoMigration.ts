import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1760280850964 implements MigrationInterface {
  name = 'AutoMigration1760280850964';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "updated_at" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "closed_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "closed_at"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "created_at"`);
  }
}
