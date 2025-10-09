import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { EnvNames } from 'src/common/names.env';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private logBasePath: string;

  constructor(private readonly configService: ConfigService) {
    try {
      this.logBasePath = this.getLogPath();
      this.ensureDirectory(this.logBasePath); // Asegurar directorio base
      this.setupLogger();
    } catch (error) {
      console.error('❌ Error al inicializar el logger:', error);
    }
  }

  private getLogPath(): string {
    try {
      const env = this.configService.get<string>(EnvNames.NODE_ENV);
      const customPath = this.configService.get<string>(EnvNames.PATH_LOG);

      let logPath: string;
      if (env === 'development') {
        logPath = path.resolve(process.cwd(), 'logs');
        console.log('🛠️ Logger en modo desarrollo - usando:', logPath);
      } else if (customPath) {
        logPath = path.normalize(customPath);
        console.log(`🚀 Logger en producción - guardando logs en: ${logPath}`);
      } else {
        logPath = path.resolve(process.cwd(), 'logs');
        console.warn(
          `⚠️ No se encontró una ruta personalizada, usando: ${logPath}`,
        );
      }
      return logPath;
    } catch (error) {
      console.error('❌ Error al obtener la ruta de logs:', error);
      return path.resolve(process.cwd(), 'logs'); // Valor por defecto
    }
  }

  private setupLogger() {
    try {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      const logPath = path.resolve(this.logBasePath, year, month);
      this.ensureDirectory(logPath); // Crear directorios AÑO/MES

      this.logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            const level = info.level?.toUpperCase?.() ?? 'INFO';

            const timestamp =
              typeof info.timestamp === 'string'
                ? info.timestamp
                : JSON.stringify(info.timestamp);

            const message =
              typeof info.message === 'object'
                ? JSON.stringify(info.message, null, 2)
                : JSON.stringify(info.message);

            return `${timestamp} [${level}]: ${message}`;
          }),
        ),
        transports: [
          new DailyRotateFile({
            dirname: logPath, // Directorio correcto AÑO/MES
            filename: `%DATE%.log`, // Formato de archivo basado en la fecha
            datePattern: 'YYYY-MM-DD', // Se asegura de que el nombre sea solo YYYY-MM-DD.log
            zippedArchive: false,
            maxSize: '5m',
          }),
        ],
      });
    } catch (error) {
      console.error('❌ Error al configurar el logger:', error);
    }
  }

  private ensureDirectory(dirPath: string) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📂 Directorio creado: ${dirPath}`);
      }
    } catch (error) {
      console.error('❌ Error al crear directorio de logs:', error);
    }
  }

  log(message: any) {
    try {
      this.logger.info(
        typeof message === 'object'
          ? JSON.stringify(message, null, 2)
          : message,
      );
    } catch (error) {
      console.error('❌ Error al escribir log INFO:', error);
    }
  }

  error(message: any, trace?: any) {
    try {
      this.logger.error(
        typeof message === 'object'
          ? JSON.stringify(message, null, 2)
          : message + (trace ? ` - Trace: ${trace}` : ''),
      );
    } catch (error) {
      console.error('❌ Error al escribir log ERROR:', error);
    }
  }

  warn(message: any) {
    try {
      this.logger.warn(
        typeof message === 'object'
          ? JSON.stringify(message, null, 2)
          : message,
      );
    } catch (error) {
      console.error('❌ Error al escribir log WARNING:', error);
    }
  }

  format() {
    this.logger.info('------------');
  }
}
