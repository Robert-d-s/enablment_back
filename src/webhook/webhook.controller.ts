import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookGuard } from './webhook.guard';
import { Public } from 'src/auth/auth.controller';

@Controller('webhook')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @Public()
  @UseGuards(WebhookGuard)
  async handle(@Body() body: any) {
    await this.webhookService.handle(body);
  }
}
