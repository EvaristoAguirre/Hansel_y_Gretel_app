import { PartialType } from '@nestjs/mapped-types';
import { CreateSlotOptionDto } from './create-slot-option.dto';

export class UpdateSlotOptionDto extends PartialType(CreateSlotOptionDto) {}
