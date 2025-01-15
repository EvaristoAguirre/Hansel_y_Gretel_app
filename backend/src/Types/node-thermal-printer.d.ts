declare module 'node-thermal-printer' {
  export default class Printer {
    constructor(config: PrinterConfig);
    clear(): void;
    alignCenter(): void;
    alignLeft(): void;
    alignRight(): void;
    bold(value: boolean): void;
    println(text: string): void;
    newLine(): void;
    cut(): void;
    execute(): Promise<void>;
    isPrinterConnected(): Promise<boolean>;
  }

  export interface PrinterConfig {
    type: string;
    interface: string;
    characterSet?: string;
    removeSpecialCharacters?: boolean;
    lineCharacter?: string;
  }
}
