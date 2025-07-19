import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
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

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  summaryAtMoment(): Promise<object> {
    return this.dailyCashService.summaryAtMoment();
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

  @Get('movements/by-date')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getDailyCashWithOrdersByDate(
    @Query('day', ParseIntPipe) day: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<DailyCash | null> {
    return this.dailyCashService.getDailyCashWithOrdersByDate(day, month, year);
  }

  @Get('movement-by-id/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  detailsMovementById(@Param('id') id: string) {
    return this.dailyCashService.detailsMovementById(id);
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

  // -------------------------- metricas -----------------------
  @Get('metrics/monthly')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getMonthlyMetrics(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ income: number; expenses: number; profit: number }> {
    return this.dailyCashService.getMonthlySummary(month, year);
  }

  @Get('metrics/annual')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getAnnualSummary(
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ income: number; expenses: number; profit: number }> {
    return this.dailyCashService.getAnnualSummary(year);
  }

  @Get('metrics/annual-distribution')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getAnnualDistribution(
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ mes: string; income: number; expenses: number }[]> {
    return this.dailyCashService.getAnnualDistribution(year);
  }

  @Get('metrics/daily')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getDailyMetrics(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ day: string; income: number; expenses: number }[]> {
    return this.dailyCashService.getDailyMetrics(month, year);
  }

  @Get('metrics/daily-profit')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getDailyProfit(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ day: string; profit: number }[]> {
    return this.dailyCashService.getDailyProfit(month, year);
  }
}
