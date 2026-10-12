import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from 'src/Order/entities/order.entity';
import { buildProductLines } from 'src/Order/helpers/order-response.helper';
import { AfipConfig } from './afip-config';
import { ArcaClient, ArcaSolicitarResult } from './arca-client';
import {
  calculateInvoice,
  InvoiceCalculationError,
} from './invoice-calculator';
import { Invoice, InvoiceAfipEnv } from './invoice.entity';
import { fiscalTicketFromInvoice } from './fiscal-ticket';
import { InvoiceCloseView, InvoiceSnapshot } from './invoice.types';

const ORDER_RELATIONS = [
  'orderDetails',
  'orderDetails.product',
  'orderDetails.orderDetailToppings',
  'orderDetails.orderDetailToppings.topping',
  'table',
] as const;

@Injectable()
export class InvoiceService {
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
      cbteFch: row.cbteFch,
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

    const built = this.buildFromOrder(order);
    const cbteNro = await this.nextNumber(afipEnv, ptoVta, 6);
    const settings = this.config.settings;
    const today = localIsoDate();

    const row = this.invoices.create({
      origin: 'order',
      orderId: order.id,
      afipEnv,
      status: 'pending',
      ptoVta,
      cbteTipo: 6,
      cbteNro,
      cbteFch: today,
      concepto: settings.concepto,
      docTipo: 99,
      docNro: 0,
      condicionIvaReceptorId: settings.condicionIvaReceptorId ?? 0,
      impTotal: money(built.amounts.impTotal),
      impNeto: money(built.amounts.impNeto),
      impIva: money(built.amounts.impIva),
      impTotConc: '0.00',
      impOpEx: '0.00',
      impTrib: '0.00',
      iva: built.amounts.iva,
      discountAmount: money(built.amounts.discountAmount),
      tipExcluded: money(Number(order.tip ?? 0)),
      customerEmail: customerEmail ?? null,
      snapshot: built.snapshot as unknown as Record<string, unknown>,
      attemptCount: 1,
      lastAttemptAt: new Date(),
    });
    const saved = await this.invoices.save(row);

    let result: ArcaSolicitarResult;
    try {
      result = await this.arca.solicitar({
        ptoVta,
        cbteTipo: 6,
        cbteNro,
        cbteFch: today.replace(/-/g, ''),
        concepto: settings.concepto,
        docTipo: 99,
        docNro: 0,
        condicionIvaReceptorId: settings.condicionIvaReceptorId ?? 0,
        impTotal: built.amounts.impTotal,
        impTotConc: 0,
        impNeto: built.amounts.impNeto,
        impOpEx: 0,
        impTrib: 0,
        impIva: built.amounts.impIva,
        iva: built.amounts.iva.map((item) => ({
          id: item.id,
          baseImp: item.baseImp,
          importe: item.importe,
        })),
      });
    } catch {
      result = { outcome: 'timeout' };
    }

    if (result.outcome === 'timeout') {
      try {
        const consulted = await this.arca.consultar(ptoVta, 6, cbteNro);
        if (consulted?.cae) {
          result = {
            outcome: 'authorized',
            cae: consulted.cae,
            caeFchVto: consulted.caeFchVto,
            reproceso: true,
          };
        }
      } catch {
        result = { outcome: 'timeout' };
      }
    }

    if (result.outcome === 'authorized') {
      saved.status = 'authorized';
      saved.cae = result.cae;
      saved.caeFchVto = isoFromCompact(result.caeFchVto);
      saved.resultado = 'A';
      saved.authorizedAt = new Date();
      saved.arcaErrors = null;
    } else if (result.outcome === 'rejected') {
      saved.status = 'rejected';
      saved.resultado = 'R';
      saved.arcaErrors = { errors: result.errors };
    } else {
      saved.status = 'pending';
      saved.resultado = null;
    }

    const updated = await this.invoices.save(saved);
    return this.toView(updated);
  }

  private async retryLocked(invoice: Invoice): Promise<InvoiceCloseView> {
    invoice.attemptCount = Number(invoice.attemptCount ?? 0) + 1;
    invoice.lastAttemptAt = new Date();

    if (invoice.status === 'pending' && invoice.cbteNro != null) {
      try {
        const consulted = await this.arca.consultar(
          invoice.ptoVta,
          invoice.cbteTipo,
          invoice.cbteNro,
        );
        if (consulted?.cae) {
          invoice.status = 'authorized';
          invoice.cae = consulted.cae;
          invoice.caeFchVto = isoFromCompact(consulted.caeFchVto);
          invoice.resultado = 'A';
          invoice.authorizedAt = new Date();
          const saved = await this.invoices.save(invoice);
          return this.toView(saved);
        }
      } catch {
        // Sigue el reintento de solicitud.
      }
    }

    let result: ArcaSolicitarResult;
    try {
      result = await this.arca.solicitar(this.solicitudFromInvoice(invoice));
    } catch {
      result = { outcome: 'timeout' };
    }
    this.applyResult(invoice, result);
    const saved = await this.invoices.save(invoice);
    return this.toView(saved);
  }

  private solicitudFromInvoice(invoice: Invoice) {
    return {
      ptoVta: invoice.ptoVta,
      cbteTipo: invoice.cbteTipo,
      cbteNro: invoice.cbteNro ?? 0,
      cbteFch: String(invoice.cbteFch).slice(0, 10).replace(/-/g, ''),
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
      invoice.arcaErrors = null;
      return;
    }
    if (result.outcome === 'rejected') {
      invoice.status = 'rejected';
      invoice.resultado = 'R';
      invoice.arcaErrors = { errors: result.errors };
      return;
    }
    invoice.status = 'pending';
    invoice.resultado = null;
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
      emitter: {
        cuit: settings.cuit,
        razonSocial: settings.razonSocial,
        domicilio: settings.domicilio,
        condicionIva: 'Responsable Inscripto',
        iibb: settings.iibb,
        inicioActividades: settings.inicioActividades,
      },
    };

    return { amounts, snapshot };
  }

  private async nextNumber(
    afipEnv: InvoiceAfipEnv,
    ptoVta: number,
    cbteTipo: number,
  ): Promise<number> {
    const fromClient = await this.arca.ultimoAutorizado(ptoVta, cbteTipo);
    const raw = await this.invoices
      .createQueryBuilder('invoice')
      .select('COALESCE(MAX(invoice.cbteNro), 0)', 'max')
      .where('invoice.afipEnv = :afipEnv', { afipEnv })
      .andWhere('invoice.ptoVta = :ptoVta', { ptoVta })
      .andWhere('invoice.cbteTipo = :cbteTipo', { cbteTipo })
      .getRawOne<{ max: string }>();
    return Math.max(fromClient, Number(raw?.max ?? 0)) + 1;
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

function messageFor(invoice: Invoice): string {
  if (invoice.status === 'authorized') {
    return `Factura B autorizada. Número ${invoice.cbteNro}.`;
  }
  if (invoice.status === 'rejected') {
    const errors = (invoice.arcaErrors as { errors?: { msg: string }[] } | null)
      ?.errors;
    const reason = errors?.[0]?.msg ?? 'ARCA rechazó el comprobante.';
    return `La orden está cobrada. ${reason}`;
  }
  return 'La orden está cobrada. La factura quedó pendiente.';
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

function localIsoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoFromCompact(value: string): string {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}
