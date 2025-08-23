import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GlobalGqlExceptionFilter } from './filters/gql-exception.filter';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { SanitizationService } from './services/sanitization.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GlobalGqlExceptionFilter,
    TokenBlacklistService,
    SanitizationService,
  ],
  exports: [
    GlobalGqlExceptionFilter,
    TokenBlacklistService,
    SanitizationService,
  ],
})
export class CommonModule {}
