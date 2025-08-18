import { Global, Module } from '@nestjs/common';
import { GlobalGqlExceptionFilter } from './filters/gql-exception.filter';

@Global()
@Module({
  providers: [GlobalGqlExceptionFilter],
  exports: [GlobalGqlExceptionFilter],
})
export class CommonModule {}
