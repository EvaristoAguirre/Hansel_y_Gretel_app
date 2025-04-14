import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

@Injectable()
export class PrinterService {
  private counter: number = 0;
  private readonly counterFilePath = path.join(__dirname, 'print-counter.json');
  private readonly printerHost = '192.168.1.49'; // Ajusta la IP de tu impresora
  private readonly printerPort = 9100; // Puerto común para impresoras térmicas

  constructor() {
    this.loadCounter();
  }

  private loadCounter(): void {
    try {
      if (fs.existsSync(this.counterFilePath)) {
        const data = fs.readFileSync(this.counterFilePath, 'utf8');
        this.counter = JSON.parse(data).counter;
      }
    } catch (error) {
      console.error('Error loading counter:', error);
      this.counter = 0;
    }
  }

  private saveCounter(): void {
    try {
      fs.writeFileSync(
        this.counterFilePath,
        JSON.stringify({
          counter: this.counter,
        }),
      );
    } catch (error) {
      console.error('Error saving counter:', error);
    }
  }

  private generateOrderCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = String(this.counter++).padStart(4, '0');
    this.saveCounter();
    return `${year}-${month}-${day}-${count}`;
  }

  private async sendRawCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.printerHost,
        port: this.printerPort,
      });

      socket.on('connect', () => {
        socket.write(command, (error) => {
          socket.end();
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      socket.on('error', (error) => {
        reject(error);
      });
    });
  }

  async printKitchenOrder(orderData: PrintComandaDTO): Promise<void> {
    const now = new Date();
    const orderCode = this.generateOrderCode();
    console.log('dataaaaaa.......', orderData);

    const formatProductLine = (name: string, quantity: number) => {
      const namePart = name.padEnd(20).substring(0, 20);
      const quantityPart = `x${quantity.toString().padStart(2)}`;
      return `${namePart} ${quantityPart}\n`;
    };

    const commands = [
      '\x1B\x40', // Inicializar impresora
      '\x1B\x61\x01', // Centrar texto
      '\x1D\x21\x01', // Texto doble altura
      'COMANDA COCINA\n',
      '\x1D\x21\x00', // Texto normal
      '-----------------------------\n',
      `Código: ${orderCode}\n`,
      `Mesa: ${orderData.table}\n`,
      `Hora: ${now.toLocaleTimeString()}\n`,
      '-----------------------------\n',
      '\x1B\x45\x01', // Negrita ON
      'PRODUCTO             CANT.\n',
      '\x1B\x45\x00', // Negrita OFF
      '-----------------------------\n',
      ...orderData.products.map((p) => formatProductLine(p.name, p.quantity)),
      '-----------------------------\n',
      '\x1B\x61\x01', // Centrar texto
      'Por favor preparar con cuidado\n',
      '\x1B\x42\x02\x02', // Doble pitido
      '\x1D\x56\x41\x50', // Cortar papel (con avance)
    ].join('');

    return this.sendRawCommand(commands);
  }
}
