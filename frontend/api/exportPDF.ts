import { URI_PDF } from "@/components/URI/URI";

export const exportPDF = async (token: string) => {
  try {
    const response = await fetch(URI_PDF, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) throw new Error('Error al generar el PDF');

    const blob = await response.blob();

    // Obtenemos fecha y hora actuales
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const filename = `stock_${day}${month}${year}_${hours}${minutes}.pdf`;

    // Link y disparardor de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert('Hubo un error al exportar el stock.');
  }
};
