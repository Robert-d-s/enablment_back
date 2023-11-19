import { Controller, Get, HttpCode } from '@nestjs/common';
import { LinearService } from './linear.service';
import { firstValueFrom } from 'rxjs';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly linearService: LinearService) {}

  @Get('/query')
  @HttpCode(200)
  async queryOrganization() {
    const observable = this.linearService.queryOrganization();
    return firstValueFrom(observable);
  }
}
