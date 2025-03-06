import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const linearSignature = request.headers['linear-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET || '';

    if (!linearSignature) {
      this.logger.warn('Missing Linear signature header');
      throw new UnauthorizedException('Missing Linear signature header');
    }

    this.logger.debug(`recevived Linear signature: ${linearSignature}`);
    this.logger.debug(
      `Webhook secret available: ${!!process.env.WEBHOOK_SECRET}`,
    );

    if (!webhookSecret) {
      this.logger.error('Webhook secret not configured');
      return false;
    }

    const payload = JSON.stringify(request.body);

    const signature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');

    this.logger.debug(`Calculated signature: ${signature}`);

    try {
      const isValid = signature === linearSignature;

      if (!isValid) {
        this.logger.warn('Signature mismatch - webhook validation failed');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating webhook signature', error);
      throw new UnauthorizedException('Error validating webhook signature');
    }
  }
}
