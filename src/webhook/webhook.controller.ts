import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookGuard } from './webhook.guard';
import { LinearWebhookBody } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @UseGuards(WebhookGuard)
  async handle(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: LinearWebhookBody,
  ): Promise<void> {
    await this.webhookService.handle(body);
  }
}
