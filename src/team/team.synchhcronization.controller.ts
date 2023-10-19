// team.synchronization.controller.ts

import { Controller, Get, HttpCode } from '@nestjs/common';
import { LinearService } from './linear.service';

@Controller('team-synchronize')
export class TeamSynchronizationController {
  constructor(private readonly linearService: LinearService) {}

  @Get('/teams')
  @HttpCode(200)
  async synchronizeTeams() {
    await this.linearService.synchronizeTeamsWithLinear();
    return { message: 'Team synchronization process initiated' };
  }
}
