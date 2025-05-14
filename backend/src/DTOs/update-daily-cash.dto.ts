import { PartialType } from '@nestjs/swagger';
import { CreateDailyCashDto } from '../../DTOs/create-daily-cash.dto';

export class UpdateDailyCashDto extends PartialType(CreateDailyCashDto) {}
