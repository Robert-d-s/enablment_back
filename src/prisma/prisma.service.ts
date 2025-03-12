import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Prisma Client initializing...');
    await this.$connect();
    this.logger.log('Prisma Client connected');
  }

  async onModuleDestroy() {
    this.logger.log('Prisma Client disconnecting...');
    await this.$disconnect();
    this.logger.log('Prisma Client disconnected');
  }
}
