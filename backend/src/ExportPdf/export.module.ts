import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ProductModule } from 'src/Product/product.module';
import { IngredientModule } from 'src/Ingredient/ingredient.module';
import { PrinterModule } from 'src/Printer/printer.module';

@Module({
  imports: [ProductModule, IngredientModule, PrinterModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
