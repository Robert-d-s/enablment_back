import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GlobalGqlExceptionFilter } from './filters/gql-exception.filter';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GlobalGqlExceptionFilter, TokenBlacklistService],
  exports: [GlobalGqlExceptionFilter, TokenBlacklistService],
})
export class CommonModule {}
