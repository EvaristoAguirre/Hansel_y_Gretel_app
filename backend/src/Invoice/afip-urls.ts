export const AFIP_ENVIRONMENTS = ['homologacion', 'produccion'] as const;

export type AfipEnvironment = (typeof AFIP_ENVIRONMENTS)[number];

export interface AfipEndpointUrls {
  wsaa: string;
  wsfe: string;
}

export const AFIP_URLS: Record<AfipEnvironment, AfipEndpointUrls> = {
  homologacion: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
  produccion: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
};
