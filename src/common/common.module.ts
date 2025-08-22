import { Global, Module } from '@nestjs/common';
import { GlobalGqlExceptionFilter } from './filters/gql-exception.filter';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Global()
@Module({
  providers: [GlobalGqlExceptionFilter, TokenBlacklistService],
  exports: [GlobalGqlExceptionFilter, TokenBlacklistService],
})
export class CommonModule {}
