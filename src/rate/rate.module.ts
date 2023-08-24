import { Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { RateResolver } from './rate.resolver';

@Module({
  providers: [RateService, RateResolver],
})
export class RateModule {}
