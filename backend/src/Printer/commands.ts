// commands.js - Archivo de configuración de comandos para impresora 3nStar

export const commands = {
  // Comandos básicos
  CTL_LF: '\x0A',
  CTL_FF: '\x0C',
  CTL_CR: '\x0D',
  CTL_HT: '\x09',
  CTL_VT: '\x0B',

  // Configuración de impresora
  HW_INIT: '\x1B\x40',
  HW_SELECT: '\x1B\x3D\x01',
  HW_RESET: '\x1B\x3F\x0A\x00',

  // Orientación del texto
  UPSIDE_DOWN_ON: '\x0F',
  UPSIDE_DOWN_OFF: '\x12',

  // Corte de papel
  PAPER_FULL_CUT: '\x1B\x64\x02',
  PAPER_PART_CUT: '\x1B\x64\x03',

  // Formato de texto
  TXT_NORMAL: '\x1B\x69\x00\x00',
  TXT_2HEIGHT: '\x1B\x69\x01\x00',
  TXT_2WIDTH: '\x1B\x69\x00\x01',
  TXT_4SQUARE: '\x1B\x69\x01\x01',
  TXT_UNDERL_OFF: '\x1B\x2D\x00',
  TXT_UNDERL_ON: '\x1B\x2D\x01',
  TXT_UNDERL2_ON: '\x1B\x2D\x02',
  TXT_BOLD_OFF: '\x1B\x46',
  TXT_BOLD_ON: '\x1B\x45',
  TXT_INVERT_OFF: '\x1B\x35',
  TXT_INVERT_ON: '\x1B\x34',

  // Fuentes
  TXT_FONT_A: '\x1B\x1E\x46\x00',
  TXT_FONT_B: '\x1B\x1E\x46\x01',

  // Alineación
  TXT_ALIGN_LT: '\x1B\x1D\x61\x00',
  TXT_ALIGN_CT: '\x1B\x1D\x61\x01',
  TXT_ALIGN_RT: '\x1B\x1D\x61\x02',

  // Códigos de barras
  BARCODE_TXT_OFF: '\x1D\x48\x00',
  BARCODE_TXT_ABV: '\x1D\x48\x01',
  BARCODE_TXT_BLW: '\x1D\x48\x02',
  BARCODE_TXT_BTH: '\x1D\x48\x03',
  BARCODE_FONT_A: '\x1D\x66\x00',
  BARCODE_FONT_B: '\x1D\x66\x01',
  BARCODE_HEIGHT: '\x1D\x68\x64',
  BARCODE_WIDTH: '\x1D\x77\x03',
  BARCODE_UPC_A: '\x1D\x6B\x00',
  BARCODE_UPC_E: '\x1D\x6B\x01',
  BARCODE_EAN13: '\x1D\x6B\x02',
  BARCODE_EAN8: '\x1D\x6B\x03',
  BARCODE_CODE39: '\x1D\x6B\x04',
  BARCODE_ITF: '\x1D\x6B\x05',
  BARCODE_NW7: '\x1D\x6B\x06',
  BARCODE_CODE128: '\x1B\x62\x36',

  // QR Codes
  QRCODE_MODEL1: '\x1B\x1D\x79\x53\x30\x01',
  QRCODE_MODEL2: '\x1B\x1D\x79\x53\x30\x02',
  QRCODE_CORRECTION_L: '\x1B\x1D\x79\x53\x31\x00',
  QRCODE_CORRECTION_M: '\x1B\x1D\x79\x53\x31\x01',
  QRCODE_CORRECTION_Q: '\x1B\x1D\x79\x53\x31\x02',
  QRCODE_CORRECTION_H: '\x1B\x1D\x79\x53\x31\x03',
  QRCODE_CELLSIZE_1: '\x1B\x1D\x79\x53\x32\x01',
  QRCODE_CELLSIZE_2: '\x1B\x1D\x79\x53\x32\x02',
  QRCODE_CELLSIZE_3: '\x1B\x1D\x79\x53\x32\x03',
  QRCODE_CELLSIZE_4: '\x1B\x1D\x79\x53\x32\x04',
  QRCODE_CELLSIZE_5: '\x1B\x1D\x79\x53\x32\x05',
  QRCODE_CELLSIZE_6: '\x1B\x1D\x79\x53\x32\x06',
  QRCODE_CELLSIZE_7: '\x1B\x1D\x79\x53\x32\x07',
  QRCODE_CELLSIZE_8: '\x1B\x1D\x79\x53\x32\x08',
  QRCODE_PRINT: '\x1B\x1D\x79\x50',

  // Otros comandos
  CD_KICK_2: '\x1B\x70\x00',
  CD_KICK_5: '\x1B\x70\x01',
  CD_KICK: '\x1B\x07\x0B\x37\x07',

  // Feed de papel
  PD_N50: '\x1D\x7C\x00',
  PD_N37: '\x1D\x7C\x01',
  PD_N25: '\x1D\x7C\x02',
  PD_N12: '\x1D\x7C\x03',
  PD_0: '\x1D\x7C\x04',
  PD_P50: '\x1D\x7C\x08',
  PD_P37: '\x1D\x7C\x07',
  PD_P25: '\x1D\x7C\x06',
};
