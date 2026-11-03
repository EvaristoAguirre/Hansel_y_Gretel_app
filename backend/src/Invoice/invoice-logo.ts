import * as fs from 'fs';
import * as path from 'path';

/**
 * PNG del logo de frontend/public/logo.svg, recortado a la marca visible.
 * pdfkit y el correo no muestran bien ese SVG.
 */
export function invoiceLogoPath(): string {
  const candidates = [
    path.join(__dirname, 'assets', 'logo.png'),
    path.join(process.cwd(), 'src/Invoice/assets/logo.png'),
    path.join(process.cwd(), 'dist/src/Invoice/assets/logo.png'),
    path.join(process.cwd(), 'dist/Invoice/assets/logo.png'),
  ];
  const found = candidates.find((item) => fs.existsSync(item));
  if (!found) {
    throw new Error('No está el logo de la factura.');
  }
  return found;
}

export function invoiceLogoPng(): Buffer {
  return fs.readFileSync(invoiceLogoPath());
}
