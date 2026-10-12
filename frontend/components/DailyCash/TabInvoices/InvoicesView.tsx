"use client";

import {
  downloadInvoicePdf,
  getInvoice,
  listInvoices,
  printInvoice,
  retryInvoice,
  sendInvoiceEmail,
  updateInvoiceEmail,
  InvoiceRow,
} from "@/api/invoices";
import { useAuth } from "@/app/context/authContext";
import { formatNumber } from "@/components/Utils/FormatNumber";
import EmailIcon from "@mui/icons-material/Email";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SendIcon from "@mui/icons-material/Send";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const statusLabel: Record<InvoiceRow["status"], string> = {
  pending: "Pendiente",
  authorized: "Autorizada",
  rejected: "Rechazada",
};

export default function InvoicesView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const { getAccessToken } = useAuth();

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      setRows(await listInvoices(token, month, year));
    } catch (error) {
      Swal.fire("No se pudieron cargar las facturas", String(error), "error");
    }
  }, [getAccessToken, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    setDetail(await getInvoice(token, id));
  };

  const download = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await downloadInvoicePdf(token, id);
    } catch (error) {
      Swal.fire("No se pudo descargar el PDF", String(error), "error");
    }
  };

  const reprint = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await printInvoice(token, id);
      Swal.fire("Ticket enviado a la impresora", "", "success");
    } catch (error) {
      Swal.fire("No se pudo reimprimir", String(error), "error");
    }
  };

  const editEmail = async (row: InvoiceRow) => {
    const token = getAccessToken();
    if (!token) return;
    const result = await Swal.fire({
      title: "Email",
      input: "email",
      inputValue: row.customerEmail ?? "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
    });
    if (!result.isConfirmed || !result.value) return;
    try {
      await updateInvoiceEmail(token, row.id, result.value);
      await load();
    } catch (error) {
      Swal.fire("No se pudo guardar el email", String(error), "error");
    }
  };

  const sendEmail = async (row: InvoiceRow) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await sendInvoiceEmail(token, row.id);
      Swal.fire("Correo enviado", "", "success");
      await load();
    } catch (error) {
      Swal.fire("No se pudo enviar", String(error), "error");
    }
  };

  const retry = async (row: InvoiceRow) => {
    const confirm = await Swal.fire({
      title: "Reintentar factura",
      text: "Se vuelve a pedir la autorización con el mismo número.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Reintentar",
    });
    if (!confirm.isConfirmed) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const result = await retryInvoice(token, row.id);
      Swal.fire(result.message || "Listo", "", result.status === "authorized" ? "success" : "warning");
      await load();
    } catch (error) {
      Swal.fire("No se pudo reintentar", String(error), "error");
    }
  };

  const columns: GridColDef[] = [
    { field: "cbteFch", headerName: "Fecha", width: 120 },
    {
      field: "cbteNro",
      headerName: "Comprobante",
      width: 170,
      valueGetter: (_value, row: InvoiceRow) =>
        `${String(row.ptoVta).padStart(4, "0")}-${
          row.cbteNro == null ? "sin número" : String(row.cbteNro).padStart(8, "0")
        }`,
    },
    {
      field: "origin",
      headerName: "Origen",
      width: 110,
      valueGetter: (value) => (value === "manual" ? "Manual" : "Mesa"),
    },
    {
      field: "impTotal",
      headerName: "Importe",
      width: 120,
      valueFormatter: (value: number) => `$${formatNumber(value || 0)}`,
    },
    {
      field: "status",
      headerName: "Estado",
      width: 130,
      valueGetter: (value: InvoiceRow["status"]) => statusLabel[value] ?? value,
    },
    { field: "customerEmail", headerName: "Email", width: 200 },
    {
      field: "afipEnv",
      headerName: "Modo",
      width: 130,
      valueGetter: (value) => (value === "simulado" ? "Simulado" : value),
    },
    {
      field: "actions",
      headerName: "",
      width: 280,
      sortable: false,
      renderCell: (params) => {
        const row = params.row as InvoiceRow;
        const canRetry = row.status === "pending" || row.status === "rejected";
        const authorized = row.status === "authorized";
        const canSend = authorized && Boolean(row.customerEmail);
        const locked = "Disponible cuando la factura está autorizada";
        return (
          <>
            <Tooltip title="Ver detalle">
              <IconButton onClick={() => openDetail(row.id)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={authorized ? "Descargar PDF" : locked}>
              <span>
                <IconButton disabled={!authorized} onClick={() => download(row.id)}>
                  <PictureAsPdfIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={authorized ? "Reimprimir" : locked}>
              <span>
                <IconButton disabled={!authorized} onClick={() => reprint(row.id)}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Editar email">
              <IconButton onClick={() => editEmail(row)}>
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                canSend
                  ? "Enviar"
                  : "Disponible cuando está autorizada y tiene email"
              }
            >
              <span>
                <IconButton disabled={!canSend} onClick={() => sendEmail(row)}>
                  <SendIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={canRetry ? "Reintentar" : "Solo pendiente o rechazada"}>
              <span>
                <IconButton disabled={!canRetry} onClick={() => retry(row)}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        );
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          select
          label="Mes"
          size="small"
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {MONTHS.map((label, index) => (
            <MenuItem key={label} value={index + 1}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Año"
          size="small"
          type="number"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        />
        <Button variant="outlined" onClick={load}>
          Buscar
        </Button>
      </Box>
      {rows.length === 0 ? (
        <Typography>No hay facturas en ese mes</Typography>
      ) : (
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
        />
      )}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle de factura</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
            {detail ? JSON.stringify(detail, null, 2) : ""}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
