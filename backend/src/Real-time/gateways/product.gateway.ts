import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BroadcastService } from '../services/broadcast.service';
import { ProductService } from 'src/Product/product.service';
import { Product } from 'src/Product/product.entity';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProductGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly productService: ProductService,
  ) {}

  afterInit(server: Server) {
    this.broadcastService.setServer(server);
    console.log('WebSocket server initialized');
  }

  @SubscribeMessage('createProduct')
  async handleCreateProduct(
    @MessageBody() createProductDto: CreateProductDto,
  ): Promise<Product> {
    console.log('Recibiendo datos para crear producto:', createProductDto);
    const product = await this.productService.createProduct(createProductDto);
    this.broadcastService.broadcast('productCreated', product);
    console.log('Producto creado', product);
    return product;
  }

  @SubscribeMessage('updateProduct')
  async handleUpdateProduct(
    @MessageBody()
    { id, updateData }: { id: string; updateData: UpdateProductDto },
  ): Promise<Product> {
    const updateProduct = await this.productService.updateProduct(
      id,
      updateData,
    );
    this.broadcastService.broadcast('productUpdated', updateProduct);
    return updateProduct;
  }

  @SubscribeMessage('getAllProducts')
  async handleGetAllProducts(
    @MessageBody() { page, limit }: { page: number; limit: number },
  ): Promise<Product[]> {
    const products = await this.productService.getAllProducts(page, limit);
    return products;
  }
}
