import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(WebhookGuard.name) private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const linearSignature = request.headers['linear-signature'];
    const webhookSecret = this.configService.get<string>('WEBHOOK_SECRET');

    if (!linearSignature) {
      this.logger.warn('Missing Linear signature header');
      throw new UnauthorizedException('Missing Linear signature header');
    }

    if (!webhookSecret) {
      this.logger.error(
        'Webhook secret not configured - WEBHOOK_SECRET environment variable is missing',
      );
      throw new UnauthorizedException('Webhook secret not configured');
    }

    this.logger.debug({ linearSignature }, 'Received Linear signature');
    this.logger.debug('Webhook secret configured successfully');

    let payload: string;
    try {
      payload = JSON.stringify(request.body);
    } catch (e) {
      this.logger.error(
        { err: e },
        'Failed to stringify request body for webhook validation',
      );
      throw new UnauthorizedException('Invalid request body format');
    }

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    this.logger.debug(
      { calculatedSignature: signature },
      'Calculated signature for webhook',
    );

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(linearSignature),
      );

      if (!isValid) {
        this.logger.warn('Signature mismatch - webhook validation failed');
        throw new UnauthorizedException('Invalid webhook signature');
      }
      this.logger.info('Webhook signature validated successfully');
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn({ err: error }, 'Webhook signature validation failed'); // Log as warn if expected validation failure
        throw error;
      } else {
        this.logger.error(
          { err: error },
          'Unexpected error validating webhook signature',
        );
        throw new UnauthorizedException('Error validating webhook signature');
      }
    }
  }
}
