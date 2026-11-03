import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/Order/entities/order.entity';
import { PrinterModule } from 'src/Printer/printer.module';
import { UserModule } from 'src/User/user.module';
import { AfipConfig } from './afip-config';
import { AfipToken } from './afip-token.entity';
import { ArcaClient } from './arca-client';
import { createArcaClient } from './arca-client.factory';
import { TypeormTokenStore } from './arca-wsfe-client';
import { Invoice } from './invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceDocumentService } from './invoice-document.service';
import { InvoiceMailService } from './invoice-mail.service';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, AfipToken, Order]),
    UserModule,
    PrinterModule,
  ],
  controllers: [InvoiceController],
  providers: [
    AfipConfig,
    InvoiceService,
    InvoiceDocumentService,
    InvoiceMailService,
    {
      provide: ArcaClient,
      useFactory: (config: AfipConfig, tokens: Repository<AfipToken>) =>
        createArcaClient(config.settings, new TypeormTokenStore(tokens)),
      inject: [AfipConfig, getRepositoryToken(AfipToken)],
    },
  ],
  exports: [AfipConfig, ArcaClient, InvoiceService],
})
export class InvoiceModule {}
