import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from 'src/Order/entities/order.entity';
import { buildProductLines } from 'src/Order/helpers/order-response.helper';
import { AfipConfig } from './afip-config';
import { ArcaClient, ArcaComprobante, ArcaSolicitarResult } from './arca-client';
import {
  calculateInvoice,
  InvoiceAmounts,
  InvoiceCalculationError,
} from './invoice-calculator';
import { Invoice, InvoiceAfipEnv } from './invoice.entity';
import { fiscalTicketFromInvoice } from './fiscal-ticket';
import { civilDate } from './invoice-format';
import { InvoiceCloseView, InvoiceSnapshot } from './invoice.types';

const ORDER_RELATIONS = [
  'orderDetails',
  'orderDetails.product',
  'orderDetails.orderDetailToppings',
  'orderDetails.orderDetailToppings.topping',
  'table',
] as const;

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';
/** Concepto productos: ARCA acepta la fecha del comprobante a ±5 días. */
const PRODUCT_CBTE_WINDOW_DAYS = 5;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly locks = new Map<string, Promise<void>>();

  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly config: AfipConfig,
    private readonly arca: ArcaClient,
  ) {}

  async list(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const from = isoDate(start);
    const to = isoDate(end);
    const rows = await this.invoices.find({
      where: { cbteFch: Between(from, to) },
      order: { cbteFch: 'DESC', createdAt: 'DESC' },
    });
    return rows.map((row) => ({
      id: row.id,
      cbteFch: civilDate(row.cbteFch),
      createdAt: row.createdAt,
      ptoVta: row.ptoVta,
      cbteNro: row.cbteNro,
      origin: row.origin,
      impTotal: Number(row.impTotal),
      status: row.status,
      customerEmail: row.customerEmail,
      afipEnv: row.afipEnv,
    }));
  }

  async detail(id: string) {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('No se encontró la factura.');
    }
    invoice.cbteFch = civilDate(invoice.cbteFch);
    invoice.caeFchVto = invoice.caeFchVto
      ? civilDate(invoice.caeFchVto)
      : invoice.caeFchVto;
    return invoice;
  }

  async retry(id: string): Promise<InvoiceCloseView> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('No se encontró la factura.');
    }
    if (invoice.status !== 'pending' && invoice.status !== 'rejected') {
      throw new ConflictException(
        'Solo se reintenta una factura pendiente o rechazada.',
      );
    }
    if (invoice.afipEnv !== this.config.settings.mode) {
      throw new ConflictException(
        'Esta factura se emitió en otro modo y no se reenvía a ARCA.',
      );
    }
    const lockKey = `${invoice.afipEnv}:${invoice.ptoVta}:${invoice.cbteTipo}`;
    return this.withLock(lockKey, () => this.retryLocked(invoice));
  }

  async fiscalTicket(id: string) {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice || invoice.status !== 'authorized' || !invoice.cae) {
      throw new ConflictException('Solo se imprime una factura autorizada.');
    }
    return fiscalTicketFromInvoice(invoice);
  }

  currentAfipEnv(): InvoiceAfipEnv {
    return this.config.settings.mode as InvoiceAfipEnv;
  }

  currentPtoVta(): number {
    return this.config.settings.ptoVta ?? 1;
  }

  async emitForOrder(
    orderId: string,
    customerEmail?: string,
  ): Promise<InvoiceCloseView> {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: [...ORDER_RELATIONS],
    });
    if (!order) {
      throw new NotFoundException('No se encontró la orden para facturar.');
    }

    const settings = this.config.settings;
    const afipEnv = settings.mode as InvoiceAfipEnv;
    const ptoVta = settings.ptoVta ?? 1;
    const lockKey = `${afipEnv}:${ptoVta}:6`;

    return this.withLock(lockKey, () =>
      this.emitLocked(order, afipEnv, ptoVta, customerEmail),
    );
  }

  private async emitLocked(
    order: Order,
    afipEnv: InvoiceAfipEnv,
    ptoVta: number,
    customerEmail?: string,
  ): Promise<InvoiceCloseView> {
    const existing = await this.invoices.findOne({
      where: { orderId: order.id },
    });
    if (existing) {
      return this.toView(existing);
    }

    let built: { amounts: InvoiceAmounts; snapshot: InvoiceSnapshot };
    try {
      built = this.buildFromOrder(order);
    } catch (error) {
      const message =
        error instanceof ConflictException
          ? String(error.message)
          : error instanceof Error
            ? error.message
            : 'No se pudo armar la factura.';
      return this.persistFailedAttempt({
        origin: 'order',
        orderId: order.id,
        afipEnv,
        ptoVta,
        tipExcluded: Number(order.tip ?? 0),
        customerEmail: customerEmail ?? null,
        message,
        amounts: zeroAmounts(),
        snapshot: emptySnapshot('order', order.table?.name ?? null),
      });
    }

    return this.persistAndRequest({
      origin: 'order',
      orderId: order.id,
      afipEnv,
      ptoVta,
      tipExcluded: Number(order.tip ?? 0),
      customerEmail: customerEmail ?? null,
      amounts: built.amounts,
      snapshot: built.snapshot,
    });
  }

  async emitManual(input: {
    lines: {
      concept: string;
      quantity: number;
      unitPrice: number;
      alicQuota?: number | null;
    }[];
    discountAmount?: number;
    customerEmail?: string;
  }): Promise<InvoiceCloseView> {
    const settings = this.config.settings;
    const lines = input.lines.map((line) => ({
      name: line.concept.trim(),
      quantity: line.quantity,
      unitaryPrice: line.unitPrice,
      subtotal: Math.round(line.quantity * line.unitPrice * 100) / 100,
      alicQuota: line.alicQuota ?? null,
    }));

    let amounts: InvoiceAmounts;
    try {
      amounts = calculateInvoice({
        lines: lines.map((line) => ({
          subtotal: line.subtotal,
          alicQuota: line.alicQuota,
        })),
        discountAmount: input.discountAmount ?? 0,
        defaultAlicuotaPct: settings.alicuotaDefaultPct,
      });
    } catch (error) {
      if (error instanceof InvoiceCalculationError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    const snapshot: InvoiceSnapshot = {
      origin: 'manual',
      tableName: null,
      lines: lines.map((line) => ({
        ...line,
        alicQuota: line.alicQuota ?? settings.alicuotaDefaultPct,
      })),
      consumption: amounts.consumption,
      discountAmount: amounts.discountAmount,
      tipExcluded: 0,
      emitter: this.emitterSnapshot(),
    };

    const afipEnv = settings.mode as InvoiceAfipEnv;
    const ptoVta = settings.ptoVta ?? 1;
    return this.withLock(`${afipEnv}:${ptoVta}:6`, () =>
      this.persistAndRequest({
        origin: 'manual',
        orderId: null,
        afipEnv,
        ptoVta,
        tipExcluded: 0,
        customerEmail: input.customerEmail?.trim() || null,
        amounts,
        snapshot,
      }),
    );
  }

  private async persistAndRequest(input: {
    origin: 'order' | 'manual';
    orderId: string | null;
    afipEnv: InvoiceAfipEnv;
    ptoVta: number;
    tipExcluded: number;
    customerEmail: string | null;
    amounts: InvoiceAmounts;
    snapshot: InvoiceSnapshot;
  }): Promise<InvoiceCloseView> {
    const settings = this.config.settings;
    const today = argentinaIsoDate();
    const numberResult = await this.allocateNumber(
      input.afipEnv,
      input.ptoVta,
      6,
    );

    if (numberResult.kind === 'blocked') {
      return this.persistFailedAttempt({
        origin: input.origin,
        orderId: input.orderId,
        afipEnv: input.afipEnv,
        ptoVta: input.ptoVta,
        tipExcluded: input.tipExcluded,
        customerEmail: input.customerEmail,
        message: numberResult.message,
        amounts: input.amounts,
        snapshot: input.snapshot,
        cbteFch: today,
      });
    }

    const cbteNro = numberResult.cbteNro;
    const condicionIvaReceptorId = this.requireCondicionIvaReceptorId();
    const row = this.invoices.create({
      origin: input.origin,
      orderId: input.orderId,
      afipEnv: input.afipEnv,
      status: 'pending',
      ptoVta: input.ptoVta,
      cbteTipo: 6,
      cbteNro,
      cbteFch: today,
      concepto: settings.concepto,
      docTipo: 99,
      docNro: 0,
      condicionIvaReceptorId,
      impTotal: money(input.amounts.impTotal),
      impNeto: money(input.amounts.impNeto),
      impIva: money(input.amounts.impIva),
      impTotConc: '0.00',
      impOpEx: '0.00',
      impTrib: '0.00',
      iva: input.amounts.iva,
      discountAmount: money(input.amounts.discountAmount),
      tipExcluded: money(input.tipExcluded),
      customerEmail: input.customerEmail,
      snapshot: input.snapshot as unknown as Record<string, unknown>,
      attemptCount: 1,
      lastAttemptAt: new Date(),
    });
    let saved: Invoice;
    try {
      saved = await this.invoices.save(row);
    } catch (error) {
      if (!isInvoiceNumberConflict(error)) {
        this.logInvoice('error', 'base', row, errorText(error));
        throw error;
      }
      this.logInvoice(
        'error',
        'numeración',
        row,
        'el número ya está en la base',
      );
      return this.persistFailedAttempt({
        origin: input.origin,
        orderId: input.orderId,
        afipEnv: input.afipEnv,
        ptoVta: input.ptoVta,
        tipExcluded: input.tipExcluded,
        customerEmail: input.customerEmail,
        message: errorText(error),
        amounts: input.amounts,
        snapshot: input.snapshot,
        cbteFch: today,
      });
    }

    let result: ArcaSolicitarResult;
    try {
      result = await this.arca.solicitar({
        ptoVta: input.ptoVta,
        cbteTipo: 6,
        cbteNro,
        cbteFch: today.replace(/-/g, ''),
        concepto: settings.concepto,
        docTipo: 99,
        docNro: 0,
        condicionIvaReceptorId,
        impTotal: input.amounts.impTotal,
        impTotConc: 0,
        impNeto: input.amounts.impNeto,
        impOpEx: 0,
        impTrib: 0,
        impIva: input.amounts.impIva,
        iva: input.amounts.iva.map((item) => ({
          id: item.id,
          baseImp: item.baseImp,
          importe: item.importe,
        })),
      });
    } catch (error) {
      result = { outcome: 'timeout' };
      saved.arcaErrors = {
        errors: [
          {
            code: 'REQUEST',
            msg: errorText(error),
          },
        ],
      };
      this.logInvoice('warn', 'timeout', saved, errorText(error));
    }

    if (result.outcome === 'timeout') {
      const resolved = await this.tryAuthorizeFromConsulta(saved);
      if (resolved) {
        return this.toView(resolved);
      }
      saved.status = 'pending';
      saved.resultado = null;
      if (!saved.arcaErrors) {
        this.logInvoice('warn', 'timeout', saved);
      }
      const updated = await this.invoices.save(saved);
      return this.toView(updated);
    }

    this.applyResult(saved, result);
    const updated = await this.invoices.save(saved);
    return this.toView(updated);
  }

  private async persistFailedAttempt(input: {
    origin: 'order' | 'manual';
    orderId: string | null;
    afipEnv: InvoiceAfipEnv;
    ptoVta: number;
    tipExcluded: number;
    customerEmail: string | null;
    message: string;
    amounts: InvoiceAmounts;
    snapshot: InvoiceSnapshot;
    cbteFch?: string;
  }): Promise<InvoiceCloseView> {
    const settings = this.config.settings;
    const condicionIvaReceptorId =
      settings.condicionIvaReceptorId != null &&
      settings.condicionIvaReceptorId > 0
        ? settings.condicionIvaReceptorId
        : 0;
    const row = this.invoices.create({
      origin: input.origin,
      orderId: input.orderId,
      afipEnv: input.afipEnv,
      status: 'pending',
      ptoVta: input.ptoVta,
      cbteTipo: 6,
      cbteNro: null,
      cbteFch: input.cbteFch ?? argentinaIsoDate(),
      concepto: settings.concepto,
      docTipo: 99,
      docNro: 0,
      condicionIvaReceptorId,
      impTotal: money(input.amounts.impTotal),
      impNeto: money(input.amounts.impNeto),
      impIva: money(input.amounts.impIva),
      impTotConc: '0.00',
      impOpEx: '0.00',
      impTrib: '0.00',
      iva: input.amounts.iva,
      discountAmount: money(input.amounts.discountAmount),
      tipExcluded: money(input.tipExcluded),
      customerEmail: input.customerEmail,
      snapshot: input.snapshot as unknown as Record<string, unknown>,
      arcaErrors: { errors: [{ code: 'LOCAL', msg: input.message }] },
      attemptCount: 1,
      lastAttemptAt: new Date(),
    });
    const saved = await this.invoices.save(row);
    return this.toView(saved);
  }

  private async retryLocked(invoice: Invoice): Promise<InvoiceCloseView> {
    invoice.attemptCount = Number(invoice.attemptCount ?? 0) + 1;
    invoice.lastAttemptAt = new Date();

    if (invoice.cbteNro != null) {
      const fromConsulta = await this.tryAuthorizeFromConsulta(invoice);
      if (fromConsulta) {
        return this.toView(fromConsulta);
      }
      if (invoice.status === 'pending' && invoice.arcaErrors) {
        const errors = (
          invoice.arcaErrors as { errors?: { code?: string }[] } | null
        )?.errors;
        if (errors?.some((item) => item.code === 'CONSULTA')) {
          const saved = await this.invoices.save(invoice);
          return this.toView(saved);
        }
        if (errors?.some((item) => item.code === 'MISMATCH')) {
          const saved = await this.invoices.save(invoice);
          return this.toView(saved);
        }
      }
    }

    if (invoice.cbteNro == null) {
      if (invoice.origin === 'order' && invoice.orderId) {
        const rebuilt = await this.rebuildOrderInvoice(invoice);
        if (rebuilt) {
          invoice = rebuilt;
        }
      }
      const allocated = await this.allocateNumber(
        invoice.afipEnv,
        invoice.ptoVta,
        invoice.cbteTipo,
      );
      if (allocated.kind === 'blocked') {
        invoice.arcaErrors = {
          errors: [{ code: 'LOCAL', msg: allocated.message }],
        };
        const saved = await this.invoices.save(invoice);
        return this.toView(saved);
      }
      invoice.cbteNro = allocated.cbteNro;
      if (!invoice.cbteFch) {
        invoice.cbteFch = argentinaIsoDate();
      }
    }

    this.alignCbteFchToProductWindow(invoice);

    let result: ArcaSolicitarResult;
    try {
      result = await this.arca.solicitar(this.solicitudFromInvoice(invoice));
    } catch (error) {
      invoice.status = 'pending';
      invoice.resultado = null;
      const previousFch = previousCbteFchOf(invoice);
      invoice.arcaErrors = {
        errors: [
          {
            code: 'REQUEST',
            msg: errorText(error),
          },
        ],
        ...(previousFch ? { previousCbteFch: previousFch } : {}),
      };
      this.logInvoice('warn', 'timeout', invoice, errorText(error));
      const saved = await this.invoices.save(invoice);
      return this.toView(saved);
    }

    if (result.outcome === 'timeout') {
      const resolved = await this.tryAuthorizeFromConsulta(invoice);
      if (resolved) {
        return this.toView(resolved);
      }
      invoice.status = 'pending';
      invoice.resultado = null;
      this.logInvoice('warn', 'timeout', invoice);
      const saved = await this.invoices.save(invoice);
      return this.toView(saved);
    }

    this.applyResult(invoice, result);
    const saved = await this.invoices.save(invoice);
    return this.toView(saved);
  }

  private async rebuildOrderInvoice(
    invoice: Invoice,
  ): Promise<Invoice | null> {
    if (!invoice.orderId) return null;
    const order = await this.orders.findOne({
      where: { id: invoice.orderId },
      relations: [...ORDER_RELATIONS],
    });
    if (!order) return null;
    try {
      const built = this.buildFromOrder(order);
      invoice.impTotal = money(built.amounts.impTotal);
      invoice.impNeto = money(built.amounts.impNeto);
      invoice.impIva = money(built.amounts.impIva);
      invoice.iva = built.amounts.iva;
      invoice.discountAmount = money(built.amounts.discountAmount);
      invoice.tipExcluded = money(Number(order.tip ?? 0));
      invoice.snapshot = built.snapshot as unknown as Record<string, unknown>;
      invoice.condicionIvaReceptorId = this.requireCondicionIvaReceptorId();
      invoice.concepto = this.config.settings.concepto;
      return invoice;
    } catch {
      return null;
    }
  }

  /**
   * Consulta el número. Si hay CAE con el mismo importe y fecha, autoriza.
   * Si la consulta falla o el CAE no coincide, deja la fila pendiente y
   * no pide un CAE nuevo.
   * Devuelve la fila autorizada, o null si hay que seguir (inexistente)
   * o si no se puede solicitar.
   */
  private async tryAuthorizeFromConsulta(
    invoice: Invoice,
  ): Promise<Invoice | null> {
    if (invoice.cbteNro == null) return null;

    let consulted: ArcaComprobante | null;
    try {
      consulted = await this.arca.consultar(
        invoice.ptoVta,
        invoice.cbteTipo,
        invoice.cbteNro,
      );
    } catch (error) {
      invoice.status = 'pending';
      invoice.resultado = null;
      const msg = errorText(
        error,
        'No se pudo consultar el comprobante en ARCA.',
      );
      invoice.arcaErrors = {
        errors: [
          {
            code: 'CONSULTA',
            msg,
          },
        ],
      };
      this.logInvoice('warn', 'CONSULTA', invoice, msg);
      await this.invoices.save(invoice);
      return null;
    }

    if (!consulted?.cae) {
      return null;
    }

    if (!this.comprobanteMatchesInvoice(invoice, consulted)) {
      invoice.status = 'pending';
      invoice.resultado = null;
      invoice.arcaErrors = {
        errors: [
          {
            code: 'MISMATCH',
            msg: 'ARCA tiene un CAE para este número con otro importe o fecha.',
          },
        ],
      };
      this.logInvoice('warn', 'MISMATCH', invoice);
      await this.invoices.save(invoice);
      return null;
    }

    invoice.status = 'authorized';
    invoice.cae = consulted.cae;
    invoice.caeFchVto = isoFromCompact(consulted.caeFchVto);
    invoice.resultado = 'A';
    invoice.authorizedAt = new Date();
    invoice.arcaErrors = null;
    return this.invoices.save(invoice);
  }

  private comprobanteMatchesInvoice(
    invoice: Invoice,
    consulted: ArcaComprobante,
  ): boolean {
    const localTotal = Number(invoice.impTotal);
    if (Math.abs(localTotal - Number(consulted.impTotal)) > 0.009) {
      return false;
    }
    if (!consulted.cbteFch) {
      return true;
    }
    const localFch = civilDate(invoice.cbteFch).replace(/-/g, '');
    const remoteFch = consulted.cbteFch.replace(/-/g, '');
    return localFch === remoteFch;
  }

  private async allocateNumber(
    afipEnv: InvoiceAfipEnv,
    ptoVta: number,
    cbteTipo: number,
  ): Promise<
    | { kind: 'ok'; cbteNro: number }
    | { kind: 'blocked'; message: string }
  > {
    const remoteLast = await this.arca.ultimoAutorizado(ptoVta, cbteTipo);
    const localLast = await this.maxAuthorizedNumber(afipEnv, ptoVta, cbteTipo);
    let candidate = Math.max(remoteLast, localLast) + 1;

    for (let guard = 0; guard < 20; guard += 1) {
      const pending = await this.findByNumber(
        afipEnv,
        ptoVta,
        cbteTipo,
        candidate,
        'pending',
      );
      if (pending) {
        const authorized = await this.tryAuthorizeFromConsulta(pending);
        if (authorized?.status === 'authorized') {
          candidate += 1;
          continue;
        }
        if (
          pending.status === 'pending' &&
          (pending.arcaErrors as { errors?: { code?: string }[] } | null)
            ?.errors?.some(
              (item) => item.code === 'CONSULTA' || item.code === 'MISMATCH',
            )
        ) {
          return {
            kind: 'blocked',
            message:
              'Hay una factura pendiente con este número y no se pudo confirmar en ARCA. Reintentala antes de emitir otra.',
          };
        }
        return {
          kind: 'blocked',
          message:
            'Hay una factura pendiente sin CAE. Reintentala antes de emitir otra.',
        };
      }

      const rejected = await this.findByNumber(
        afipEnv,
        ptoVta,
        cbteTipo,
        candidate,
        'rejected',
      );
      if (rejected) {
        if (rejected.resultado !== 'R') {
          return {
            kind: 'blocked',
            message:
              'Hay un comprobante marcado como rechazado sin un rechazo explícito de ARCA. No se reutiliza el número.',
          };
        }
        await this.releaseNumber(rejected);
        return { kind: 'ok', cbteNro: candidate };
      }

      return { kind: 'ok', cbteNro: candidate };
    }

    return {
      kind: 'blocked',
      message: 'No se pudo asignar un número de comprobante.',
    };
  }

  private async findByNumber(
    afipEnv: InvoiceAfipEnv,
    ptoVta: number,
    cbteTipo: number,
    cbteNro: number,
    status: 'pending' | 'rejected',
  ): Promise<Invoice | null> {
    return this.invoices.findOne({
      where: { afipEnv, ptoVta, cbteTipo, cbteNro, status },
    });
  }

  private async maxAuthorizedNumber(
    afipEnv: InvoiceAfipEnv,
    ptoVta: number,
    cbteTipo: number,
  ): Promise<number> {
    const rows = await this.invoices.find({
      where: { afipEnv, ptoVta, cbteTipo, status: 'authorized' },
      order: { cbteNro: 'DESC' },
      take: 1,
    });
    return Number(rows[0]?.cbteNro ?? 0);
  }

  private async releaseNumber(invoice: Invoice): Promise<void> {
    const released = invoice.cbteNro;
    const previous =
      (invoice.arcaErrors as Record<string, unknown> | null) ?? {};
    invoice.cbteNro = null;
    invoice.arcaErrors = {
      ...previous,
      releasedCbteNro: released,
    };
    await this.invoices.save(invoice);
  }

  private solicitudFromInvoice(invoice: Invoice) {
    return {
      ptoVta: invoice.ptoVta,
      cbteTipo: invoice.cbteTipo,
      cbteNro: invoice.cbteNro ?? 0,
      cbteFch: civilDate(invoice.cbteFch).replace(/-/g, ''),
      concepto: invoice.concepto,
      docTipo: invoice.docTipo,
      docNro: invoice.docNro,
      condicionIvaReceptorId: invoice.condicionIvaReceptorId,
      impTotal: Number(invoice.impTotal),
      impTotConc: Number(invoice.impTotConc ?? 0),
      impNeto: Number(invoice.impNeto),
      impOpEx: Number(invoice.impOpEx ?? 0),
      impTrib: Number(invoice.impTrib ?? 0),
      impIva: Number(invoice.impIva),
      iva: (invoice.iva ?? []).map((item) => ({
        id: item.id,
        baseImp: item.baseImp,
        importe: item.importe,
      })),
    };
  }

  private applyResult(invoice: Invoice, result: ArcaSolicitarResult) {
    if (result.outcome === 'authorized') {
      invoice.status = 'authorized';
      invoice.cae = result.cae;
      invoice.caeFchVto = isoFromCompact(result.caeFchVto);
      invoice.resultado = 'A';
      invoice.authorizedAt = new Date();
      const previousFch = previousCbteFchOf(invoice);
      invoice.arcaErrors = previousFch
        ? { previousCbteFch: previousFch }
        : null;
      return;
    }
    if (result.outcome === 'rejected') {
      invoice.status = 'rejected';
      invoice.resultado = 'R';
      const previousFch = previousCbteFchOf(invoice);
      invoice.arcaErrors = {
        errors: result.errors,
        ...(previousFch ? { previousCbteFch: previousFch } : {}),
      };
      this.logInvoice(
        'warn',
        'rechazo',
        invoice,
        result.errors.map((item) => `${item.code} ${item.msg}`).join('; '),
      );
      return;
    }
    invoice.status = 'pending';
    invoice.resultado = null;
  }

  private alignCbteFchToProductWindow(invoice: Invoice): void {
    const today = argentinaIsoDate();
    const stored = civilDate(invoice.cbteFch);
    if (stored === today) return;
    if (stored && !outsideProductWindow(stored, today)) return;
    invoice.arcaErrors = {
      ...errorRecord(invoice.arcaErrors),
      previousCbteFch: stored || String(invoice.cbteFch ?? ''),
    };
    invoice.cbteFch = today;
  }

  private logInvoice(
    level: 'warn' | 'error',
    event: string,
    invoice: {
      id?: string;
      afipEnv?: string;
      ptoVta?: number;
      cbteNro?: number | null;
    },
    detail?: string,
  ) {
    const line = [
      event,
      `env=${invoice.afipEnv ?? '-'}`,
      `ptoVta=${invoice.ptoVta ?? '-'}`,
      `cbteNro=${invoice.cbteNro ?? '-'}`,
      `id=${invoice.id || '-'}`,
      detail,
    ]
      .filter(Boolean)
      .join(' ');
    this.logger[level](line);
  }

  private buildFromOrder(order: Order) {
    const settings = this.config.settings;
    const lines = [];
    for (const detail of order.orderDetails ?? []) {
      if (!detail.isActive) continue;
      const quota =
        detail.product?.alicQuota == null
          ? null
          : Number(detail.product.alicQuota);
      for (const line of buildProductLines(detail)) {
        lines.push({
          name: line.productName,
          quantity: line.quantity,
          unitaryPrice: line.unitaryPrice,
          subtotal: line.subtotal,
          alicQuota: quota,
        });
      }
    }

    let amounts;
    try {
      amounts = calculateInvoice({
        lines: lines.map((line) => ({
          subtotal: line.subtotal,
          alicQuota: line.alicQuota,
        })),
        discountAmount: Number(order.discountAmount ?? 0),
        defaultAlicuotaPct: settings.alicuotaDefaultPct,
      });
    } catch (error) {
      if (error instanceof InvoiceCalculationError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    const snapshot: InvoiceSnapshot = {
      origin: 'order',
      tableName: order.table?.name ?? null,
      lines: lines.map((line) => ({
        ...line,
        alicQuota: line.alicQuota ?? settings.alicuotaDefaultPct,
      })),
      consumption: amounts.consumption,
      discountAmount: amounts.discountAmount,
      tipExcluded: Number(order.tip ?? 0),
      emitter: this.emitterSnapshot(),
    };

    return { amounts, snapshot };
  }

  private emitterSnapshot() {
    const settings = this.config.settings;
    return {
      cuit: settings.cuit,
      razonSocial: settings.razonSocial,
      domicilio: settings.domicilio,
      condicionIva: 'Responsable Inscripto',
      iibb: settings.iibb,
      inicioActividades: settings.inicioActividades,
    };
  }

  private requireCondicionIvaReceptorId(): number {
    const value = this.config.settings.condicionIvaReceptorId;
    if (value != null && value > 0) {
      return value;
    }
    if (this.config.settings.simulate) {
      return 0;
    }
    throw new ConflictException(
      'Falta AFIP_CONDICION_IVA_RECEPTOR_ID para facturar.',
    );
  }

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(
      key,
      previous.then(() => current),
    );
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private toView(invoice: Invoice): InvoiceCloseView {
    return {
      id: invoice.id,
      status: invoice.status,
      cbteNro: invoice.cbteNro,
      cae: invoice.cae,
      afipEnv: invoice.afipEnv,
      message: messageFor(invoice),
    };
  }
}

function previousCbteFchOf(invoice: Invoice): string | null {
  const value = errorRecord(invoice.arcaErrors).previousCbteFch;
  return typeof value === 'string' && value ? value : null;
}

function errorRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function errorText(
  error: unknown,
  fallback = 'Error al solicitar.',
): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isInvoiceNumberConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as {
    code?: string;
    constraint?: string;
    message?: string;
    driverError?: { code?: string; constraint?: string; message?: string };
  };
  const code = row.driverError?.code ?? row.code;
  const constraint = `${row.driverError?.constraint ?? ''} ${row.constraint ?? ''} ${row.message ?? ''} ${row.driverError?.message ?? ''}`;
  return code === '23505' && /UQ_invoices_number/.test(constraint);
}

function outsideProductWindow(stored: string, today: string): boolean {
  const delta = daysBetweenIso(stored, today);
  if (delta == null) return true;
  return Math.abs(delta) > PRODUCT_CBTE_WINDOW_DAYS;
}

function daysBetweenIso(from: string, to: string): number | null {
  const start = isoUtc(from);
  const end = isoUtc(to);
  if (start == null || end == null) return null;
  return Math.round((end - start) / 86_400_000);
}

function isoUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function messageFor(invoice: Invoice): string {
  if (invoice.status === 'authorized') {
    return `Factura B autorizada. Número ${invoice.cbteNro}.`;
  }
  const stored = firstErrorMessage(invoice.arcaErrors);
  if (invoice.status === 'rejected') {
    const reason = stored ?? 'ARCA rechazó el comprobante.';
    return invoice.origin === 'order'
      ? `La orden está cobrada. ${reason}`
      : reason;
  }
  if (stored) {
    return invoice.origin === 'order'
      ? `La orden está cobrada. ${stored}`
      : stored;
  }
  return invoice.origin === 'order'
    ? 'La orden está cobrada. La factura quedó pendiente.'
    : 'La factura quedó pendiente.';
}

function firstErrorMessage(arcaErrors: unknown): string | null {
  const errors = (arcaErrors as { errors?: { msg?: string }[] } | null)
    ?.errors;
  const msg = errors?.[0]?.msg;
  return msg ? String(msg) : null;
}

function money(value: number): string {
  return value.toFixed(2);
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fecha civil del comprobante en zona argentina, independiente del TZ del proceso. */
export function argentinaIsoDate(date = new Date()): string {
  const local = date
    .toLocaleString('sv-SE', { timeZone: ARGENTINA_TZ })
    .slice(0, 10);
  return local;
}

function isoFromCompact(value: string): string {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}

function zeroAmounts(): InvoiceAmounts {
  return {
    consumption: 0,
    discountAmount: 0,
    impTotal: 0,
    impNeto: 0,
    impIva: 0,
    impTotConc: 0,
    impOpEx: 0,
    impTrib: 0,
    iva: [],
  };
}

function emptySnapshot(
  origin: 'order' | 'manual',
  tableName: string | null,
): InvoiceSnapshot {
  return {
    origin,
    tableName,
    lines: [],
    consumption: 0,
    discountAmount: 0,
    tipExcluded: 0,
    emitter: {
      cuit: null,
      razonSocial: null,
      domicilio: null,
      condicionIva: 'Responsable Inscripto',
      iibb: null,
      inicioActividades: null,
    },
  };
}
