import { PartialType } from '@nestjs/swagger';
import { CreateDailyCashDto } from './create-daily-cash.dto';

/** Solo lo que se carga al abrir: comentario y efectivo inicial. Los totales los calcula el cierre. */
export class UpdateDailyCashDto extends PartialType(CreateDailyCashDto) {}
