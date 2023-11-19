import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { WebhookModule } from './webhook/webhook.module';
import { ProjectModule } from './project/project.module';
import { IssueModule } from './issue/issue.module';
import { TeamModule } from './team/team.module';
import { RateModule } from './rate/rate.module';
import { TimeModule } from './time/time.module';
import { InvoiceModule } from './invoice/invoice.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    ProjectModule,
    IssueModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req }) => ({ req }),
    }),
    WebhookModule,
    TeamModule,
    RateModule,
    TimeModule,
    InvoiceModule,
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
