import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';
import * as micro from 'micro';

@Injectable()
export class WebhookGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const signature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(request.body))
      .digest('hex');

    if (signature !== request.headers['linear-signature']) {
      return false;
    }

    return true;
  }
}
