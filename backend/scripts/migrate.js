#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`);
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`${colors.green}✅ ${description} completado${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Error en: ${description}${colors.reset}`, 'red');
    log(`${colors.red}${error.message}${colors.reset}`, 'red');
    process.exit(1);
  }
}

function main() {
  const command = process.argv[2];

  log(
    `${colors.bright}${colors.blue}🚀 Script de Migración de Base de Datos${colors.reset}`,
  );
  log(
    `${colors.blue}==============================================${colors.reset}`,
  );

  switch (command) {
    case 'run':
      log(`${colors.yellow}Ejecutando migraciones...${colors.reset}`);
      runCommand('pnpm run migration:run', 'Ejecutando migraciones');
      break;

    case 'revert':
      log(`${colors.yellow}Revirtiendo última migración...${colors.reset}`);
      runCommand('pnpm run migration:revert', 'Revirtiendo migración');
      break;

    case 'show':
      log(`${colors.yellow}Mostrando estado de migraciones...${colors.reset}`);
      runCommand('pnpm run migration:show', 'Mostrando estado');
      break;

    case 'generate': {
      const migrationName = process.argv[3];
      if (!migrationName) {
        log(
          `${colors.red}❌ Debe proporcionar un nombre para la migración${colors.reset}`,
          'red',
        );
        log(
          `${colors.yellow}Uso: node scripts/migrate.js generate NombreDeLaMigracion${colors.reset}`,
          'yellow',
        );
        process.exit(1);
      }
      log(
        `${colors.yellow}Generando migración: ${migrationName}${colors.reset}`,
      );
      runCommand(
        `pnpm run migration:generate -- migration/${migrationName}`,
        `Generando migración: ${migrationName}`,
      );
      break;
    }

    case 'create': {
      const createName = process.argv[3];
      if (!createName) {
        log(
          `${colors.red}❌ Debe proporcionar un nombre para la migración${colors.reset}`,
          'red',
        );
        log(
          `${colors.yellow}Uso: node scripts/migrate.js create NombreDeLaMigracion${colors.reset}`,
          'yellow',
        );
        process.exit(1);
      }
      log(
        `${colors.yellow}Creando migración vacía: ${createName}${colors.reset}`,
      );
      runCommand(
        `pnpm run migration:create -- migration/${createName}`,
        `Creando migración: ${createName}`,
      );
      break;
    }

    default:
      log(`${colors.yellow}Comandos disponibles:${colors.reset}`);
      log(
        `${colors.cyan}  run${colors.reset}      - Ejecutar migraciones pendientes`,
      );
      log(
        `${colors.cyan}  revert${colors.reset}   - Revertir última migración`,
      );
      log(
        `${colors.cyan}  show${colors.reset}     - Mostrar estado de migraciones`,
      );
      log(
        `${colors.cyan}  generate <nombre>${colors.reset} - Generar migración automática`,
      );
      log(
        `${colors.cyan}  create <nombre>${colors.reset}   - Crear migración vacía`,
      );
      log(`\n${colors.yellow}Ejemplos:${colors.reset}`);
      log(`${colors.cyan}  node scripts/migrate.js run${colors.reset}`);
      log(
        `${colors.cyan}  node scripts/migrate.js generate AddNewTable${colors.reset}`,
      );
      log(`${colors.cyan}  node scripts/migrate.js revert${colors.reset}`);
      break;
  }
}

main();
