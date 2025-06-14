import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ProductModule } from 'src/Product/product.module';
import { IngredientModule } from 'src/Ingredient/ingredient.module';

@Module({
  imports: [ProductModule, IngredientModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
