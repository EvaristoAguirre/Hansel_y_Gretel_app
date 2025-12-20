import { PartialType } from '@nestjs/swagger';
import { CreateSlotOptionDto } from './create-slot-option.dto';

export class UpdateSlotOptionDto extends PartialType(CreateSlotOptionDto) {}
