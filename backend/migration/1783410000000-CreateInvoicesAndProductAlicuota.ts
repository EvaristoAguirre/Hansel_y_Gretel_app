import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Factura B: comprobantes, caché del ticket de acceso y alícuota del producto.
 * No se ejecuta sola. Hay que correrla a mano antes de volver a levantar el backend:
 * la columna products.alicQuota entra en el SELECT de TypeORM.
 */
export class CreateInvoicesAndProductAlicuota1783410000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "alicQuota" numeric(5,2)
    `);

    await queryRunner.query(`
      CREATE TYPE "invoices_origin_enum" AS ENUM ('order', 'manual')
    `);
    await queryRunner.query(`
      CREATE TYPE "invoices_afip_env_enum" AS ENUM ('simulado', 'homologacion', 'produccion')
    `);
    await queryRunner.query(`
      CREATE TYPE "invoices_status_enum" AS ENUM ('pending', 'authorized', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "origin" "invoices_origin_enum" NOT NULL,
        "orderId" uuid,
        "afipEnv" "invoices_afip_env_enum" NOT NULL,
        "status" "invoices_status_enum" NOT NULL,
        "ptoVta" integer NOT NULL,
        "cbteTipo" integer NOT NULL,
        "cbteNro" integer,
        "cbteFch" date NOT NULL,
        "concepto" integer NOT NULL,
        "docTipo" integer NOT NULL,
        "docNro" integer NOT NULL,
        "condicionIvaReceptorId" integer NOT NULL,
        "impTotal" numeric(14,2) NOT NULL,
        "impNeto" numeric(14,2) NOT NULL,
        "impIva" numeric(14,2) NOT NULL,
        "impTotConc" numeric(14,2) NOT NULL DEFAULT 0,
        "impOpEx" numeric(14,2) NOT NULL DEFAULT 0,
        "impTrib" numeric(14,2) NOT NULL DEFAULT 0,
        "iva" jsonb NOT NULL,
        "discountAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "tipExcluded" numeric(12,2) NOT NULL DEFAULT 0,
        "cae" character varying,
        "caeFchVto" date,
        "resultado" character(1),
        "arcaErrors" jsonb,
        "customerEmail" character varying,
        "emailSentAt" timestamptz,
        "snapshot" jsonb NOT NULL,
        "attemptCount" integer NOT NULL DEFAULT 0,
        "lastAttemptAt" timestamptz,
        "authorizedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_invoices_orderId"
      ON "invoices" ("orderId")
      WHERE "orderId" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_invoices_number"
      ON "invoices" ("afipEnv", "ptoVta", "cbteTipo", "cbteNro")
      WHERE "cbteNro" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_cbteFch" ON "invoices" ("cbteFch")
    `);

    await queryRunner.query(`
      CREATE TABLE "afip_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "service" character varying NOT NULL,
        "afipEnv" character varying NOT NULL,
        "token" text NOT NULL,
        "sign" text NOT NULL,
        "expirationTime" timestamptz NOT NULL,
        CONSTRAINT "UQ_afip_tokens_service_env" UNIQUE ("service", "afipEnv")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "afip_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_afip_env_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_origin_enum"`);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "alicQuota"
    `);
  }
}
