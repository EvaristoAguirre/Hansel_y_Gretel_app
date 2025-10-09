import { Global, Module } from '@nestjs/common';
import { LoggerService } from './monitoring-logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class MonitoringModule {}
