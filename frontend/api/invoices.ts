import { URI_INVOICES } from "@/components/URI/URI";

export interface InvoiceRow {
  id: string;
  cbteFch: string;
  ptoVta: number;
  cbteNro: number | null;
  origin: "order" | "manual";
  impTotal: number;
  status: "pending" | "authorized" | "rejected";
  customerEmail: string | null;
  afipEnv: "simulado" | "homologacion" | "produccion";
}

export interface InvoiceDetailLine {
  name: string;
  quantity: number;
  unitaryPrice: number;
  subtotal: number;
  alicQuota: number;
}

export interface InvoiceDetail {
  ptoVta: number;
  cbteTipo: number;
  cbteNro: number | null;
  cbteFch: string;
  status: InvoiceRow["status"];
  afipEnv: InvoiceRow["afipEnv"];
  origin: InvoiceRow["origin"];
  cae: string | null;
  caeFchVto: string | null;
  resultado: string | null;
  arcaErrors: { errors?: { code?: string; msg?: string }[] } | null;
  impTotal: string | number;
  impNeto: string | number;
  impIva: string | number;
  discountAmount: string | number;
  customerEmail: string | null;
  iva: {
    quota: number;
    baseImp: number | string;
    importe: number | string;
  }[];
  snapshot: {
    tableName?: string | null;
    lines?: InvoiceDetailLine[];
    emitter?: {
      cuit?: string | null;
      razonSocial?: string | null;
      domicilio?: string | null;
    };
  };
}

async function readError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.message || "No se pudo completar la operación");
}

export async function createManualInvoice(
  token: string,
  body: {
    lines: {
      concept: string;
      quantity: number;
      unitPrice: number;
      alicQuota?: number | null;
    }[];
    discountAmount?: number;
    customerEmail?: string;
  }
) {
  const response = await fetch(URI_INVOICES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) await readError(response);
  return response.json();
}

export async function listInvoices(
  token: string,
  month: number,
  year: number
): Promise<InvoiceRow[]> {
  const response = await fetch(
    `${URI_INVOICES}?month=${month}&year=${year}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) await readError(response);
  return response.json();
}

export async function getInvoice(
  token: string,
  id: string
): Promise<InvoiceDetail> {
  const response = await fetch(`${URI_INVOICES}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  return response.json();
}

export async function downloadInvoicePdf(token: string, id: string) {
  const response = await fetch(`${URI_INVOICES}/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "factura-b.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

export async function printInvoice(token: string, id: string) {
  const response = await fetch(`${URI_INVOICES}/${id}/print`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  return response.json();
}

export async function updateInvoiceEmail(
  token: string,
  id: string,
  customerEmail: string
) {
  const response = await fetch(`${URI_INVOICES}/${id}/email`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerEmail }),
  });
  if (!response.ok) await readError(response);
  return response.json();
}

export async function sendInvoiceEmail(token: string, id: string) {
  const response = await fetch(`${URI_INVOICES}/${id}/send-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  return response.json();
}

export async function retryInvoice(token: string, id: string) {
  const response = await fetch(`${URI_INVOICES}/${id}/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  return response.json();
}
