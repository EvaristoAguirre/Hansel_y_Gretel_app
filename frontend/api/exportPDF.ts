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

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert('Hubo un error al exportar el stock.');
  }
};
