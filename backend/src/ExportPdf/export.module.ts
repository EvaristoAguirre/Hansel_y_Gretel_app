import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ProductModule } from 'src/Product/product.module';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { PrinterModule } from 'src/Printer/printer.module';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [ProductModule, IngredientModule, PrinterModule, UserModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
