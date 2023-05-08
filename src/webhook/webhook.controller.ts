import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookGuard } from './webhook.guard';

@Controller('webhook')
export class WebhookController {

    constructor(private webhookService: WebhookService) {}

    @Post()
    @UseGuards(WebhookGuard)
    async handle(@Body() body: any) {
        await this.webhookService.handle(body)
    }
}
