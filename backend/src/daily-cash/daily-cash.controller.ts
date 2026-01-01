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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Caja Diaria')
@ApiBearerAuth('JWT-auth')
@Controller('daily-cash')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class DailyCashController {
  constructor(private readonly dailyCashService: DailyCashService) {}

  @Post()
  @ApiOperation({
    summary: 'Abrir caja diaria',
    description:
      'Abre una nueva caja diaria con el monto inicial especificado. Solo puede haber una caja abierta a la vez.',
  })
  @ApiBody({
    type: CreateDailyCashDto,
    description: 'Datos de apertura de caja',
    examples: {
      ejemplo: {
        value: {
          initialAmount: 10000,
          openedBy: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Caja abierta exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe una caja abierta' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  openDailyCash(
    @Body() createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    return this.dailyCashService.openDailyCash(createDailyCashDto);
  }

  @Post('close/:id')
  @ApiOperation({
    summary: 'Cerrar caja diaria',
    description:
      'Cierra la caja diaria actual, registrando el monto final y calculando diferencias',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la caja a cerrar',
  })
  @ApiBody({
    type: CloseDailyCash,
    description: 'Datos de cierre de caja',
    examples: {
      ejemplo: {
        value: {
          finalAmount: 45000,
          closedBy: 'Juan Pérez',
          notes: 'Día tranquilo',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Caja cerrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Caja no encontrada' })
  @ApiResponse({ status: 400, description: 'La caja ya está cerrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  closeDailyCash(
    @Param('id') id: string,
    @Body() closeDailyCashDto: CloseDailyCash,
  ): Promise<DailyCash> {
    return this.dailyCashService.closeDailyCash(id, closeDailyCashDto);
  }

  @Post('register-expense')
  @ApiOperation({
    summary: 'Registrar gasto',
    description:
      'Registra un egreso/gasto en la caja actual (compras, pagos, etc.)',
  })
  @ApiBody({
    type: RegisterExpenseDto,
    description: 'Datos del gasto',
    examples: {
      ejemplo: {
        value: {
          amount: 5000,
          description: 'Compra de insumos',
          category: 'PROVEEDOR',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Gasto registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'No hay caja abierta' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  registerExpense(
    @Body() expenseData: RegisterExpenseDto,
  ): Promise<CashMovement> {
    return this.dailyCashService.registerExpense(expenseData);
  }

  @Post('register-movement')
  @ApiOperation({
    summary: 'Registrar movimiento',
    description: 'Registra un movimiento de caja (ingreso o egreso manual)',
  })
  @ApiBody({
    type: RegisterMovementDto,
    description: 'Datos del movimiento',
    examples: {
      ingreso: {
        summary: 'Ingreso manual',
        value: {
          amount: 5000,
          type: 'INCOME',
          description: 'Ingreso adicional',
        },
      },
      egreso: {
        summary: 'Egreso manual',
        value: {
          amount: 2000,
          type: 'EXPENSE',
          description: 'Retiro de efectivo',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  registerMovement(
    @Body() movementData: RegisterMovementDto,
  ): Promise<CashMovement> {
    return this.dailyCashService.registerMovement(movementData);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener historial de cajas',
    description: 'Devuelve una lista paginada de todas las cajas diarias',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cajas obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getAllDailysCash(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(1000), ParseIntPipe)
    limit: number = 1000,
  ): Promise<DailyCash[]> {
    return this.dailyCashService.getAllDailyCash(page, limit);
  }

  @Get('incomes/:id')
  @ApiOperation({
    summary: 'Obtener ingresos de una caja',
    description:
      'Devuelve todos los ingresos registrados en una caja específica',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la caja' })
  @ApiResponse({ status: 200, description: 'Lista de ingresos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getIncomesByDailyCashId(@Param('id') id: string): Promise<CashMovement[]> {
    return this.dailyCashService.getIncomesByDailyCashId(id);
  }

  @Get('expenses/:id')
  @ApiOperation({
    summary: 'Obtener egresos de una caja',
    description:
      'Devuelve todos los egresos registrados en una caja específica',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la caja' })
  @ApiResponse({ status: 200, description: 'Lista de egresos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getExpensesByDailyCashId(@Param('id') id: string): Promise<CashMovement[]> {
    return this.dailyCashService.getExpensesByDailyCashId(id);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen actual de caja',
    description:
      'Devuelve el resumen de la caja actual (ingresos, egresos, saldo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de caja',
    schema: {
      example: {
        totalIncome: 50000,
        totalExpenses: 15000,
        currentBalance: 45000,
        ordersCount: 25,
      },
    },
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  summaryAtMoment(): Promise<object> {
    return this.dailyCashService.summaryAtMoment();
  }

  @Get('check-open')
  @ApiOperation({
    summary: 'Verificar caja abierta',
    description: 'Verifica si hay una caja diaria abierta actualmente',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la caja',
    schema: {
      example: { isOpen: true, dailyCashId: 'uuid-caja' },
    },
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  isAnyDailyCashOpen(): Promise<object> {
    return this.dailyCashService.isAnyDailyCashOpen();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener caja por ID',
    description: 'Devuelve una caja diaria específica con todos sus detalles',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la caja' })
  @ApiResponse({ status: 200, description: 'Caja encontrada' })
  @ApiResponse({ status: 404, description: 'Caja no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getDailyCashById(@Param('id') id: string): Promise<DailyCash> {
    return this.dailyCashService.getDailyCashById(id);
  }

  @Get('movements/by-date')
  @ApiOperation({
    summary: 'Obtener caja por fecha',
    description:
      'Devuelve la caja diaria de una fecha específica con todos sus movimientos',
  })
  @ApiQuery({
    name: 'day',
    required: true,
    type: Number,
    description: 'Día (1-31)',
    example: 15,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
    example: 6,
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({ status: 200, description: 'Caja del día encontrada' })
  @ApiResponse({ status: 404, description: 'No hay caja para esa fecha' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getDailyCashWithOrdersByDate(
    @Query('day', ParseIntPipe) day: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<DailyCash | null> {
    return this.dailyCashService.getDailyCashWithOrdersByDate(day, month, year);
  }

  @Get('movement-by-id/:id')
  @ApiOperation({
    summary: 'Obtener detalle de movimiento',
    description: 'Devuelve el detalle completo de un movimiento de caja',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del movimiento' })
  @ApiResponse({ status: 200, description: 'Detalle del movimiento' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  detailsMovementById(@Param('id') id: string) {
    return this.dailyCashService.detailsMovementById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar caja diaria',
    description:
      'Actualiza datos de una caja diaria (notas, observaciones, etc.)',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la caja' })
  @ApiBody({ type: UpdateDailyCashDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Caja actualizada exitosamente' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateDailyCash(
    @Param('id') id: string,
    @Body() updateDailyCashDto: UpdateDailyCashDto,
  ) {
    return this.dailyCashService.updateDailyCash(id, updateDailyCashDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar caja diaria',
    description:
      'Elimina una caja diaria del historial. Solo ADMIN y ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la caja a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Caja eliminada exitosamente' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteDailyCash(@Param('id') id: string) {
    return this.dailyCashService.deleteDailyCash(+id);
  }

  // -------------------------- metricas -----------------------
  @Get('metrics/monthly')
  @ApiOperation({
    summary: 'Métricas mensuales',
    description:
      'Devuelve el resumen de ingresos, egresos y ganancia de un mes específico',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
    example: 6,
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del mes',
    schema: { example: { income: 500000, expenses: 150000, profit: 350000 } },
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getMonthlyMetrics(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ income: number; expenses: number; profit: number }> {
    return this.dailyCashService.getMonthlySummary(month, year);
  }

  @Get('metrics/annual')
  @ApiOperation({
    summary: 'Métricas anuales',
    description:
      'Devuelve el resumen de ingresos, egresos y ganancia de un año completo',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del año',
    schema: {
      example: { income: 6000000, expenses: 2000000, profit: 4000000 },
    },
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getAnnualSummary(
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ income: number; expenses: number; profit: number }> {
    return this.dailyCashService.getAnnualSummary(year);
  }

  @Get('metrics/annual-distribution')
  @ApiOperation({
    summary: 'Distribución anual por mes',
    description:
      'Devuelve la distribución de ingresos y egresos mes a mes para un año',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: 'Distribución mensual',
    schema: {
      example: [
        { mes: 'Enero', income: 500000, expenses: 150000 },
        { mes: 'Febrero', income: 450000, expenses: 140000 },
      ],
    },
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getAnnualDistribution(
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ mes: string; income: number; expenses: number }[]> {
    return this.dailyCashService.getAnnualDistribution(year);
  }

  @Get('metrics/daily')
  @ApiOperation({
    summary: 'Métricas diarias del mes',
    description: 'Devuelve ingresos y egresos día a día para un mes específico',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
    example: 6,
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({ status: 200, description: 'Métricas diarias del mes' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getDailyMetrics(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ day: string; income: number; expenses: number }[]> {
    return this.dailyCashService.getDailyMetrics(month, year);
  }

  @Get('metrics/daily-profit')
  @ApiOperation({
    summary: 'Ganancia diaria del mes',
    description: 'Devuelve la ganancia neta día a día para un mes específico',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
    example: 6,
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2024,
  })
  @ApiResponse({ status: 200, description: 'Ganancia diaria del mes' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getDailyProfit(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<{ day: string; profit: number }[]> {
    return this.dailyCashService.getDailyProfit(month, year);
  }
}
