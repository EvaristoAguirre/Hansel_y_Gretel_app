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

async function readError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.message || "No se pudo completar la operación");
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

export async function getInvoice(token: string, id: string) {
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

export async function retryInvoice(token: string, id: string) {
  const response = await fetch(`${URI_INVOICES}/${id}/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await readError(response);
  return response.json();
}
