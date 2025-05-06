import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';


@Injectable()
export class PrismaService
  extends PrismaClient<{
    log: [
      { emit: 'event'; level: 'query' },
      { emit: 'event'; level: 'info' },
      { emit: 'event'; level: 'warn' },
      { emit: 'event'; level: 'error' }
    ];
  }>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ] as const,
    });
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.trace(
        { duration: e.duration, query: e.query, params: e.params },
        'Prisma Query Executed',
      );
    });
    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.info(e, 'Prisma Info');
    });
    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(e, 'Prisma Warn');
    });
    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(e, 'Prisma Error');
    });
  }

  async onModuleInit() {
    this.logger.info('Prisma Client initializing...');
    await this.$connect();
    this.logger.info('Prisma Client connected');
  }

  async onModuleDestroy() {
    this.logger.info('Prisma Client disconnecting...');
    await this.$disconnect();
    this.logger.info('Prisma Client disconnected');
  }
}
