"use client";

import { InvoiceDetail } from "@/api/invoices";
import {
  formatCurrency,
  parseEsARNumber,
} from "@/components/Utils/FormatNumber";
import { ReactNode } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";

const statusLabel: Record<InvoiceDetail["status"], string> = {
  pending: "Pendiente",
  authorized: "Autorizada",
  rejected: "Rechazada",
};

const envLabel: Record<InvoiceDetail["afipEnv"], string> = {
  simulado: "Simulado",
  homologacion: "Homologación",
  produccion: "Producción",
};

function money(value: string | number | null | undefined) {
  return `$${formatCurrency(parseEsARNumber(value))}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatQuota(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;
}

function comprobante(detail: InvoiceDetail) {
  const number =
    detail.cbteNro == null
      ? "sin número"
      : String(detail.cbteNro).padStart(8, "0");
  const type = detail.cbteTipo === 6 ? "Factura B" : `Tipo ${detail.cbteTipo}`;
  return `${type} ${String(detail.ptoVta).padStart(4, "0")}-${number}`;
}

function originLabel(detail: InvoiceDetail) {
  if (detail.origin === "manual") return "Manual";
  const table = detail.snapshot?.tableName;
  return table ? `Mesa ${table}` : "Mesa";
}

function arcaMessages(detail: InvoiceDetail) {
  const errors = detail.arcaErrors?.errors;
  if (!Array.isArray(errors)) return [];
  return errors
    .map((error) => [error.code, error.msg].filter(Boolean).join(" — "))
    .filter(Boolean);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ color: "#856D5E", mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function InvoiceDetailDialog({
  detail,
  onClose,
}: {
  detail: InvoiceDetail | null;
  onClose: () => void;
}) {
  const lines = detail?.snapshot?.lines ?? [];
  const emitter = detail?.snapshot?.emitter;
  const messages = detail ? arcaMessages(detail) : [];
  const discount = detail ? parseEsARNumber(detail.discountAmount) : 0;

  return (
    <Dialog open={Boolean(detail)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle de factura</DialogTitle>
      {detail && (
        <DialogContent>
          <Section title="Comprobante">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Field label="Número" value={comprobante(detail)} />
              <Field label="Fecha" value={formatDate(detail.cbteFch)} />
              <Field label="Estado" value={statusLabel[detail.status] ?? detail.status} />
              <Field label="Modo" value={envLabel[detail.afipEnv] ?? detail.afipEnv} />
              <Field label="Origen" value={originLabel(detail)} />
              {detail.customerEmail ? (
                <Field label="Email" value={detail.customerEmail} />
              ) : null}
            </Box>
          </Section>

          <Divider sx={{ mb: 2 }} />

          <Section title="Autorización">
            {detail.status === "rejected" && messages.length > 0 ? (
              <Box sx={{ mb: 1.5 }}>
                {messages.map((message) => (
                  <Typography key={message} variant="body2" color="error">
                    {message}
                  </Typography>
                ))}
              </Box>
            ) : null}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Field label="CAE" value={detail.cae || "Sin CAE"} />
              <Field label="Vencimiento del CAE" value={formatDate(detail.caeFchVto)} />
              <Field
                label="Resultado"
                value={
                  detail.resultado === "A"
                    ? "Autorizado"
                    : detail.resultado === "R"
                      ? "Rechazado"
                      : "Pendiente"
                }
              />
            </Box>
          </Section>

          <Divider sx={{ mb: 2 }} />

          <Section title="Importes">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Field label="Total" value={money(detail.impTotal)} />
              <Field label="Neto" value={money(detail.impNeto)} />
              {(detail.iva ?? []).length > 0 ? (
                detail.iva.map((item, index) => (
                  <Field
                    key={`${item.quota}-${index}`}
                    label={`IVA ${formatQuota(Number(item.quota))}`}
                    value={money(item.importe)}
                  />
                ))
              ) : (
                <Field label="IVA" value={money(detail.impIva)} />
              )}
              {discount > 0 ? (
                <Field label="Descuento" value={money(detail.discountAmount)} />
              ) : null}
            </Box>
          </Section>

          <Divider sx={{ mb: 2 }} />

          <Section title="Ítems">
            {lines.length === 0 ? (
              <Typography variant="body2">Sin ítems</Typography>
            ) : (
              lines.map((line, index) => (
                <Box
                  key={`${line.name}-${index}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 2,
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    {line.name} × {line.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatQuota(Number(line.alicQuota))}
                  </Typography>
                  <Typography variant="body2">{money(line.subtotal)}</Typography>
                </Box>
              ))
            )}
          </Section>

          <Divider sx={{ mb: 2 }} />

          <Section title="Emisor">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Field label="Razón social" value={emitter?.razonSocial || "—"} />
              <Field label="CUIT" value={emitter?.cuit || "—"} />
              <Field label="Domicilio" value={emitter?.domicilio || "—"} />
            </Box>
          </Section>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
