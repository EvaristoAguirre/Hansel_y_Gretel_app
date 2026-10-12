"use client";

import { createManualInvoice } from "@/api/invoices";
import { searchProducts } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState } from "react";
import Swal from "sweetalert2";

interface Line {
  concept: string;
  quantity: string;
  unitPrice: string;
  alicQuota: string;
}

const emptyLine = (): Line => ({
  concept: "",
  quantity: "1",
  unitPrice: "",
  alicQuota: "",
});

export default function ManualInvoiceDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [discount, setDiscount] = useState("");
  const [email, setEmail] = useState("");
  const [catalog, setCatalog] = useState("");

  const update = (index: number, field: keyof Line, value: string) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const loadFromCatalog = async () => {
    const token = getAccessToken();
    if (!token || !catalog.trim()) return;
    const found = await searchProducts(catalog.trim(), token);
    const list = Array.isArray(found) ? found : found?.products ?? found?.data ?? [];
    const product = list[0];
    if (!product) {
      Swal.fire("Sin resultados", "No hay un producto con ese nombre o código.", "info");
      return;
    }
    const price = Number(String(product.price).replace(/\./g, "").replace(",", "."));
    setLines((current) => [
      ...current.filter((line) => line.concept || line.unitPrice),
      {
        concept: product.name,
        quantity: "1",
        unitPrice: Number.isFinite(price) ? String(price) : "",
        alicQuota: product.alicQuota == null ? "" : String(product.alicQuota),
      },
    ]);
  };

  const submit = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const result = await createManualInvoice(token, {
        lines: lines.map((line) => ({
          concept: line.concept,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          alicQuota: line.alicQuota === "" ? null : Number(line.alicQuota),
        })),
        discountAmount: discount === "" ? 0 : Number(discount),
        customerEmail: email.trim() || undefined,
      });
      const icon = result.status === "authorized" ? "success" : "warning";
      Swal.fire(result.message || "Factura registrada", "", icon);
      setLines([emptyLine()]);
      setDiscount("");
      setEmail("");
      onCreated();
      onClose();
    } catch (error) {
      Swal.fire("No se pudo emitir", String(error), "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva factura</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          margin="dense"
          label="Producto del catálogo"
          value={catalog}
          onChange={(event) => setCatalog(event.target.value)}
          helperText="Precarga una línea. Se puede editar antes de emitir."
        />
        <Button onClick={loadFromCatalog}>Cargar</Button>
        {lines.map((line, index) => (
          <div key={index}>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              label="Concepto"
              value={line.concept}
              onChange={(event) => update(index, "concept", event.target.value)}
            />
            <TextField
              size="small"
              margin="dense"
              label="Cantidad"
              type="number"
              value={line.quantity}
              onChange={(event) => update(index, "quantity", event.target.value)}
            />
            <TextField
              size="small"
              margin="dense"
              label="Precio"
              type="number"
              value={line.unitPrice}
              onChange={(event) => update(index, "unitPrice", event.target.value)}
              sx={{ mx: 1 }}
            />
            <TextField
              size="small"
              margin="dense"
              label="Alícuota"
              value={line.alicQuota}
              onChange={(event) => update(index, "alicQuota", event.target.value)}
              helperText="Vacío = 21 %"
            />
          </div>
        ))}
        <Button onClick={() => setLines((current) => [...current, emptyLine()])}>
          Otra línea
        </Button>
        <TextField
          fullWidth
          size="small"
          margin="dense"
          label="Descuento en pesos"
          type="number"
          value={discount}
          onChange={(event) => setDiscount(event.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          margin="dense"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit}>
          Emitir Factura B
        </Button>
      </DialogActions>
    </Dialog>
  );
}
