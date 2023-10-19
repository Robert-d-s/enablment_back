// team.synchronization.controller.ts

import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { LinearService } from './linear.service';
// If you decide to use guards, make sure to import them.
// For example, for JWT: import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('team-synchronize')
export class TeamSynchronizationController {
  constructor(private readonly linearService: LinearService) {}

  @Get('/teams')
  @HttpCode(200)
  // If using guards, uncomment the line below
  // @UseGuards(JwtAuthGuard)
  async synchronizeTeams() {
    await this.linearService.synchronizeTeamsWithLinear();
    return { message: 'Team synchronization process initiated' };
  }
}
