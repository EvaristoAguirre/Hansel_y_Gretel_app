import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { DailyCash } from './daily-cash.entity';
import {
  RegisterExpenseDto,
  RegisterMovementDto,
} from 'src/DTOs/create-expense.dto';
import { CashMovement } from './cash-movement.entity';
import { CloseDailyCash } from 'src/DTOs/close-daily-cash.dto';

@Controller('daily-cash')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class DailyCashController {
  constructor(private readonly dailyCashService: DailyCashService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  openDailyCash(
    @Body() createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    return this.dailyCashService.openDailyCash(createDailyCashDto);
  }

  @Post('close/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  closeDailyCash(
    @Param('id') id: string,
    @Body() closeDailyCashDto: CloseDailyCash,
  ): Promise<DailyCash> {
    return this.dailyCashService.closeDailyCash(id, closeDailyCashDto);
  }

  @Post('register-expense')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  registerExpense(
    @Body() expenseData: RegisterExpenseDto,
  ): Promise<CashMovement> {
    return this.dailyCashService.registerExpense(expenseData);
  }
  @Post('register-movement')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  registerMovement(
    @Body() movementData: RegisterMovementDto,
  ): Promise<CashMovement> {
    return this.dailyCashService.registerMovement(movementData);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getAllDailysCash(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1000,
  ): Promise<DailyCash[]> {
    return this.dailyCashService.getAllDailyCash(page, limit);
  }

  @Get('incomes/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getIncomesByDailyCashId(@Param('id') id: string): Promise<CashMovement[]> {
    return this.dailyCashService.getIncomesByDailyCashId(id);
  }

  @Get('expenses/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getExpensesByDailyCashId(@Param('id') id: string): Promise<CashMovement[]> {
    return this.dailyCashService.getExpensesByDailyCashId(id);
  }

  @Get('check-open')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  isTodayDailyCashOpen(): Promise<object> {
    return this.dailyCashService.isTodayDailyCashOpen();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getDailyCashById(@Param('id') id: string): Promise<DailyCash> {
    return this.dailyCashService.getDailyCashById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateDailyCash(
    @Param('id') id: string,
    @Body() updateDailyCashDto: UpdateDailyCashDto,
  ) {
    return this.dailyCashService.updateDailyCash(id, updateDailyCashDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteDailyCash(@Param('id') id: string) {
    return this.dailyCashService.deleteDailyCash(+id);
  }
}
