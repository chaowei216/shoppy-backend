import { promises as fs } from 'fs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from 'src/prisma/prisma.service';
import { join } from 'path';
import { PRODUCT_IMAGES } from './product-images';
import { Prisma } from 'generated/prisma';
import { ProductsGateway } from './products.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productGateway: ProductsGateway,
  ) {}

  async createProduct(data: CreateProductRequest, userId: number) {
    const product = await this.prismaService.product.create({
      data: {
        ...data,
        userId,
      },
    });
    this.productGateway.handleProductUpdated();
    return product;
  }

  async getProducts(status?: string) {
    const args: Prisma.ProductFindManyArgs = {};
    if (status === 'available') {
      args.where = { sold: false };
    }
    const products = await this.prismaService.product.findMany(args);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExists: await this.imageExists(product.id),
      })),
    );
  }

  async getProduct(productId: number) {
    try {
      return {
        ...(await this.prismaService.product.findUniqueOrThrow({
          where: { id: productId },
        })),
        imageExists: await this.imageExists(productId),
      };
    } catch (err) {
      throw new NotFoundException(`Product not found with ID ${productId}`);
    }
  }

  async update(productId: number, data: Prisma.ProductUpdateInput) {
    await this.prismaService.product.update({
      where: { id: productId },
      data,
    });
    this.productGateway.handleProductUpdated();
  }

  private async imageExists(productId: number) {
    try {
      await fs.access(
        join(`${PRODUCT_IMAGES}/${productId}.jpg`),
        fs.constants.F_OK,
      );
      return true;
    } catch (err) {
      return false;
    }
  }
}
