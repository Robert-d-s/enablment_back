import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookProjectService } from './webhook.project.service';
import { ProjectService } from 'src/project/project.service';

@Module({
  providers: [ProjectService, WebhookService, WebhookProjectService],
  controllers: [WebhookController],
})
export class WebhookModule {}
